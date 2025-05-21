'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Appointment,
  groupAppointmentsByDate
} from '@/utils/appointment/formatters';
import { 
  getAppointments, 
  getAppointmentById, 
  createAppointment, 
  updateAppointment, 
  deleteAppointment 
} from '@/services/appointmentService';

// Filtre seçenekleri için tip tanımı
export interface AppointmentFilterOptions {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
  status?: string;
  [key: string]: any; // Diğer olası filtre parametreleri için
}
import { useAppointmentPermissions } from './useAppointmentPermissions';
import { useAppointmentCache } from './useAppointmentCache';
import { useAppointmentUI } from './useAppointmentUI';

/**
 * Hook props interface
 */
interface UseAppointmentDataProps {
  initialAppointments?: Appointment[];
  autoFetch?: boolean;
  showToasts?: boolean;
  defaultFilter?: string;
}

/**
 * Enum for loading state tracking
 */
enum LoadingState {
  IDLE = 'idle',
  FETCHING = 'fetching',
  CREATING = 'creating',
  UPDATING = 'updating',
  DELETING = 'deleting'
}

/**
 * Hook for appointment data operations (CRUD)
 * 
 * @param options Hook options
 * @returns Hook state and methods for appointment data operations
 */
export const useAppointmentData = ({
  initialAppointments = [],
  autoFetch = true,
  showToasts = true,
  defaultFilter = 'ALL'
}: UseAppointmentDataProps = {}) => {
  // State for appointments and data operations
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<string>(defaultFilter);
  const [groupedAppointments, setGroupedAppointments] = useState<{[key: string]: Appointment[]}>({});
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Refs for operations and throttling
  const lastFetchTimeRef = useRef<number>(Date.now());
  const lastRefreshTimeRef = useRef<number>(0);

  // Computed loading state
  const loading = loadingState !== LoadingState.IDLE;
  
  // UI işlemleri için hook
  const { 
    showSuccessToast, 
    showErrorToast, 
    formatAppointment 
  } = useAppointmentUI();
  
  // Get permissions
  const { canViewAppointments, canAddAppointments, canEditAppointments, canDeleteAppointments } = useAppointmentPermissions();
  
  // Get cache
  const { 
    getCachedData, 
    cacheData, 
    invalidateCache, 
    isCacheEnabled,
    cacheExpirationTime 
  } = useAppointmentCache();
  
  /**
   * Refresh trigger for data
   */
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  /**
   * Fetch all appointments with optimized caching
   * 
   * @param filters Optional filter options
   * @param skipCache Whether to skip cache and force fetch
   */
  const fetchAppointments = useCallback(async (
    filters: AppointmentFilterOptions = {}, 
    skipCache: boolean = false
  ) => {
    if (!canViewAppointments) {
      setError('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.');
      return;
    }
    
    try {
      // Check if we're already loading
      if (loadingState === LoadingState.FETCHING) {
        console.log('[useAppointmentData] Already fetching appointments, skipping');
        return;
      }
      
      // Set loading state
      setLoadingState(LoadingState.FETCHING);
      setError('');
      
      // Check cache if enabled
      if (isCacheEnabled && !skipCache) {
        const cachedData = getCachedData(filters);
        
        if (cachedData) {
          console.log('[useAppointmentData] Using cached data');
          setAppointments(cachedData);
          
          // Group appointments by date
          const grouped = groupAppointmentsByDate(cachedData);
          setGroupedAppointments(grouped);
          
          setLoadingState(LoadingState.IDLE);
          return;
        }
      }
      
      // Track fetch time for throttling
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      const isFirstFetch = appointments.length === 0;
      
      // Throttle fetches to prevent excessive API calls (min 4 seconds between fetches)
      // Ancak ilk yüklemede kısıtlama uygulanmasın
      if (timeSinceLastFetch < 4000 && !skipCache && !isFirstFetch) {
        console.log('[useAppointmentData] Throttling fetch, using existing data');
        setLoadingState(LoadingState.IDLE);
        return;
      }
      
      lastFetchTimeRef.current = now;
      
      // Fetch appointments using the service (with cache if enabled)
      const data = await getAppointments(filters);
      
      // Manually cache the data if needed
      if (isCacheEnabled && skipCache) {
        cacheData(filters, data);
      }
      
      setAppointments(data);
      
      // Group appointments by date
      const grouped = groupAppointmentsByDate(data);
      setGroupedAppointments(grouped);
      
      setError('');
    } catch (error: any) {
      console.error('Fetch appointments error:', error);
      setError(`Randevu listesi yüklenirken bir hata oluştu: ${error.message}`);
      
      if (showToasts) {
        showErrorToast('Randevular yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  }, [canViewAppointments, loadingState, showToasts, showErrorToast, isCacheEnabled, getCachedData, cacheData, appointments.length]);
  
  /**
   * Fetch appointment by ID with extended details
   * 
   * @param id Appointment ID
   * @param includeServices Whether to include service details
   * @returns Appointment data or null
   */
  const fetchAppointmentById = useCallback(async (id: string, includeServices: boolean = true) => {
    if (!canViewAppointments) return null;
    
    try {
      setLoadingState(LoadingState.FETCHING);
      
      const appointment = await getAppointmentById(id, includeServices);
      return appointment;
    } catch (error) {
      console.error(`Error fetching appointment ${id}:`, error);
      return null;
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  }, [canViewAppointments]);
  
  /**
   * Handle creating a new appointment with improved error handling
   * 
   * @param data Appointment data
   * @returns Created appointment or null on error
   */
  const handleCreateAppointment = useCallback(async (data: any) => {
    if (!canAddAppointments) {
      if (showToasts) {
        showErrorToast('Randevu oluşturma yetkiniz bulunmamaktadır.');
      }
      return null;
    }
    
    try {
      setLoadingState(LoadingState.CREATING);
      
      const newAppointment = await createAppointment(data);
      
      if (showToasts) {
        showSuccessToast('Randevu başarıyla oluşturuldu');
      }
      
      // Update local state to avoid full refetch
      setAppointments(prev => [newAppointment, ...prev]);
      
      // Update grouped appointments
      const dateKey = new Date(newAppointment.startTime).toISOString().split('T')[0];
      setGroupedAppointments(prev => {
        const newGrouped = { ...prev };
        if (!newGrouped[dateKey]) {
          newGrouped[dateKey] = [];
        }
        newGrouped[dateKey] = [newAppointment, ...newGrouped[dateKey]];
        return newGrouped;
      });
      
      // Invalidate cache
      if (isCacheEnabled) {
        invalidateCache();
      }
      
      // Refresh appointments to ensure consistency
      setTimeout(() => fetchAppointments({}, true), 500);
      
      return newAppointment;
    } catch (error: any) {
      console.error('Create appointment error:', error);
      
      if (showToasts) {
        showErrorToast(error.message || 'Randevu oluşturulurken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  }, [canAddAppointments, showToasts, showSuccessToast, showErrorToast, fetchAppointments, isCacheEnabled, invalidateCache]);
  
  /**
   * Handle updating an appointment with optimistic updates
   * 
   * @param id Appointment ID
   * @param data Updated data
   * @returns Updated appointment or null on error
   */
  const handleUpdateAppointment = useCallback(async (id: string, data: any) => {
    if (!canEditAppointments) {
      if (showToasts) {
        showErrorToast('Randevu güncelleme yetkiniz bulunmamaktadır.');
      }
      return null;
    }
    
    try {
      setLoadingState(LoadingState.UPDATING);
      
      // Perform API update
      const updatedAppointment = await updateAppointment(id, data);
      
      if (showToasts) {
        showSuccessToast('Randevu başarıyla güncellendi');
      }
      
      // Optimistic update of local state
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? { ...appointment, ...updatedAppointment } : appointment
        )
      );
      
      // Update grouped appointments
      setGroupedAppointments(prev => {
        const newGrouped = { ...prev };
        // Find and update in all date groups
        Object.keys(newGrouped).forEach(dateKey => {
          newGrouped[dateKey] = newGrouped[dateKey].map(appointment => 
            appointment.id === id ? { ...appointment, ...updatedAppointment } : appointment
          );
        });
        return newGrouped;
      });
      
      // Invalidate cache
      if (isCacheEnabled) {
        invalidateCache();
      }
      
      // Refresh appointments in the background to ensure consistency
      setTimeout(() => fetchAppointments({}, true), 500);
      
      return updatedAppointment;
    } catch (error: any) {
      console.error(`Update appointment error for ${id}:`, error);
      
      if (showToasts) {
        showErrorToast(error.message || 'Randevu güncellenirken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  }, [canEditAppointments, fetchAppointments, showToasts, showSuccessToast, showErrorToast, isCacheEnabled, invalidateCache]);
  
  /**
   * Handle deleting an appointment with improved confirmation
   * 
   * @param id Appointment ID
   * @returns Success indicator
   */
  const handleDeleteAppointment = useCallback(async (id: string) => {
    if (!canDeleteAppointments) {
      if (showToasts) {
        showErrorToast('Randevu silme yetkiniz bulunmamaktadır.');
      }
      return false;
    }
    
    try {
      setLoadingState(LoadingState.DELETING);
      setDeleteError('');
      
      // Get appointment info for better confirmation message
      const appointmentToDelete = appointments.find(a => a.id === id);
      let confirmMessage = 'Bu randevuyu silmek istediğinizden emin misiniz?';
      
      if (appointmentToDelete) {
        const customerName = appointmentToDelete.customer?.name || 'Müşteri';
        const date = new Date(appointmentToDelete.startTime).toLocaleDateString('tr-TR');
        const time = new Date(appointmentToDelete.startTime).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        confirmMessage = `${customerName} için ${date} ${time} tarihli randevuyu silmek istediğinizden emin misiniz?`;
      }
      
      // Confirm deletion
      if (!window.confirm(confirmMessage)) {
        return false;
      }
      
      // Optimistically update UI
      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      
      // Update grouped appointments
      setGroupedAppointments(prev => {
        const newGrouped = { ...prev };
        // Remove from all date groups
        Object.keys(newGrouped).forEach(dateKey => {
          newGrouped[dateKey] = newGrouped[dateKey].filter(appointment => appointment.id !== id);
          // Remove empty date groups
          if (newGrouped[dateKey].length === 0) {
            delete newGrouped[dateKey];
          }
        });
        return newGrouped;
      });
      
      // Actually delete appointment in backend
      await deleteAppointment(id);
      
      if (showToasts) {
        showSuccessToast('Randevu başarıyla silindi');
      }
      
      // Invalidate cache
      if (isCacheEnabled) {
        invalidateCache();
      }
      
      return true;
    } catch (error: any) {
      console.error(`Delete appointment error for ${id}:`, error);
      setDeleteError('Randevu silinirken bir hata oluştu');
      
      // Revert optimistic update on error
      fetchAppointments({}, true);
      
      if (showToasts) {
        showErrorToast(error.message || 'Randevu silinirken bir hata oluştu');
      }
      
      return false;
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  }, [canDeleteAppointments, fetchAppointments, appointments, showToasts, showSuccessToast, showErrorToast, isCacheEnabled, invalidateCache]);
  
  /**
   * Filter appointments by status
   * 
   * @returns Filtered appointments array
   */
  const getFilteredAppointments = useCallback(() => {
    return appointments.filter(appointment => {
      switch (currentFilter) {
        case 'ACTIVE':
          return ['PENDING', 'CONFIRMED'].includes(appointment.status);
        case 'NO_SHOW':
          return appointment.status === 'NO_SHOW';
        case 'COMPLETED':
          return appointment.status === 'COMPLETED';
        default:
          return true;
      }
    });
  }, [appointments, currentFilter]);
  
  return {
    // State
    appointments,
    loading,
    loadingState,
    error,
    deleteError,
    currentFilter,
    groupedAppointments,
    
    // Set functions
    setCurrentFilter,
    
    // Computed values
    filteredAppointments: getFilteredAppointments(),
    
    // API functions
    fetchAppointments,
    fetchAppointmentById,
    handleCreateAppointment,
    handleUpdateAppointment,
    handleDeleteAppointment,
    triggerRefresh,
    
    // Permissions expose
    permissions: {
      canView: canViewAppointments,
      canAdd: canAddAppointments,
      canEdit: canEditAppointments,
      canDelete: canDeleteAppointments
    }
  };
};

export default useAppointmentData;