'use client';

import { useState, useCallback } from 'react';
import { Appointment } from '@/types/appointment';
import { AppointmentStatus, AttendanceStatus } from '@/services/api/types/calendar';
import { updateAppointmentStatus, updateAppointment } from '@/services/appointmentService';
import { useCalendarUI } from './useCalendarUI';

export interface UseCalendarStatusResult {
  updating: boolean;
  updateEventStatus: (eventId: string, status: AppointmentStatus) => Promise<void>;
  updateEventAttendance: (eventId: string, attendance: AttendanceStatus) => Promise<void>;
}

/**
 * Takvim randevu durumunu yöneten hook
 */
export const useCalendarStatus = (
  canUpdate: boolean,
  events: Appointment[],
  setEvents: (events: Appointment[]) => void,
  selectedEvent: Appointment | null,
  setSelectedEvent: (event: Appointment | null) => void
): UseCalendarStatusResult => {
  // UI hook'unu kullan
  const { showSuccessToast, showErrorToast } = useCalendarUI();
  
  const [updating, setUpdating] = useState(false);
  
  // Randevu durum güncellemesi
  const updateEventStatus = useCallback(async (eventId: string, status: AppointmentStatus) => {
    if (!canUpdate) {
      showErrorToast('Randevu durumu güncelleme yetkiniz bulunmuyor.');
      return;
    }
    
    try {
      setUpdating(true);
      const result = await updateAppointmentStatus(eventId, status);
      
      if (!result.success) {
        throw new Error(result.error || 'Randevu durumu güncellenirken bir hata oluştu');
      }
      
      // State güncelleme
      if (result.appointment) {
        const updatedEvents = events.map(evt => evt.id === eventId 
          ? { ...evt, status } 
          : evt
        );
        setEvents(updatedEvents);
        
        // Eğer seçili event ise onu da güncelle
        if (selectedEvent?.id === eventId && selectedEvent) {
          const updatedEvent = { ...selectedEvent, status };
          setSelectedEvent(updatedEvent);
        }
      }
      
      showSuccessToast('Randevu durumu başarıyla güncellendi');
    } catch (err) {
      console.error('Randevu durumu güncellenirken hata oluştu:', err);
      
      showErrorToast(err instanceof Error ? err.message : 'Randevu durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  }, [canUpdate, showSuccessToast, showErrorToast, selectedEvent, setEvents, setSelectedEvent, events]);
  
  // Randevu katılım durumu güncelleme
  const updateEventAttendance = useCallback(async (eventId: string, attendance: AttendanceStatus) => {
    if (!canUpdate) {
      showErrorToast('Randevu katılım durumu güncelleme yetkiniz bulunmuyor.');
      return;
    }
    
    try {
      setUpdating(true);
      const result = await updateAppointment(eventId, { attendance });
      
      if (!result.success) {
        throw new Error(result.error || 'Randevu katılım durumu güncellenirken bir hata oluştu');
      }
      
      // State güncelleme
      if (result.appointment) {
        const updatedEvents = events.map(evt => evt.id === eventId 
          ? { ...evt, attendance } 
          : evt
        );
        setEvents(updatedEvents);
        
        // Eğer seçili event ise onu da güncelle
        if (selectedEvent?.id === eventId && selectedEvent) {
          const updatedEvent = { ...selectedEvent, attendance };
          setSelectedEvent(updatedEvent);
        }
      }
      
      showSuccessToast('Randevu katılım durumu başarıyla güncellendi');
    } catch (err) {
      console.error('Randevu katılım durumu güncellenirken hata oluştu:', err);
      
      showErrorToast(err instanceof Error ? err.message : 'Randevu katılım durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  }, [canUpdate, showSuccessToast, showErrorToast, selectedEvent, setEvents, setSelectedEvent, events]);

  return {
    updating,
    updateEventStatus,
    updateEventAttendance
  };
};
