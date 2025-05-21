'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * İşletme çalışma günlerini getir
 */
export async function getBusinessDays() {
  return await callMcpApi('get-business-days', {}, {
    showToast: false,
    customErrorMsg: 'İşletme çalışma günleri alınırken bir hata oluştu'
  });
}

/**
 * İşletme çalışma günlerini güncelle
 */
export async function updateBusinessDays(data: any) {
  return await callMcpApi('update-business-days', data, {
    showToast: false,
    customErrorMsg: 'İşletme çalışma günleri güncellenirken bir hata oluştu'
  });
}

/**
 * Sistem ayarlarını getir
 */
export async function getSystemSettings() {
  return await callMcpApi('get-system-settings', {}, {
    showToast: false,
    customErrorMsg: 'Sistem ayarları alınırken bir hata oluştu'
  });
}

/**
 * Sistem ayarlarını güncelle
 */
export async function updateSystemSettings(data: any) {
  return await callMcpApi('update-system-settings', data, {
    showToast: false,
    customErrorMsg: 'Sistem ayarları güncellenirken bir hata oluştu'
  });
}