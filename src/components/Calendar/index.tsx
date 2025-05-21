'use client'

/**
 * Takvim Modülü - Ana Bileşen
 * Merkezi ve dengeli mimariye uygun olarak tasarlanmıştır
 * useCalendarManagement hook'u üzerinden state yönetimi yapılır
 */

// CalendarClient'i yeniden export et
export { default } from './CalendarClient'

// Hook'u dışa aç - böylece başka modüller doğrudan kullanabilir
export { 
  useCalendarManagement,
  type UseCalendarManagementOptions,
  type UseCalendarManagementResult
} from '@/hooks/calendar/useCalendarManagement';

// Tipleri doğrudan kendi modüllerinden export ediyoruz
export { ViewMode, type CalendarFilter } from '@/types/calendar';
export { type UpdateEventArgs } from '@/types/appointment';