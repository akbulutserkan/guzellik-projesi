'use client';

import { useEffect } from 'react';
import { useWorkingHoursData } from './useWorkingHoursData';
import { useWorkingHoursExceptions } from './useWorkingHoursExceptions';

export interface UseWorkingHoursOptions {
  autoLoad?: boolean;
  updateInterval?: number;
  staffId?: string;
}

/**
 * Ana çalışma saatleri hook'u
 * Tüm alt hook'ları birleştirir
 */
export const useWorkingHours = (options: UseWorkingHoursOptions = {}) => {
  const {
    autoLoad = true,
    updateInterval = 0, // 0: otomatik güncelleme yok
    staffId = ''
  } = options;

  // Alt hook'ları kullan
  const {
    workingHours,
    businessHours,
    currentWorkingHour,
    loading: dataLoading,
    error: dataError,
    fetchWorkingHours,
    fetchWorkingHoursByStaff,
    fetchWorkingHourById,
    createWorkingHour,
    updateWorkingHour,
    deleteWorkingHour,
    fetchBusinessHours
  } = useWorkingHoursData();

  const {
    exceptions,
    loading: exceptionsLoading,
    error: exceptionsError,
    fetchExceptions,
    createException,
    updateException,
    deleteException
  } = useWorkingHoursExceptions();

  // İlk yükleme
  useEffect(() => {
    if (autoLoad) {
      if (staffId) {
        fetchWorkingHoursByStaff(staffId);
      } else {
        fetchWorkingHours();
      }
      fetchExceptions();
    }
  }, [autoLoad, staffId, fetchWorkingHours, fetchWorkingHoursByStaff, fetchExceptions]);

  // Periyodik güncelleme
  useEffect(() => {
    if (updateInterval > 0) {
      const interval = setInterval(() => {
        if (staffId) {
          fetchWorkingHoursByStaff(staffId);
        } else {
          fetchWorkingHours();
        }
        fetchExceptions();
      }, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [updateInterval, staffId, fetchWorkingHours, fetchWorkingHoursByStaff, fetchExceptions]);

  // Loading ve Error durumlarını birleştir
  const loading = dataLoading || exceptionsLoading;
  const error = dataError || exceptionsError;

  return {
    // Durum (state)
    workingHours,
    businessHours,
    exceptions,
    currentWorkingHour,
    loading,
    error,
    
    // Çalışma saatleri işlemleri
    fetchWorkingHours,
    fetchWorkingHoursByStaff,
    fetchWorkingHourById,
    createWorkingHour,
    updateWorkingHour,
    deleteWorkingHour,
    
    // İşletme çalışma saatleri işlemleri
    fetchBusinessHours,
    
    // İstisnalar işlemleri
    fetchExceptions,
    createException,
    updateException,
    deleteException
  };
};
