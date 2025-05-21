'use client';

import { useCallback } from 'react';
import { validateWorkingHours } from '@/services/staffService';

export function useStaffWorkingHours() {
  // Çalışma saatlerini doğrula
  const validateStaffWorkingHours = useCallback(async (workingHours: any[]) => {
    return await validateWorkingHours(workingHours);
  }, []);

  return {
    validateStaffWorkingHours
  };
}

export default useStaffWorkingHours;