'use client';

import { useCallback } from 'react';
import { getBusinessHoursDetails } from '@/services/workingHoursService';
import { useWorkingHoursData } from './useWorkingHoursData';

/**
 * İşletme çalışma saatleri yönetiminden sorumlu hook
 */
export const useBusinessHoursData = () => {
  const {
    businessHours,
    loading,
    error,
    setBusinessHours,
    setLoading,
    setError
  } = useWorkingHoursData();

  /**
   * İşletme çalışma saatlerini getirir
   */
  const fetchBusinessHours = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getBusinessHoursDetails();
      
      if (result.success) {
        setBusinessHours(result.data);
      } else {
        setError(result.error || 'İşletme çalışma saatleri alınırken bir hata oluştu');
      }
    } catch (err) {
      console.error('İşletme çalışma saatleri alınırken hata:', err);
      setError('İşletme çalışma saatleri alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setBusinessHours]);

  return {
    businessHours,
    loading,
    error,
    fetchBusinessHours
  };
};