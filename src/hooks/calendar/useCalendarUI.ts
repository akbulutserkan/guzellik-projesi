'use client';

import { useState, useCallback } from 'react';
import { Appointment } from '@/types/appointment';
import { CalendarFilter } from '@/types/calendar';
import { toast } from '@/components/ui/use-toast';

export interface UseCalendarUIOptions {
  defaultFilters?: CalendarFilter;
}

export interface UseCalendarUIResult {
  selectedEvent: Appointment | null;
  filters: CalendarFilter;
  setSelectedEvent: (event: Appointment | null) => void;
  setFilters: (filters: CalendarFilter) => void;
  applyFilter: (key: keyof CalendarFilter, value: any) => void;
  clearFilters: () => void;
  
  // UI Bildirimleri için yeni fonksiyonlar
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
  
  // Formatlamalar için yeni fonksiyonlar
  formatAppointment: (appointment: any) => Appointment;
}

/**
 * Takvim UI durumunu yöneten hook
 */
export const useCalendarUI = (
  options: UseCalendarUIOptions = {}
): UseCalendarUIResult => {
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState<CalendarFilter>(options.defaultFilters || {});
  
  // Filtre işlemleri
  const applyFilter = useCallback((key: keyof CalendarFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Bildirimler için yeni fonksiyonlar
  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: 'Başarılı',
      description: message,
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
  
  // Formatlamalar için yeni fonksiyonlar
  const formatAppointment = useCallback((appointment: any): Appointment => {
    // Veriyi takvim formatına dönüştür
    return {
      ...appointment,
      start: appointment.startTime || appointment.start,
      end: appointment.endTime || appointment.end,
      resourceId: appointment.staffId || appointment.resourceId
    };
  }, []);

  return {
    selectedEvent,
    filters,
    setSelectedEvent,
    setFilters,
    applyFilter,
    clearFilters,
    
    // UI işlemleri
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    formatAppointment
  };
};
