'use client';

import { Customer } from '@/types/customer';

// Önbellek için sabitler
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

// Önbellek için yerel cache
let customersCache: Customer[] = [];
let cacheTimestamp: number = 0;

export interface UseCustomerCacheResult {
  getCache: () => Customer[] | null;
  getCachedCustomer: (id: string) => Customer | undefined;
  updateCache: (customers: Customer[]) => void;
  addToCache: (customer: Customer) => void;
  updateInCache: (id: string, customer: Customer) => void;
  removeFromCache: (id: string) => void;
  invalidateCache: () => void;
  isCacheValid: () => boolean;
}

/**
 * Müşteri önbellekleme hook'u
 */
export const useCustomerCache = (): UseCustomerCacheResult => {
  /**
   * Önbelleğin geçerli olup olmadığını kontrol eder
   */
  const isCacheValid = () => {
    const now = Date.now();
    return cacheTimestamp > 0 && 
           (now - cacheTimestamp < CACHE_DURATION) && 
           customersCache.length > 0;
  };

  /**
   * Önbellekteki tüm müşterileri döndürür
   */
  const getCache = () => {
    if (isCacheValid()) {
      return customersCache;
    }
    return null;
  };

  /**
   * Önbellekteki belirli bir müşteriyi ID'sine göre döndürür
   */
  const getCachedCustomer = (id: string) => {
    if (isCacheValid()) {
      return customersCache.find(c => c.id === id);
    }
    return undefined;
  };

  /**
   * Önbelleği tamamen günceller
   */
  const updateCache = (customers: Customer[]) => {
    customersCache = customers;
    cacheTimestamp = Date.now();
  };

  /**
   * Önbelleğe yeni bir müşteri ekler
   */
  const addToCache = (customer: Customer) => {
    customersCache = [...customersCache, customer];
    cacheTimestamp = Date.now();
  };

  /**
   * Önbellekteki bir müşteriyi günceller
   */
  const updateInCache = (id: string, customer: Customer) => {
    customersCache = customersCache.map(c => c.id === id ? customer : c);
    cacheTimestamp = Date.now();
  };

  /**
   * Önbellekten bir müşteriyi kaldırır
   */
  const removeFromCache = (id: string) => {
    customersCache = customersCache.filter(c => c.id !== id);
    cacheTimestamp = Date.now();
  };

  /**
   * Önbelleği geçersiz kılar
   */
  const invalidateCache = () => {
    customersCache = [];
    cacheTimestamp = 0;
  };

  return {
    getCache,
    getCachedCustomer,
    updateCache,
    addToCache,
    updateInCache,
    removeFromCache,
    invalidateCache,
    isCacheValid
  };
};
