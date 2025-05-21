/**
 * Paket ve Paket Kategorileri için tip tanımlamaları
 */

// Paket kategorisi oluşturma/güncelleme için veri tipi
export interface PackageCategoryData {
  name: string;
}

// Paket veritabanı modelinin tip tanımlaması
export interface Package {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  price: number;
  categoryId: string | null;
  isDeleted: boolean;
  sessionCount: number;
  packageServices?: Array<{
    serviceId: string;
    packageId: string;
    service?: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
  }>;
  services?: FormattedServiceInfo[];
  category?: {
    id: string;
    name: string;
  };
}

// Paket oluşturma için veri tipi
export interface CreatePackageData {
  name: string;
  sessionCount: number;
  price: number;
  categoryId: string;
  serviceIds: string[];
}

// Paket güncelleme için veri tipi
export interface UpdatePackageData {
  name?: string;
  sessionCount?: number;
  price?: number;
  categoryId?: string;
  serviceIds?: string[];
}

// Paket formatlanmış servis bilgisi
export interface FormattedServiceInfo {
  id: string;
  name: string;
  duration: number;
  price: number;
}

// Fonksiyon sonuç tipi
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  // Ek hata bilgileri
  dbConnectionError?: boolean;
  errorDetails?: any;
  stack?: string;
  details?: any;
}
