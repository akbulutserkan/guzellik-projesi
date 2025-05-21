/**
 * Çalışma saatleri doğrulama servisi
 */
import { 
  isValidTimeFormat, 
  checkTimeOverlaps,
  validateWorkingHourData 
} from './helpers';
import { ServiceResponse } from './types';

/**
 * Çalışma saatlerini doğrulama (personel veya genel çalışma saatleri)
 */
export async function validateWorkingHoursFromDb(workingHours: any[]): Promise<ServiceResponse<any[]>> {
  try {
    console.log('[working-hours-db-service] validateWorkingHoursFromDb çağrıldı');
    
    if (!Array.isArray(workingHours)) {
      return {
        success: false,
        error: 'Çalışma saatleri bir dizi olmalıdır'
      };
    }
    
    // Temel doğrulama kontrolleri
    const errors: string[] = [];
    
    for (const hour of workingHours) {
      const validationError = validateWorkingHourData(hour);
      if (validationError) {
        errors.push(validationError);
      }
    }
    
    // Çakışma kontrolü
    const overlapErrors = checkTimeOverlaps(workingHours);
    errors.push(...overlapErrors);
    
    if (errors.length > 0) {
      console.log(`[working-hours-db-service] Çalışma saatleri doğrulama hataları:`, errors);
      return {
        success: false,
        error: errors.join('; '),
        data: errors
      };
    }
    
    console.log('[working-hours-db-service] Çalışma saatleri doğrulandı, sorun yok');
    
    return {
      success: true,
      data: workingHours
    };
  } catch (error) {
    console.error('[working-hours-db-service] Çalışma saatleri doğrulanırken hata oluştu:', error);
    return {
      success: false,
      error: 'Çalışma saatleri doğrulanırken bir hata oluştu'
    };
  }
}

/**
 * Tek bir çalışma saati için doğrulama
 */
export async function validateSingleWorkingHourFromDb(workingHour: any): Promise<ServiceResponse<any>> {
  try {
    console.log('[working-hours-db-service] validateSingleWorkingHourFromDb çağrıldı');
    
    const validationError = validateWorkingHourData(workingHour);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }
    
    return {
      success: true,
      data: workingHour
    };
  } catch (error) {
    console.error('[working-hours-db-service] Çalışma saati doğrulanırken hata oluştu:', error);
    return {
      success: false,
      error: 'Çalışma saati doğrulanırken bir hata oluştu'
    };
  }
}
