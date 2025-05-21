'use client';

import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface UseStaffUIResult {
  // UI işlemleri
  formatStaff: (staffData: any) => Staff;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Personel UI işlemlerini yöneten hook
 */
export const useStaffUI = (): UseStaffUIResult => {
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
   * Personel verilerini görüntüleme için formatlar
   */
  const formatStaff = useCallback((staffData: any): Staff => {
    return {
      ...staffData,
      id: staffData.id || '',
      name: staffData.name || '',
      email: staffData.email || '',
      phone: staffData.phone || '',
      role: staffData.role || '',
      isActive: staffData.isActive !== undefined ? staffData.isActive : true
    };
  }, []);
  
  return {
    formatStaff,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
}

export default useStaffUI;