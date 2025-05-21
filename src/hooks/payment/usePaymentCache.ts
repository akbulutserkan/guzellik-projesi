'use client';

import { useCallback } from 'react';
import { Payment, PaymentFilterOptions } from '@/types/payment';
import { 
  cachePayments, 
  getCachedPayments, 
  createCacheKey,
  invalidateCache
} from '@/utils/cache/paymentCache';

export interface UsePaymentCacheOptions {
  cacheEnabled?: boolean;
  cacheExpirationTime?: number;
}

export interface UsePaymentCacheResult {
  getPaymentsFromCache: (filters: PaymentFilterOptions) => Payment[] | null;
  cachePaymentsData: (filters: PaymentFilterOptions, data: Payment[]) => void;
  invalidatePaymentCache: (filters?: PaymentFilterOptions) => void;
}

/**
 * Tahsilat önbelleği hook'u
 */
export const usePaymentCache = ({
  cacheEnabled = true,
  cacheExpirationTime = 5 * 60 * 1000 // 5 dakika varsayılan
}: UsePaymentCacheOptions = {}): UsePaymentCacheResult => {
  /**
   * Önbellekten tahsilatları getir
   */
  const getPaymentsFromCache = useCallback((filters: PaymentFilterOptions): Payment[] | null => {
    if (!cacheEnabled) return null;
    
    const cacheKey = createCacheKey(filters);
    return getCachedPayments(cacheKey);
  }, [cacheEnabled]);
  
  /**
   * Tahsilatları önbelleğe kaydet
   */
  const cachePaymentsData = useCallback((filters: PaymentFilterOptions, data: Payment[]): void => {
    if (!cacheEnabled) return;
    
    const cacheKey = createCacheKey(filters);
    cachePayments(cacheKey, data, cacheExpirationTime);
  }, [cacheEnabled, cacheExpirationTime]);
  
  /**
   * Önbelleği geçersiz kıl
   */
  const invalidatePaymentCache = useCallback((filters?: PaymentFilterOptions): void => {
    if (!cacheEnabled) return;
    
    if (filters) {
      const cacheKey = createCacheKey(filters);
      invalidateCache(cacheKey);
    } else {
      // Tüm payment önbelleğini geçersiz kıl
      invalidateCache();
    }
  }, [cacheEnabled]);
  
  return {
    getPaymentsFromCache,
    cachePaymentsData,
    invalidatePaymentCache
  };
};
