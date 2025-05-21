/**
 * Simple caching mechanism for package sale data
 */

import { useState, useCallback, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface UseCacheOptions {
  /**
   * Cache expiration time in milliseconds
   * Default: 5 minutes
   */
  expirationTime?: number;
}

export const usePackageSaleCache = <T>({
  expirationTime = 5 * 60 * 1000 // Default: 5 minutes
}: UseCacheOptions = {}) => {
  // Use ref instead of state to avoid re-renders when cache changes
  const cacheRef = useRef<Map<string, CacheItem<T>>>(new Map());
  
  /**
   * Gets data from cache or calls the fetch function if not found
   */
  const getWithCache = useCallback(async (
    key: string, 
    fetchFn: () => Promise<T>,
    forceFresh: boolean = false
  ): Promise<T> => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    // Check if we have valid cached data
    if (!forceFresh && cache.has(key)) {
      const item = cache.get(key)!;
      
      // If cache is still valid
      if (now - item.timestamp < expirationTime) {
        console.log(`[Cache] Using cached data for key: ${key}`);
        return item.data;
      } else {
        console.log(`[Cache] Expired data for key: ${key}`);
        cache.delete(key);
      }
    }
    
    // If we don't have valid cache, fetch fresh data
    console.log(`[Cache] Fetching fresh data for key: ${key}`);
    const data = await fetchFn();
    
    // Store in cache
    cache.set(key, {
      data,
      timestamp: now,
      key
    });
    
    return data;
  }, [expirationTime]);
  
  /**
   * Invalidates a specific cache key
   */
  const invalidateCache = useCallback((key: string) => {
    const cache = cacheRef.current;
    if (cache.has(key)) {
      console.log(`[Cache] Invalidating key: ${key}`);
      cache.delete(key);
      return true;
    }
    return false;
  }, []);
  
  /**
   * Invalidates all cache items
   */
  const clearCache = useCallback(() => {
    console.log('[Cache] Clearing all cache');
    cacheRef.current.clear();
  }, []);
  
  /**
   * Updates a specific cache key with new data
   */
  const updateCache = useCallback((key: string, data: T) => {
    console.log(`[Cache] Updating key: ${key}`);
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }, []);
  
  return {
    getWithCache,
    invalidateCache,
    clearCache,
    updateCache
  };
};

export default usePackageSaleCache;