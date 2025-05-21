'use client';

/**
 * Müşteri ile ilgili tip tanımları
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastVisit?: string | Date;
  // Formatlanmış tarihler (UI için)
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
  lastVisitFormatted?: string;
}

/**
 * Yeni müşteri oluşturmak için gerekli veri yapısı
 */
export interface CustomerCreateData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

/**
 * Müşteri güncellemek için gerekli veri yapısı
 */
export interface CustomerUpdateData {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

/**
 * Müşteri arama filtresi seçenekleri
 */
export interface CustomerFilterOptions {
  name?: string;
  phone?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Müşteri listesi response yapısı
 */
export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  error?: string;
}

/**
 * Müşteri detay response yapısı
 */
export interface CustomerDetailResponse {
  success: boolean;
  data: Customer;
  error?: string;
}
