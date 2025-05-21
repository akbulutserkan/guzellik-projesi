'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for checking appointment conflicts
 */
export const useConflictCheck = () => {
  const { toast } = useToast();
  const [showShiftEndConflict, setShowShiftEndConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  
  /**
   * Check for conflicts between appointment time and staff availability
   */
  const checkForServiceConflict = useCallback(async (staffId: string, startTime: string) => {
    try {
      // Import and use the service instead of direct API call
      const { checkAppointmentConflict } = await import('@/services/appointmentService');
      const conflictResult = await checkAppointmentConflict(staffId, startTime, undefined, true);
      
      return conflictResult;
    } catch (err) {
      console.error('Error checking conflict:', err);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Çakışma kontrolü yapılırken bir hata oluştu.'
      });
      return null;
    }
  }, [toast]);
  
  /**
   * Check for conflicts when adding a new service
   */
  const checkNewServiceConflict = useCallback(async (staffId: string, latestEndTime: string) => {
    try {
      // First check for conflicts
      const conflict = await checkForServiceConflict(staffId, latestEndTime);
      
      if (conflict?.hasConflict) {
        // Show conflict warning modal
        setConflictMessage(conflict.message || 'Seçtiğiniz saatte bir çakışma bulunmaktadır.');
        setShowShiftEndConflict(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('New service conflict check error:', error);
      return null;
    }
  }, [checkForServiceConflict]);
  
  return {
    showShiftEndConflict,
    setShowShiftEndConflict,
    conflictMessage,
    setConflictMessage,
    checkForServiceConflict,
    checkNewServiceConflict
  };
};

export default useConflictCheck;
