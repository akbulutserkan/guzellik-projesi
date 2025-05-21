'use client';

/**
 * Client tarafı personel servisi.
 * Bu servis yalnızca API çağrıları yapar ve arabulucu (proxy) görevi görür.
 * Tüm iş mantığı ve veri işlemleri db/staff servisinde gerçekleştirilir.
 * @see /src/services/db/staff/crudService.ts Veritabanı tarafı personel servisi
 */

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm personel listesini getir
 * @param includeInactive Pasif durumda olanları da dahil et
 * @returns Personel listesi yanıtı
 */
export async function getStaff(includeInactive: boolean = false) {
  return await callMcpApi('get-staff', { 
    includeInactive 
  }, {
    showToast: false,
    customErrorMsg: 'Personel listesi alınırken bir hata oluştu'
  });
}

/**
 * Personel detayını getir
 * @param id Personel ID
 * @returns Personel detayı yanıtı
 */
export async function getStaffById(id: string) {
  return await callMcpApi('get-staff-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Personel detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni personel oluştur
 * @param data Personel bilgileri
 * @returns Oluşturulan personel yanıtı
 */
export async function createStaff(data: any) {
  return await callMcpApi('create-staff', data, {
    showToast: false,
    customErrorMsg: 'Personel oluşturulurken bir hata oluştu'
  });
}

/**
 * Personel güncelle
 * @param id Personel ID
 * @param data Güncellenecek personel bilgileri
 * @returns Güncellenen personel yanıtı
 */
export async function updateStaff(id: string, data: any) {
  return await callMcpApi('update-staff', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Personel güncellenirken bir hata oluştu'
  });
}

/**
 * Personel sil
 * @param id Personel ID
 * @returns İşlem sonucu yanıtı
 */
export async function deleteStaff(id: string) {
  return await callMcpApi('delete-staff', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Personel silinirken bir hata oluştu'
  });
}

/**
 * Personel izinlerini güncelle
 * @param id Personel ID
 * @param permissions İzin listesi
 * @returns Güncellenen izin listesi yanıtı
 */
export async function updateStaffPermissions(id: string, permissions: string[]) {
  return await callMcpApi('update-staff-permissions', { 
    id, 
    permissions 
  }, {
    showToast: false,
    customErrorMsg: 'Personel izinleri güncellenirken bir hata oluştu'
  });
}

/**
 * Çalışma saatlerini doğrula
 * @param workingHours Çalışma saati ayarları
 * @returns Doğrulama sonuç yanıtı
 */
export async function validateWorkingHours(workingHours: any[]) {
  return await callMcpApi('validate-working-hours', { 
    workingHours 
  }, {
    showToast: false,
    customErrorMsg: 'Çalışma saatleri doğrulanırken bir hata oluştu'
  });
}

/**
 * Personel çalışma saatlerini getir
 * @param staffId Personel ID
 * @param date Tarih
 * @returns Çalışma saatleri yanıtı
 */
export async function getStaffSchedule(staffId: string, date?: string) {
  return await callMcpApi('get-staff-schedule', { 
    staffId,
    date
  }, {
    showToast: false,
    customErrorMsg: 'Personel çalışma saatleri alınırken bir hata oluştu'
  });
}

/**
 * Personel uygunluk durumunu getir
 * @param staffId Personel ID
 * @param date Tarih
 * @returns Uygunluk durumu yanıtı
 */
export async function getStaffAvailability(staffId: string, date: string) {
  return await callMcpApi('get-staff-availability', { 
    staffId,
    date
  }, {
    showToast: false,
    customErrorMsg: 'Personel uygunluk durumu alınırken bir hata oluştu'
  });
}

/**
 * Personelin sunduğu hizmetleri getir
 * @param staffId Personel ID
 * @param allServices Tüm hizmet listesi (opsiyonel)
 * @returns Personel hizmetleri listesi
 */
export async function getStaffServices(staffId: string, allServices: any[] = []) {
  const result = await callMcpApi('get-staff-by-id', { 
    id: staffId 
  }, {
    showToast: false,
    customErrorMsg: 'Personel hizmetleri alınırken bir hata oluştu'
  });

  // API yanıtını işle ve personel hizmetlerini çıkar
  let staffServices: any[] = [];
  try {
    const staffData = result.data;
    
    // 1. Doğrudan services dizisi
    if (staffData.services && Array.isArray(staffData.services)) {
      staffServices = staffData.services;
    }
    // 2. allowedServices dizisi
    else if (staffData.allowedServices && Array.isArray(staffData.allowedServices)) {
      staffServices = staffData.allowedServices;
    }
    // 3. categories içinde services
    else if (staffData.categories && Array.isArray(staffData.categories)) {
      for (const category of staffData.categories) {
        if (category.services && Array.isArray(category.services)) {
          staffServices = [...staffServices, ...category.services];
        }
      }
    }
    // 4. staff içinde services
    else if (staffData.staff && staffData.staff.services && Array.isArray(staffData.staff.services)) {
      staffServices = staffData.staff.services;
    }
    // 5. staff içinde allowedServices
    else if (staffData.staff && staffData.staff.allowedServices && Array.isArray(staffData.staff.allowedServices)) {
      staffServices = staffData.staff.allowedServices;
    }
    // 6. serviceIds dizisi (sadece ID'ler)
    else if (staffData.serviceIds && Array.isArray(staffData.serviceIds)) {
      staffServices = staffData.serviceIds.map(id => ({ id }));
    }
    // 7. staff içinde serviceIds
    else if (staffData.staff && staffData.staff.serviceIds && Array.isArray(staffData.staff.serviceIds)) {
      staffServices = staffData.staff.serviceIds.map(id => ({ id }));
    }
  } catch (error) {
    console.error('Personel hizmetleri işlenirken hata:', error);
  }

  return staffServices;
}