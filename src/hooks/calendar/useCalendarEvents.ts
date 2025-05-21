'use client';

import { useCallback } from 'react';
import { Appointment, UpdateEventArgs } from '@/types/appointment';
import { 
  checkStaffAvailability, 
  updateAppointmentDrag, 
  getCustomerAppointments,
  getAppointmentById
} from '@/services/appointmentService';
import moment from 'moment';
import { useCalendarUI } from './useCalendarUI';

export interface UseCalendarEventsResult {
  updateEventAfterDrag: (args: UpdateEventArgs) => Promise<void>;
  getEventDetails: (eventId: string) => Promise<Appointment>;
  getCustomerEvents: (customerId: string, date: Date) => Promise<Appointment[]>;
  checkAvailability: (staffId: string, start: Date, end: Date, excludeEventId?: string) => Promise<boolean>;
}

/**
 * Takvim etkinliklerini yöneten hook
 */
export const useCalendarEvents = (
  canUpdate: boolean,
  events: Appointment[],
  setEvents: (events: Appointment[]) => void,
  refreshCalendar: () => Promise<void>
): UseCalendarEventsResult => {
  // UI hook'unu kullan
  const {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    formatAppointment
  } = useCalendarUI();
  
  // Randevu taşıma/yeniden boyutlandırma
  const updateEventAfterDrag = useCallback(
    async ({ event, start, end, resourceId }: UpdateEventArgs) => {
      // Yetki kontrolü
      if (!canUpdate) {
        showErrorToast('Randevu güncelleme yetkiniz bulunmuyor.');
        return;
      }
      
      try {
        // Tarih formatını düzenle
        const updateData = {
          id: event.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          staffId: resourceId?.toString()
        };
        
        // Önce personel müsaitliğini kontrol et
        if (resourceId) {
          const availabilityResult = await checkStaffAvailability(
            resourceId.toString(),
            start.toISOString(),
            end.toISOString(),
            event.id
          );
          
          if (!availabilityResult.success) {
            throw new Error(availabilityResult.error || 'Personel müsaitliği kontrol edilirken bir hata oluştu');
          }
          
          const availability = availabilityResult.data;
          
          if (!availability.isAvailable) {
            if (availability.workingHoursIssue) {
              throw new Error(availability.workingHoursIssue);
            }
            
            if (availability.conflictingAppointments?.length) {
              throw new Error('Seçilen zaman diliminde çakışan randevular bulunuyor');
            }
            
            throw new Error('Personel seçilen zaman diliminde müsait değil');
          }
        }
        
        // Randevu güncelleme işlemini gerçekleştir
        const result = await updateAppointmentDrag(updateData);
        
        if (!result.success) {
          throw new Error(result.error || 'Randevu güncellenirken bir hata oluştu');
        }
        
        // Başarılı güncellemeden sonra events'i güncelle
        const updatedEvents = events.map(evt => evt.id === event.id 
          ? { 
              ...evt, 
              start: new Date(start), 
              end: new Date(end), 
              resourceId: resourceId?.toString() || evt.resourceId, 
              staffId: resourceId?.toString() || evt.staffId 
            } 
          : evt
        );
        setEvents(updatedEvents);
        
        showSuccessToast('Randevu başarıyla güncellendi');
      } catch (err) {
        console.error('Randevu güncellenirken hata oluştu:', err);
        
        showErrorToast(err instanceof Error ? err.message : 'Randevu güncellenirken bir hata oluştu');
        
        // Hata durumunda, tüm takvimi yenile
        await refreshCalendar();
      }
    },
    [canUpdate, showSuccessToast, showErrorToast, refreshCalendar, setEvents, events]
  );
  
  // Randevu detaylarını getir
  const getEventDetails = useCallback(async (eventId: string): Promise<Appointment> => {
    try {
      const result = await getAppointmentById(eventId);
      
      if (!result.success) {
        throw new Error(result.error || 'Randevu detayları alınırken bir hata oluştu');
      }
      
      // Veriyi takvim formatına dönüştür - UI hook'unu kullan
      const formattedAppointment = formatAppointment(result.data);
      
      return formattedAppointment;
    } catch (err) {
      console.error('Randevu detayları alınırken hata oluştu:', err);
      
      showErrorToast(err instanceof Error ? err.message : 'Randevu detayları alınırken bir hata oluştu');
      
      throw err;
    }
  }, [showErrorToast, formatAppointment]);
  
  // Müşterinin randevularını getir
  const getCustomerEvents = useCallback(async (customerId: string, date: Date): Promise<Appointment[]> => {
    try {
      // Formatlanmış tarih
      const formattedDate = moment(date).format('YYYY-MM-DD');
      
      const result = await getCustomerAppointments(customerId, formattedDate);
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteri randevuları alınırken bir hata oluştu');
      }
      
      // Veriyi takvim formatına dönüştür - UI hook'unu kullan
      const formattedAppointments = result.data.map((appointment: any) => 
        formatAppointment(appointment)
      );
      
      return formattedAppointments;
    } catch (err) {
      console.error('Müşteri randevuları alınırken hata oluştu:', err);
      
      showErrorToast(err instanceof Error ? err.message : 'Müşteri randevuları alınırken bir hata oluştu');
      
      throw err;
    }
  }, [showErrorToast, formatAppointment]);
  
  // Personel müsaitliği kontrolü
  const checkAvailability = useCallback(async (
    staffId: string, 
    start: Date, 
    end: Date, 
    excludeEventId?: string
  ): Promise<boolean> => {
    try {
      const apiResult = await checkStaffAvailability(
        staffId,
        start.toISOString(),
        end.toISOString(),
        excludeEventId
      );
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Personel müsaitliği kontrol edilirken bir hata oluştu');
      }
      
      const result = apiResult.data;
      
      if (!result.isAvailable) {
        const message = result.workingHoursIssue || 
                     (result.conflictingAppointments?.length ? 
                      'Seçilen zaman diliminde çakışan randevular bulunuyor' : 
                      'Personel seçilen zaman diliminde müsait değil');
        
        showWarningToast(message);
      }
      
      return result.isAvailable;
    } catch (err) {
      console.error('Müsaitlik kontrolünde hata oluştu:', err);
      
      showErrorToast('Personel müsaitliği kontrol edilirken bir hata oluştu');
      
      return false;
    }
  }, [showErrorToast, showWarningToast]);

  return {
    updateEventAfterDrag,
    getEventDetails,
    getCustomerEvents,
    checkAvailability
  };
};
