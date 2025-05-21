/**
 * Personel çalışma saatleri için servis fonksiyonları
 */
import { prisma } from '@/lib/prisma';
import {
  WorkingHourWithStaff,
  WorkingHourInput,
  WorkingHourUpdateInput,
  ServiceResponse
} from './types';
import { validateWorkingHourData, isValidTimeFormat, isValidTimeRange } from './helpers';

/**
 * Tüm çalışma saatlerini getir
 */
export async function getWorkingHoursFromDb(): Promise<ServiceResponse<WorkingHourWithStaff[]>> {
  try {
    console.log('[working-hours-db-service] getWorkingHoursFromDb çağrıldı');
    
    const workingHours = await prisma.workingHour.findMany({
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        dayOfWeek: 'asc',
      }
    });
    
    console.log(`[working-hours-db-service] ${workingHours.length} çalışma saati kaydı bulundu`);
    
    return {
      success: true,
      data: workingHours
    };
  } catch (error) {
    console.error('[working-hours-db-service] Çalışma saatleri getirilirken hata oluştu:', error);
    return {
      success: false,
      error: 'Çalışma saatleri getirilirken bir hata oluştu'
    };
  }
}

/**
 * Belirli bir personelin çalışma saatlerini getir
 */
export async function getWorkingHoursByStaffFromDb(staffId: string): Promise<ServiceResponse<WorkingHourWithStaff[]>> {
  try {
    console.log(`[working-hours-db-service] getWorkingHoursByStaffFromDb çağrıldı, staffId: ${staffId}`);
    
    if (!staffId) {
      return {
        success: false,
        error: 'Personel ID bilgisi gerekli'
      };
    }
    
    const workingHours = await prisma.workingHour.findMany({
      where: {
        staffId
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        dayOfWeek: 'asc',
      }
    });
    
    console.log(`[working-hours-db-service] ${staffId} ID'li personel için ${workingHours.length} çalışma saati kaydı bulundu`);
    
    return {
      success: true,
      data: workingHours
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${staffId} ID'li personelin çalışma saatleri getirilirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Personel çalışma saatleri getirilirken bir hata oluştu'
    };
  }
}

/**
 * ID'ye göre tek bir çalışma saati getir
 */
export async function getWorkingHourByIdFromDb(id: string): Promise<ServiceResponse<WorkingHourWithStaff>> {
  try {
    console.log(`[working-hours-db-service] getWorkingHourByIdFromDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Çalışma saati ID bilgisi gerekli'
      };
    }
    
    const workingHour = await prisma.workingHour.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!workingHour) {
      console.log(`[working-hours-db-service] ${id} ID'li çalışma saati bulunamadı`);
      return {
        success: false,
        error: 'Çalışma saati bulunamadı'
      };
    }
    
    console.log(`[working-hours-db-service] ${id} ID'li çalışma saati bulundu`);
    
    return {
      success: true,
      data: workingHour
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${id} ID'li çalışma saati getirilirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Çalışma saati getirilirken bir hata oluştu'
    };
  }
}

/**
 * Yeni bir çalışma saati oluştur
 */
export async function createWorkingHourInDb(data: WorkingHourInput): Promise<ServiceResponse<WorkingHourWithStaff>> {
  try {
    console.log(`[working-hours-db-service] createWorkingHourInDb çağrıldı, data:`, data);
    
    // Veri doğrulama
    const validationError = validateWorkingHourData(data);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }
    
    const workingHour = await prisma.workingHour.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive !== undefined ? data.isActive : true,
        staffId: data.staffId || null
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    console.log(`[working-hours-db-service] Yeni çalışma saati oluşturuldu, id: ${workingHour.id}`);
    
    return {
      success: true,
      data: workingHour
    };
  } catch (error) {
    console.error('[working-hours-db-service] Çalışma saati oluşturulurken hata oluştu:', error);
    return {
      success: false,
      error: 'Çalışma saati oluşturulurken bir hata oluştu'
    };
  }
}

/**
 * Mevcut bir çalışma saatini güncelle
 */
export async function updateWorkingHourInDb(id: string, data: WorkingHourUpdateInput): Promise<ServiceResponse<WorkingHourWithStaff>> {
  try {
    console.log(`[working-hours-db-service] updateWorkingHourInDb çağrıldı, id: ${id}, data:`, data);
    
    if (!id) {
      return {
        success: false,
        error: 'Çalışma saati ID bilgisi gerekli'
      };
    }
    
    // Mevcut çalışma saatini kontrol et
    const existing = await prisma.workingHour.findUnique({
      where: { id }
    });
    
    if (!existing) {
      console.log(`[working-hours-db-service] ${id} ID'li çalışma saati bulunamadı`);
      return {
        success: false,
        error: 'Güncellenecek çalışma saati bulunamadı'
      };
    }
    
    // Zaman formatı kontrolü (HH:MM)
    if (data.startTime || data.endTime) {
      const startTime = data.startTime || existing.startTime;
      const endTime = data.endTime || existing.endTime;
      
      if (data.startTime && !isValidTimeFormat(data.startTime)) {
        return {
          success: false,
          error: 'Başlangıç zamanı formatı HH:MM şeklinde olmalıdır'
        };
      }
      
      if (data.endTime && !isValidTimeFormat(data.endTime)) {
        return {
          success: false,
          error: 'Bitiş zamanı formatı HH:MM şeklinde olmalıdır'
        };
      }
      
      // Başlangıç zamanı bitiş zamanından önce mi kontrolü
      if (!isValidTimeRange(startTime, endTime)) {
        return {
          success: false,
          error: 'Başlangıç zamanı bitiş zamanından önce olmalıdır'
        };
      }
    }
    
    const workingHour = await prisma.workingHour.update({
      where: { id },
      data: {
        dayOfWeek: data.dayOfWeek !== undefined ? data.dayOfWeek : undefined,
        startTime: data.startTime !== undefined ? data.startTime : undefined,
        endTime: data.endTime !== undefined ? data.endTime : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        staffId: data.staffId !== undefined ? data.staffId : undefined
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    console.log(`[working-hours-db-service] ${id} ID'li çalışma saati güncellendi`);
    
    return {
      success: true,
      data: workingHour
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${id} ID'li çalışma saati güncellenirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Çalışma saati güncellenirken bir hata oluştu'
    };
  }
}

/**
 * Bir çalışma saatini sil
 */
export async function deleteWorkingHourFromDb(id: string): Promise<ServiceResponse<void>> {
  try {
    console.log(`[working-hours-db-service] deleteWorkingHourFromDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Çalışma saati ID bilgisi gerekli'
      };
    }
    
    // Mevcut çalışma saatini kontrol et
    const existing = await prisma.workingHour.findUnique({
      where: { id }
    });
    
    if (!existing) {
      console.log(`[working-hours-db-service] ${id} ID'li çalışma saati bulunamadı`);
      return {
        success: false,
        error: 'Silinecek çalışma saati bulunamadı'
      };
    }
    
    await prisma.workingHour.delete({
      where: { id }
    });
    
    console.log(`[working-hours-db-service] ${id} ID'li çalışma saati silindi`);
    
    return {
      success: true,
      message: 'Çalışma saati başarıyla silindi'
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${id} ID'li çalışma saati silinirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Çalışma saati silinirken bir hata oluştu'
    };
  }
}
