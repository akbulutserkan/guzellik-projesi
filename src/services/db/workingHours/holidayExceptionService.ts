/**
 * Tatil ve özel günler için istisna işlemleri
 */
import { prisma } from '@/lib/prisma';
import { 
  HolidayExceptionInput, 
  HolidayExceptionUpdateInput,
  ServiceResponse 
} from './types';
import { HolidayException } from '@prisma/client';

/**
 * Tarih bazlı çalışma saati istisnaları getir (tatiller vb.)
 */
export async function getWorkingHourExceptionsFromDb(date?: string): Promise<ServiceResponse<HolidayException[]>> {
  try {
    console.log(`[working-hours-db-service] getWorkingHourExceptionsFromDb çağrıldı, date: ${date || 'tümü'}`);
    
    let whereClause = {};
    
    if (date) {
      const requestedDate = new Date(date);
      requestedDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(requestedDate);
      nextDay.setDate(requestedDate.getDate() + 1);
      
      whereClause = {
        date: {
          gte: requestedDate,
          lt: nextDay
        }
      };
    }
    
    const exceptions = await prisma.holidayException.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });
    
    console.log(`[working-hours-db-service] ${exceptions.length} çalışma saati istisnası kaydı bulundu`);
    
    return {
      success: true,
      data: exceptions
    };
  } catch (error) {
    console.error('[working-hours-db-service] Çalışma saati istisnaları getirilirken hata oluştu:', error);
    return {
      success: false,
      error: 'Çalışma saati istisnaları getirilirken bir hata oluştu'
    };
  }
}

/**
 * ID'ye göre çalışma saati istisnası getir
 */
export async function getWorkingHourExceptionByIdFromDb(id: string): Promise<ServiceResponse<HolidayException>> {
  try {
    console.log(`[working-hours-db-service] getWorkingHourExceptionByIdFromDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'İstisna ID bilgisi gerekli'
      };
    }
    
    const exception = await prisma.holidayException.findUnique({
      where: { id }
    });
    
    if (!exception) {
      console.log(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası bulunamadı`);
      return {
        success: false,
        error: 'Çalışma saati istisnası bulunamadı'
      };
    }
    
    return {
      success: true,
      data: exception
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası getirilirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Çalışma saati istisnası getirilirken bir hata oluştu'
    };
  }
}

/**
 * Çalışma saati istisnası oluştur (tatil vb.)
 */
export async function createWorkingHourExceptionInDb(data: HolidayExceptionInput): Promise<ServiceResponse<HolidayException>> {
  try {
    console.log(`[working-hours-db-service] createWorkingHourExceptionInDb çağrıldı, data:`, data);
    
    // Zorunlu alan kontrolü
    if (!data.date) {
      return {
        success: false,
        error: 'Tarih bilgisi gerekli'
      };
    }
    
    // Tarih formatını düzelt
    const exceptionDate = new Date(data.date);
    
    // Aynı gün için başka bir kayıt var mı kontrolü
    const existingDate = new Date(exceptionDate);
    existingDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(existingDate);
    nextDay.setDate(existingDate.getDate() + 1);
    
    const existingException = await prisma.holidayException.findFirst({
      where: {
        date: {
          gte: existingDate,
          lt: nextDay
        }
      }
    });
    
    if (existingException) {
      return {
        success: false,
        error: `${exceptionDate.toISOString().split('T')[0]} tarihinde zaten bir istisna kaydı mevcut`
      };
    }
    
    const exception = await prisma.holidayException.create({
      data: {
        date: exceptionDate,
        description: data.description || '',
        isWorkingDay: data.isWorkingDay !== undefined ? data.isWorkingDay : false
      }
    });
    
    console.log(`[working-hours-db-service] Yeni çalışma saati istisnası oluşturuldu, id: ${exception.id}`);
    
    return {
      success: true,
      data: exception
    };
  } catch (error) {
    console.error('[working-hours-db-service] Çalışma saati istisnası oluşturulurken hata oluştu:', error);
    return {
      success: false,
      error: 'Çalışma saati istisnası oluşturulurken bir hata oluştu'
    };
  }
}

/**
 * Çalışma saati istisnasını güncelle
 */
export async function updateWorkingHourExceptionInDb(
  id: string, 
  data: HolidayExceptionUpdateInput
): Promise<ServiceResponse<HolidayException>> {
  try {
    console.log(`[working-hours-db-service] updateWorkingHourExceptionInDb çağrıldı, id: ${id}, data:`, data);
    
    if (!id) {
      return {
        success: false,
        error: 'İstisna ID bilgisi gerekli'
      };
    }
    
    // Mevcut istisnayı kontrol et
    const existing = await prisma.holidayException.findUnique({
      where: { id }
    });
    
    if (!existing) {
      console.log(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası bulunamadı`);
      return {
        success: false,
        error: 'Güncellenecek istisna bulunamadı'
      };
    }
    
    // Tarih formatını düzelt
    let exceptionDate = undefined;
    
    if (data.date) {
      exceptionDate = new Date(data.date);
      
      // Aynı gün için başka bir kayıt var mı kontrolü (kendisi hariç)
      const testDate = new Date(exceptionDate);
      testDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(testDate);
      nextDay.setDate(testDate.getDate() + 1);
      
      const existingException = await prisma.holidayException.findFirst({
        where: {
          id: { not: id },
          date: {
            gte: testDate,
            lt: nextDay
          }
        }
      });
      
      if (existingException) {
        return {
          success: false,
          error: `${testDate.toISOString().split('T')[0]} tarihinde zaten bir istisna kaydı mevcut`
        };
      }
    }
    
    const exception = await prisma.holidayException.update({
      where: { id },
      data: {
        date: exceptionDate,
        description: data.description !== undefined ? data.description : undefined,
        isWorkingDay: data.isWorkingDay !== undefined ? data.isWorkingDay : undefined
      }
    });
    
    console.log(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası güncellendi`);
    
    return {
      success: true,
      data: exception
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası güncellenirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Çalışma saati istisnası güncellenirken bir hata oluştu'
    };
  }
}

/**
 * Çalışma saati istisnasını sil
 */
export async function deleteWorkingHourExceptionFromDb(id: string): Promise<ServiceResponse<void>> {
  try {
    console.log(`[working-hours-db-service] deleteWorkingHourExceptionFromDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'İstisna ID bilgisi gerekli'
      };
    }
    
    // Mevcut istisnayı kontrol et
    const existing = await prisma.holidayException.findUnique({
      where: { id }
    });
    
    if (!existing) {
      console.log(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası bulunamadı`);
      return {
        success: false,
        error: 'Silinecek istisna bulunamadı'
      };
    }
    
    await prisma.holidayException.delete({
      where: { id }
    });
    
    console.log(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası silindi`);
    
    return {
      success: true,
      message: 'Çalışma saati istisnası başarıyla silindi'
    };
  } catch (error) {
    console.error(`[working-hours-db-service] ${id} ID'li çalışma saati istisnası silinirken hata oluştu:`, error);
    return {
      success: false,
      error: 'Çalışma saati istisnası silinirken bir hata oluştu'
    };
  }
}
