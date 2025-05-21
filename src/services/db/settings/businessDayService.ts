/**
 * İşletme çalışma günleri servisi
 */
import { prisma } from '@/lib/prisma';
import { BusinessDaysFormat, ServiceResponse } from './types';
import { 
  getDayNumber, 
  getDayName, 
  formatBusinessDaysForFrontend,
  validateTimeFormat
} from './helpers';

/**
 * İşletme çalışma günlerini getir
 * @returns Formatlanmış işletme çalışma günleri
 */
export async function getBusinessDaysFromDb(): Promise<ServiceResponse<BusinessDaysFormat>> {
  try {
    console.log('[settings-db-service] getBusinessDaysFromDb çağrıldı');
    
    const businessDays = await prisma.businessDay.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });
    
    // Günleri Frontend için formatla
    const formattedDays = formatBusinessDaysForFrontend(businessDays);

    console.log('[settings-db-service] İşletme çalışma günleri başarıyla alındı');
    
    return {
      success: true,
      data: formattedDays
    };
  } catch (error) {
    console.error('[settings-db-service] İşletme çalışma günleri alınırken hata:', error);
    return {
      success: false,
      error: 'İşletme çalışma günleri alınamadı'
    };
  }
}

/**
 * İşletme çalışma günlerini güncelle
 * @param data Güncellenecek çalışma günleri
 * @returns Güncellenmiş işletme çalışma günleri
 */
export async function updateBusinessDaysInDb(data: BusinessDaysFormat): Promise<ServiceResponse<BusinessDaysFormat>> {
  try {
    console.log('[settings-db-service] updateBusinessDaysInDb çağrıldı, data:', data);
    
    // Veri validasyonu
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'Geçersiz veri formatı'
      };
    }

    // Zaman formatı kontrolü
    const timeFormatErrors = [];
    
    for (const [day, settings] of Object.entries(data)) {
      if (settings.enabled) {
        if (!validateTimeFormat(settings.start)) {
          timeFormatErrors.push(`${day} için başlangıç saati formatı hatalı (HH:MM olmalı)`);
        }
        
        if (!validateTimeFormat(settings.end)) {
          timeFormatErrors.push(`${day} için bitiş saati formatı hatalı (HH:MM olmalı)`);
        }
      }
    }
    
    if (timeFormatErrors.length > 0) {
      return {
        success: false,
        error: timeFormatErrors.join(', ')
      };
    }

    // Her gün için veritabanı güncellemeleri
    const updates = Object.entries(data).map(([day, settings]) => {
      return prisma.businessDay.upsert({
        where: { dayOfWeek: getDayNumber(day) },
        update: {
          isWorkingDay: settings.enabled,
          startTime: settings.start,
          endTime: settings.end
        },
        create: {
          dayOfWeek: getDayNumber(day),
          isWorkingDay: settings.enabled,
          startTime: settings.start,
          endTime: settings.end
        }
      });
    });

    // İşlemleri bir transaction içinde gerçekleştir
    await prisma.$transaction(updates);

    // Güncel veriyi getir
    const updatedDays = await prisma.businessDay.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
    
    // Sonuç verisini formatla
    const formattedDays = formatBusinessDaysForFrontend(updatedDays);

    console.log('[settings-db-service] İşletme çalışma günleri başarıyla güncellendi');
    
    return {
      success: true,
      data: formattedDays
    };
  } catch (error) {
    console.error('[settings-db-service] İşletme çalışma günleri güncellenirken hata:', error);
    return {
      success: false,
      error: 'İşletme çalışma günleri güncellenemedi'
    };
  }
}
