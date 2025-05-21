'use client';

import { Staff, Appointment, UpdateEventArgs } from '@/types/appointment';
import { 
  ViewMode, 
  CalendarFilter, 
  AppointmentStatus,
  AttendanceStatus,
  CalendarViewOptions 
} from '@/types/calendar';

// Alt hook'ları içe aktar
import { useCalendarData } from './useCalendarData';
import { useCalendarPermissions } from './useCalendarPermissions';
import { useCalendarNavigation } from './useCalendarNavigation';
import { useCalendarStatus } from './useCalendarStatus';
import { useCalendarUI } from './useCalendarUI';
import { useCalendarEvents } from './useCalendarEvents';

export interface UseCalendarManagementOptions {
  initialDate?: Date;
  initialView?: ViewMode;
  refreshInterval?: number;
  forceInitialLoad?: boolean;
  defaultFilters?: CalendarFilter;
}

export interface UseCalendarManagementResult {
  // States
  staff: Staff[];
  events: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  selectedEvent: Appointment | null;
  updating: boolean;
  viewMode: ViewMode;
  filters: CalendarFilter;
  businessHours: any;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  
  // Actions
  setSelectedDate: (date: Date) => void;
  setSelectedEvent: (event: Appointment | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: CalendarFilter) => void;
  applyFilter: (key: keyof CalendarFilter, value: any) => void;
  clearFilters: () => void;
  fetchCalendarData: (force?: boolean) => Promise<void>;
  updateEventAfterDrag: (args: UpdateEventArgs) => Promise<void>;
  getEventDetails: (eventId: string) => Promise<Appointment>;
  getCustomerEvents: (customerId: string, date: Date) => Promise<Appointment[]>;
  refreshCalendar: () => Promise<void>;
  updateEventStatus: (eventId: string, status: AppointmentStatus) => Promise<void>;
  updateEventAttendance: (eventId: string, attendance: AttendanceStatus) => Promise<void>;
  checkAvailability: (staffId: string, start: Date, end: Date, excludeEventId?: string) => Promise<boolean>;
  navigateToDate: (date: Date) => void;
  navigateToToday: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
}

/**
 * Calendar yönetimi için ana hook
 * Bu hook, küçük alt hook'ları bir araya getirerek takvim yönetimi için tek bir API sağlar
 */
export const useCalendarManagement = (
  options: UseCalendarManagementOptions = {}
): UseCalendarManagementResult => {
  // Alt hook'ları kullan
  const {
    selectedDate,
    viewMode,
    setSelectedDate,
    setViewMode,
    navigateToDate,
    navigateToToday,
    navigateNext,
    navigatePrevious
  } = useCalendarNavigation({
    initialDate: options.initialDate,
    initialView: options.initialView
  });
  
  const {
    selectedEvent,
    filters,
    setSelectedEvent,
    setFilters,
    applyFilter,
    clearFilters
  } = useCalendarUI({
    defaultFilters: options.defaultFilters
  });
  
  const {
    canCreate,
    canUpdate,
    canDelete
  } = useCalendarPermissions();
  
  const {
    staff,
    events,
    loading,
    error,
    businessHours,
    updating: dataUpdating,
    fetchCalendarData,
    refreshCalendar,
    fetchBusinessHours
  } = useCalendarData(options, selectedDate, viewMode, filters);
  
  // Events için setEvents fonksiyonu
  const setEvents = (newEvents: Appointment[]) => {
    // Bu fonksiyon useCalendarData hook'unun içinde state'i güncelliyor.
    // Burada direkt olarak state'i güncelleyemiyoruz, bu yüzden takvimi yeniliyoruz.
    refreshCalendar();
  };
  
  const {
    updating: statusUpdating,
    updateEventStatus,
    updateEventAttendance
  } = useCalendarStatus(canUpdate, events, setEvents, selectedEvent, setSelectedEvent);
  
  const {
    updateEventAfterDrag,
    getEventDetails,
    getCustomerEvents,
    checkAvailability
  } = useCalendarEvents(canUpdate, events, setEvents, refreshCalendar);
  
  // Her iki updating durumunu birleştir
  const updating = dataUpdating || statusUpdating;

  return {
    // States
    staff,
    events,
    loading,
    error,
    selectedDate,
    selectedEvent,
    updating,
    viewMode,
    filters,
    businessHours,
    canCreate,
    canUpdate,
    canDelete,
    
    // Actions
    setSelectedDate,
    setSelectedEvent,
    setViewMode,
    setFilters,
    applyFilter,
    clearFilters,
    fetchCalendarData,
    updateEventAfterDrag,
    getEventDetails,
    getCustomerEvents,
    refreshCalendar,
    updateEventStatus,
    updateEventAttendance,
    checkAvailability,
    navigateToDate,
    navigateToToday,
    navigateNext,
    navigatePrevious
  };
};

export default useCalendarManagement;