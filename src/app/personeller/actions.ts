'use server';
import { db } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { formatTitleCase } from "@/lib/utils";

export type PersonelStatus = "Personel" | "Yönetici" | "Kasa";

export interface DayHours {
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
}

export type WorkingDays = Record<string, DayHours>; // '0' for Sunday, '1' for Monday...

export interface Personel {
    id: string;
    fullName: string;
    phone: string;
    status: PersonelStatus;
    serviceIds: string[];
    workingDays: WorkingDays;
    createdAt: Date;
    order?: number; // Sıralama için eklendi (opsiyonel)
}

// Personelleri çek
export async function getPersonelAction(): Promise<Personel[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getPersonelAction)");
      return [];
    }
    try {
      let personelSnapshot;
      try {
        // Önce 'order' alanına göre sıralamayı dene. Bu, bir bileşik indeks gerektirebilir.
        personelSnapshot = await db.collection("personel").orderBy("order", "asc").get();
      } catch (error) {
        // Eğer 'order' indeksi yoksa veya başka bir hata olursa, createdAt'e göre sırala.
        console.warn("Order alanına göre sıralama başarısız oldu, muhtemelen indeks eksik. Varsayılan sıralamaya (createdAt) geçiliyor:", error);
        personelSnapshot = await db.collection("personel").orderBy("createdAt", "desc").get();
      }
      
      const personelList = personelSnapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: doc.id,
          fullName: data.fullName,
          phone: data.phone,
          status: data.status || "Personel",
          serviceIds: data.serviceIds || [],
          workingDays: data.workingDays || {},
          createdAt: (data.createdAt as Timestamp).toDate(),
          order: data.order, // Firestore'dan gelen 'order' değerini al
        } as Personel;
      });
      
      // Her ihtimale karşı istemci tarafında da sıralama yap.
      // 'order' alanı olanları öne al, olmayanları arkada tarihe göre sırala.
      return personelList.sort((a, b) => {
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;

        if (orderA !== orderB) {
            return orderA - orderB;
        }
        // Eğer order alanları aynı veya ikisi de tanımsız ise, createdAt'e göre sırala
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    } catch (error: any) {
      console.error("Personel verileri çekilirken kritik hata:", error);
      return []; // Hata durumunda her zaman boş bir dizi döndür.
    }
}

// Personel Ekle
export async function performAddPersonelAction(formData: FormData) {
  'use server';
  const fullNameRaw = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const status = formData.get("status") as PersonelStatus;
  const serviceIds = formData.getAll("serviceIds") as string[];
  const workingDays: WorkingDays = {};
    for (let i = 0; i < 7; i++) {
        const day = String(i);
        const isWorkingDay = formData.has(`isWorkingDay_${day}`);
        
        if (isWorkingDay) {
            const startTime = formData.get(`startTime_${day}`) as string;
            const endTime = formData.get(`endTime_${day}`) as string;
             if (!startTime || !endTime) {
                 return { success: false, message: `Çalışma günü olarak işaretlenen günler için başlangıç ve bitiş saatleri zorunludur.` };
            }
             if (startTime >= endTime) {
                return { success: false, message: `Başlangıç saati, bitiş saatinden önce olmalıdır.` };
            }
            workingDays[day] = { 
                isWorkingDay: true, 
                startTime: startTime, 
                endTime: endTime 
            };
        }
    }

  if (!fullNameRaw || !phone || !status) {
    return { success: false, message: "Ad Soyad, Telefon ve Statü alanları zorunludur." };
  }
  if (!/^[5]\d{9}$/.test(phone)) {
    return { success: false, message: "Geçersiz telefon numarası formatı. Numara '5' ile başlamalı ve 10 haneli olmalıdır." };
  }
  const fullName = formatTitleCase(fullNameRaw);
  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
  
  try {
    // Mevcut personellerin sayısını öğrenmek için bir sorgu yap
    const personelSnapshot = await db.collection("personel").get();
    const nextOrder = personelSnapshot.size;
    
    const personel = { 
        fullName, 
        phone, 
        status, 
        serviceIds, 
        workingDays, 
        createdAt: Timestamp.now(),
        order: nextOrder, // Sıralama bilgisi eklendi
    };
    await db.collection("personel").add(personel);
    revalidatePath("/personeller");
    revalidatePath("/takvim");
    return { success: true, message: `${fullName} adlı personel başarıyla eklendi.` };
  } catch (error) {
    console.error("Veritabanına kaydetme hatası:", error);
    return { success: false, message: "Personel veritabanına kaydedilemedi." };
  }
}

// Personel Güncelle
export async function performUpdatePersonelAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    const fullNameRaw = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const status = formData.get("status") as PersonelStatus;
    const serviceIds = formData.getAll("serviceIds") as string[];
    const workingDays: WorkingDays = {};
    for (let i = 0; i < 7; i++) {
        const day = String(i);
        const isWorkingDay = formData.has(`isWorkingDay_${day}`);
        
        if (isWorkingDay) {
            const startTime = formData.get(`startTime_${day}`) as string;
            const endTime = formData.get(`endTime_${day}`) as string;
             if (!startTime || !endTime) {
                 return { success: false, message: `Çalışma günü olarak işaretlenen günler için başlangıç ve bitiş saatleri zorunludur.` };
            }
             if (startTime >= endTime) {
                return { success: false, message: `Başlangıç saati, bitiş saatinden önce olmalıdır.` };
            }
            workingDays[day] = { 
                isWorkingDay: true, 
                startTime: startTime, 
                endTime: endTime 
            };
        }
    }
    if (!id || !fullNameRaw || !phone || !status) {
        return { success: false, message: "Ad Soyad, Telefon ve Statü alanları zorunludur." };
    }
     if (!/^[5]\d{9}$/.test(phone)) {
        return { success: false, message: "Geçersiz telefon numarası formatı. Numara '5' ile başlamalı ve 10 haneli olmalıdır." };
    }
    const newFullName = formatTitleCase(fullNameRaw);
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    try {
        await db.runTransaction(async (transaction) => {
            const personelRef = db.collection("personel").doc(id);
            
            const personelDoc = await transaction.get(personelRef);
            if (!personelDoc.exists) {
                throw new Error("Personel bulunamadı.");
            }
            
            const oldFullName = personelDoc.data()?.fullName;
            const nameChanged = oldFullName !== newFullName;
            let appointmentsSnap, salesSnap, packageSalesSnap;
            if (nameChanged) {
                const appointmentsQuery = db.collection("appointments").where("personnelId", "==", id);
                appointmentsSnap = await transaction.get(appointmentsQuery);
                const salesQuery = db.collection("sales").where("personnelId", "==", id);
                salesSnap = await transaction.get(salesQuery);
                const packageSalesQuery = db.collection("packageSales").where("personnelId", "==", id);
                packageSalesSnap = await transaction.get(packageSalesQuery);
            }
            
            const updateData: any = { 
                fullName: newFullName, 
                phone, 
                status, 
                serviceIds, 
                workingDays,
            };

            // Mevcut 'order' alanını koru. Eğer yoksa, bu güncelleme eklemez.
            const currentOrder = personelDoc.data()?.order;
            if (currentOrder !== undefined) {
                updateData.order = currentOrder;
            }

            transaction.update(personelRef, updateData);
            
            if (nameChanged) {
                if (appointmentsSnap) {
                    appointmentsSnap.docs.forEach(doc => {
                        transaction.update(doc.ref, { personnelName: newFullName });
                    });
                }
                if (salesSnap) {
                    salesSnap.docs.forEach(doc => {
                        transaction.update(doc.ref, { personnelName: newFullName });
                    });
                }
                if (packageSalesSnap) {
                    packageSalesSnap.docs.forEach(doc => {
                        transaction.update(doc.ref, { personnelName: newFullName });
                    });
                }
            }
        });
        revalidatePath("/personeller");
        revalidatePath("/takvim");
        revalidatePath("/kasa");
        revalidatePath("/urun-satislar");
        revalidatePath("/paket-satislar");
        revalidatePath("/musteriler"); 
        return { success: true, message: "Personel bilgileri ve tüm ilişkili kayıtlar başarıyla güncellendi." };
    } catch (error: any) {
        console.error("Güncelleme hatası:", error);
        return { success: false, message: error.message || "Personel bilgileri güncellenemedi." };
    }
}

// Personel Sil
export async function performDeletePersonelAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Personel ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        await db.collection("personel").doc(id).delete();
        revalidatePath("/personeller");
        return { success: true, message: "Personel başarıyla silindi." };
    } catch (error) {
        console.error("Silme hatası:", error);
        return { success: false, message: "Personel silinemedi." };
    }
}

// Mevcut personel kayıtlarına order alanı eklemek için geçici fonksiyon
export async function addOrderToExistingPersonel() {
    'use server';
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const personelSnapshot = await db.collection("personel").get();
        const batch = db.batch();
        
        personelSnapshot.docs.forEach((doc, index) => {
            const personelRef = db.collection("personel").doc(doc.id);
            if (doc.data().order === undefined) {
                batch.update(personelRef, { order: index });
            }
        });
        
        await batch.commit();
        revalidatePath("/personeller");
        revalidatePath("/takvim");
        return { success: true, message: "Mevcut personel verilerine order alanı eklendi." };
    } catch (error) {
        console.error("Order alanı ekleme hatası:", error);
        return { success: false, message: "Order alanı eklenemedi." };
    }
}

// Personel sıralamasını güncelleme fonksiyonu
export async function updatePersonelOrderAction(personelIds: string[]) {
    'use server';
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const batch = db.batch();
        
        personelIds.forEach((id, index) => {
            const personelRef = db.collection("personel").doc(id);
            batch.update(personelRef, { order: index });
        });
        
        await batch.commit();
        revalidatePath("/takvim");
        revalidatePath("/personeller");
        return { success: true, message: "Personel sıralaması başarıyla güncellendi." };
    } catch (error) {
        console.error("Sıralama güncelleme hatası:", error);
        return { success: false, message: "Personel sıralaması güncellenemedi." };
    }
}
