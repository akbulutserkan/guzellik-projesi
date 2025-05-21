'use client';

/**
 * Client tarafı müşteri servisi.
 * Bu servis yalnızca API çağrıları yapar ve arabulucu (proxy) görevi görür.
 * Tüm iş mantığı ve veri işlemleri db/customer servisinde gerçekleştirilir.
 * @see /src/services/db/customer/crudService.ts Veritabanı tarafı müşteri servisi
 */

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm müşteri listesini getir
 * @param filters Filtreleme seçenekleri (ad, email, telefon, vb.)
 * @returns Müşteri listesi yanıtı
 */
export async function getCustomers(filters: any = {}) {
  console.log('[customerService] getCustomers çağrıldı, filtreler:', filters);
  try {
    // callMcpApi'ye gönderilecek filtreleri düzenle
    const apiParams = { ...filters };
    
    // Filtreleri standartlaştır
    if (filters.name && typeof filters.name === 'string') {
      apiParams.name = { contains: filters.name };
    }
    
    if (filters.email && typeof filters.email === 'string') {
      apiParams.email = { contains: filters.email };
    }
    
    if (filters.phone && typeof filters.phone === 'string') {
      apiParams.phone = { contains: filters.phone };
    }
    
    console.log('[customerService] getCustomers düzenlenmiş parametreler:', apiParams);
  
    return await callMcpApi('get-customers', apiParams, {
      showToast: false,
      customErrorMsg: 'Müşteri listesi alınırken bir hata oluştu'
    });
  } catch (error) {
    console.error('[customerService] getCustomers hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Müşteri listesi alınırken bir hata oluştu',
      data: [] 
    };
  }
}

/**
 * Eski getList için geriye uyumluluk (Gerekiyorsa)
 * @param includeDeleted Silinmiş müşterileri dahil et
 * @returns Müşteri listesi yanıtı
 * @deprecated Yerine getCustomers() kullanın
 */
export async function getCustomerList(includeDeleted: boolean = false) {
  console.log('[customerService] getCustomerList çağrıldı, includeDeleted:', includeDeleted);
  return await callMcpApi('get-customers', { 
    includeDeleted 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri listesi alınırken bir hata oluştu'
  });
}

/**
 * Müşteri detayını getir
 * @param id Müşteri ID
 * @returns Müşteri detayı yanıtı
 */
export async function getCustomerById(id: string) {
  return await callMcpApi('get-customer-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni müşteri oluştur
 * @param data Müşteri bilgileri
 * @returns Oluşturulan müşteri yanıtı
 */
export async function createCustomer(data: any) {
  return await callMcpApi('create-customer', data, {
    showToast: false,
    customErrorMsg: 'Müşteri oluşturulurken bir hata oluştu'
  });
}

/**
 * Müşteri güncelle
 * @param id Müşteri ID
 * @param data Güncellenecek müşteri bilgileri
 * @returns Güncellenen müşteri yanıtı
 */
export async function updateCustomer(id: string, data: any) {
  return await callMcpApi('update-customer', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri güncellenirken bir hata oluştu'
  });
}

/**
 * Müşteri sil
 * @param id Müşteri ID
 * @returns İşlem sonucu
 */
export async function deleteCustomer(id: string) {
  return await callMcpApi('delete-customer', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri silinirken bir hata oluştu'
  });
}

/**
 * Müşteri ara
 * @param query Arama sorgusu
 * @returns Arama sonuçları
 */
export async function searchCustomers(query: string) {
  return await callMcpApi('search-customers', { 
    query 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri araması yapılırken bir hata oluştu'
  });
}