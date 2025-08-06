
'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import type { Appointment } from "../randevular/actions";
import type { PackageSale } from "../paket-satislar/actions";
import type { Sale } from "../urun-satislar/actions";
import type { PaymentTransaction } from "../kasa/actions";


export interface Customer {
    id: string;
    fullName: string;
    phone: string;
    notes?: string;
    createdAt: Date;
}

export interface EnrichedPaymentTransaction extends PaymentTransaction {
    description: string;
    personnelName: string;
}

export interface CustomerDetails {
    customer: Customer;
    appointments: Appointment[];
    packageSales: PackageSale[];
    productSales: Sale[];
    paymentTransactions: EnrichedPaymentTransaction[];
    totalSpent: number;
}


// Helper function to format names
const formatFullName = (name: string): string => {
    if (!name) return "";
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};


// Müşterileri çek
export async function getCustomersAction(): Promise<Customer[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getCustomersAction)");
      return [];
    }
    try {
      const customersSnapshot = await db.collection("customers").orderBy("createdAt", "desc").get();
      const customers = customersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fullName: data.fullName,
          phone: data.phone,
          notes: data.notes,
          createdAt: (data.createdAt as Timestamp).toDate(),
        } as Customer;
      });
      return customers;
    } catch (error) {
      console.error("Müşteriler çekilirken hata:", error);
      return [];
    }
}

// Müşteri Ekle
export async function performAddCustomerAction(formData: FormData): Promise<{ success: boolean; message: string; newCustomer?: Customer }> {
  'use server';
  const fullNameRaw = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string || "";

  if (!fullNameRaw || !phone) {
    return { success: false, message: "Ad Soyad ve Telefon alanları zorunludur." };
  }
   if (!/^[5]\d{9}$/.test(phone)) {
    return { success: false, message: "Geçersiz telefon numarası formatı. Numara '5' ile başlamalı ve 10 haneli olmalıdır." };
  }

  const fullName = formatFullName(fullNameRaw);

  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

  try {
    const customerData = { fullName, phone, notes, createdAt: Timestamp.now() };
    const newDocRef = await db.collection("customers").add(customerData);
    revalidatePath("/musteriler");
    revalidatePath("/takvim"); // Revalidate calendar page data as well

    const newCustomer: Customer = {
        id: newDocRef.id,
        ...customerData,
        createdAt: customerData.createdAt.toDate(),
    };

    return { success: true, message: `${fullName} adlı müşteri başarıyla eklendi.`, newCustomer };
  } catch (error) {
    console.error("Veritabanına kaydetme hatası:", error);
    return { success: false, message: "Müşteri veritabanına kaydedilemedi." };
  }
}

// Müşteri Güncelle
export async function performUpdateCustomerAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    const fullNameRaw = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string || "";

    if (!id || !fullNameRaw || !phone) {
        return { success: false, message: "Ad Soyad ve Telefon alanları zorunludur." };
    }
    if (!/^[5]\d{9}$/.test(phone)) {
        return { success: false, message: "Geçersiz telefon numarası formatı. Numara '5' ile başlamalı ve 10 haneli olmalıdır." };
    }

    const fullName = formatFullName(fullNameRaw);

    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        await db.collection("customers").doc(id).update({ fullName, phone, notes });
        revalidatePath("/musteriler");
        revalidatePath("/takvim"); // Update customer name in calendar if it's open
        return { success: true, message: "Müşteri bilgileri başarıyla güncellendi." };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { success: false, message: "Müşteri bilgileri güncellenemedi." };
    }
}


// Müşteri Sil
export async function performDeleteCustomerAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Müşteri ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        // İleride bu müşteriye ait randevu, satış vb. varsa silmeyi engelleyen bir kontrol eklenebilir.
        await db.collection("customers").doc(id).delete();
        revalidatePath("/musteriler");
        return { success: true, message: "Müşteri başarıyla silindi." };
    } catch (error) {
        console.error("Silme hatası:", error);
        return { success: false, message: "Müşteri silinemedi." };
    }
}


export async function getCustomerDetailsAction(customerId: string): Promise<CustomerDetails | null> {
    console.log(`[CUSTOMER_DETAILS_LOG] Firing for customerId: ${customerId}`);
    if (!customerId || !db) {
        console.error(`[CUSTOMER_DETAILS_LOG] Aborting: Missing customerId or DB connection.`);
        return null;
    }

    try {
        const customerDoc = await db.collection("customers").doc(customerId).get();
        if (!customerDoc.exists) {
            console.error(`[CUSTOMER_DETAILS_LOG] ERROR: Customer not found: ${customerId}`);
            return null;
        }
        
        const customerData = customerDoc.data()!;
        const customer: Customer = {
            id: customerDoc.id,
            fullName: customerData.fullName,
            phone: customerData.phone,
            notes: customerData.notes,
            createdAt: (customerData.createdAt as Timestamp).toDate()
        };
        console.log(`[CUSTOMER_DETAILS_LOG] Found customer: ${customer.fullName}`);
        
        // Fetch all related data in parallel
        const [appointmentSnap, packageSalesSnap, productSaleSnap, paymentSnap] = await Promise.all([
            db.collection("appointments").where("customerId", "==", customerId).get(),
            db.collection("packageSales").where("customerId", "==", customerId).get(),
            db.collection("sales").where("customerId", "==", customerId).get(),
            db.collection("paymentTransactions").where("customerId", "==", customerId).get()
        ]);
        console.log(`[CUSTOMER_DETAILS_LOG] Fetched related data: ${appointmentSnap.size} appointments, ${packageSalesSnap.size} package sales, ${productSaleSnap.size} product sales, ${paymentSnap.size} payments.`);

        const allAppointments: Appointment[] = appointmentSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), start: (doc.data().start as Timestamp).toDate(), end: (doc.data().end as Timestamp).toDate(), createdAt: (doc.data().createdAt as Timestamp).toDate() } as Appointment))
            .sort((a, b) => b.start.getTime() - a.start.getTime());

        const allPackageSales: PackageSale[] = packageSalesSnap.docs
            .map(doc => {
                const data = doc.data();
                const totalSessions = data.totalSessionsCount || 0;
                const remainingSessions = data.remainingSessions ?? totalSessions;
                const usedSessions = totalSessions - remainingSessions;
                return { 
                    id: doc.id, 
                    ...data, 
                    saleDate: (data.saleDate as Timestamp).toDate(),
                    remainingSessions: remainingSessions,
                    totalSessionsCount: totalSessions,
                    usedSessionsCount: usedSessions < 0 ? 0 : usedSessions,
                    serviceIds: data.serviceIds || [],
                } as PackageSale;
            });

        const allProductSales: Sale[] = productSaleSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), saleDate: (doc.data().saleDate as Timestamp).toDate() }))
            .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

        const allPaymentTransactions: PaymentTransaction[] = paymentSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), paymentDate: (doc.data().paymentDate as Timestamp).toDate() } as PaymentTransaction));
        
        const enrichedPayments: EnrichedPaymentTransaction[] = [];
        console.log(`[CUSTOMER_DETAILS_LOG] Starting enrichment loop for ${allPaymentTransactions.length} payments...`);
        
        for (const trans of allPaymentTransactions) {
            let description = "Bilinmeyen İşlem";
            let personnelName = "-";

            if (trans.paymentType === 'package') {
                const sale = allPackageSales.find(s => s.id === trans.appointmentGroupId);
                if (sale) {
                    description = `Paket: ${sale.packageName}`;
                    personnelName = sale.personnelName;
                }
            } else if (trans.paymentType === 'appointment') {
                 const appointments = allAppointments.filter(a => a.groupId === trans.appointmentGroupId);
                 const sales = allProductSales.filter(s => s.appointmentGroupId === trans.appointmentGroupId);
                
                const items: string[] = [];
                if (appointments.length > 0) {
                    items.push(...appointments.map(a => a.serviceName));
                    personnelName = appointments[0].personnelName; // Use first personnel as primary
                }
                if (sales.length > 0) {
                    items.push(...sales.map(s => `${s.quantity}x ${s.productName}`));
                    if(personnelName === "-") personnelName = sales[0].personnelName || "-";
                }
                description = items.join(', ') || "Randevu Ödemesi";
            }
             enrichedPayments.push({ ...trans, description, personnelName });
        }
        console.log(`[CUSTOMER_DETAILS_LOG] Finished enrichment. Enriched ${enrichedPayments.length} payments.`);

        const totalSpent = allPaymentTransactions.reduce((acc, trans) => acc + trans.grandTotalAmount, 0);

        const result: CustomerDetails = {
            customer,
            appointments: allAppointments,
            packageSales: allPackageSales,
            productSales: allProductSales,
            paymentTransactions: enrichedPayments.sort((a,b) => b.paymentDate.getTime() - a.paymentDate.getTime()),
            totalSpent
        };
        
        console.log(`[CUSTOMER_DETAILS_LOG] Successfully built details object. Returning to client.`);
        return result;

    } catch (error: any) {
        console.error("[CUSTOMER_DETAILS_LOG] CRITICAL ERROR in getCustomerDetailsAction:", error.message);
        console.error("Stack Trace:", error.stack);
        return null;
    }
}

    