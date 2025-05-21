'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm randevuları getir
 */
export async function getAppointments(filters: any = {}) {
  return await callMcpApi('get-appointments', filters, {
    showToast: false,
    customErrorMsg: 'Randevular alınırken bir hata oluştu'
  });
}

/**
 * Randevu detayını getir
 */
export async function getAppointmentById(id: string, includeServices: boolean = false) {
  return await callMcpApi('get-appointment-by-id', { 
    id,
    includeServices
  }, {
    showToast: false,
    customErrorMsg: 'Randevu detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni randevu oluştur
 */
export async function createAppointment(data: any) {
  return await callMcpApi('create-appointment', data, {
    showToast: false,
    customErrorMsg: 'Randevu oluşturulurken bir hata oluştu'
  });
}

/**
 * Randevu güncelle
 */
export async function updateAppointment(id: string, data: any) {
  return await callMcpApi('update-appointment', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Randevu güncellenirken bir hata oluştu'
  });
}

/**
 * Randevu sil
 */
export async function deleteAppointment(id: string) {
  return await callMcpApi('delete-appointment', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Randevu silinirken bir hata oluştu'
  });
}

/**
 * Randevu durumunu güncelle
 */
export async function updateAppointmentStatus(id: string, status: string) {
  return await callMcpApi('update-appointment-status', { 
    id, 
    status 
  }, {
    showToast: false,
    customErrorMsg: 'Randevu durumu güncellenirken bir hata oluştu'
  });
}

/**
 * Randevu notlarını güncelle
 */
export async function updateAppointmentNotes(id: string, notes: string) {
  return await callMcpApi('update-appointment-notes', { 
    id, 
    notes 
  }, {
    showToast: false,
    customErrorMsg: 'Randevu notları güncellenirken bir hata oluştu'
  });
}

/**
 * Takvim verilerini getir (personel ve randevular)
 */
export async function getCalendarData(options: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
  forceRefresh?: boolean;
} = {}) {
  return await callMcpApi('get-calendar-data', options, {
    showToast: false,
    customErrorMsg: 'Takvim verileri alınırken bir hata oluştu'
  });
}

/**
 * Personel uygunluğunu kontrol et
 */
export async function checkStaffAvailability(
  staffId: string, 
  startTime: string, 
  endTime: string, 
  excludeEventId?: string
) {
  return await callMcpApi('check-staff-availability', { 
    staffId, 
    startTime,
    endTime,
    excludeEventId
  }, {
    showToast: false,
    customErrorMsg: 'Personel uygunluğu kontrol edilirken bir hata oluştu'
  });
}

/**
 * Randevu taşıma veya yeniden boyutlandırma işlemini gerçekleştirir
 */
export async function updateAppointmentDrag(data: any) {
  return await callMcpApi('update-appointment-drag', data, {
    showToast: false,
    customErrorMsg: 'Randevu güncellenirken bir hata oluştu'
  });
}

/**
 * İşletme çalışma saatlerini getir
 */
export async function getBusinessHours() {
  return await callMcpApi('get-business-hours', {}, {
    showToast: false,
    customErrorMsg: 'İşletme çalışma saatleri alınırken bir hata oluştu'
  });
}

/**
 * Müşterinin randevularını getir
 */
export async function getCustomerAppointments(customerId: string, date: string) {
  return await callMcpApi('get-customer-appointments', { 
    customerId, 
    date 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri randevuları alınırken bir hata oluştu'
  });
}

/**
 * Randevu katılım durumunu güncelle
 */
export async function markAppointmentAsNoShow(id: string) {
  return await callMcpApi('update-appointment', { 
    id, 
    status: 'NO_SHOW',
    attendance: 'NO_SHOW' 
  }, {
    showToast: false,
    customErrorMsg: 'Randevu gelmedi olarak işaretlenirken bir hata oluştu'
  });
}