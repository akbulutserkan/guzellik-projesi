'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  AppointmentStatus, 
  AttendanceStatus,
  mapAttendanceToStatus,
  mapStatusToAttendance
} from '@/utils/appointment/formatters';
import { updateAppointmentStatus } from '@/services/appointmentService';
import { useAppointmentPermissions } from './useAppointmentPermissions';

/**
 * Hook props interface
 */
interface UseAppointmentStatusProps {
  showToasts?: boolean;
}

/**
 * Hook for managing appointment status changes
 */
export const useAppointmentStatus = ({ showToasts = true }: UseAppointmentStatusProps = {}) => {
  // State
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('unspecified');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Hooks
  const { toast } = useToast();
  const { canChangeAppointmentStatus } = useAppointmentPermissions();
  
  /**
   * Handle updating appointment status with one-click actions
   * 
   * @param appointmentId Appointment ID
   * @param newStatus New status
   * @param onSuccess Success callback
   * @returns Success indicator
   */
  const handleStatusChange = useCallback(async (
    appointmentId: string,
    newStatus: AttendanceStatus | AppointmentStatus,
    onSuccess?: (status: AppointmentStatus) => void
  ) => {
    if (!canChangeAppointmentStatus || !appointmentId) return false;
    
    try {
      setIsUpdating(true);
      
      // Convert attendance status to appointment status if needed
      const status = typeof newStatus === 'string' && ['showed', 'noshow', 'unspecified'].includes(newStatus)
        ? mapAttendanceToStatus(newStatus as AttendanceStatus)
        : newStatus as AppointmentStatus;
      
      // Update attendance status in UI immediately (optimistic)
      if (typeof newStatus === 'string' && ['showed', 'noshow', 'unspecified'].includes(newStatus)) {
        setAttendanceStatus(newStatus as AttendanceStatus);
      } else {
        setAttendanceStatus(mapStatusToAttendance(status as AppointmentStatus));
      }
      
      // Actually update appointment status in backend
      await updateAppointmentStatus(appointmentId, status as AppointmentStatus);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(status as AppointmentStatus);
      }
      
      return true;
    } catch (error) {
      console.error('Status change error:', error);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Randevu durumu güncellenirken bir hata oluştu'
        });
      }
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [canChangeAppointmentStatus, showToasts, toast]);
  
  /**
   * Set attendance status directly (without API call)
   */
  const setAppointmentAttendanceStatus = useCallback((status: AttendanceStatus) => {
    setAttendanceStatus(status);
  }, []);
  
  /**
   * Get status label for display
   */
  const getStatusLabel = useCallback((status: AppointmentStatus | AttendanceStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Bekliyor';
      case 'CONFIRMED':
        return 'Onaylandı';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      case 'NO_SHOW':
        return 'Gelmedi';
      case 'showed':
        return 'Geldi';
      case 'noshow':
        return 'Gelmedi';
      case 'unspecified':
        return 'Belirtilmedi';
      default:
        return 'Bilinmiyor';
    }
  }, []);
  
  /**
   * Get status color for display
   */
  const getStatusColor = useCallback((status: AppointmentStatus | AttendanceStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      case 'showed':
        return 'bg-green-100 text-green-800';
      case 'noshow':
        return 'bg-gray-100 text-gray-800';
      case 'unspecified':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }, []);
  
  return {
    // State
    attendanceStatus,
    isUpdating,
    
    // Actions
    handleStatusChange,
    setAttendanceStatus: setAppointmentAttendanceStatus,
    
    // Utilities
    getStatusLabel,
    getStatusColor,
    mapAttendanceToStatus,
    mapStatusToAttendance
  };
};

export default useAppointmentStatus;