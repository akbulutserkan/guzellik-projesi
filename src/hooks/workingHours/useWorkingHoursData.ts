'use client';

import { useState, useCallback } from 'react';
import { useWorkingHoursUI } from './useWorkingHoursUI';
import { 
  getWorkingHours, 
  getWorkingHoursByStaff, 
  getWorkingHourById, 
  createWorkingHour as apiCreateWorkingHour,
  updateWorkingHour as apiUpdateWorkingHour, 
  deleteWorkingHour as apiDeleteWorkingHour, 
  getBusinessHoursDetails
} from '@/services/workingHoursService';
import { WorkingHour, WorkingHourInput, BusinessHour } from './types';

/**
 * Çalışma saatleri veri işlemleri hook'u
 */
export const useWorkingHoursData = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [currentWorkingHour, setCurrentWorkingHour] = useState<WorkingHour | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI hook'unu kullan
  const {
    formatWorkingHour,
    formatBusinessHour,
    showSuccessToast,
    showErrorToast
  } = useWorkingHoursUI();

  /**
   * Tüm çalışma saatlerini getirir
   */
  const fetchWorkingHours = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWorkingHours();
      
      if (result.success) {
        setWorkingHours(result.data.staffWorkingHours || []);
        setBusinessHours(result.data.businessHours || []);
      } else {
        const errorMessage = result.error || 'Çalışma saatleri alınırken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error('Çalışma saatleri alınırken hata:', err);
      const errorMessage = 'Çalışma saatleri alınırken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  /**
   * Belirli bir personelin çalışma saatlerini getirir
   */
  const fetchWorkingHoursByStaff = useCallback(async (staffId: string) => {
    if (!staffId) {
      setError('Personel ID bilgisi gerekli');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWorkingHoursByStaff(staffId);
      
      if (result.success) {
        setWorkingHours(result.data.staffWorkingHours || []);
        setBusinessHours(result.data.businessHours || []);
      } else {
        const errorMessage = result.error || 'Personel çalışma saatleri alınırken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error(`${staffId} ID'li personelin çalışma saatleri alınırken hata:`, err);
      const errorMessage = 'Personel çalışma saatleri alınırken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  /**
   * ID'ye göre çalışma saati detayını getirir
   */
  const fetchWorkingHourById = useCallback(async (id: string) => {
    if (!id) {
      setError('Çalışma saati ID bilgisi gerekli');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWorkingHourById(id);
      
      if (result.success) {
        setCurrentWorkingHour(result.data);
      } else {
        const errorMessage = result.error || 'Çalışma saati detayı alınırken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati detayı alınırken hata:`, err);
      const errorMessage = 'Çalışma saati detayı alınırken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  /**
   * Yeni bir çalışma saati oluşturur
   */
  const createWorkingHour = useCallback(async (data: WorkingHourInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCreateWorkingHour(data);
      
      if (result.success) {
        // Yeni çalışma saatini listeye ekle
        setWorkingHours(prevHours => [...prevHours, result.data]);
        showSuccessToast('Çalışma saati başarıyla oluşturuldu');
        return result.data;
      } else {
        const errorMessage = result.error || 'Çalışma saati oluşturulurken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
        return null;
      }
    } catch (err) {
      console.error('Çalışma saati oluşturulurken hata:', err);
      const errorMessage = 'Çalışma saati oluşturulurken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  /**
   * Mevcut bir çalışma saatini günceller
   */
  const updateWorkingHour = useCallback(async (id: string, data: Partial<WorkingHourInput>) => {
    if (!id) {
      setError('Çalışma saati ID bilgisi gerekli');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiUpdateWorkingHour(id, data);
      
      if (result.success) {
        // Listedeki ilgili çalışma saatini güncelle
        setWorkingHours(prevHours => 
          prevHours.map(hour => hour.id === id ? result.data : hour)
        );
        
        // Eğer seçili çalışma saati güncellendiyse onu da güncelle
        if (currentWorkingHour?.id === id) {
          setCurrentWorkingHour(result.data);
        }
        
        showSuccessToast('Çalışma saati başarıyla güncellendi');
        return result.data;
      } else {
        const errorMessage = result.error || 'Çalışma saati güncellenirken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
        return null;
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati güncellenirken hata:`, err);
      const errorMessage = 'Çalışma saati güncellenirken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWorkingHour, showSuccessToast, showErrorToast]);

  /**
   * Bir çalışma saatini siler
   */
  const deleteWorkingHour = useCallback(async (id: string) => {
    if (!id) {
      setError('Çalışma saati ID bilgisi gerekli');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiDeleteWorkingHour(id);
      
      if (result.success) {
        // Silinen çalışma saatini listeden çıkar
        setWorkingHours(prevHours => 
          prevHours.filter(hour => hour.id !== id)
        );
        
        // Eğer seçili çalışma saati silindiyse onu da temizle
        if (currentWorkingHour?.id === id) {
          setCurrentWorkingHour(null);
        }
        
        showSuccessToast('Çalışma saati başarıyla silindi');
        return true;
      } else {
        const errorMessage = result.error || 'Çalışma saati silinirken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
        return false;
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati silinirken hata:`, err);
      const errorMessage = 'Çalışma saati silinirken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentWorkingHour, showSuccessToast, showErrorToast]);

  /**
   * İşletme çalışma saatlerini getirir
   */
  const fetchBusinessHours = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getBusinessHoursDetails();
      
      if (result.success) {
        setBusinessHours(result.data);
      } else {
        const errorMessage = result.error || 'İşletme çalışma saatleri alınırken bir hata oluştu';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error('İşletme çalışma saatleri alınırken hata:', err);
      const errorMessage = 'İşletme çalışma saatleri alınırken bir hata oluştu';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  return {
    // Durum (state)
    workingHours,
    businessHours,
    currentWorkingHour,
    loading,
    error,
    
    // Veri işlemleri
    fetchWorkingHours,
    fetchWorkingHoursByStaff,
    fetchWorkingHourById,
    createWorkingHour,
    updateWorkingHour,
    deleteWorkingHour,
    fetchBusinessHours
  };
};
