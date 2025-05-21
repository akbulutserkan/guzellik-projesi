'use client';

import { useCallback } from 'react';
import { createWorkingHour as apiCreateWorkingHour, updateWorkingHour as apiUpdateWorkingHour, deleteWorkingHour as apiDeleteWorkingHour } from '@/services/workingHoursService';
import { WorkingHourInput } from './types';
import { useWorkingHoursData } from './useWorkingHoursData';

/**
 * Çalışma saatleri yönetiminden sorumlu hook
 */
export const useWorkingHoursManagement = () => {
  const {
    workingHours,
    currentWorkingHour,
    loading,
    error,
    setWorkingHours,
    setCurrentWorkingHour,
    setLoading,
    setError
  } = useWorkingHoursData();

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
        return result.data;
      } else {
        setError(result.error || 'Çalışma saati oluşturulurken bir hata oluştu');
        return null;
      }
    } catch (err) {
      console.error('Çalışma saati oluşturulurken hata:', err);
      setError('Çalışma saati oluşturulurken bir hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setWorkingHours]);

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
        
        return result.data;
      } else {
        setError(result.error || 'Çalışma saati güncellenirken bir hata oluştu');
        return null;
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati güncellenirken hata:`, err);
      setError('Çalışma saati güncellenirken bir hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWorkingHour, setLoading, setError, setWorkingHours, setCurrentWorkingHour]);

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
        
        return true;
      } else {
        setError(result.error || 'Çalışma saati silinirken bir hata oluştu');
        return false;
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati silinirken hata:`, err);
      setError('Çalışma saati silinirken bir hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentWorkingHour, setLoading, setError, setWorkingHours, setCurrentWorkingHour]);

  return {
    // CRUD işlemleri
    createWorkingHour,
    updateWorkingHour,
    deleteWorkingHour
  };
};