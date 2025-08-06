
'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp } from 'firebase-admin/firestore';
import { getCustomersAction, type Customer } from "../../musteriler/actions";
import { getPersonelAction, type Personel } from "../../personeller/actions";
import { getServicesAction, type Service } from "../../hizmetler/actions";
import { getGroupedPackagesAction, type Package, getCustomerPackagesAction as baseGetCustomerPackagesAction } from "../../paketler/actions";
import { getProductsAction, type Product as BaseProduct } from "../../urunler/actions";
import { Product as SaleableProduct, Sale } from "../../urun-satislar/actions";
import type { Appointment, CalendarPageData, CustomerPackageInfo } from './types';
import { isSameDay } from 'date-fns';


// Randevuları Çek
export async function getAppointmentsAction(): Promise<Appointment[]> {
    if (!db) {
      console.error("[getAppointmentsAction LOG] Firestore veritabanı bağlantısı mevcut değil.");
      return [];
    }
    try {
      const snapshot = await db.collection("appointments").orderBy("start", "asc").get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        const startTimestamp = data.start as Timestamp;
        const endTimestamp = data.end as Timestamp;
        
        return {
          id: doc.id,
          ...data,
          start: startTimestamp.toDate(),
          end: endTimestamp.toDate(),
          isPackageSession: data.isPackageSession || false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Appointment;
      });
    } catch (error: any) {
      console.error("[getAppointmentsAction LOG] Randevular çekilirken HATA:", error.message);
      return [];
    }
}

// Takvim sayfası için gerekli tüm verileri tek seferde çek
export async function getCalendarPageData(): Promise<CalendarPageData> {
    try {
        const [appointments, customers, personnel, services, packagesByCategory, products] = await Promise.all([
            getAppointmentsAction(),
            getCustomersAction(),
            getPersonelAction(),
            getServicesAction(),
            getGroupedPackagesAction(),
            getProductsAction()
        ]);
        
        // getProductsAction'dan dönen SaleableProduct'ları BaseProduct'a dönüştür
        const saleableProducts: SaleableProduct[] = products.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            sellingPrice: p.latestSellingPrice || 0,
            createdAt: p.createdAt
        }));
        
        const packages = Object.values(packagesByCategory).flatMap(cat => cat.packages);
        
        return { appointments, customers, personnel, services, packages, products: saleableProducts };
    } catch (error: any) {
        console.error("[getCalendarPageData LOG] Fonksiyon sırasında KRİTİK HATA:", error.message);
        // Hata durumunda boş bir nesne döndürerek uygulamanın çökmesini engelle
        return { appointments: [], customers: [], personnel: [], services: [], packages: [], products: [] };
    }
}

// Bir müşterinin aktif paketlerini ve kalan seanslarını çek
export async function getCustomerPackagesAction(customerId: string): Promise<CustomerPackageInfo[]> {
    return baseGetCustomerPackagesAction(customerId);
}

export async function getSalesForAppointmentGroupAction(groupIds: string[]): Promise<Sale[]> {
    if (!db || groupIds.length === 0) {
        return [];
    }
    try {
        const salesSnapshot = await db.collection("sales").where("appointmentGroupId", "in", groupIds).get();
        return salesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                saleDate: (data.saleDate as Timestamp).toDate(),
            } as Sale;
        });
    } catch (error) {
        console.error("Grup için satışlar çekilirken hata:", error);
        return [];
    }
}
