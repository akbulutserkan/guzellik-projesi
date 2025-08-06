



'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue, Transaction, DocumentSnapshot } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { getCustomersAction, type Customer } from "../musteriler/actions";
import { getPersonelAction, type Personel } from "../personeller/actions";
import { getGroupedPackagesAction, type Package, getServicesAction } from "../paketler/actions";
import type { PaymentTransaction, PaymentMethod, PaymentType } from "../kasa/actions";


export interface PackageSale {
    id: string;
    packageId: string;
    packageName: string;
    price: number;
    paidAmount: number;
    remainingAmount: number;
    sessionCount: number;
    customerId: string;
    customerName: string;
    customerPhone: string;
    personnelId: string;
    personnelName: string;
    saleDate: Date;
    serviceIds: string[]; 
    usedSessionsCount: number;
    totalSessionsCount: number;
    remainingSessions: number;
}

export interface CustomerPackageSession {
    id: string;
    packageSaleId: string;
    customerId: string;
    serviceId: string; // The specific service within the package for this session
    status: 'available' | 'used' | 'cancelled';
    appointmentId?: string; // The appointment where this session was used
}

export interface CustomerPackageInfo {
    saleId: string;
    packageId: string;
    packageName: string;
    remainingSessions: number;
    totalSessions: number;
    personnelId: string;
    price: number;
    serviceIds: string[];
}


export interface PackageSalesPageData {
    sales: PackageSale[];
    packages: Package[];
    customers: Customer[];
    personel: Personel[];
}

export async function getAllDataForPackageSalesPageAction(): Promise<PackageSalesPageData> {
    const [sales, packagesByCategory, customers, personel] = await Promise.all([
        getPackageSalesAction(),
        getGroupedPackagesAction(),
        getCustomersAction(),
        getPersonelAction()
    ]);
    
    const packages = Object.values(packagesByCategory).flatMap(cat => cat.packages);
    return { sales, packages, customers, personel };
}

export async function getPackageSalesAction(): Promise<PackageSale[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil.");
      return [];
    }
    try {
      const salesSnapshot = await db.collection("packageSales").orderBy("saleDate", "desc").get();
      
      const sales = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          const totalSessions = data.totalSessionsCount || 0;
          const remainingSessions = data.remainingSessions ?? totalSessions;
          const usedSessions = totalSessions - remainingSessions;

          return {
              id: doc.id,
              ...data,
              saleDate: (data.saleDate as Timestamp).toDate(),
              usedSessionsCount: usedSessions < 0 ? 0 : usedSessions,
              totalSessionsCount: totalSessions,
              remainingSessions: remainingSessions,
              serviceIds: data.serviceIds || [],
              paidAmount: data.paidAmount || 0,
              remainingAmount: data.remainingAmount ?? (data.price - (data.paidAmount || 0)),
              customerPhone: data.customerPhone || "",
          } as PackageSale;
      });
      
      return sales;

    } catch (error) {
      console.error("Paket satışları çekilirken hata:", error);
      return [];
    }
}

export async function performRecordPackageSaleAction(formData: FormData) {
    'use server';
    const packageId = formData.get("packageId") as string;
    const customerId = formData.get("customerId") as string;
    const personnelId = formData.get("personnelId") as string;
    const priceStr = formData.get("price") as string;
    const paidAmountStr = formData.get("paidAmount") as string;
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || "Nakit";
    const saleDateStr = formData.get("saleDate") as string;

    console.log(`[PACKAGE_SALE_LOG] Firing performRecordPackageSaleAction. PackageID: ${packageId}, CustomerID: ${customerId}`);

    if (!packageId || !customerId || !personnelId || !priceStr || !saleDateStr) {
        console.error("[PACKAGE_SALE_LOG] Validation failed: Missing required fields.");
        return { success: false, message: "Lütfen tüm zorunlu alanları doldurun." };
    }
    if (!db) {
        console.error("[PACKAGE_SALE_LOG] DB connection failed.");
        return { success: false, message: "Veritabanı bağlantı hatası." };
    }
    
    const price = parseFloat(priceStr);
    const paidAmount = parseFloat(paidAmountStr || "0");
    const saleDate = new Date(saleDateStr);

    if (isNaN(price) || price < 0) return { success: false, message: "Geçersiz fiyat." };
    if (isNaN(paidAmount) || paidAmount < 0) return { success: false, message: "Geçersiz ödenen tutar." };
    if (paidAmount > price) return { success: false, message: "Ödenen tutar, paket fiyatından büyük olamaz." };

    try {
        await db.runTransaction(async (transaction) => {
            const [pkgDoc, customerDoc, personnelDoc] = await Promise.all([
                db.collection('packages').doc(packageId).get(),
                db.collection('customers').doc(customerId).get(),
                db.collection('personel').doc(personnelId).get(),
            ]);

            if (!pkgDoc.exists) throw new Error("Paket bulunamadı.");
            if (!customerDoc.exists) throw new Error("Müşteri bulunamadı.");
            if (!personnelDoc.exists) throw new Error("Personel bulunamadı.");
            
            const pkgData = pkgDoc.data();
            if(!pkgData) throw new Error("Paket verisi okunamadı.");

            const customerData = customerDoc.data();
            const personnelData = personnelDoc.data();
            
            const totalSessions = (pkgData.sessionCount || 0) * (pkgData.serviceIds?.length || 1);
            if (totalSessions === 0) throw new Error("Paketin toplam seans sayısı 0 olamaz.");

            const newSaleRef = db.collection("packageSales").doc();
            const saleData = {
                packageId: pkgDoc.id, packageName: pkgData.name, price, paidAmount,
                remainingAmount: price - paidAmount,
                sessionCount: pkgData.sessionCount, customerId: customerDoc.id, customerName: customerData?.fullName, customerPhone: customerData?.phone,
                personnelId: personnelDoc.id, personnelName: personnelData?.fullName, saleDate: Timestamp.fromDate(saleDate),
                serviceIds: pkgData.serviceIds || [], totalSessionsCount: totalSessions, remainingSessions: totalSessions, 
            };
            transaction.set(newSaleRef, saleData);
            console.log(`[PACKAGE_SALE_LOG] New package sale record created in transaction: ${newSaleRef.id}`);
            
            if (paidAmount > 0) {
                const paymentTransactionData = {
                    appointmentGroupId: newSaleRef.id, 
                    customerId: customerDoc.id, 
                    customerName: customerData?.fullName,
                    totalServiceAmount: paidAmount, 
                    totalProductAmount: 0, 
                    grandTotalAmount: paidAmount,
                    paymentMethod, 
                    paymentDate: Timestamp.fromDate(saleDate), 
                    paymentType: 'package' as PaymentType,
                };
                transaction.set(db.collection("paymentTransactions").doc(), paymentTransactionData);
                console.log(`[PACKAGE_SALE_LOG] Initial payment record of ${paidAmount} created for sale ${newSaleRef.id}`);
            }
        });
        
        revalidatePath("/paket-satislar"); revalidatePath("/kasa"); revalidatePath("/musteriler");
        console.log("[PACKAGE_SALE_LOG] Transaction committed successfully.");
        return { success: true, message: "Paket satışı başarıyla kaydedildi." };
    } catch (error: any) {
        console.error("[PACKAGE_SALE_LOG] CRITICAL ERROR during package sale transaction:", error);
        return { success: false, message: error.message || "Paket satışı kaydedilemedi." };
    }
}

export async function performUpdatePackageSaleAction(formData: FormData) {
    'use server';
    const saleId = formData.get("id") as string;
    const newPackageId = formData.get("packageId") as string;
    const newCustomerId = formData.get("customerId") as string;
    const newPersonnelId = formData.get("personnelId") as string;
    const newPriceStr = formData.get("price") as string;
    const newSaleDateStr = formData.get("saleDate") as string;

    if (!saleId || !newPackageId || !newCustomerId || !newPersonnelId || !newPriceStr || !newSaleDateStr) {
        return { success: false, message: "Lütfen tüm zorunlu alanları doldurun." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice < 0) return { success: false, message: "Geçersiz fiyat." };

    try {
        const [saleDoc, newPkgDoc, newCustomerDoc, newPersonnelDoc] = await Promise.all([
            db.collection('packageSales').doc(saleId).get(), db.collection('packages').doc(newPackageId).get(),
            db.collection('customers').doc(newCustomerId).get(), db.collection('personel').doc(newPersonnelId).get(),
        ]);

        if (!saleDoc.exists) throw new Error("Güncellenecek satış kaydı bulunamadı.");
        if (!newPkgDoc.exists) return { success: false, message: "Yeni paket bulunamadı." };
        if (!newCustomerDoc.exists) return { success: false, message: "Yeni müşteri bulunamadı." };
        if (!newPersonnelDoc.exists) return { success: false, message: "Yeni personel bulunamadı." };

        const oldSaleData = saleDoc.data() as PackageSale;
        const newPkg = { id: newPkgDoc.id, ...newPkgDoc.data() } as Package & {id: string};
        const newCustomer = { id: newCustomerDoc.id, ...newCustomerDoc.data() } as Customer;
        const newPersonnel = { id: newPersonnelDoc.id, ...newPersonnelDoc.data() } as Personel;
        
        const usedSessions = oldSaleData.totalSessionsCount - oldSaleData.remainingSessions;
        if(usedSessions > 0) throw new Error("Bu paketten seans kullanıldığı için değişiklik yapılamaz.");
        
        const totalSessions = (newPkg.sessionCount || 0) * (newPkg.serviceIds?.length || 1);
        const remainingAmount = newPrice - (oldSaleData.paidAmount || 0);

        const saleUpdateData: any = {
            packageId: newPkg.id, packageName: newPkg.name, price: newPrice,
            remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
            sessionCount: newPkg.sessionCount, customerId: newCustomerId, customerName: newCustomer.fullName, customerPhone: newCustomer.phone,
            personnelId: newPersonnelId, personnelName: newPersonnel.fullName, serviceIds: newPkg.serviceIds,
            totalSessionsCount: totalSessions, remainingSessions: totalSessions,
            saleDate: Timestamp.fromDate(new Date(newSaleDateStr))
        };
        
        await db.collection("packageSales").doc(saleId).update(saleUpdateData);
        revalidatePath("/paket-satislar");
        return { success: true, message: "Paket satışı başarıyla güncellendi." };
    } catch (error: any) {
        console.error("Paket satışı güncellenirken hata:", error);
        return { success: false, message: error.message || "Paket satışı güncellenemedi." };
    }
}

export async function performDeletePackageSaleAction(saleId: string) {
    'use server';
    if (!saleId) return { success: false, message: "Satış ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        await db.runTransaction(async (transaction) => {
            const saleRef = db.collection("packageSales").doc(saleId);
            const saleDoc = await transaction.get(saleRef);
            if (!saleDoc.exists) throw new Error("Silinecek satış kaydı bulunamadı.");
            const saleData = saleDoc.data() as PackageSale;
            const usedSessions = (saleData.totalSessionsCount || 0) - (saleData.remainingSessions || 0);
            if (usedSessions > 0) throw new Error("Bu paketten seans kullanıldığı için satış iptal edilemez.");
            
            const paymentsQuery = db.collection("paymentTransactions").where("appointmentGroupId", "==", saleId);
            const paymentsSnap = await transaction.get(paymentsQuery);
            paymentsSnap.docs.forEach(doc => transaction.delete(doc.ref));
            transaction.delete(saleRef);
        });

        revalidatePath("/paket-satislar"); revalidatePath("/kasa");
        return { success: true, message: "Paket satışı ve ilişkili ödemeler başarıyla silindi." };
    } catch (error: any) {
        console.error("Paket satışı silme hatası:", error);
        return { success: false, message: error.message || "Paket satışı silinemedi." };
    }
}

export async function getCustomerPackagesAction(customerId: string): Promise<CustomerPackageInfo[]> {
    if (!customerId || !db) return [];
    try {
        const salesSnapshot = await db.collection("packageSales").where("customerId", "==", customerId).get();
        if (salesSnapshot.empty) return [];
        return salesSnapshot.docs.map(doc => {
            const saleData = doc.data();
            const remaining = typeof saleData.remainingSessions === 'number' ? saleData.remainingSessions : saleData.totalSessionsCount;
            return {
                saleId: doc.id, packageId: saleData.packageId, packageName: saleData.packageName,
                remainingSessions: remaining, totalSessions: saleData.totalSessionsCount,
                personnelId: saleData.personnelId, price: saleData.price, serviceIds: saleData.serviceIds || [],
            };
        }).filter(pkg => pkg.remainingSessions > 0);
    } catch (error) {
        console.error(`Müşteri (${customerId}) paketleri çekilirken hata:`, error);
        return [];
    }
}

export async function updateAndRecordPackagePaymentsAction(
    packageSaleId: string,
    customerData: { id: string; fullName: string },
    updatedPayments: { id: string; amount: number; date: Date; }[],
    newPayment: { amount: number; date: Date; method: string } | null,
    totalPackagePrice: number
) {
    'use server';
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    if (!packageSaleId) return { success: false, message: "Paket satış ID'si eksik." };
    console.log(`[PACKAGE_PAYMENT_LOG] Starting update for sale ID: ${packageSaleId}`);

    try {
        await db.runTransaction(async (transaction) => {
            
            const paymentsQuery = db.collection("paymentTransactions")
                                    .where("appointmentGroupId", "==", packageSaleId)
                                    .where("paymentType", "==", "package");
            const existingPaymentsSnap = await transaction.get(paymentsQuery);
            const existingPaymentsInDB = existingPaymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as PaymentTransaction }));
            
            let totalPaid = 0;
            const handledPaymentIds = new Set<string>();

            if(updatedPayments.length > 0) {
                 console.log(`[PACKAGE_PAYMENT_LOG] Processing ${updatedPayments.length} updated payments.`);
                for (const payment of updatedPayments) {
                    const paymentRef = db.collection("paymentTransactions").doc(payment.id);
                    transaction.update(paymentRef, {
                        grandTotalAmount: payment.amount,
                        totalServiceAmount: payment.amount,
                        paymentDate: Timestamp.fromDate(payment.date)
                    });
                    totalPaid += payment.amount;
                    handledPaymentIds.add(payment.id);
                }
            }

            for (const existingPayment of existingPaymentsInDB) {
                if (!handledPaymentIds.has(existingPayment.id)) {
                    totalPaid += existingPayment.grandTotalAmount;
                }
            }
            
            if (newPayment && newPayment.amount > 0) {
                const newPaymentRef = db.collection("paymentTransactions").doc();
                const newPaymentData = {
                    appointmentGroupId: packageSaleId,
                    customerId: customerData.id,
                    customerName: customerData.fullName,
                    totalServiceAmount: newPayment.amount,
                    totalProductAmount: 0,
                    grandTotalAmount: newPayment.amount,
                    paymentMethod: newPayment.method as PaymentMethod,
                    paymentDate: Timestamp.fromDate(newPayment.date),
                    paymentType: 'package' as PaymentType,
                };
                transaction.set(newPaymentRef, newPaymentData);
                 console.log(`[PACKAGE_PAYMENT_LOG] Creating new payment of ${newPayment.amount}.`);
                totalPaid += newPayment.amount;
            }

            const packageSaleRef = db.collection("packageSales").doc(packageSaleId);
            const newRemainingAmount = totalPackagePrice - totalPaid;
            
            const packageUpdateData = {
                paidAmount: totalPaid,
                remainingAmount: newRemainingAmount < 0 ? 0 : newRemainingAmount
            };
            transaction.update(packageSaleRef, packageUpdateData);
            console.log(`[PACKAGE_PAYMENT_LOG] Updating package sale ${packageSaleId}. New total paid: ${totalPaid}, New remaining: ${newRemainingAmount}`);
        });

        revalidatePath("/paket-satislar");
        revalidatePath("/kasa");
        revalidatePath(`/musteriler`);
        
        console.log("[PACKAGE_PAYMENT_LOG] Transaction committed successfully.");
        return { success: true, message: "Ödemeler başarıyla güncellendi." };
    } catch (error: any) {
        console.error("[PACKAGE_PAYMENT_LOG] CRITICAL: Error updating package payments:", error);
        return { success: false, message: error.message || "Ödemeler güncellenemedi." };
    }
}
    
