**Konu: Next.js/Firestore Randevu Ekleme Sıralama Hatası ("Heisenbug")**

Merhaba, bir Next.js uygulamasında randevu zamanlama ile ilgili çözmekte zorlandığım inatçı bir hata konusunda yardımınıza ihtiyacım var.

**Sorunun Tanımı:**

Uygulamada, kullanıcılar mevcut bir randevuya yeni hizmetler ekleyebiliyor. Her hizmet, bir önceki hizmetin bitiş saatinde başlaması gereken ayrı bir randevu kaydı olarak oluşturuluyor. Hata şu senaryoda ortaya çıkıyor:

1.  Takvimde tek bir hizmetten oluşan bir randevu grubu var.
2.  Kullanıcı "Hizmet Ekle" diyerek bu gruba ikinci bir hizmet ekliyor.
3.  Eklenen bu ikinci hizmet, olması gerektiği gibi ilk hizmetin bitiş saatinde başlamak yerine, **daha ileri, alakasız bir saatte** başlıyor ve arada bir boşluk oluşuyor.
4.  **İşin garip kısmı:** Aynı randevu grubuna **üçüncü veya dördüncü** bir hizmet eklendiğinde, bu sonraki hizmetler **doğru şekilde**, bir öncekinin hemen bitiş saatinde başlıyor. Hata sadece 1'den 2'ye geçerken tutarlı bir şekilde tekrarlanıyor.

**Denenen Çözüm Yöntemleri ve Başarısızlık Nedenleri:**

1.  **Veritabanı Sıralama Sorunu Şüphesi:**
    *   **Hipotez:** Firestore sorgusunun randevuları belirli bir sırada getirmediğini düşündüm. Gruptaki tek randevunun `end` (bitiş) zamanını alırken, sıralama garantisi olmadığı için yanlış bir referans alıyor olabilirdi.
    *   **Çözüm Denemesi:** `addServiceToAppointmentAction` fonksiyonundaki sorguya `orderBy("start", "asc")` ekleyerek randevuların her zaman kronolojik sırada gelmesini sağlamaya çalıştım.
    *   **Sonuç:** Başarısız. Hata devam etti, bu da sorunun basit bir sıralama eksikliği olmadığını gösterdi.

2.  **Mantık Hatası ve "Heisenbug" Keşfi:**
    *   **Hipotez:** Zaman hesaplama mantığında bir hata veya "race condition" (zamanlama sorunu) olabileceğinden şüphelendim.
    *   **Çözüm Denemesi:** `addServiceToAppointmentAction` fonksiyonunun içine, her adımı (gelen veri, bulunan son randevu, hesaplanan bitiş ve başlangıç saatleri) konsola yazdırmak için çok sayıda `console.log` ifadesi ekledim.
    *   **Sonuç:** **Çok tuhaf bir şekilde, loglama eklendiğinde hata ortadan kalktı!** Loglar varken, ikinci hizmet doğru saate ekleniyordu. Performans ve temizlik amacıyla logları kaldırdığımda ise hata geri geldi. Bu durum, "Heisenbug" olarak bilinen, sistemin gözlemlenmesinin (loglamanın getirdiği milisaniyelik gecikme bile) davranışını değiştirdiği durumlara işaret ediyor. Sorun muhtemelen `Date` nesnelerinin durumu, zaman dilimi dönüşümleri veya asenkron bir işlemin tam olarak bitmeden diğerinin başlaması gibi derin bir zamanlama sorunundan kaynaklanıyor.

**Yardım Talebi:**

Bu "Heisenbug" problemini çözmek için bir yaklaşıma ihtiyacım var. Loglama olmadan, fonksiyonun her zaman tutarlı ve doğru çalışmasını nasıl sağlayabilirim?

**İlgili Kod (Hatanın Olduğu Dosya):**

Aşağıda, sorunun yaşandığı `src/app/randevular/services/appointmentWrite.ts` dosyasının loglar kaldırılmış ve hatanın mevcut olduğu son halini bulabilirsiniz.

```typescript
'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { performAddCustomerAction } from "../../musteriler/actions";
import { getPersonelAction } from "../../personeller/actions";
import { getServicesAction } from "../../hizmetler/actions";
import { getGroupedPackagesAction } from "../../paketler/actions";
import { decreaseStockForSale, getProductsAction, increaseStockAfterSaleCancellation } from "../../urunler/actions";
import type { Appointment, AppointmentWritePayload, AppointmentUpdatePayload } from './types';
import { isSameDay, startOfDay, endOfDay } from 'date-fns';

// Birden çok randevuyu tek bir grup olarak ekle
export async function performAddAppointmentAction(formData: FormData) {
    'use server';
    const customerId = formData.get("customerId") as string;
    const dateTimeStr = formData.get("dateTime") as string;
    const notes = formData.get("notes") as string || "";

    const personnelIds = formData.getAll("personnelIds") as string[];
    const serviceOrPackageIds = formData.getAll("serviceOrPackageIds") as string[];
    const prices = formData.getAll("prices").map(p => parseFloat(p as string));
    const isPackageSessionFlags = formData.getAll("isPackageSession").map(f => f === 'true');
    const packageSaleIds = formData.getAll("packageSaleIds") as string[];


    if (!customerId || personnelIds.length === 0 || !dateTimeStr) {
        return { success: false, message: "Müşteri, en az bir hizmet ve tarih/saat zorunludur." };
    }
     if (personnelIds.length !== serviceOrPackageIds.length || personnelIds.length !== prices.length) {
        return { success: false, message: "Hizmet satırı bilgileri eşleşmiyor." };
    }

    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const customerDoc = await db.collection("customers").doc(customerId).get();
        if (!customerDoc.exists) {
            const newCustomerResult = await performAddCustomerAction(formData);
            if (!newCustomerResult.success || !newCustomerResult.newCustomer) {
                return { success: false, message: "Yeni müşteri oluşturulamadı veya müşteri bilgisi alınamadı." };
            }
            formData.set("customerId", newCustomerResult.newCustomer.id);
        }
        
        const finalCustomerId = formData.get("customerId") as string;
        const allCustomerAppointmentsSnap = await db.collection("appointments")
            .where("customerId", "==", finalCustomerId)
            .get();

        const appointmentDate = new Date(dateTimeStr);
        const appointmentsOnDate = allCustomerAppointmentsSnap.docs
            .map(doc => ({ ...doc.data(), id: doc.id, start: (doc.data().start as Timestamp).toDate(), end: (doc.data().end as Timestamp).toDate() } as Appointment))
            .filter(app => isSameDay(app.start, appointmentDate));


        const finalCustomerDoc = await db.collection("customers").doc(finalCustomerId).get();
        if (!finalCustomerDoc.exists) return { success: false, message: "Müşteri bulunamadı." };

        const customerName = finalCustomerDoc.data()?.fullName;

        // Tüm personelleri ve hizmetleri/paketleri önceden çek
        const allPersonnel = await getPersonelAction();
        const allServices = await getServicesAction();
        const allPackages = Object.values(await getGroupedPackagesAction()).flatMap(cat => cat.packages);
        
        let appointmentGroupId: string;
        let currentStartTime = new Date(dateTimeStr); // Always start from the user-selected time.

        if (appointmentsOnDate.length > 0) {
            // Mevcut bir randevu varsa, onun groupId'sini kullan.
            appointmentGroupId = appointmentsOnDate[0].groupId;
        } else {
            // Yeni randevu, yeni groupId
            appointmentGroupId = db.collection("appointments").doc().id;
        }

        const batch = db.batch();

        for (let i = 0; i < personnelIds.length; i++) {
            const personnelId = personnelIds[i];
            const serviceOrPackageId = serviceOrPackageIds[i];
            const price = prices[i];
            const isPackageSession = isPackageSessionFlags[i] || false;
            const packageSaleId = packageSaleIds[i] || "";

            const personnel = allPersonnel.find(p => p.id === personnelId);
            if (!personnel) throw new Error(`Personel bulunamadı: ${personnelId}`);

            let serviceName = "";
            let duration = 0;
            let isPackage = false; // Bu, hizmetin bir "Paket Satışı" mı yoksa tek hizmet mi olduğunu belirtir

            const service = allServices.find(s => s.id === serviceOrPackageId);
            const pkg = allPackages.find(p => p.id === serviceOrPackageId);

            if (service) {
                serviceName = service.name;
                duration = service.duration;
            } else if (pkg) {
                serviceName = pkg.name;
                duration = pkg.serviceIds.reduce((acc, sid) => acc + (allServices.find(s => s.id === sid)?.duration || 0), 0) || 60;
                isPackage = true;
            } else {
                // Eğer müşteri paketinden gelen bir hizmetse, ismini ve süresini bul
                const serviceFromPackage = allServices.find(s => s.id === serviceOrPackageId);
                if (isPackageSession && serviceFromPackage) {
                    serviceName = serviceFromPackage.name;
                    duration = serviceFromPackage.duration;
                } else {
                    throw new Error(`Hizmet veya paket bulunamadı: ${serviceOrPackageId}`);
                }
            }

            if (duration <= 0) throw new Error(`Hizmetin süresi geçersiz: ${serviceName}`);
            if (isNaN(price) || price < 0) throw new Error("Geçersiz fiyat değeri.");
            
            const startDate = currentStartTime;
            const endDate = new Date(startDate.getTime() + duration * 60000);
            
            const appointmentData: any = {
                groupId: appointmentGroupId,
                customerId: finalCustomerId,
                customerName,
                personnelId,
                personnelName: personnel.fullName,
                serviceId: serviceOrPackageId,
                serviceName,
                price: isPackageSession ? 0 : price, // Paket seansıysa fiyat 0'dır
                isPackage,
                isPackageSession,
                start: Timestamp.fromDate(startDate),
                end: Timestamp.fromDate(endDate),
                notes,
                createdAt: FieldValue.serverTimestamp(),
                status: "active",
            };

            if (isPackageSession && packageSaleId) {
                appointmentData.packageSaleId = packageSaleId;
            }

            const newAppointmentRef = db.collection("appointments").doc();
            batch.set(newAppointmentRef, appointmentData);

            currentStartTime = endDate;
        }

        await batch.commit();
        revalidatePath("/takvim");

        return { success: true, message: `${personnelIds.length} adet randevu başarıyla oluşturuldu.` };

    } catch (error: any) {
        console.error("Randevu kaydetme hatası:", error);
        return { success: false, message: error.message || "Randevu oluşturulurken bir sunucu hatası oluştu." };
    }
}


export async function performUpdateAppointmentAction({ event, start, end, newPersonnelId }: AppointmentUpdatePayload) {
    'use server';
    if (!event || !start || !end) {
        return { success: false, message: "Gerekli bilgiler eksik." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        const appointmentRef = db.collection("appointments").doc(event.id);
        const appointmentDoc = await appointmentRef.get();
        if (!appointmentDoc.exists) {
            throw new Error("Güncellenecek randevu bulunamadı.");
        }

        const updateData: { [key: string]: any } = {
            start: Timestamp.fromDate(start),
            end: Timestamp.fromDate(end),
        };
        
        if (newPersonnelId && newPersonnelId !== event.personnelId) {
             const allPersonnel = await getPersonelAction();
             const targetPersonnel = allPersonnel.find(p => p.id === newPersonnelId);
             if (targetPersonnel) {
                updateData.personnelId = targetPersonnel.id;
                updateData.personnelName = targetPersonnel.fullName;
             }
        }
        
        await appointmentRef.update(updateData);
        
        revalidatePath("/takvim");
        return { success: true, message: "Randevu başarıyla güncellendi." };

    } catch (error: any) {
        console.error("Randevu güncelleme hatası:", error);
        return { success: false, message: error.message || "Randevu güncellenirken bir sunucu hatası oluştu." };
    }
}


// Randevu Grubunu ve Satışları Güncelle
export async function performFullUpdateAppointmentAction(formData: FormData) {
    'use server';
    const groupId = formData.get("groupId") as string;
    const customerId = formData.get("customerId") as string;
    const dateTimeStr = formData.get("dateTime") as string;
    const notes = formData.get("notes") as string || "";
    const allGroupIdsToDelete = (formData.get("allGroupIdsToDelete") as string).split(',');
    const isDurationChanged = formData.get("isDurationChanged") === 'true';

    const personnelIds = formData.getAll("personnelIds") as string[];
    const serviceOrPackageIds = formData.getAll("serviceOrPackageIds") as string[];
    const prices = formData.getAll("prices").map(p => parseFloat(p as string));
    const isPackageSessionFlags = formData.getAll("isPackageSession").map(f => f === 'true');
    const packageSaleIds = formData.getAll("packageSaleIds") as string[];
    
    const soldProductIds = formData.getAll("soldProductIds") as string[];
    const soldQuantities = formData.getAll("soldQuantities").map(q => parseInt(q as string, 10));
    const soldTotalAmounts = formData.getAll("soldTotalAmounts").map(p => parseFloat(p as string));
    const soldPersonnelIds = formData.getAll("soldPersonnelIds") as string[];
    
    if (!groupId || !customerId || !dateTimeStr || !allGroupIdsToDelete.length) {
        return { success: false, message: "Grup ID, Müşteri, Tarih ve Saat zorunludur." };
    }
    if (personnelIds.some(p => !p) || serviceOrPackageIds.some(s => !s) || prices.some(p => isNaN(p))) {
        return { success: false, message: "Lütfen tüm hizmet satırlarındaki alanları doldurun." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
   
    try {
        const allPersonnelData = await getPersonelAction();
        const allServices = await getServicesAction();
        const allPackages = Object.values(await getGroupedPackagesAction()).flatMap(cat => cat.packages);
        const allProductsData = await getProductsAction();

        await db.runTransaction(async (transaction) => {
            const customerDocSnap = await transaction.get(db.collection("customers").doc(customerId));
            if (!customerDocSnap.exists) throw new Error("Müşteri bulunamadı.");

            const oldAppointmentsQuery = db.collection("appointments").where("groupId", "in", allGroupIdsToDelete);
            const oldAppointmentsSnap = await transaction.get(oldAppointmentsQuery);
            const originalAppointments = oldAppointmentsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    start: (data.start as Timestamp).toDate(),
                    end: (data.end as Timestamp).toDate()
                } as Appointment;
            }).sort((a,b) => a.start.getTime() - b.start.getTime());

            const oldSalesQuery = db.collection("sales").where("appointmentGroupId", "in", allGroupIdsToDelete);
            const oldSalesSnap = await transaction.get(oldSalesQuery);
            
            for (const doc of oldSalesSnap.docs) {
                const oldSaleData = doc.data();
                await increaseStockAfterSaleCancellation(oldSaleData.productId, oldSaleData.quantity, transaction);
                transaction.delete(doc.ref);
            }
            
            oldAppointmentsSnap.docs.forEach(doc => transaction.delete(doc.ref));

            const customerName = customerDocSnap.data()?.fullName;
            let currentStartTime = new Date(dateTimeStr);
            
            for (let i = 0; i < personnelIds.length; i++) {
                const personnelId = personnelIds[i];
                const serviceOrPackageId = serviceOrPackageIds[i];
                const price = prices[i];
                const isPackageSession = isPackageSessionFlags[i] || false;
                const packageSaleId = packageSaleIds[i] || "";
                if (!personnelId || !serviceOrPackageId) continue;

                const personnel = allPersonnelData.find(p => p.id === personnelId);
                if (!personnel) throw new Error(`Personel bulunamadı: ${personnelId}`);

                let serviceName = "";
                let duration = 0;
                let isPackage = false;

                const service = allServices.find(s => s.id === serviceOrPackageId);
                const pkg = allPackages.find(p => p.id === serviceOrPackageId);

                if (service) {
                    serviceName = service.name;
                    duration = service.duration;
                } else if (pkg) {
                    serviceName = pkg.name;
                    duration = pkg.serviceIds.reduce((acc, sid) => acc + (allServices.find(s => s.id === sid)?.duration || 0), 0) || 60;
                    isPackage = true;
                } else {
                     const serviceFromPackage = allServices.find(s => s.id === serviceOrPackageId);
                     if (isPackageSession && serviceFromPackage) {
                         serviceName = serviceFromPackage.name;
                         duration = serviceFromPackage.duration;
                     } else {
                         throw new Error(`Hizmet veya paket bulunamadı: ${serviceOrPackageId}`);
                     }
                }
                
                let startDate: Date;
                if (isDurationChanged) {
                    startDate = currentStartTime;
                } else {
                     // Find the corresponding original appointment to keep its time
                    const originalApp = originalAppointments[i];
                    const firstAppStart = new Date(dateTimeStr);
                    
                    if (i === 0) {
                        startDate = firstAppStart;
                    } else if (originalApp) {
                        const previousOriginalApp = originalAppointments[i-1];
                        const timeDiff = originalApp.start.getTime() - previousOriginalApp.start.getTime();
                        
                        const newPreviousAppEnd = new Date(currentStartTime.getTime());
                        startDate = new Date(newPreviousAppEnd.getTime());
                    } else {
                         startDate = currentStartTime; // Fallback for new items
                    }
                }
                
                const endDate = new Date(startDate.getTime() + duration * 60000);
                
                const appointmentData: any = {
                    groupId, customerId, customerName, personnelId, personnelName: personnel.fullName,
                    serviceId: serviceOrPackageId, serviceName, price: isPackageSession ? 0 : price, isPackage, isPackageSession,
                    start: Timestamp.fromDate(startDate), 
                    end: Timestamp.fromDate(endDate),
                    notes, createdAt: FieldValue.serverTimestamp(), status: "active",
                };

                if(isPackageSession && packageSaleId) {
                    appointmentData.packageSaleId = packageSaleId;
                }

                transaction.set(db.collection("appointments").doc(), appointmentData);
                
                currentStartTime = endDate;
            }
            
            if (soldProductIds.length > 0) {
                for (let i = 0; i < soldProductIds.length; i++) {
                    const productId = soldProductIds[i];
                    const quantity = soldQuantities[i];
                    const totalAmount = soldTotalAmounts[i];
                    const salePersonnelId = soldPersonnelIds[i];

                    if (!productId || !salePersonnelId || !quantity || quantity <= 0) continue;
                    
                    const salePersonnel = allPersonnelData.find(p => p.id === salePersonnelId);
                    const productData = allProductsData.find(p => p.id === productId);

                    if (!salePersonnel || !productData) continue;

                    await decreaseStockForSale(productId, quantity, transaction);
                    
                    const saleData = {
                        productId, productName: productData.name, quantity, totalAmount,
                        customerId, customerName, personnelId: salePersonnel.id,
                        personnelName: salePersonnel.fullName, saleDate: Timestamp.now(),
                        appointmentGroupId: groupId
                    };
                    transaction.set(db.collection("sales").doc(), saleData);
                }
            }
        });

        revalidatePath("/takvim");
        revalidatePath("/urun-satislar");
        revalidatePath("/urunler");
        return { success: true, message: "Randevu başarıyla güncellendi." };

    } catch (error: any) {
        console.error("Randevu güncelleme hatası:", error);
        return { success: false, message: error.message || "Randevu güncellenirken bir sunucu hatası oluştu." };
    }
}


// Randevu Grubunu Sil/İptal Et
export async function performDeleteAppointmentAction(groupId: string) {
    'use server';
    if (!groupId) return { success: false, message: "Randevu Grup ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
       await db.runTransaction(async (transaction) => {
            const appointmentsQuery = db.collection("appointments").where("groupId", "==", groupId);
            const appointmentsSnap = await transaction.get(appointmentsQuery);
            if (appointmentsSnap.empty) return; 

            const salesQuery = db.collection("sales").where("appointmentGroupId", "==", groupId);
            const salesSnap = await transaction.get(salesQuery);

            if (!salesSnap.empty) {
                for (const doc of salesSnap.docs) {
                    const saleData = doc.data();
                    if (saleData) {
                        await increaseStockAfterSaleCancellation(saleData.productId, saleData.quantity, transaction);
                         transaction.delete(doc.ref);
                    }
                }
            }
            
            appointmentsSnap.docs.forEach(doc => {
                transaction.update(doc.ref, { status: "cancelled" });
            });
        });
        
        revalidatePath("/takvim");
        revalidatePath("/urun-satislar");
        revalidatePath("/urunler");
        revalidatePath("/musteriler");

        return { success: true, message: "Randevu grubu başarıyla iptal edildi." };
    } catch (error: any) {
        console.error("Randevu silme/iptal etme hatası:", error);
        return { success: false, message: error.message || "Randevu iptal edilemedi." };
    }
}

// Sadece tek bir randevu hizmetini sil
export async function deleteSingleAppointmentAction(appointmentId: string) {
    'use server';
    if (!appointmentId) return { success: false, message: "Randevu ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        const appointmentRef = db.collection("appointments").doc(appointmentId);
        await appointmentRef.delete();

        revalidatePath("/takvim");
        return { success: true, message: "Hizmet başarıyla silindi." };
    } catch (error: any) {
        console.error("Tekil randevu silme hatası:", error);
        return { success: false, message: error.message || "Hizmet silinemedi." };
    }
}

interface AddServicePayload {
  groupId: string;
  customerId: string;
  personnelId: string;
  serviceId: string;
  price: number;
  isPackage: boolean;
}

export async function addServiceToAppointmentAction(payload: AddServicePayload) {
    'use server';
    const { groupId, customerId, personnelId, serviceId, price, isPackage } = payload;
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const [customerDoc, personnelDoc, serviceOrPackageDoc, groupAppointmentsSnap] = await Promise.all([
            db.collection("customers").doc(customerId).get(),
            db.collection("personel").doc(personnelId).get(),
            db.collection(isPackage ? "packages" : "services").doc(serviceId).get(),
            db.collection("appointments").where("groupId", "==", groupId).get()
        ]);

        if (!customerDoc.exists) return { success: false, message: "Müşteri bulunamadı." };
        if (!personnelDoc.exists) return { success: false, message: "Personel bulunamadı." };
        if (!serviceOrPackageDoc.exists) return { success: false, message: "Hizmet veya paket bulunamadı." };

        const allServices = await getServicesAction(); 

        let duration = 0;
        if (isPackage) {
            const pkg = serviceOrPackageDoc.data();
            duration = pkg?.serviceIds.reduce((acc: number, sid: string) => acc + (allServices.find(s => s.id === sid)?.duration || 0), 0) || 60;
        } else {
            duration = serviceOrPackageDoc.data()?.duration || 0;
        }

        if (duration <= 0) return { success: false, message: "Hizmet süresi geçersiz." };
        if (groupAppointmentsSnap.empty) return { success: false, message: "Mevcut randevu grubu bulunamadı." };
        
        const appointmentsInGroup = groupAppointmentsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), start: (doc.data().start as Timestamp).toDate(), end: (doc.data().end as Timestamp).toDate() } as Appointment))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
        
        let lastAppointmentEnd = new Date(0); 
        let lastAppointmentNotes = "";
        
        if (appointmentsInGroup.length > 0) {
            const lastAppointment = appointmentsInGroup[appointmentsInGroup.length - 1];
            lastAppointmentEnd = lastAppointment.end;
            lastAppointmentNotes = lastAppointment.notes || "";
        } else {
             return { success: false, message: "Randevu grubu bulunamadı." };
        }
        
        const newAppointmentStart = lastAppointmentEnd;
        const newAppointmentEnd = new Date(newAppointmentStart.getTime() + duration * 60000);


        const appointmentData = {
            groupId,
            customerId,
            customerName: customerDoc.data()?.fullName,
            personnelId,
            personnelName: personnelDoc.data()?.fullName,
            serviceId,
            serviceName: serviceOrPackageDoc.data()?.name,
            price,
            isPackage,
            isPackageSession: false, 
            start: Timestamp.fromDate(newAppointmentStart),
            end: Timestamp.fromDate(newAppointmentEnd),
            notes: lastAppointmentNotes,
            createdAt: FieldValue.serverTimestamp(),
            status: "active",
        };
        
        await db.collection("appointments").add(appointmentData);

        revalidatePath("/takvim");
        return { success: true, message: "Hizmet başarıyla eklendi." };

    } catch (error: any) {
        console.error("Randevuya hizmet eklenirken hata:", error);
        return { success: false, message: error.message || "Hizmet eklenemedi." };
    }
}

export async function updateAppointmentServicePriceAction(appointmentId: string, newPrice: number) {
    'use server';
    if (!appointmentId || typeof newPrice !== 'number' || newPrice < 0) {
        return { success: false, message: "Geçersiz veri." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const appointmentRef = db.collection("appointments").doc(appointmentId);
        await appointmentRef.update({ price: newPrice });
        
        revalidatePath("/takvim");
        return { success: true, message: "Fiyat güncellendi." };
    } catch (error: any) {
        console.error("Randevu fiyatı güncellenirken hata:", error);
        return { success: false, message: "Fiyat güncellenemedi." };
    }
}
```