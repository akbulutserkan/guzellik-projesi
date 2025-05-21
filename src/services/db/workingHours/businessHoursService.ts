/**
 * İşletme çalışma saatleri için servis fonksiyonları
 */
import { prisma } from '@/lib/prisma';
import { BusinessHour, ServiceResponse } from './types';

/**
 * İşletme çalışma saatlerini getir
 */
export async function getBusinessHoursFromDb(): Promise<ServiceResponse<BusinessHour[]>> {
  try {
    console.log('[working-hours-db-service] getBusinessHoursFromDb çağrıldı');
    
    const businessHours = await prisma.businessDay.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
    
    console.log(`[working-hours-db-service] ${businessHours.length} işletme çalışma günü kaydı bulundu`);
    
    return {
      success: true,
      data: businessHours
    };
  } catch (error) {
    console.error('[working-hours-db-service] İşletme çalışma saatleri getirilirken hata oluştu:', error);
    return {
      success: false,
      error: 'İşletme çalışma saatleri getirilirken bir hata oluştu'
    };
  }
}

/**
 * Belirli bir günün işletme çalışma saatlerini getir
 */
export async function getBusinessHourByDayFromDb(dayOfWeek: number): Promise<ServiceResponse<BusinessHour>> {
  try {
    console.log(`[working-hours-db-service] getBusinessHourByDayFromDb çağrıldı, gün: ${dayOfWeek}`);
    
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return {
        success: false,
        error: 'Geçersiz gün değeri. 0-6 arasında bir değer girilmelidir (0: Pazar, 6: Cumartesi)'
      };
    }
    
    const businessHour = await prisma.businessDay.findUnique({
      where: { dayOfWeek }
    });
    
    if (!businessHour) {
      return {
        success: false,
        error: `${dayOfWeek} günü için çalışma saati bulunamadı`
      };
    }
    
    return {
      success: true,
      data: businessHour
    };
  } catch (error) {
    console.error(`[working-hours-db-service] Gün ${dayOfWeek} için işletme çalışma saatleri getirilirken hata oluştu:`, error);
    return {
      success: false,
      error: 'İşletme çalışma saatleri getirilirken bir hata oluştu'
    };
  }
}

/**
 * İşletme çalışma saatlerini güncelle (upsert)
 */
export async function updateBusinessHourInDb(data: BusinessHour): Promise<ServiceResponse<BusinessHour>> {
  try {
    console.log(`[working-hours-db-service] updateBusinessHourInDb çağrıldı, data:`, data);
    
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      return {
        success: false,
        error: 'Geçersiz gün değeri. 0-6 arasında bir değer girilmelidir (0: Pazar, 6: Cumartesi)'
      };
    }
    
    // Zaman formatı kontrolü
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    
    if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
      return {
        success: false,
        error: 'Geçersiz saat formatı. HH:MM şeklinde olmalıdır'
      };
    }
    
    // Başlangıç zamanı bitiş zamanından önce mi kontrolü
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      return {
        success: false,
        error: 'Başlangıç zamanı bitiş zamanından önce olmalıdır'
      };
    }
    
    // Upsert işlemi (güncelle veya yeni oluştur)
    const businessHour = await prisma.businessDay.upsert({
      where: { dayOfWeek: data.dayOfWeek },
      update: {
        isOpen: data.isOpen,
        startTime: data.startTime,
        endTime: data.endTime
      },
      create: {
        dayOfWeek: data.dayOfWeek,
        isOpen: data.isOpen,
        startTime: data.startTime,
        endTime: data.endTime
      }
    });
    
    console.log(`[working-hours-db-service] Gün ${data.dayOfWeek} için işletme çalışma saatleri güncellendi`);
    
    return {
      success: true,
      data: businessHour
    };
  } catch (error) {
    console.error('[working-hours-db-service] İşletme çalışma saatleri güncellenirken hata oluştu:', error);
    return {
      success: false,
      error: 'İşletme çalışma saatleri güncellenirken bir hata oluştu'
    };
  }
}

/**
 * Çoklu işletme çalışma saatlerini toplu güncelle
 */
export async function updateBusinessHoursBulkInDb(data: BusinessHour[]): Promise<ServiceResponse<BusinessHour[]>> {
  try {
    console.log(`[working-hours-db-service] updateBusinessHoursBulkInDb çağrıldı, veri sayısı: ${data.length}`);
    
    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: 'Geçerli bir çalışma saatleri listesi gönderilmelidir'
      };
    }
    
    const updatedHours: BusinessHour[] = [];
    const errors: string[] = [];
    
    // Her bir gün için ayrı ayrı güncelleme
    for (const hourData of data) {
      const result = await updateBusinessHourInDb(hourData);
      
      if (result.success && result.data) {
        updatedHours.push(result.data);
      } else {
        errors.push(`Gün ${hourData.dayOfWeek} için güncelleme hatası: ${result.error}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('[working-hours-db-service] Toplu güncelleme sırasında hatalar oluştu:', errors);
      return {
        success: false,
        error: errors.join('; '),
        data: updatedHours
      };
    }
    
    console.log(`[working-hours-db-service] ${updatedHours.length} işletme çalışma saati başarıyla güncellendi`);
    
    return {
      success: true,
      data: updatedHours
    };
  } catch (error) {
    console.error('[working-hours-db-service] İşletme çalışma saatleri toplu güncellenirken hata oluştu:', error);
    return {
      success: false,
      error: 'İşletme çalışma saatleri toplu güncellenirken bir hata oluştu'
    };
  }
}
