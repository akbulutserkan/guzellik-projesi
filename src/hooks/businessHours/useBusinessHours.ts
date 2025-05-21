// hooks/businessHours/useBusinessHours.ts
import { useEffect } from 'react';
import { useBusinessHoursData, UseBusinessHoursDataOptions } from './useBusinessHoursData';
import { useBusinessHoursUtils } from './useBusinessHoursUtils';
import { useBusinessHoursUI } from './useBusinessHoursUI';

/**
 * Ana işletme çalışma saatleri hook'u
 * Tüm alt hook'ları birleştirir
 */
export const useBusinessHours = (options: UseBusinessHoursDataOptions = {}) => {
  const {
    updateInterval = 0 // 0: otomatik güncelleme yok
  } = options;

  // Alt hook'ları kullan
  const {
    businessHours,
    loading,
    error,
    fetchBusinessHours
  } = useBusinessHoursData(options);

  const {
    isWorkingHour,
    getWorkingHoursForDay,
    getEnabledDays
  } = useBusinessHoursUtils(businessHours);

  const {
    showSuccessToast,
    showErrorToast,
    showWarningToast
  } = useBusinessHoursUI();

  // İlk yükleme ve periyodik güncelleme
  useEffect(() => {
    fetchBusinessHours(true);

    // Periyodik güncelleme
    if (updateInterval > 0) {
      const interval = setInterval(() => fetchBusinessHours(false), updateInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBusinessHours, updateInterval]);

  return {
    // Veri ve durum
    businessHours,
    loading,
    error,
    
    // Yardımcı fonksiyonlar
    isWorkingHour,
    getWorkingHoursForDay,
    getEnabledDays,
    refreshHours: fetchBusinessHours,
    
    // UI işlemleri
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};