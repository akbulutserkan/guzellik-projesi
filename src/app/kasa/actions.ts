

'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { getProductsAction, increaseStockAfterSaleCancellation, decreaseStockForSale } from "../urunler/actions";
import { getServicesAction } from "../hizmetler/actions";
import { getGroupedPackagesAction } from "../paketler/actions";
import { getPersonelAction } from "../personeller/actions";
import { getCustomersAction } from "../musteriler/actions";
import type { Appointment } from "../randevular/actions";
import type { Sale } from "../urun-satislar/actions";
import type { PackageSale } from "../paket-satislar/actions";
import type admin from 'firebase-admin';
import { isSameDay, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";


export type PaymentMethod = "Nakit" | "Kart" | "Havale/EFT";
export type PaymentType = "appointment" | "package";

// This is the extended type we'll use in the frontend
export interface EnrichedPaymentTransaction {
  id: string; 
  appointmentGroupId: string;
  customerId: string;
  customerName: string;
  personnelName: string;
  totalServiceAmount: number;
  totalProductAmount: number;
  grandTotalAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  paymentType: 'appointment' | 'package' | 'package_sale' | 'package_payment'; // Extended for frontend logic
  description: string;
}

// This is the raw type from the database
export interface PaymentTransaction {
  id: string; 
  appointmentGroupId: string;
  customerId: string;
  customerName: string;
  totalServiceAmount: number;
  totalProductAmount: number;
  grandTotalAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  paymentType?: PaymentType;
}

export interface PersonnelRevenueDetail {
    personnelName: string;
    totalRevenue: number;
    services: {
        serviceName: string;
        quantity: number;
        totalAmount: number;
    }[];
}


export async function getPaymentTransactionsAction(): Promise<EnrichedPaymentTransaction[]> {
    if (!db) {
        console.error("Veritabanı bağlantısı mevcut değil.");
        return [];
    }

    try {
        console.log("[KASA_LOG] Fetching all related data for payment transactions.");

        const [
            paymentTransactionsSnapshot,
            appointmentsSnap,
            salesSnap,
            packageSalesSnap,
            personnelSnap
        ] = await Promise.all([
            db.collection("paymentTransactions").orderBy("paymentDate", "desc").get(),
            db.collection("appointments").get(),
            db.collection("sales").get(),
            db.collection("packageSales").get(),
            db.collection("personnel").get()
        ]);

        console.log(`[KASA_LOG] Found ${paymentTransactionsSnapshot.docs.length} total payment transaction documents.`);
        if (paymentTransactionsSnapshot.empty) {
            return [];
        }

        const personnelMap = new Map<string, string>();
        personnelSnap.docs.forEach(doc => {
            const data = doc.data();
            personnelMap.set(doc.id, data.fullName);
        });

        const appointmentsByGroupId = new Map<string, Appointment[]>();
        appointmentsSnap.docs.forEach(doc => {
            const app = { id: doc.id, ...doc.data() } as Appointment;
            app.personnelName = personnelMap.get(app.personnelId) || app.personnelName;
            const group = appointmentsByGroupId.get(app.groupId) || [];
            group.push(app);
            appointmentsByGroupId.set(app.groupId, group);
        });

        const salesByGroupId = new Map<string, Sale[]>();
        salesSnap.docs.forEach(doc => {
            const sale = { id: doc.id, ...doc.data() } as Sale;
            if (sale.personnelId) {
                sale.personnelName = personnelMap.get(sale.personnelId) || sale.personnelName;
            }
            if (sale.appointmentGroupId) {
                const group = salesByGroupId.get(sale.appointmentGroupId) || [];
                group.push(sale);
                salesByGroupId.set(sale.appointmentGroupId, group);
            }
        });

        const packageSalesById = new Map<string, PackageSale>();
        packageSalesSnap.docs.forEach(doc => {
            const sale = { id: doc.id, ...doc.data() } as PackageSale;
            if (sale.personnelId) {
                sale.personnelName = personnelMap.get(sale.personnelId) || sale.personnelName;
            }
            packageSalesById.set(doc.id, sale);
        });

        const rawPayments = paymentTransactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            paymentDate: (doc.data().paymentDate as Timestamp).toDate(),
        } as PaymentTransaction));

        const transactions: EnrichedPaymentTransaction[] = [];
        for (const payment of rawPayments) {
             try {
                let description = "Ödeme";
                let enrichedPaymentType: EnrichedPaymentTransaction['paymentType'] = 'appointment'; // Default
                let personnelName = "-";

                const dbPaymentType = payment.paymentType;
                const groupId = payment.appointmentGroupId;

                if (dbPaymentType === 'package') {
                    const sale = packageSalesById.get(groupId);
                    if (sale) {
                        personnelName = sale.personnelName || "-";
                        const saleDate = (sale.saleDate as any).toDate ? (sale.saleDate as any).toDate() : new Date(sale.saleDate);
                        if (isSameDay(saleDate, payment.paymentDate)) {
                            description = `Paket Satışı: ${sale.packageName}`;
                            enrichedPaymentType = 'package_sale';
                        } else {
                            description = `Kalan Ödeme: ${sale.packageName}`;
                            enrichedPaymentType = 'package_payment';
                        }
                    } else {
                        description = "İlişkili Paket Satışı Bulunamadı";
                    }
                } else if (dbPaymentType === 'appointment' || !dbPaymentType) { // Handle old and new appointment payments
                    const appointments = appointmentsByGroupId.get(groupId) || [];
                    const sales = salesByGroupId.get(groupId) || [];
                    
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
                    enrichedPaymentType = 'appointment';
                }

                transactions.push({
                    ...payment,
                    personnelName,
                    paymentType: enrichedPaymentType,
                    description: description,
                });
             } catch (loopError: any) {
                console.error(`Ödeme ID ${payment.id} işlenirken bir hata oluştu: ${loopError.message}. Bu ödeme atlanıyor.`);
             }
        }
        
        return transactions;

    } catch (error: any) {
        console.error("Ödeme işlemleri çekilirken hata:", error.message, error.stack);
        return [];
    }
}


export async function performFullUpdateKasaAction(formData: FormData) {
    'use server';
    const transactionId = formData.get("transactionId") as string;
    const groupId = formData.get("groupId") as string;
    const customerId = formData.get("customerId") as string;
    const dateTimeStr = formData.get("dateTime") as string;
    const notes = formData.get("notes") as string || "";
    const paymentMethod = formData.get("paymentMethod") as PaymentMethod;

    const personnelIds = formData.getAll("personnelIds") as string[];
    const serviceOrPackageIds = formData.getAll("serviceOrPackageIds") as string[];
    const prices = formData.getAll("prices").map(p => parseFloat(p as string));
    
    const soldProductIds = formData.getAll("soldProductIds") as string[];
    const soldQuantities = formData.getAll("soldQuantities").map(q => parseInt(q as string, 10));
    const soldTotalAmounts = formData.getAll("soldTotalAmounts").map(p => parseFloat(p as string));
    const soldPersonnelIds = formData.getAll("soldPersonnelIds") as string[];
    
    if (!transactionId || !groupId || !customerId || !dateTimeStr || !paymentMethod) {
        return { success: false, message: "Gerekli alanlar eksik." };
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

            const oldAppointmentsQuery = db.collection("appointments").where("groupId", "==", groupId);
            const oldAppointmentsSnap = await transaction.get(oldAppointmentsQuery);

            const oldSalesQuery = db.collection("sales").where("appointmentGroupId", "==", groupId);
            const oldSalesSnap = await transaction.get(oldSalesQuery);
            
            for (const doc of oldSalesSnap.docs) {
                const oldSaleData = doc.data();
                await increaseStockAfterSaleCancellation(oldSaleData.productId, oldSaleData.quantity, transaction);
                transaction.delete(doc.ref);
            }

            oldAppointmentsSnap.docs.forEach(doc => transaction.delete(doc.ref));

            const customerName = customerDocSnap.data()?.fullName;
            let currentStartTime = new Date(dateTimeStr);
            let newTotalServiceAmount = 0;
            
            for (let i = 0; i < personnelIds.length; i++) {
                const personnelId = personnelIds[i];
                const serviceOrPackageId = serviceOrPackageIds[i];
                const price = prices[i];
                if (!personnelId || !serviceOrPackageId || isNaN(price)) continue;

                newTotalServiceAmount += price;

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
                    throw new Error(`Hizmet veya paket bulunamadı: ${serviceOrPackageId}`);
                }

                const startDate = currentStartTime;
                const endDate = new Date(startDate.getTime() + duration * 60000);

                const appointmentData = {
                    groupId, customerId, customerName, personnelId, personnelName: personnel.fullName,
                    serviceId: serviceOrPackageId, serviceName, price, isPackage,
                    start: Timestamp.fromDate(startDate), end: Timestamp.fromDate(endDate),
                    notes, createdAt: Timestamp.now(), status: "completed" as "active" | "completed",
                };
                transaction.set(db.collection("appointments").doc(), appointmentData);
                currentStartTime = endDate;
            }
            
            let newTotalProductAmount = 0;
            if (soldProductIds.length > 0) {
                for (let i = 0; i < soldProductIds.length; i++) {
                    const productId = soldProductIds[i];
                    const quantity = soldQuantities[i];
                    const totalAmount = soldTotalAmounts[i];
                    const salePersonnelId = soldPersonnelIds[i];

                    if (!productId || !salePersonnelId || !quantity || quantity <= 0) continue;
                    
                    newTotalProductAmount += totalAmount;

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
            
            const paymentRef = db.collection("paymentTransactions").doc(transactionId);
            const newGrandTotal = newTotalServiceAmount + newTotalProductAmount;
            transaction.update(paymentRef, {
                paymentMethod,
                totalServiceAmount: newTotalServiceAmount,
                totalProductAmount: newTotalProductAmount,
                grandTotalAmount: newGrandTotal,
                paymentDate: Timestamp.now(),
                paymentType: 'appointment'
            });
        });

        revalidatePath("/kasa");
        revalidatePath("/takvim");
        revalidatePath("/urun-satislar");
        revalidatePath("/urunler");
        return { success: true, message: "Ödeme ve ilişkili randevular başarıyla güncellendi." };

    } catch (error: any) {
        console.error("Ödeme hareketi güncelleme hatası:", error);
        return { success: false, message: error.message || "Ödeme hareketi güncellenemedi." };
    }
}


export async function deletePaymentTransactionAction(transactionId: string) {
    'use server';
    if (!transactionId) {
        return { success: false, message: "İşlem ID'si gerekli." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        await db.runTransaction(async (transaction) => {
            const transactionRef = db.collection("paymentTransactions").doc(transactionId);
            const transactionDoc = await transaction.get(transactionRef);

            if (!transactionDoc.exists) {
                throw new Error("Silinecek ödeme işlemi bulunamadı.");
            }
            
            const transactionData = transactionDoc.data()!;
            const groupId = transactionData?.appointmentGroupId;
            const paymentType = transactionData?.paymentType; 


            if (groupId && paymentType === 'package') {
                const packageSaleRef = db.collection("packageSales").doc(groupId);
                const packageSaleDoc = await transaction.get(packageSaleRef);
                
                if (packageSaleDoc.exists) {
                    const paymentAmount = transactionData?.grandTotalAmount || 0;
                    transaction.update(packageSaleRef, {
                        paidAmount: FieldValue.increment(-paymentAmount),
                        remainingAmount: FieldValue.increment(paymentAmount)
                    });
                } else {
                    console.warn(`Could not find package sale with ID: ${groupId} to revert payment.`);
                }
            } else if (groupId && (paymentType === 'appointment' || !paymentType)) { // Handle old data
                const appointmentsQuery = db.collection("appointments").where("groupId", "==", groupId);
                const appointmentsSnap = await transaction.get(appointmentsQuery);
                appointmentsSnap.docs.forEach(doc => {
                    transaction.update(doc.ref, { status: "active" });
                });
            }
            
            transaction.delete(transactionRef);
        });
        
        revalidatePath("/kasa");
        revalidatePath("/takvim"); 
        revalidatePath("/paket-satislar");
        return { success: true, message: "Ödeme iptal edildi ve ilişkili kayıtlar güncellendi." };

    } catch (error: any) {
        console.error("CRITICAL: Error deleting payment:", error);
        return { success: false, message: error.message || "Ödeme işlemi silinemedi." };
    }
}

export async function getPaymentsForPackageAction(packageSaleId: string): Promise<PaymentTransaction[]> {
    if (!db || !packageSaleId) {
        return [];
    }
    try {
        // Query for payments that either have paymentType === 'package' or no paymentType field at all (for backward compatibility)
        const packagesSnapshot = await db.collection("paymentTransactions").where("appointmentGroupId", "==", packageSaleId).get();

        const payments = packagesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as PaymentTransaction))
            .filter(p => p.paymentType === 'package') // Only get package payments
            .map(p => ({ ...p, paymentDate: (p.paymentDate as any).toDate() }));

        payments.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
      
        return payments;

    } catch (error: any) {
      console.error(`Error fetching payments for package ${packageSaleId}:`, error);
      return [];
    }
}

// REPORTING ACTIONS
export async function getPersonnelRevenueReportAction(dateRange: DateRange): Promise<PersonnelRevenueDetail[]> {
  if (!db || !dateRange.from || !dateRange.to) return [];

  const startDate = Timestamp.fromDate(startOfDay(dateRange.from));
  const endDate = Timestamp.fromDate(endOfDay(dateRange.to));

  const paymentsSnap = await db.collection("paymentTransactions")
    .where("paymentDate", ">=", startDate)
    .where("paymentDate", "<=", endDate)
    .get();

  const groupIds = [...new Set(paymentsSnap.docs.map(doc => doc.data().appointmentGroupId).filter(Boolean))];
  if (groupIds.length === 0) return [];
  
  const appointmentsSnap = await db.collection("appointments").where("groupId", "in", groupIds).get();
  const salesSnap = await db.collection("sales").where("appointmentGroupId", "in", groupIds).get();

  const revenueByPersonnel: { 
      [key: string]: { 
          name: string, 
          revenue: number,
          services: { [key: string]: { name: string, quantity: number, total: number } } 
      } 
  } = {};

  // Process appointments
  appointmentsSnap.docs.forEach(doc => {
    const app = doc.data() as Appointment;
    if (app.personnelId && !app.isPackageSession) { // Do not count package sessions as revenue
      if (!revenueByPersonnel[app.personnelId]) {
        revenueByPersonnel[app.personnelId] = { name: app.personnelName, revenue: 0, services: {} };
      }
      revenueByPersonnel[app.personnelId].revenue += app.price || 0;
      
      const serviceKey = app.serviceId;
      if (!revenueByPersonnel[app.personnelId].services[serviceKey]) {
        revenueByPersonnel[app.personnelId].services[serviceKey] = { name: app.serviceName, quantity: 0, total: 0 };
      }
      revenueByPersonnel[app.personnelId].services[serviceKey].quantity += 1;
      revenueByPersonnel[app.personnelId].services[serviceKey].total += app.price || 0;
    }
  });

  // Process product sales
  salesSnap.docs.forEach(doc => {
    const sale = doc.data() as Sale;
    if (sale.personnelId) {
      if (!revenueByPersonnel[sale.personnelId]) {
        revenueByPersonnel[sale.personnelId] = { name: sale.personnelName || 'Bilinmeyen Personel', revenue: 0, services: {} };
      }
      revenueByPersonnel[sale.personnelId].revenue += sale.totalAmount || 0;
      
      const serviceKey = `product_${sale.productId}`;
      if (!revenueByPersonnel[sale.personnelId].services[serviceKey]) {
        revenueByPersonnel[sale.personnelId].services[serviceKey] = { name: sale.productName, quantity: 0, total: 0 };
      }
      revenueByPersonnel[sale.personnelId].services[serviceKey].quantity += sale.quantity;
      revenueByPersonnel[sale.personnelId].services[serviceKey].total += sale.totalAmount || 0;
    }
  });

  return Object.values(revenueByPersonnel)
    .map(p => ({ 
        personnelName: p.name, 
        totalRevenue: p.revenue,
        services: Object.values(p.services).map(s => ({
            serviceName: s.name,
            quantity: s.quantity,
            totalAmount: s.total
        })).sort((a,b) => b.totalAmount - a.totalAmount)
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}
