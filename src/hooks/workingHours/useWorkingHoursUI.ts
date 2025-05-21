'use client';

import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { WorkingHour, BusinessHour, WorkingHourException } from './types';

export interface UseWorkingHoursUIResult {
  formatWorkingHour: (data: any) => WorkingHour;
  formatBusinessHour: (data: any) => BusinessHour;
  formatException: (data: any) => WorkingHourException;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Çalışma saatleri UI işlemleri hook'u
 */
export const useWorkingHoursUI = (): UseWorkingHoursUIResult => {
  /**
   * Başarı toast mesajı gösterir
   */
  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: 'Başarılı',
      description: message,
      variant: 'default'
    });
  }, []);
  
  /**
   * Hata toast mesajı gösterir
   */
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: 'Hata',
      description: message,
      variant: 'destructive'
    });
  }, []);
  
  /**
   * Uyarı toast mesajı gösterir
   */
  const showWarningToast = useCallback((message: string) => {
    toast({
      title: 'Uyarı',
      description: message,
      variant: 'warning'
    });
  }, []);
  
  /**
   * Çalışma saati verilerini görüntüleme için formatlar
   */
  const formatWorkingHour = useCallback((data: any): WorkingHour => {
    return {
      id: data.id || '',
      staffId: data.staffId || '',
      staffName: data.staffName || data.staff?.name || '',
      dayOfWeek: data.dayOfWeek || 0,
      dayName: data.dayName || '',
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '18:00',
      isActive: data.isActive !== undefined ? data.isActive : true
    };
  }, []);
  
  /**
   * İşletme çalışma saati verilerini görüntüleme için formatlar
   */
  const formatBusinessHour = useCallback((data: any): BusinessHour => {
    return {
      id: data.id || '',
      dayOfWeek: data.dayOfWeek || 0,
      dayName: data.dayName || '',
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '18:00',
      isActive: data.isActive !== undefined ? data.isActive : true,
      isOpen: data.isOpen !== undefined ? data.isOpen : true
    };
  }, []);
  
  /**
   * Çalışma saati istisnasını görüntüleme için formatlar
   */
  const formatException = useCallback((data: any): WorkingHourException => {
    return {
      id: data.id || '',
      staffId: data.staffId || '',
      staffName: data.staffName || data.staff?.name || '',
      date: data.date || new Date().toISOString().split('T')[0],
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      type: data.type || 'closed',
      reason: data.reason || '',
      isActive: data.isActive !== undefined ? data.isActive : true
    };
  }, []);
  
  return {
    formatWorkingHour,
    formatBusinessHour,
    formatException,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};

export default useWorkingHoursUI;