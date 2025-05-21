import { z } from 'zod'
import { ServiceCategory } from '@prisma/client'
import type { Package as PrismaPackage } from '@prisma/client'

export type Service = {
 id: string
 name: string
 duration: number // Prisma şemasına uygun olarak duration alanını zorunlu yaptık
 durationMinutes?: number // Geri uyumluluk için korundu
 price?: number
 category?: {
   id: string
   name: string
 }
}

export type Session = {
  id: string
  status: string
  date: string | null
  staff?: {
    name: string
    position?: string | null
  } | null
  service: {
    name: string
  }
}

export type Customer = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export type Staff = {
  id: string
  name: string
  username?: string
  phone?: string
  email?: string
  position?: string
  accountType?: string
  serviceGender?: string
  showInCalendar?: boolean
  isActive?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type Payment = {
  id: string
  amount: number
  paymentMethod: string
  paymentType: string 
  customerId: string
  packageSaleId?: string
  productSaleId?: string
  installment?: number
  receiptNumber?: string
  notes?: string
  status: string
  processedBy: string
  date?: string // Uyumluluk için koruyalım
  createdAt?: string | Date
  updatedAt?: string | Date
}


export type PackageSale = {
  id: string
  packageId: string
  customerId: string
  staffId: string
  price: number
  status: string
  notes?: string
  saleDate: string | Date
  expiryDate?: string | Date
  createdAt: string | Date
  updatedAt: string | Date
  usedSessions: number

  // İlişkili alanlar
  customer: Customer
  package: {
    id: string
    name: string
    sessionCount: number
    packageServices?: {
      service: Service
    }[]
  }
  sessions: Session[]
  payments: Payment[]
  staff: Staff
}

// Paket form şeması
export const packageSchema = z.object({
 name: z.string().min(1, 'Paket adı zorunludur'),
 sessionCount: z.number().min(1, 'Seans sayısı en az 1 olmalıdır'),
 price: z.number().min(0, 'Fiyat 0\'dan büyük olmalıdır'),
 categoryId: z.string().min(1, 'Kategori seçimi zorunludur'),
 serviceIds: z.array(z.string()).min(1, 'En az bir hizmet seçilmelidir')
})

// Paket form verileri tipi
export type PackageFormData = {
 name: string
 sessionCount: number
 price: number
 categoryId: string
 serviceIds: string[]
}

// İlişkili verilerle birlikte paket tipi
export interface PackageWithRelations extends PrismaPackage {
 category: ServiceCategory
 packageServices: {
   service: Service
 }[]
}

// API yanıt tipi
export interface ApiResponse<T = any> {
 success: boolean
 data?: T
 error?: string
 message?: string
 details?: any
 existingPackage?: PackageWithRelations
}

// Paket oluşturma/güncelleme form verisi
export type FormData = {
 id?: string
 name: string
 sessionCount: string | number
 price: string | number
 categoryId: string
 serviceIds: string[]
 serviceName?: string
}

// Temel paket tipi
export type Package = {
  id: string
  name: string
  sessionCount: number
  price: number
  packageServices?: {
    service: Service
  }[]
}

// Paket ve hizmet ilişkisi tipi (kullanım uyumluluğu için)
export type PackageWithServices = PackageWithRelations;

// Geriye dönük uyumluluk için PackageBase'i tutuyoruz
export type PackageBase = Package;

// Ödeme form verisi
export type PaymentFormData = {
  amount: string
  paymentMethod: string | null
  processedBy: string
}

// Yeni paket satışı prop'ları
export interface NewPackageSalesProps {
  packages: PackageBase[];
  customers: Customer[];
  staffList: Staff[];
  onNewSale: (sale: PackageSale) => void;
  onNewCustomer: (customer: Customer) => void;
  fetchPackages: () => Promise<void>;
  saleDate: string;
  expiryDate: string;
  onSaleDateChange: (date: string) => void;
  onExpiryDateChange: (date: string) => void;
}

// Kategori tipi
export type Category = {
  id: string;
  name: string;
};

// Paket modal prop'ları
export interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PackageFormData) => Promise<void>;
  fetchPackages?: () => Promise<void>;
  packageData?: PackageWithRelations | null;
}