'use client';

import { useState, useCallback } from 'react';

export interface DateRangeState {
  startDate: Date;
  endDate: Date;
}

export interface UseProductSaleDateRangeResult {
  dateRange: DateRangeState;
  setDateRange: React.Dispatch<React.SetStateAction<DateRangeState>>;
  setThisMonth: () => void;
  setLastMonth: () => void;
  setLastThreeMonths: () => void;
  setThisYear: () => void;
  setCustomRange: (start: Date, end: Date) => void;
}

/**
 * Ürün satışı tarih aralığı filtresini yöneten hook
 */
export const useProductSaleDateRange = (
  autoRefreshOnChange: boolean = false, // Tarih değiştiğinde otomatik yenileme yapılsın mı?
  initialRange?: Partial<DateRangeState>
): UseProductSaleDateRangeResult => {
  // Varsayılan olarak, mevcut ay
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: initialRange?.startDate || firstDayOfMonth,
    endDate: initialRange?.endDate || today
  });
  
  /**
   * Tarih aralığını değiştir ve isteğe bağlı olarak event emit et
   */
  const updateDateRangeWithoutEmit = useCallback((newRange: DateRangeState) => {
    setDateRange(newRange);
  }, []);
  
  /**
   * Bu ay için tarih aralığını ayarla
   */
  const setThisMonth = useCallback(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    updateDateRangeWithoutEmit({
      startDate: firstDayOfMonth,
      endDate: today
    });
  }, [updateDateRangeWithoutEmit]);
  
  /**
   * Geçen ay için tarih aralığını ayarla
   */
  const setLastMonth = useCallback(() => {
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    updateDateRangeWithoutEmit({
      startDate: firstDayOfLastMonth,
      endDate: lastDayOfLastMonth
    });
  }, [updateDateRangeWithoutEmit]);
  
  /**
   * Son 3 ay için tarih aralığını ayarla
   */
  const setLastThreeMonths = useCallback(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    
    updateDateRangeWithoutEmit({
      startDate: threeMonthsAgo,
      endDate: today
    });
  }, [updateDateRangeWithoutEmit]);
  
  /**
   * Bu yıl için tarih aralığını ayarla
   */
  const setThisYear = useCallback(() => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    
    updateDateRangeWithoutEmit({
      startDate: firstDayOfYear,
      endDate: today
    });
  }, [updateDateRangeWithoutEmit]);
  
  /**
   * Özel tarih aralığı belirle
   */
  const setCustomRange = useCallback((start: Date, end: Date) => {
    updateDateRangeWithoutEmit({
      startDate: start,
      endDate: end
    });
  }, [updateDateRangeWithoutEmit]);
  
  return {
    dateRange,
    setDateRange,
    setThisMonth,
    setLastMonth,
    setLastThreeMonths,
    setThisYear,
    setCustomRange
  };
};
