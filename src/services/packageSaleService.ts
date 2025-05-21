'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm paket satışlarını getir
 */
export async function getPackageSales(filters: any = {}) {
  console.log('[packageSaleService] getPackageSales çağrıldı, filtreler:', filters);
  return await callMcpApi('get-package-sales', filters, {
    showToast: false,
    customErrorMsg: 'Paket satışları alınırken bir hata oluştu'
  });
}

/**
 * Paket satış detayını getir
 */
export async function getPackageSaleById(id: string) {
  console.log(`[packageSaleService] getPackageSaleById çağrıldı, id: ${id}`);
  return await callMcpApi('get-package-sale-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Paket satış detayı alınırken bir hata oluştu'
  });
}

/**
 * Müşterinin paket satışlarını getir
 */
export async function getPackageSalesByCustomer(customerId: string, includeDeleted: boolean = false) {
  console.log(`[packageSaleService] getPackageSalesByCustomer çağrıldı, customerId: ${customerId}, includeDeleted: ${includeDeleted}`);
  return await callMcpApi('get-package-sales-by-customer', { 
    customerId,
    includeDeleted
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri paket satışları alınırken bir hata oluştu'
  });
}

/**
 * Yeni paket satışı oluştur
 */
export async function createPackageSale(data: any) {
  console.log('[packageSaleService] createPackageSale çağrıldı, data:', data);
  return await callMcpApi('create-package-sale', data, {
    showToast: false,
    customErrorMsg: 'Paket satışı oluşturulurken bir hata oluştu'
  });
}

/**
 * Paket satışı güncelle
 */
export async function updatePackageSale(id: string, data: any) {
  console.log(`[packageSaleService] updatePackageSale çağrıldı, id: ${id}, data:`, data);
  return await callMcpApi('update-package-sale', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Paket satışı güncellenirken bir hata oluştu'
  });
}

/**
 * Paket satışı sil
 */
export async function deletePackageSale(id: string) {
  console.log(`[packageSaleService] deletePackageSale çağrıldı, id: ${id}`);
  return await callMcpApi('delete-package-sale', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Paket satışı silinirken bir hata oluştu'
  });
}

/**
 * Paket ödemelerini getir
 */
export async function getPackageSalePayments(packageSaleId: string) {
  console.log(`[packageSaleService] getPackageSalePayments çağrıldı, packageSaleId: ${packageSaleId}`);
  // MCP API üzerinden doğrudan veritabanı servisiyle çağrı
  return await callMcpApi('get-payments-by-package-sale', { 
    packageSaleId 
  }, {
    showToast: false,
    customErrorMsg: 'Paket ödemeleri alınırken bir hata oluştu'
  });
}

/**
 * Paket satışına ödeme ekle
 */
export async function addPackageSalePayment(data: any) {
  console.log('[packageSaleService] addPackageSalePayment çağrıldı, data:', data);
  // Ödeme verilerinin gerekli alanlarını kontrol et
  if (!data.packageSaleId || data.amount === undefined) {
    console.error('[packageSaleService] Eksik ödeme verileri:', data);
    return {
      success: false,
      error: 'Paket satışı ID ve ödeme tutarı gereklidir'
    };
  }
  
  // MCP API ile ödeme oluştur
  return await callMcpApi('add-payment', {
    ...data,
    // Ödemenin paket satışına ait olduğunu belirtmek için packageSaleId kullan
    packageSaleId: data.packageSaleId
  }, {
    showToast: false,
    customErrorMsg: 'Ödeme eklenirken bir hata oluştu'
  });
}

/**
 * Ödeme sil
 */
export async function deletePackageSalePayment(paymentId: string) {
  console.log(`[packageSaleService] deletePackageSalePayment çağrıldı, paymentId: ${paymentId}`);
  return await callMcpApi('delete-payment', { 
    id: paymentId 
  }, {
    showToast: false,
    customErrorMsg: 'Ödeme silinirken bir hata oluştu'
  });
}

/**
 * Paket seansı oluştur
 */
export async function createPackageSession(packageSaleId: string, data: any) {
  console.log(`[packageSaleService] createPackageSession çağrıldı, packageSaleId: ${packageSaleId}, data:`, data);
  return await callMcpApi('create-package-session', { 
    packageSaleId, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Paket seansı oluşturulurken bir hata oluştu'
  });
}

/**
 * Paket seansı güncelle
 */
export async function updatePackageSession(sessionId: string, data: any) {
  console.log(`[packageSaleService] updatePackageSession çağrıldı, sessionId: ${sessionId}, data:`, data);
  return await callMcpApi('update-package-session', { 
    id: sessionId, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Paket seansı güncellenirken bir hata oluştu'
  });
}

/**
 * Paket seansı sil
 */
export async function deletePackageSession(sessionId: string) {
  console.log(`[packageSaleService] deletePackageSession çağrıldı, sessionId: ${sessionId}`);
  return await callMcpApi('delete-package-session', { 
    id: sessionId 
  }, {
    showToast: false,
    customErrorMsg: 'Paket seansı silinirken bir hata oluştu'
  });
}