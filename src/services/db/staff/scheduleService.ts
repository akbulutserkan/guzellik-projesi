/**
 * Personel çalışma saatleri ve takvim işlemleri
 */
import { prisma } from '@/lib/prisma';
import { 
  StaffSchedule,
  StaffAvailability,
  ServiceResponse
} from './types';

/**
 * Personel çalışma saatlerini getir
 * @param staffId Personel ID
 * @param date Tarih
 * @returns Çalışma saatleri bilgisi
 */
export async function getStaffScheduleFromDb(staffId: string, date?: string): Promise<ServiceResponse<StaffSchedule>> {
  try {
    console.log(`[staff-db-service] getStaffScheduleFromDb çağrıldı, staffId: ${staffId}, date: ${date || 'belirtilmedi'}`);
    
    if (!staffId) {
      return {
        success: false,
        error: 'Personel ID\'si gereklidir'
      };
    }

    // Personel bilgisini getir
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        name: true,
        workingHours: true
      }
    });

    if (!staff) {
      console.log(`[staff-db-service] Personel bulunamadı, id: ${staffId}`);
      return {
        success: false,
        error: 'Personel bulunamadı'
      };
    }

    // İşyeri çalışma saatlerini getir
    const businessHours = await prisma.businessHours.findMany();
    const formattedBusinessHours = businessHours.map(day => ({
      dayOfWeek: day.dayOfWeek,
      isWorkingDay: day.isWorkingDay,
      startTime: day.startTime,
      endTime: day.endTime
    }));

    // Özel günleri getir (istisna günler - tatiller vs.)
    let exceptions = [];
    if (date) {
      const dateObj = new Date(date);
      
      exceptions = await prisma.workingDayException.findMany({
        where: {
          date: dateObj
        }
      });
    }

    console.log(`[staff-db-service] Personel çalışma saatleri alındı, id: ${staffId}`);
    
    return {
      success: true,
      data: {
        staff: {
          id: staffId,
          name: staff.name
        },
        workingHours: staff.workingHours,
        businessHours: formattedBusinessHours,
        exceptions,
        staffSchedule: staff.workingHours
      }
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel çalışma saatleri alınırken hata (id: ${staffId}):`, error);
    return {
      success: false,
      error: 'Personel çalışma saatleri alınamadı'
    };
  }
}

/**
 * Personel uygunluk durumunu getir
 * @param staffId Personel ID
 * @param date Tarih
 * @returns Uygunluk durumu
 */
export async function getStaffAvailabilityFromDb(staffId: string, date: string): Promise<ServiceResponse<StaffAvailability>> {
  try {
    console.log(`[staff-db-service] getStaffAvailabilityFromDb çağrıldı, staffId: ${staffId}, date: ${date}`);
    
    if (!staffId || !date) {
      return {
        success: false,
        error: 'Personel ID ve tarih gereklidir'
      };
    }

    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Personel bilgisini getir
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        workingHours: true
      }
    });

    if (!staff) {
      console.log(`[staff-db-service] Personel bulunamadı, id: ${staffId}`);
      return {
        success: false,
        error: 'Personel bulunamadı'
      };
    }

    // İşyeri çalışma saatlerini getir
    const businessHours = await prisma.businessHours.findMany();

    // O günkü randevuları getir
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: staffId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED', 'DELETED']
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        customer: true,
        service: true
      }
    });

    // Özel günleri getir (tatiller, istisna günler)
    const exceptions = await prisma.workingDayException.findMany({
      where: {
        date: startOfDay
      }
    });

    console.log(`[staff-db-service] Personel uygunluk bilgisi alındı, id: ${staffId}, randevu sayısı: ${appointments.length}`);
    
    return {
      success: true,
      data: {
        staff: {
          id: staff.id,
          name: staff.name
        },
        workingHours: staff.workingHours,
        businessHours,
        appointments,
        exceptions,
        date: date
      }
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel uygunluk bilgisi alınırken hata (id: ${staffId}):`, error);
    return {
      success: false,
      error: 'Personel uygunluk bilgisi alınamadı'
    };
  }
}

/**
 * Belirli bir tarihteki tüm personel uygunluk durumlarını getir
 * @param date Tarih
 * @returns Tüm personelin uygunluk durumları
 */
export async function getAllStaffAvailabilityFromDb(date: string): Promise<ServiceResponse<StaffAvailability[]>> {
  try {
    console.log(`[staff-db-service] getAllStaffAvailabilityFromDb çağrıldı, date: ${date}`);
    
    if (!date) {
      return {
        success: false,
        error: 'Tarih bilgisi gereklidir'
      };
    }

    // Aktif personel listesini getir
    const activeStaff = await prisma.staff.findMany({
      where: { 
        isActive: true,
        showInCalendar: true
      },
      select: {
        id: true,
        name: true
      }
    });

    // Her personel için uygunluk bilgisini getir
    const availabilityList = [];
    
    for (const staff of activeStaff) {
      const availabilityResult = await getStaffAvailabilityFromDb(staff.id, date);
      
      if (availabilityResult.success && availabilityResult.data) {
        availabilityList.push(availabilityResult.data);
      }
    }

    console.log(`[staff-db-service] Toplam ${availabilityList.length} personel için uygunluk bilgisi alındı`);
    
    return {
      success: true,
      data: availabilityList
    };
  } catch (error) {
    console.error(`[staff-db-service] Toplu personel uygunluk bilgisi alınırken hata:`, error);
    return {
      success: false,
      error: 'Personel uygunluk bilgileri alınamadı'
    };
  }
}

/**
 * Personelin çalışma saatlerini güncelle
 * @param staffId Personel ID
 * @param workingHours Çalışma saatleri
 * @returns İşlem sonucu
 */
export async function updateStaffWorkingHoursFromDb(staffId: string, workingHours: any[]): Promise<ServiceResponse<any>> {
  try {
    console.log(`[staff-db-service] updateStaffWorkingHoursFromDb çağrıldı, staffId: ${staffId}`);
    
    if (!staffId) {
      return {
        success: false,
        error: 'Personel ID\'si gereklidir'
      };
    }
    
    if (!Array.isArray(workingHours)) {
      return {
        success: false,
        error: 'Çalışma saatleri bir dizi olmalıdır'
      };
    }

    // Çalışma saatlerini doğrula
    const { validateWorkingHoursFromDb } = await import('@/services/db/workingHours'); 
    const validationResult = await validateWorkingHoursFromDb(workingHours);
    
    if (!validationResult.success) {
      return validationResult;
    }

    // Personel çalışma saatlerini güncelle
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: { workingHours },
      select: {
        id: true,
        name: true,
        workingHours: true
      }
    });

    console.log(`[staff-db-service] Personel çalışma saatleri güncellendi, id: ${staffId}`);
    
    return {
      success: true,
      data: updatedStaff
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel çalışma saatleri güncellenirken hata (id: ${staffId}):`, error);
    return {
      success: false,
      error: 'Personel çalışma saatleri güncellenemedi'
    };
  }
}
