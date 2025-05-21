'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { checkStaffAvailability } from '@/services/appointmentService';

/**
 * Hook props interface
 */
interface UseAppointmentConflictProps {
  showToasts?: boolean;
}

/**
 * Hook for checking appointment conflicts
 */
export const useAppointmentConflict = ({ showToasts = true }: UseAppointmentConflictProps = {}) => {
  // Hooks
  const { toast } = useToast();
  
  /**
   * Check for appointment conflicts with improved detection
   * 
   * @param staffId Staff ID
   * @param startTime Start time
   * @param endTime End time (optional)
   * @param excludeAppointmentId Appointment ID to exclude from conflict check
   * @returns Conflict check result
   */
  const checkConflict = useCallback(async (
    staffId: string, 
    startTime: string, 
    endTime?: string,
    excludeAppointmentId?: string
  ) => {
    try {
      const result = await checkStaffAvailability(
        staffId, 
        startTime, 
        endTime || '', 
        excludeAppointmentId
      );
      
      if (result.hasConflict && showToasts) {
        toast({
          variant: 'destructive',
          title: 'Çakışma Tespit Edildi',
          description: result.message || 'Seçtiğiniz saatte bir çakışma bulunmaktadır.'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Conflict check error:', error);
      
      return {
        hasConflict: false,
        message: 'Çakışma kontrolü yapılırken bir hata oluştu.'
      };
    }
  }, [showToasts, toast]);
  
  return { checkConflict };
};

export default useAppointmentConflict;