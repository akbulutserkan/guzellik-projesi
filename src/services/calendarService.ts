'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Takvim verilerini getir
 */
export async function getCalendarData(options: any = {}) {
  console.log('[calendarService] getCalendarData çağrıldı, options:', JSON.stringify(options, null, 2));
  
  // MCP API çağrısının parametrelerini detaylı logla
  console.log('[calendarService] MCP API çağrısı yapılıyor: get-calendar-data', JSON.stringify(options, null, 2));
  
  // İstemci tarafı için tarih aralığı kontrolü ve varsayılan değer tanımlama
  if (!options.startDate || !options.endDate) {
    const now = new Date();
    
    // Varsayılan başlangıç tarihi (bugünün başı)
    if (!options.startDate) {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      options.startDate = startDate.toISOString();
    }
    
    // Varsayılan bitiş tarihi (bugünün sonu)
    if (!options.endDate) {
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      options.endDate = endDate.toISOString();
    }
    
    console.log(`[calendarService] Varsayılan tarih aralığı ayarlandı: ${options.startDate} - ${options.endDate}`);
  }
  
  try {
    console.log('[calendarService] MCP API çağrısı başlatılıyor...');
    const response = await callMcpApi('get-calendar-data', options, {
      showToast: false,
      customErrorMsg: 'Takvim verileri alınırken bir hata oluştu'
    });
    
    console.log('[calendarService] getCalendarData yanıtı alındı, başarı durumu:', response.success);
    
    if (!response.success) {
      console.error('[calendarService] Hata yanıtı:', response.error);
      return {
        success: false,
        error: response.error || 'Takvim verileri alınırken bir hata oluştu',
        data: {
          staff: [],
          appointments: []
        }
      };
    }

    // Herhangi bir veri yoksa boş bir veri yapısı döndür
    if (!response.data) {
      console.warn('[calendarService] Yanıtta data yok, boş veri döndürülüyor');
      return {
        success: true,
        data: {
          staff: [],
          appointments: []
        }
      };
    }
    
    // Veri yapısı kontrolü ve düzeltme
    const staff = Array.isArray(response.data.staff) ? response.data.staff : [];
    const appointments = Array.isArray(response.data.appointments) ? response.data.appointments : [];
    
    // Yanıt içeriğini detaylı kontrol et
    console.log('[calendarService] Data formatı:', {
      hasData: !!response.data,
      hasStaff: Array.isArray(staff),
      staffCount: staff.length,
      hasAppointments: Array.isArray(appointments),
      appointmentsCount: appointments.length
    });
    
    // Düzeltilmiş veriyi döndür
    return {
      success: true,
      data: {
        staff,
        appointments
      }
    };
  } catch (error) {
    console.error('[calendarService] getCalendarData çağrısında hata:', error);
    console.error('[calendarService] Hata mesajı:', error.message);
    if (error.stack) {
      console.error('[calendarService] Hata stack:', error.stack);
    }
    
    // Hata durumunda bile bir dönüş değeri oluştur
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Takvim verileri alınırken bir hata oluştu',
      data: {
        staff: [],
        appointments: []
      }
    };
  }
}

/**
 * Personel uygunluğunu kontrol et
 */
export async function checkStaffAvailability(staffId: string, startTime: string, endTime: string, excludeEventId?: string) {
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
export async function updateEventDrag(data: any) {
  return await callMcpApi('update-appointment-drag', data, {
    showToast: false,
    customErrorMsg: 'Randevu güncellenirken bir hata oluştu'
  });
}

/**
 * İşletme çalışma saatlerini getir
 */
export async function getBusinessHours(forceRefresh: boolean = false) {
  return await callMcpApi('get-business-hours', { forceRefresh }, {
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