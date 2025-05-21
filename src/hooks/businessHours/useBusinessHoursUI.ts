// hooks/businessHours/useBusinessHoursUI.ts
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { BusinessHours } from './types';

/**
 * İşletme çalışma saatleri için UI işlemlerini yöneten hook
 */
export const useBusinessHoursUI = () => {
  /**
   * Başarı mesajı göster
   */
  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: 'Başarılı',
      description: message
    });
  }, []);

  /**
   * Hata mesajı göster
   */
  const showErrorToast = useCallback((message: string) => {
    toast({
      variant: 'destructive',
      title: 'Hata',
      description: message
    });
  }, []);

  /**
   * Uyarı mesajı göster
   */
  const showWarningToast = useCallback((message: string) => {
    toast({
      variant: 'warning',
      title: 'Uyarı',
      description: message
    });
  }, []);

  /**
   * Çalışma saatlerini formatlama
   */
  const formatBusinessHours = useCallback((data: Record<string, any>): BusinessHours => {
    // Bu format işlemi useBusinessHoursData'da transformApiResponse olarak tanımlanmış
    // Gerekirse buraya taşınabilir
    return data as BusinessHours;
  }, []);

  return {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    formatBusinessHours
  };
};
