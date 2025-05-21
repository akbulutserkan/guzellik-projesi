'use client';

import { useCallback, useState } from 'react';
import { Product } from '@/services/productService';

// Cache yapısı
interface ProductCache {
  [key: string]: {
    data: Product[];
    timestamp: number;
  };
}

// Varsayılan önbellek süresi
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 dakika

// Bellek içi önbellek (hook örnekleri arasında paylaşılır)
let productCache: ProductCache = {};

export interface UseProductCacheOptions {
  enabled?: boolean;
  expirationTime?: number;
}

export interface UseProductCacheResult {
  getCachedData: (filters?: Record<string, any>) => Product[] | null;
  cacheData: (filters: Record<string, any>, data: Product[]) => void;
  invalidateCacheEntry: (filters: Record<string, any>) => void;
  invalidateCache: () => void;
  isCacheEnabled: boolean;
  cacheExpirationTime: number;
}

/**
 * Ürün önbelleklemesini yöneten hook
 */
export const useProductCache = (options: UseProductCacheOptions = {}): UseProductCacheResult => {
  // State
  const [cacheEnabled] = useState<boolean>(options.enabled !== false);
  const [cacheExpirationTime] = useState<number>(
    options.expirationTime || DEFAULT_CACHE_EXPIRATION
  );

  /**
   * Filtre seçeneklerinden önbellek anahtarı oluştur
   */
  const createCacheKey = useCallback((filters: Record<string, any> = {}): string => {
    return JSON.stringify(filters || {});
  }, []);

  /**
   * Önbelleklenmiş ürün verilerini al
   */
  const getCachedData = useCallback((filters: Record<string, any> = {}): Product[] | null => {
    if (!cacheEnabled) return null;

    const cacheKey = createCacheKey(filters);
    const cachedItem = productCache[cacheKey];
    
    if (!cachedItem) return null;
    
    const now = Date.now();
    if (now - cachedItem.timestamp > cacheExpirationTime) {
      // Önbellek süresi doldu
      delete productCache[cacheKey];
      return null;
    }
    
    return cachedItem.data;
  }, [cacheEnabled, cacheExpirationTime, createCacheKey]);

  /**
   * Ürün verilerini önbellekle
   */
  const cacheData = useCallback((filters: Record<string, any> = {}, data: Product[]): void => {
    if (!cacheEnabled) return;
    
    const cacheKey = createCacheKey(filters);
    productCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  }, [cacheEnabled, createCacheKey]);

  /**
   * Belirli bir önbellek girişini geçersiz kıl
   */
  const invalidateCacheEntry = useCallback((filters: Record<string, any> = {}): void => {
    const cacheKey = createCacheKey(filters);
    delete productCache[cacheKey];
  }, [createCacheKey]);

  /**
   * Tüm önbelleği geçersiz kıl
   */
  const invalidateCache = useCallback((): void => {
    productCache = {};
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

export default useProductCache;