/**
 * Paket satışı ile ilgili tip tanımlamaları
 */
import { PackageSale, Payment, PackageSession, Customer, Staff, Package } from '@prisma/client';

// Servis yanıt tipi
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// İlişkili verileri içeren paket satışı tipi
export interface PackageSaleWithRelations extends PackageSale {
  customer?: Customer;
  staff?: Staff;
  package?: Package;
  packageSessions?: PackageSession[];
  payments?: Payment[];
}

// Ek bilgileri içeren formatlanmış paket satışı tipi
export interface FormattedPackageSale extends PackageSaleWithRelations {
  totalPaid: number;
  remainingAmount: number;
  usedSessions: number;
  remainingSessions: number;
  paymentStatus: string;
}

// Filtre tipi
export interface PackageSaleFilter {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  staffId?: string;
  packageId?: string;
  status?: 'active' | 'completed' | 'expired';
  includeDeleted?: boolean;
}

// Paket seansı ile ilgili tip tanımlamaları
export interface PackageSessionWithRelations extends PackageSession {
  packageSale?: PackageSaleWithRelations;
  appointment?: any; // Appointment tipi gerekirse import edilmeli
}

// Ödeme ile ilgili tip tanımlamaları
export interface PaymentWithRelations extends Payment {
  packageSale?: PackageSaleWithRelations;
  staff?: Staff;
}

// Yeni paket satışı oluşturma veri tipi
export interface CreatePackageSaleData {
  packageId: string;
  customerId: string;
  price: number;
  saleDate?: string | Date;
  expiryDate?: string | Date;
  staffId?: string;
  notes?: string;
  isCompleted?: boolean;
  payment?: {
    amount: number;
    date?: string | Date;
    method?: string;
    notes?: string;
    staffId?: string;
  };
}

// Paket satışı güncelleme veri tipi
export interface UpdatePackageSaleData {
  price?: number;
  saleDate?: string | Date;
  expiryDate?: string | Date | null;
  staffId?: string;
  notes?: string;
  isCompleted?: boolean;
}

// Paket seansı oluşturma veri tipi
export interface CreatePackageSessionData {
  packageSaleId: string;
  appointmentId?: string;
  sessionDate?: string | Date;
  status?: string;
  notes?: string;
}

// Paket seansı güncelleme veri tipi
export interface UpdatePackageSessionData {
  appointmentId?: string;
  sessionDate?: string | Date;
  status?: string;
  notes?: string;
}

// Ödeme oluşturma veri tipi
export interface CreatePaymentData {
  packageSaleId: string;
  amount: number;
  date?: string | Date;
  method?: string;
  notes?: string;
  staffId?: string;
}
