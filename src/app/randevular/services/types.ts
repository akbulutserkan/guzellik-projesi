
import type { Customer } from "../../musteriler/actions";
import type { Personel } from "../../personeller/actions";
import type { Service } from "../../hizmetler/actions";
import type { Package, CustomerPackageInfo } from "../../paketler/actions";
import type { Product as SaleableProduct } from "../../urun-satislar/actions";
import type { PaymentType } from "../../kasa/actions";


export interface Appointment {
    id: string;
    groupId: string;
    customerId: string;
    customerName: string;
    personnelId: string;
    personnelName: string;
    serviceId: string; // Hizmet veya Paket ID'si
    serviceName: string;
    price: number; // The actual price for this specific appointment
    isPackage: boolean; // Bu bir paket randevusu mu?
    isPackageSession: boolean; // Bu, bir paketten düşülen tek bir seans mı?
    packageSaleId?: string; // Hangi paket satışından düşüldü?
    start: Date;
    end: Date;
    notes?: string;
    createdAt: Date;
    status: "active" | "completed" | "cancelled"; // active, completed or cancelled
}

export interface CalendarPageData {
    appointments: Appointment[];
    customers: Customer[];
    personnel: Personel[];
    services: Service[];
    packages: Package[];
    products: SaleableProduct[];
}

export interface AppointmentUpdatePayload { 
    event: Appointment; 
    start: Date; 
    end: Date; 
    newPersonnelId?: string | undefined 
}

export interface AppointmentWritePayload {
    groupId: string;
    customerId: string;
    customerName: string;
}

export type PaymentMethod = "Nakit" | "Kart" | "Havale/EFT";

export interface PaymentPayload extends AppointmentWritePayload {
    totalServiceAmount: number;
    totalProductAmount: number;
    grandTotalAmount: number;
    paymentMethod: PaymentMethod;
    appointmentsInGroup: Appointment[];
}

export type { CustomerPackageInfo, PaymentType };
