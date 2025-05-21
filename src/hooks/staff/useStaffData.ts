'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStaff } from '@/services/staffService';
import { useStaffUI, Staff } from './useStaffUI';

interface UseStaffDataProps {
  initialStaff?: any[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

export function useStaffData({
  initialStaff = [],
  autoFetch = true,
  showToasts = true
}: UseStaffDataProps = {}) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  // UI hook'unu kullan
  const { formatStaff, showSuccessToast, showErrorToast } = useStaffUI();

  // Personel listesini getir
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getStaff(false);
      
      // API yanıt yapısını kontrol etme
      let staffData: any[] = [];
      
      if (result?.activeStaff && Array.isArray(result.activeStaff)) {
        staffData = result.activeStaff;
      } else if (result?.allStaff && Array.isArray(result.allStaff)) {
        staffData = result.allStaff;
      } else if (result?.data && Array.isArray(result.data)) {
        staffData = result.data;
      } else if (result?.staff && Array.isArray(result.staff)) {
        staffData = result.staff;
      } else if (Array.isArray(result)) {
        staffData = result;
      } else if (result?.success === false) {
        // API hata döndü
        throw new Error(result.error || 'Personel listesi getirilemedi');
      } else {
        console.warn('Beklenmeyen personel veri yapısı:', result);
        // Personel verisi bulunamadı, boş dizi döndürmeye devam et
      }
      
      setStaff(staffData);
    } catch (error) {
      console.error('Personel getirme hatası:', error);
      setError(error instanceof Error ? error.message : 'Personel listesi alınamadı');
      
      if (showToasts) {
        showErrorToast('Personel listesi alınamadı');
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);

  // İlk yükleme
  useEffect(() => {
    if (autoFetch) {
      fetchStaff();
    }
  }, [autoFetch, fetchStaff]);

  return {
    staff,
    setStaff,
    loading,
    error,
    fetchStaff
  };
}

export default useStaffData;