'use client';

import { useState, useCallback, useRef } from 'react';
import { Appointment } from '@/utils/appointment/formatters';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook for managing appointment UI state
 */
export const useAppointmentUI = () => {
  // UI state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentsForModal, setAppointmentsForModal] = useState<Appointment[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  
  // Date and time state for appointment form
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentStartTime, setAppointmentStartTime] = useState<string>('');
  const [appointmentEndTime, setAppointmentEndTime] = useState<string>('');
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [showPaymentSection, setShowPaymentSection] = useState<boolean>(false);
  
  // Refs
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Toast bildirimleri için fonksiyonlar
  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: 'Başarılı',
      description: message
    });
  }, []);

  const showErrorToast = useCallback((message: string) => {
    toast({
      variant: 'destructive',
      title: 'Hata',
      description: message
    });
  }, []);

  const showWarningToast = useCallback((message: string) => {
    toast({
      variant: 'warning',
      title: 'Uyarı',
      description: message
    });
  }, []);
  
  // Formatlama işlemleri için fonksiyonlar
  const formatAppointment = useCallback((appointmentData: any): Appointment => {
    return {
      ...appointmentData,
      id: appointmentData.id,
      start: appointmentData.startTime || appointmentData.start,
      end: appointmentData.endTime || appointmentData.end,
      customer: {
        ...appointmentData.customer,
        name: appointmentData.customer?.name || ''
      },
      staff: {
        ...appointmentData.staff,
        name: appointmentData.staff?.name || ''
      },
      service: {
        ...appointmentData.service,
        name: appointmentData.service?.name || '',
        price: appointmentData.service?.price || 0
      },
      customerId: appointmentData.customer?.id || appointmentData.customerId,
      staffId: appointmentData.staff?.id || appointmentData.staffId,
      serviceId: appointmentData.service?.id || appointmentData.serviceId,
      status: appointmentData.status
    };
  }, []);
  
  /**
   * Clear all form fields
   */
  const clearFormFields = useCallback(() => {
    setAppointmentDate('');
    setAppointmentStartTime('');
    setAppointmentEndTime('');
    setPaymentAmount('');
    setCustomPrice('');
  }, []);
  
  /**
   * Handle opening the new appointment modal
   */
  const openNewModal = useCallback(() => {
    setIsNewModalOpen(true);
    clearFormFields();
  }, [clearFormFields]);
  
  /**
   * Handle closing the new appointment modal
   */
  const closeNewModal = useCallback(() => {
    setIsNewModalOpen(false);
    clearFormFields();
  }, [clearFormFields]);
  
  /**
   * Handle opening the edit appointment modal
   */
  const openEditModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Set date and time info
    if (appointment.startTime) {
      const startDate = new Date(appointment.startTime);
      setAppointmentDate(startDate.toISOString().split('T')[0]);
      setAppointmentStartTime(startDate.toISOString().split('T')[1].substring(0, 5));
      
      if (appointment.endTime) {
        const endDate = new Date(appointment.endTime);
        setAppointmentEndTime(endDate.toISOString().split('T')[1].substring(0, 5));
      }
    }
    
    setIsEditModalOpen(true);
  }, []);
  
  /**
   * Handle closing the edit appointment modal
   */
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedAppointment(null);
    clearFormFields();
  }, [clearFormFields]);
  
  /**
   * Handle opening appointment detail with improved data formatting
   * 
   * @param appointmentsForDate Appointments for a specific date
   */
  const handleOpenAppointmentDetail = useCallback((appointmentsForDate: Appointment[]) => {
    try {
      // Use first appointment as the main one
      const mainAppointment = appointmentsForDate[0];
      
      if (!mainAppointment || !mainAppointment.id) return;
      
      // Format appointments for the modal using our formatter
      const formattedAppointments = appointmentsForDate.map(appointment => 
        formatAppointment(appointment)
      );
      
      setAppointmentsForModal(formattedAppointments);
      
      // Set the first appointment as the selected one
      setSelectedAppointment(formattedAppointments[0]);
      
      // Open the edit modal
      setIsEditModalOpen(true);
      
      // Set date and time info
      const appointment = formattedAppointments[0];
      if (appointment.startTime) {
        const startDate = new Date(appointment.startTime);
        setAppointmentDate(startDate.toISOString().split('T')[0]);
        setAppointmentStartTime(startDate.toISOString().split('T')[1].substring(0, 5));
        
        if (appointment.endTime) {
          const endDate = new Date(appointment.endTime);
          setAppointmentEndTime(endDate.toISOString().split('T')[1].substring(0, 5));
        }
      }
    } catch (error) {
      console.error('Error opening appointment detail:', error);
      showErrorToast('Randevu detayları açılırken bir hata oluştu');
    }
  }, [formatAppointment, showErrorToast]);
  
  /**
   * Find latest appointment end time for a customer
   * 
   * @returns Latest end time as ISO string
   */
  const findLatestAppointmentEndTime = useCallback(() => {
    if (!selectedAppointment || !appointmentsForModal.length) return new Date().toISOString();
    
    // Sort by end time, descending
    const sortedAppointments = [...appointmentsForModal].sort((a, b) => {
      const endTimeA = a.endTime || a.end || '';
      const endTimeB = b.endTime || b.end || '';
      return endTimeB.localeCompare(endTimeA);
    });
    
    // Return the latest end time or current time if none
    return sortedAppointments[0].endTime || sortedAppointments[0].end || new Date().toISOString();
  }, [selectedAppointment, appointmentsForModal]);
  
  return {
    // State
    selectedAppointment,
    appointmentsForModal,
    isNewModalOpen,
    isEditModalOpen,
    appointmentDate,
    appointmentStartTime,
    appointmentEndTime,
    paymentAmount,
    customPrice,
    showPaymentSection,
    modalContentRef,
    
    // Setters
    setSelectedAppointment,
    setAppointmentsForModal,
    setIsNewModalOpen,
    setIsEditModalOpen,
    setAppointmentDate,
    setAppointmentStartTime,
    setAppointmentEndTime,
    setPaymentAmount,
    setCustomPrice,
    setShowPaymentSection,
    
    // Actions
    openNewModal,
    closeNewModal,
    openEditModal,
    closeEditModal,
    handleOpenAppointmentDetail,
    findLatestAppointmentEndTime,
    clearFormFields,
    
    // UI Fonksiyonları
    showSuccessToast,
    showErrorToast, 
    showWarningToast,
    formatAppointment
  };
};

export default useAppointmentUI;