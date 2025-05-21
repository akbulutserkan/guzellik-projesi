'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { groupAppointmentsByDate } from '@/utils/appointment/formatters';
import { useToast } from '@/components/ui/use-toast';
import { 
  calculateAppointmentStats,
  AppointmentStatus
} from '@/utils/appointment/formatters';

// Import Hooks
import { 
  useAppointmentData,
  useAppointmentUI,
  useAppointmentStatus,
  useAppointmentNotes,
  useAppointmentConflict
} from './index';

/**
 * Hook props interface
 */
interface UseAppointmentManagementProps {
  initialAppointments?: Array<any>;
  autoFetch?: boolean;
  showToasts?: boolean;
  defaultFilter?: string;
  cacheEnabled?: boolean;
  cacheExpirationTime?: number;
}

/**
 * Appointment Management Hook
 * Composes all appointment related hooks into a single API
 * 
 * @param options Hook options
 * @returns Hook state and methods
 */
export const useAppointmentManagement = ({
  initialAppointments = [],
  autoFetch = true,
  showToasts = true,
  defaultFilter = 'ALL',
  cacheEnabled = true,
  cacheExpirationTime = 5 * 60 * 1000 // 5 minutes by default
}: UseAppointmentManagementProps = {}) => {
  // Initialize hooks
  const { toast } = useToast();
  
  // Data hook
  const appointmentData = useAppointmentData({
    initialAppointments,
    autoFetch,
    showToasts,
    defaultFilter
  });
  
  // UI hook
  const appointmentUI = useAppointmentUI();
  
  // Status hook
  const appointmentStatus = useAppointmentStatus({
    showToasts
  });
  
  // Notes hook
  const appointmentNotes = useAppointmentNotes({
    initialNotes: '',
    showToasts,
    onSave: async (appointmentId, notes) => {
      try {
        const result = await appointmentData.handleUpdateAppointment(appointmentId, { notes });
        return !!result;
      } catch (error) {
        console.error('Save notes error:', error);
        return false;
      }
    }
  });
  
  // Conflict hook
  const { checkConflict } = useAppointmentConflict({ showToasts });
  
  // Set selected appointment and related data
  useEffect(() => {
    if (appointmentUI.selectedAppointment) {
      // Update status
      const status = appointmentUI.selectedAppointment.status as AppointmentStatus;
      appointmentStatus.setAttendanceStatus(appointmentStatus.mapStatusToAttendance(status));
      
      // Update notes
      const notes = appointmentUI.selectedAppointment.notes || '';
      appointmentNotes.updateAppointmentNotes(notes);
    }
  }, [appointmentUI.selectedAppointment, appointmentStatus, appointmentNotes]);
  
  // Handle status change
  const handleStatusChange = useCallback(async (newStatus) => {
    if (!appointmentUI.selectedAppointment) return false;
    
    return appointmentStatus.handleStatusChange(
      appointmentUI.selectedAppointment.id,
      newStatus,
      (status) => {
        // Update selected appointment status
        if (appointmentUI.selectedAppointment) {
          appointmentUI.setSelectedAppointment({
            ...appointmentUI.selectedAppointment,
            status
          });
        }
        
        // Refresh data after status change
        setTimeout(() => appointmentData.triggerRefresh(), 500);
      }
    );
  }, [appointmentUI.selectedAppointment, appointmentStatus, appointmentData]);
  
  // Fetch appointment by ID with extended details
  const fetchAppointmentById = useCallback(async (id: string, includeServices: boolean = true) => {
    const appointment = await appointmentData.fetchAppointmentById(id, includeServices);
    
    if (appointment) {
      appointmentUI.setSelectedAppointment(appointment);
      
      // Set attendance status based on appointment status
      appointmentStatus.setAttendanceStatus(appointmentStatus.mapStatusToAttendance(appointment.status as AppointmentStatus));
      
      // Set notes if available
      if (appointment.notes) {
        appointmentNotes.updateAppointmentNotes(appointment.notes);
      } else {
        appointmentNotes.updateAppointmentNotes('');
      }
      
      // Update date and time info for detail view
      if (appointment.startTime) {
        const startDate = new Date(appointment.startTime);
        appointmentUI.setAppointmentDate(startDate.toISOString().split('T')[0]);
        appointmentUI.setAppointmentStartTime(startDate.toISOString().split('T')[1].substring(0, 5));
        
        if (appointment.endTime) {
          const endDate = new Date(appointment.endTime);
          appointmentUI.setAppointmentEndTime(endDate.toISOString().split('T')[1].substring(0, 5));
        }
      }
      
      // Özel alanları için tip tanımı
      interface AppointmentWithExtras {
        _allAppointments?: any[];
        [key: string]: any;
      }
      
      // Eğer birden fazla randevu varsa (_allAppointments), onları ayarla
      const appointmentWithExtras = appointment as AppointmentWithExtras;
      if (appointmentWithExtras._allAppointments && Array.isArray(appointmentWithExtras._allAppointments)) {
        appointmentUI.setAppointmentsForModal(appointmentWithExtras._allAppointments);
      }
    }
    
    return appointment;
  }, [appointmentData, appointmentUI, appointmentStatus, appointmentNotes]);
  
  // Calculate appointment statistics
  const stats = useMemo(() => {
    return calculateAppointmentStats(appointmentData.appointments);
  }, [appointmentData.appointments]);
  
  // Calculate filtered and grouped appointments
  const filteredGroupedAppointments = useMemo(() => {
    return groupAppointmentsByDate(appointmentData.filteredAppointments);
  }, [appointmentData.filteredAppointments]);
  
  // Force refresh
  const forceRefresh = useCallback(() => {
    appointmentData.triggerRefresh();
  }, [appointmentData]);
  
  return {
    // Data state and functions
    ...appointmentData,
    
    // UI state and functions
    ...appointmentUI,
    
    // Status state and functions
    ...appointmentStatus,
    
    // Notes state and functions
    ...appointmentNotes,
    
    // Conflict functions
    checkConflict,
    
    // Stats
    stats,
    
    // Filtered and grouped appointments
    filteredGroupedAppointments,
    
    // Override functions with combined logic
    handleStatusChange,
    fetchAppointmentById,
    forceRefresh
  };
};

export default useAppointmentManagement;