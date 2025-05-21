'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm hizmet listesini getir
 */
export async function getServices(includeDeleted: boolean = false) {
  return await callMcpApi('get-services', { 
    includeDeleted 
  }, {
    showToast: false,
    customErrorMsg: 'Hizmet listesi alınırken bir hata oluştu'
  });
}

/**
 * Hizmet detayını getir
 */
export async function getServiceById(id: string) {
  return await callMcpApi('get-service-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Hizmet detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni hizmet oluştur
 */
export async function createService(data: any) {
  console.log('[serviceService] [DEBUG] createService çağrıldı, veriler:', JSON.stringify(data, null, 2));
  
  try {
    const response = await callMcpApi('create-service', data, {
      showToast: false,
      customErrorMsg: 'Hizmet oluşturulurken bir hata oluştu'
    });
    
    console.log('[serviceService] [DEBUG] createService yanıt:', JSON.stringify({
      success: response.success,
      error: response.error || 'YOK',
      data: response.data ? 'VAR' : 'YOK',
      dataId: response.data?.id || 'YOK'
    }, null, 2));
    
    return response;
  } catch (error) {
    console.error('[serviceService] [DEBUG] createService HATA:', error);
    return {
      success: false,
      error: error.message || 'Hizmet oluşturulurken bir hata oluştu'
    };
  }
}

/**
 * Hizmet güncelle
 */
export async function updateService(id: string, data: any) {
  return await callMcpApi('update-service', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Hizmet güncellenirken bir hata oluştu'
  });
}

/**
 * Hizmet sil
 */
export async function deleteService(id: string) {
  console.log(`[SİLME-DETAY] serviceService - deleteService: API çağrısı başladı, id: ${id}`);
  
  try {
    const result = await callMcpApi('delete-service', { 
      id 
    }, {
      showToast: false,
      customErrorMsg: 'Hizmet silinirken bir hata oluştu'
    });
    
    console.log(`[SİLME-DETAY] serviceService - deleteService: API yanıtı alındı:`, result);
    return result;
  } catch (error) {
    console.error(`[SİLME-DETAY] serviceService - deleteService: API hatası:`, error);
    return {
      success: false,
      error: error.message || 'Hizmet silme işlemi sırasında hata oluştu'
    };
  }
}

/**
 * Toplu fiyat güncelleme
 */
export async function bulkUpdateServicePrices(data: any) {
  return await callMcpApi('bulk-update-prices', data, {
    showToast: false,
    customErrorMsg: 'Fiyatlar güncellenirken bir hata oluştu'
  });
}

/**
 * Fiyat geçmişini getir
 */
export async function getServicePriceHistory(serviceId: string) {
  return await callMcpApi('get-service-price-history', { 
    serviceId 
  }, {
    showToast: false,
    customErrorMsg: 'Fiyat geçmişi alınırken bir hata oluştu'
  });
}