'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm kategori listesini getir
 */
export async function getServiceCategories(includeDeleted: boolean = false) {
  return await callMcpApi('get-service-categories', { 
    includeDeleted 
  }, {
    showToast: false,
    customErrorMsg: 'Kategori listesi alınırken bir hata oluştu'
  });
}

/**
 * Kategori detayını getir
 */
export async function getServiceCategoryById(id: string) {
  return await callMcpApi('get-service-category-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Kategori detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni kategori oluştur
 */
export async function createServiceCategory(data: any) {
  return await callMcpApi('add-service-category', data, {
    showToast: false,
    customErrorMsg: 'Kategori oluşturulurken bir hata oluştu'
  });
}

/**
 * Kategori güncelle
 */
export async function updateServiceCategory(id: string, data: any) {
  return await callMcpApi('update-service-category', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Kategori güncellenirken bir hata oluştu'
  });
}

/**
 * Kategori sil
 */
export async function deleteServiceCategory(id: string) {
  return await callMcpApi('delete-service-category', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Kategori silinirken bir hata oluştu'
  });
}