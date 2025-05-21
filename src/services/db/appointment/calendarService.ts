/**
 * Calendar related operations for appointments
 */

import { prisma } from '@/lib/prisma';
import { CalendarData, ServiceResponse, FormattedAppointment, BusinessHours, AppointmentWithRelations } from './types';

/**
 * Takvim görünümü için randevu ve personel verilerini getirir
 * @param options - Filtreleme seçenekleri
 * @returns {Promise<ServiceResponse<CalendarData>>}
 */
export async function getCalendarDataFromDb(options: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
  forceRefresh?: boolean;
} = {}): Promise<ServiceResponse<CalendarData>> {
  console.log('[appointment-db-service] getCalendarDataFromDb çağrıldı, seçenekler:', JSON.stringify(options, null, 2));
  try {
    const startTime = Date.now();
    
    // Tarih aralığını detaylı logla
    if (options.startDate && options.endDate) {
      console.log(`[appointment-db-service] Talep edilen tarih aralığı: ${options.startDate} - ${options.endDate}`);
    } else {
      console.warn('[appointment-db-service] Eksik tarih aralığı! startDate ve/veya endDate belirtilmemiş.', JSON.stringify(options, null, 2));
      // Tarih aralığı belirtilmemişse, bugünün tarihini kullan
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      options.startDate = startOfDay.toISOString();
      options.endDate = endOfDay.toISOString();
      console.log(`[appointment-db-service] Varsayılan tarih aralığı oluşturuldu: ${options.startDate} - ${options.endDate}`);
    }
    
    // Önce personel verilerini getir
    console.log('[appointment-db-service] Personel verileri getiriliyor...');
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        workingHours: true,
        showInCalendar: true,
        serviceGender: true
      }
    });
    
    console.log(`[appointment-db-service] ${staff.length} aktif personel bulundu`);
    
    // Sonra randevuları getir
    let whereClause: any = {};
    
    if (options.startDate && options.endDate) {
      // Tarih aralığını düzgün formatla
      const startDate = new Date(options.startDate);
      const endDate = new Date(options.endDate);
      
      // Bitiş tarihini günün sonuna ayarla (23:59:59.999) - ÖNEMLİ DÜZELTME
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.startTime = {
        gte: startDate,
        lte: endDate
      };
      
      console.log(`[appointment-db-service] Tarih aralığı düzeltildi: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    }
    
    if (options.staffId) {
      whereClause.staffId = options.staffId;
      console.log(`[appointment-db-service] Personel filtresi aktif: ${options.staffId}`);
    }
    
    if (options.customerId) {
      whereClause.customerId = options.customerId;
      console.log(`[appointment-db-service] Müşteri filtresi aktif: ${options.customerId}`);
    }
    
    // Takvim görünümünde sadece aktif randevuları göster
    whereClause.NOT = {
      status: { in: ['CANCELLED'] }
    };
    
    console.log('[appointment-db-service] DB sorgusu için WHERE:', JSON.stringify(whereClause, null, 2));
    
    // Randevu sorgusu
    try {
      console.log('[appointment-db-service] Randevular veritabanından çekiliyor...', JSON.stringify(whereClause, null, 2));
      
      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          staff: {
            select: {
              id: true,
              name: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      
      console.log(`[appointment-db-service] Takvim için ${appointments.length} randevu bulundu`);
      
      // Hata ayıklama: İlk 3 randevunun ID ve tarihlerini detaylı göster
      if(appointments.length > 0) {
        const first3 = appointments.slice(0, Math.min(3, appointments.length));
        console.log('[appointment-db-service] İlk randevular örneği:', 
          first3.map(a => ({
            id: a.id,
            start: a.startTime,
            end: a.endTime,
            staffId: a.staffId,
            customerId: a.customerId,
            status: a.status
          }))
        );
      }
      
      if (appointments.length === 0) {
        console.log(`[appointment-db-service] Bu tarih aralığında randevu yok: ${options.startDate} - ${options.endDate}`);
      } else {
        console.log(`[appointment-db-service] İlk randevu örneği:`, appointments[0]);
      }
      
      // Formatlanan randevuları hazırla
      console.log(`[appointment-db-service] Takvim için ${appointments.length} randevu formatlanıyor`);
      
      // Takvim için uygun formata dönüştür
      console.log('[appointment-db-service] Randevular formatlanıyor, ham veri tipi kontrolü:', 
        appointments.length > 0 ? JSON.stringify({
          idType: typeof appointments[0].id,
          startTimeType: typeof appointments[0].startTime,
          startTimeIsDate: appointments[0].startTime instanceof Date,
          startTimeValue: appointments[0].startTime
        }, null, 2) : 'Randevu yok'
      );
      
      const formattedAppointments = appointments.map(appointment => ({
        id: appointment.id,
        title: `${appointment.customer?.name || 'Müşteri'} - ${appointment.service?.name || 'Hizmet'}`,
        start: appointment.startTime,
        end: appointment.endTime,
        resourceId: appointment.staffId,
        staffId: appointment.staffId,
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
        status: appointment.status,
        notes: appointment.notes,
        customer: appointment.customer,
        staff: appointment.staff,
        service: appointment.service
      }));
      
      // İşlem süresini ölç
      const elapsed = Date.now() - startTime;
      console.log(`[appointment-db-service] Takvim verisi işlemi ${elapsed}ms içinde tamamlandı`);
      console.log(`[appointment-db-service] Takvim verisi döndürülüyor: ${staff.length} personel, ${formattedAppointments.length} randevu`);
      
      // Döndürülecek veriyi detaylı logla
      if (formattedAppointments.length > 0) {
        console.log('[appointment-db-service] Formatlanmış ilk randevu örneği:', JSON.stringify(formattedAppointments[0], null, 2));
      }
      
      return {
        success: true,
        data: {
          staff,
          appointments: formattedAppointments
        }
      };
    } catch (dbError: any) {
      console.error('[appointment-db-service] Randevu sorgulamasında hata oluştu:', dbError);
      throw dbError; // Üst catch bloğunda işlensin
    }
  } catch (error: any) {
    console.error('[appointment-db-service] Takvim verileri alma hatası:', error);
    console.error('[appointment-db-service] Hata stack:', error.stack);
    return {
      success: false,
      error: `Takvim verileri alınırken hata oluştu: ${error.message}`,
      data: {
        staff: [],
        appointments: []
      }
    };
  }
}

/**
 * Belirtilen tarihte müşterinin randevularını getirir
 * @param customerId - Müşteri ID'si
 * @param date - Tarih (YYYY-MM-DD formatında)
 * @returns {Promise<ServiceResponse<FormattedAppointment[]>>}
 */
export async function getCustomerAppointmentsFromDb(
  customerId: string, 
  date: string
): Promise<ServiceResponse<FormattedAppointment[]>> {
  try {
    // Tarih formatını kontrol et
    let dateObj: Date;
    try {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
    } catch (e) {
      return {
        success: false,
        error: 'Geçersiz tarih formatı. YYYY-MM-DD formatında olmalıdır.'
      };
    }
    
    // Başlangıç ve bitiş tarihlerini hesapla
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Müşterinin randevularını getir
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId,
        startTime: {
          gte: startOfDay
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Takvim için uygun formata dönüştür
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.customer?.name || 'Müşteri'} - ${appointment.service?.name || 'Hizmet'}`,
      start: appointment.startTime,
      end: appointment.endTime,
      resourceId: appointment.staffId,
      staffId: appointment.staffId,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      status: appointment.status,
      notes: appointment.notes,
      customer: appointment.customer,
      staff: appointment.staff,
      service: appointment.service
    }));
    
    return {
      success: true,
      data: formattedAppointments
    };
  } catch (error: any) {
    console.error('Müşteri randevuları alma hatası:', error);
    return {
      success: false,
      error: `Müşteri randevuları alınırken hata oluştu: ${error.message}`
    };
  }
}

/**
 * İşletme çalışma saatlerini getirir
 * @returns {Promise<ServiceResponse<BusinessHours>>}
 */
export async function getBusinessHoursFromDb(): Promise<ServiceResponse<BusinessHours>> {
  try {
    const businessHours = await prisma.businessDay.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });
    
    // Formatlanmış veri - gün adına göre anahtar
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const formattedHours: BusinessHours = {};
    
    businessHours.forEach(day => {
      const dayName = dayNames[day.dayOfWeek];
      formattedHours[dayName] = {
        enabled: day.isWorkingDay,
        start: day.startTime || '',
        end: day.endTime || ''
      };
    });
    
    return {
      success: true,
      data: formattedHours
    };
  } catch (error: any) {
    console.error('İşletme çalışma saatleri alma hatası:', error);
    return {
      success: false,
      error: `İşletme çalışma saatleri alınırken hata oluştu: ${error.message}`
    };
  }
}

/**
 * Veritabanından randevuları getirir
 * @param filters - Filtreleme seçenekleri
 * @returns {Promise<ServiceResponse<AppointmentWithRelations[]>>}
 */
export async function getAppointmentsFromDb(filters: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  staffId?: string;
  status?: string;
} = {}): Promise<ServiceResponse<AppointmentWithRelations[]>> {
  console.log('[appointment-db-service] getAppointmentsFromDb çağrıldı, filtreler:', filters);
  try {
    // Filtreleri hazırla
    const whereClause: any = {};
    
    // Tarih filtreleri
    if (filters.startDate || filters.endDate) {
      whereClause.startTime = {};
      
      if (filters.startDate) {
        whereClause.startTime.gte = new Date(filters.startDate);
      }
      
      if (filters.endDate) {
        whereClause.startTime.lte = new Date(filters.endDate);
      }
    }
    
    // Müşteri filtresi
    if (filters.customerId) {
      whereClause.customerId = filters.customerId;
    }
    
    // Personel filtresi
    if (filters.staffId) {
      whereClause.staffId = filters.staffId;
    }
    
    // Durum filtresi
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    console.log('Randevu filtreleri:', whereClause);
    
    console.log('[appointment-db-service] Veritabanından randevular çekilecek, filtreler:', whereClause);
    
    // Randevuları getir
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });
    
    console.log(`[appointment-db-service] ${appointments.length} randevu bulundu`);
    
    return {
      success: true,
      data: appointments
    };
  } catch (error: any) {
    console.error('Randevuları getirme hatası:', error);
    return {
      success: false,
      error: `Randevular getirilirken hata oluştu: ${error.message}`
    };
  }
}
