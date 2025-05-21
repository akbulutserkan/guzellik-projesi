'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm çalışma saatlerini getir
 */
export async function getWorkingHours(date?: string) {
  return await callMcpApi('get-working-hours', { date }, {
    showToast: false,
    customErrorMsg: 'Çalışma saatleri alınırken bir hata oluştu'
  });
}

/**
 * Belirli bir personelin çalışma saatlerini getir
 */
export async function getWorkingHoursByStaff(staffId: string, date?: string) {
  return await callMcpApi('get-working-hours-by-staff', { 
    staffId,
    date
  }, {
    showToast: false,
    customErrorMsg: 'Personel çalışma saatleri alınırken bir hata oluştu'
  });
}

/**
 * ID'ye göre çalışma saati detayını getir
 */
export async function getWorkingHourById(id: string) {
  return await callMcpApi('get-working-hour-by-id', { id }, {
    showToast: false,
    customErrorMsg: 'Çalışma saati detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni bir çalışma saati oluştur
 */
export async function createWorkingHour(data: any) {
  return await callMcpApi('create-working-hour', data, {
    showToast: false,
    customErrorMsg: 'Çalışma saati oluşturulurken bir hata oluştu'
  });
}

/**
 * Mevcut bir çalışma saatini güncelle
 */
export async function updateWorkingHour(id: string, data: any) {
  return await callMcpApi('update-working-hour', { 
    id, 
    data 
  }, {
    showToast: false,
    customErrorMsg: 'Çalışma saati güncellenirken bir hata oluştu'
  });
}

/**
 * Bir çalışma saatini sil
 */
export async function deleteWorkingHour(id: string) {
  return await callMcpApi('delete-working-hour', { id }, {
    showToast: false,
    customErrorMsg: 'Çalışma saati silinirken bir hata oluştu'
  });
}

/**
 * İşletme çalışma saatlerini detaylı şekilde getir
 */
export async function getBusinessHoursDetails() {
  return await callMcpApi('get-business-hours-details', {}, {
    showToast: false,
    customErrorMsg: 'İşletme çalışma saatleri alınırken bir hata oluştu'
  });
}

/**
 * Çalışma saati istisnalarını getir (tatiller vb.)
 */
export async function getWorkingHourExceptions(date?: string) {
  return await callMcpApi('get-working-hour-exceptions', { date }, {
    showToast: false,
    customErrorMsg: 'Çalışma saati istisnaları alınırken bir hata oluştu'
  });
}

/**
 * Yeni bir çalışma saati istisnası oluştur
 */
export async function createWorkingHourException(data: any) {
  return await callMcpApi('create-working-hour-exception', data, {
    showToast: false,
    customErrorMsg: 'Çalışma saati istisnası oluşturulurken bir hata oluştu'
  });
}

/**
 * Bir çalışma saati istisnasını güncelle
 */
export async function updateWorkingHourException(id: string, data: any) {
  return await callMcpApi('update-working-hour-exception', { 
    id, 
    data 
  }, {
    showToast: false,
    customErrorMsg: 'Çalışma saati istisnası güncellenirken bir hata oluştu'
  });
}

/**
 * Bir çalışma saati istisnasını sil
 */
export async function deleteWorkingHourException(id: string) {
  return await callMcpApi('delete-working-hour-exception', { id }, {
    showToast: false,
    customErrorMsg: 'Çalışma saati istisnası silinirken bir hata oluştu'
  });
}

/**
 * Personel çalışma saatlerini kontrol et
 */
export async function checkStaffSchedule(staffId: string, date: string) {
  // Geriye uyumluluk için eski ismi kullanmaya devam ediyoruz
  return await callMcpApi('get-working-hours-by-staff', { 
    staffId, 
    date 
  }, {
    showToast: false,
    customErrorMsg: 'Personel çalışma saatleri kontrol edilirken bir hata oluştu'
  });
}