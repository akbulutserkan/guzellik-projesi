'use client';

import { useState, useCallback } from 'react';
import { ViewMode } from '@/types/calendar';

export interface UseCalendarNavigationOptions {
  initialDate?: Date;
  initialView?: ViewMode;
}

export interface UseCalendarNavigationResult {
  selectedDate: Date;
  viewMode: ViewMode;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  navigateToDate: (date: Date) => void;
  navigateToToday: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
}

/**
 * Takvim navigasyonunu yöneten hook
 */
export const useCalendarNavigation = (
  options: UseCalendarNavigationOptions = {}
): UseCalendarNavigationResult => {
  const [selectedDate, setSelectedDate] = useState<Date>(options.initialDate || new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(options.initialView || ViewMode.DAY);
  
  // Navigasyon yardımcı fonksiyonları
  const navigateToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);
  
  const navigateToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);
  
  const navigateNext = useCallback(() => {
    setSelectedDate(prev => {
      const nextDate = new Date(prev);
      
      switch(viewMode) {
        case ViewMode.DAY:
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case ViewMode.WEEK:
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case ViewMode.MONTH:
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case ViewMode.AGENDA:
          nextDate.setDate(nextDate.getDate() + 14);
          break;
      }
      
      return nextDate;
    });
  }, [viewMode]);
  
  const navigatePrevious = useCallback(() => {
    setSelectedDate(prev => {
      const nextDate = new Date(prev);
      
      switch(viewMode) {
        case ViewMode.DAY:
          nextDate.setDate(nextDate.getDate() - 1);
          break;
        case ViewMode.WEEK:
          nextDate.setDate(nextDate.getDate() - 7);
          break;
        case ViewMode.MONTH:
          nextDate.setMonth(nextDate.getMonth() - 1);
          break;
        case ViewMode.AGENDA:
          nextDate.setDate(nextDate.getDate() - 14);
          break;
      }
      
      return nextDate;
    });
  }, [viewMode]);

  return {
    selectedDate,
    viewMode,
    setSelectedDate,
    setViewMode,
    navigateToDate,
    navigateToToday,
    navigateNext,
    navigatePrevious
  };
};
