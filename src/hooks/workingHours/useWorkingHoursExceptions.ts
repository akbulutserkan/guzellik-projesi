'use client';

import { useState, useCallback } from 'react';
import { 
  getWorkingHourExceptions, 
  createWorkingHourException, 
  updateWorkingHourException, 
  deleteWorkingHourException 
} from '@/services/workingHoursService';
import { WorkingHourException } from './types';

/**
 * Çalışma saati istisnaları hook'u
 */
export const useWorkingHoursExceptions = () => {
  const [exceptions, setExceptions] = useState<WorkingHourException[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Çalışma saati istisnalarını getirir
   */
  const fetchExceptions = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWorkingHourExceptions(date);
      
      if (result.success) {
        setExceptions(result.data);
      } else {
        setError(result.error || 'Çalışma saati istisnaları alınırken bir hata oluştu');
      }
    } catch (err) {
      console.error('Çalışma saati istisnaları alınırken hata:', err);
      setError('Çalışma saati istisnaları alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Yeni bir çalışma saati istisnası oluşturur
   */
  const createException = useCallback(async (data: { date: Date | string, description: string, isWorkingDay?: boolean }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createWorkingHourException(data);
      
      if (result.success) {
        // Yeni istisnayı listeye ekle
        setExceptions(prevExceptions => [...prevExceptions, result.data]);
        return result.data;
      } else {
        setError(result.error || 'Çalışma saati istisnası oluşturulurken bir hata oluştu');
        return null;
      }
    } catch (err) {
      console.error('Çalışma saati istisnası oluşturulurken hata:', err);
      setError('Çalışma saati istisnası oluşturulurken bir hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bir çalışma saati istisnasını günceller
   */
  const updateException = useCallback(async (id: string, data: { date?: Date | string, description?: string, isWorkingDay?: boolean }) => {
    if (!id) {
      setError('İstisna ID bilgisi gerekli');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await updateWorkingHourException(id, data);
      
      if (result.success) {
        // Listedeki ilgili istisnayı güncelle
        setExceptions(prevExceptions => 
          prevExceptions.map(exception => exception.id === id ? result.data : exception)
        );
        
        return result.data;
      } else {
        setError(result.error || 'Çalışma saati istisnası güncellenirken bir hata oluştu');
        return null;
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati istisnası güncellenirken hata:`, err);
      setError('Çalışma saati istisnası güncellenirken bir hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bir çalışma saati istisnasını siler
   */
  const deleteException = useCallback(async (id: string) => {
    if (!id) {
      setError('İstisna ID bilgisi gerekli');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteWorkingHourException(id);
      
      if (result.success) {
        // Silinen istisnayı listeden çıkar
        setExceptions(prevExceptions => 
          prevExceptions.filter(exception => exception.id !== id)
        );
        
        return true;
      } else {
        setError(result.error || 'Çalışma saati istisnası silinirken bir hata oluştu');
        return false;
      }
    } catch (err) {
      console.error(`${id} ID'li çalışma saati istisnası silinirken hata:`, err);
      setError('Çalışma saati istisnası silinirken bir hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Durum (state)
    exceptions,
    loading,
    error,
    
    // İstisnalar işlemleri
    fetchExceptions,
    createException,
    updateException,
    deleteException
  };
};
