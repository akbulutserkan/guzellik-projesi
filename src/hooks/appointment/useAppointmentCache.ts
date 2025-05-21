'use client';

import { useCallback, useState } from 'react';
// Yeni merkezi API yapısına göre import güncellendi
import AppointmentsService from '@/services/api/modules/appointments';
// Filtre seçenekleri tipini import ediyoruz
import { AppointmentFilterOptions } from './useAppointmentData';
import { Appointment } from '@/utils/appointment/formatters';

// Cache structure
interface AppointmentCache {
  [key: string]: {
    data: Appointment[];
    timestamp: number;
  };
}

// Default expiration time
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache (shared between hook instances)
let appointmentCache: AppointmentCache = {};

/**
 * Hook for managing appointment cache
 */
export const useAppointmentCache = (options: {
  enabled?: boolean;
  expirationTime?: number;
} = {}) => {
  // State
  const [cacheEnabled] = useState<boolean>(options.enabled !== false);
  const [cacheExpirationTime] = useState<number>(
    options.expirationTime || DEFAULT_CACHE_EXPIRATION
  );

  /**
   * Create a cache key from filter options
   */
  const createCacheKey = useCallback((filters: AppointmentFilterOptions): string => {
    return JSON.stringify(filters || {});
  }, []);

  /**
   * Get cached appointments data
   */
  const getCachedData = useCallback((filters: AppointmentFilterOptions): Appointment[] | null => {
    if (!cacheEnabled) return null;

    const cacheKey = createCacheKey(filters);
    const cachedItem = appointmentCache[cacheKey];
    
    if (!cachedItem) return null;
    
    const now = Date.now();
    if (now - cachedItem.timestamp > cacheExpirationTime) {
      // Cache expired
      delete appointmentCache[cacheKey];
      return null;
    }
    
    return cachedItem.data;
  }, [cacheEnabled, cacheExpirationTime, createCacheKey]);

  /**
   * Cache appointments data
   */
  const cacheData = useCallback((filters: AppointmentFilterOptions, data: Appointment[]): void => {
    if (!cacheEnabled) return;
    
    const cacheKey = createCacheKey(filters);
    appointmentCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  }, [cacheEnabled, createCacheKey]);

  /**
   * Invalidate specific cache entry
   */
  const invalidateCacheEntry = useCallback((filters: AppointmentFilterOptions): void => {
    const cacheKey = createCacheKey(filters);
    delete appointmentCache[cacheKey];
  }, [createCacheKey]);

  /**
   * Invalidate all cache
   */
  const invalidateCache = useCallback((): void => {
    appointmentCache = {};
  }, []);

  return {
    getCachedData,
    cacheData,
    invalidateCacheEntry,
    invalidateCache,
    isCacheEnabled: cacheEnabled,
    cacheExpirationTime
  };
};

export default useAppointmentCache;