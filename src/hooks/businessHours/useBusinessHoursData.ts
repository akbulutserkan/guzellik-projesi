// hooks/businessHours/useBusinessHoursData.ts
import { useState, useCallback } from 'react';
import { BusinessHours, defaultHours } from './types';
import { useBusinessHoursUI } from './useBusinessHoursUI';

// API yanıtını BusinessHours formatına dönüştürme
const transformApiResponse = (data: Record<string, any>): BusinessHours => {
  // Data zaten doğru formatta, sadece validate et ve döndür
  const hours: BusinessHours = { ...defaultHours };
  
  Object.entries(data).forEach(([day, settings]: [string, any]) => {
    if (defaultHours.hasOwnProperty(day)) {
      hours[day] = {
        enabled: settings.enabled ?? defaultHours[day].enabled,
        start: settings.start || defaultHours[day].start,
        end: settings.end || defaultHours[day].end
      };
    }
  });

  return hours;
};

export interface UseBusinessHoursDataOptions {
  apiUrl?: string;
  useCaching?: boolean;
  updateInterval?: number;
}

/**
 * İşletme çalışma saatlerinin veri katmanı
 */
export const useBusinessHoursData = (options: UseBusinessHoursDataOptions = {}) => {
  const {
    apiUrl = '/api/settings/business-days',
    useCaching = false
  } = options;

  // UI hook'unu kullan
  const { showErrorToast } = useBusinessHoursUI();

  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache kullanılan durumlarda hızlı başlangıç için state'i doldur
  if (useCaching && typeof window !== 'undefined' && !businessHours) {
    try {
      const cached = localStorage.getItem('businessHours');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setBusinessHours(parsedCache);
        setLoading(false);
      }
    } catch (e) {
      console.warn('Cache ayrıştırılamadı', e);
    }
  }

  /**
   * Çalışma saatlerini getir
   */
  const fetchBusinessHours = useCallback(async (force = false) => {
    try {
      // Önbellekteki veriyi kontrol et (useCaching etkinse)
      let cachedData = null;
      if (useCaching && typeof window !== 'undefined') {
        const cached = localStorage.getItem('businessHours');
        if (cached) {
          try {
            cachedData = JSON.parse(cached);
          } catch (e) {
            console.warn('Önbellek verisi ayrıştırılamadı', e);
          }
        }
      }
      
      // API isteği
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('İşletme çalışma saatleri alınamadı');
      }

      const data = await response.json();

      // Veriyi dönüştür
      const formattedHours = transformApiResponse(data);

      // Veri değişmişse güncelle
      if (force || !businessHours || JSON.stringify(businessHours) !== JSON.stringify(formattedHours)) {
        // Veriyi kaydet
        setBusinessHours(formattedHours);

        // Önbelleğe kaydet
        if (useCaching && typeof window !== 'undefined') {
          localStorage.setItem('businessHours', JSON.stringify(formattedHours));
        }
      }

      setError(null);
    } catch (err) {
      console.error('İşletme saatleri yükleme hatası:', err);
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      setError(errorMessage);
      
      // Hata bildirimini UI hook'u ile göster
      showErrorToast(`İşletme saatleri yüklenemedi: ${errorMessage}`);
      
      setBusinessHours(defaultHours); // Hata durumunda varsayılan saatleri kullan
    } finally {
      setLoading(false);
    }
  }, [apiUrl, businessHours, useCaching, showErrorToast]);

  return {
    businessHours,
    loading,
    error,
    fetchBusinessHours
  };
};