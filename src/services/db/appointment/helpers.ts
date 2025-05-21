/**
 * Appointment service helper functions
 */
import { WorkingHoursType } from './types';

/**
 * Çalışma saatleri verilerini standart nesne formatına dönüştürür
 * @param workingHours - Çalışma saatleri verisi
 * @returns Standart formatta çalışma saatleri nesnesi
 */
export function normalizeWorkingHours(workingHours: any): WorkingHoursType | null {
  if (!workingHours) return null;
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const normalizedHours: WorkingHoursType = {};
  
  // Eğer workingHours bir dizi ise nesneye dönüştür
  if (Array.isArray(workingHours)) {
    workingHours.forEach(day => {
      const dayIndex = day.day !== undefined ? day.day : day.dayOfWeek;
      const dayName = dayNames[dayIndex];
      
      normalizedHours[dayName] = {
        enabled: day.isWorking !== undefined ? day.isWorking : true,
        start: day.startTime,
        end: day.endTime
      };
    });
    return normalizedHours;
  }
  
  // Zaten nesne formatındaysa olduğu gibi döndür
  return workingHours;
}
