// hooks/businessHours/useBusinessHoursUtils.ts
import { useCallback } from 'react';
import { BusinessHours } from './types';

/**
 * İşletme çalışma saatleri yardımcı fonksiyonları
 */
export const useBusinessHoursUtils = (businessHours: BusinessHours | null) => {
  /**
   * Belirli bir tarihin çalışma saatleri içinde olup olmadığını kontrol eder
   */
  const isWorkingHour = useCallback((date: Date, staffHours?: BusinessHours) => {
    if (!businessHours) return false;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    // İşletme saati kontrolü
    const businessDay = businessHours[dayName];
    if (!businessDay.enabled) return false;
    if (timeStr < businessDay.start || timeStr > businessDay.end) return false;

    // Personel saati kontrolü (varsa)
    if (staffHours) {
      const staffDay = staffHours[dayName];
      if (!staffDay?.enabled) return false;
      if (timeStr < staffDay.start || timeStr > staffDay.end) return false;
    }

    return true;
  }, [businessHours]);

  /**
   * Belirli bir gün için çalışma saatlerini döndürür
   */
  const getWorkingHoursForDay = useCallback((dayName: string) => {
    if (!businessHours || !businessHours[dayName]) {
      return null;
    }
    return businessHours[dayName];
  }, [businessHours]);

  /**
   * İşletmenin açık olduğu günleri döndürür
   */
  const getEnabledDays = useCallback(() => {
    if (!businessHours) return [];
    
    return Object.entries(businessHours)
      .filter(([_, settings]) => settings.enabled)
      .map(([day]) => day);
  }, [businessHours]);

  return {
    isWorkingHour,
    getWorkingHoursForDay,
    getEnabledDays
  };
};