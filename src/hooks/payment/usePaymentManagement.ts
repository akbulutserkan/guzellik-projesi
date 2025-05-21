'use client';

import { useCallback } from 'react';
import { 
  usePaymentData, 
  UsePaymentDataOptions,
  UsePaymentDataResult
} from './usePaymentData';
import { usePaymentUI } from './usePaymentUI';
import { usePaymentPermissions } from './usePaymentPermissions';
import { usePaymentCache } from './usePaymentCache';
import { Payment, PaymentFilterOptions } from '@/types/payment';

/**
 * Tahsilat yönetimi için merkezi hook
 * Diğer payment hook'larını birleştirerek tek bir API sunar
 */
export const usePaymentManagement = (options: UsePaymentDataOptions = {}) => {
  // Alt hook'ları kullan
  const paymentData = usePaymentData(options);
  const paymentUI = usePaymentUI();
  const { permissions } = usePaymentPermissions();
  const paymentCache = usePaymentCache({
    cacheEnabled: options.cacheEnabled,
    cacheExpirationTime: options.cacheExpirationTime
  });

  // Manuel yenileme işlemi
  const handleRefresh = useCallback(async () => {
    // Önbelleği geçersiz kıl
    paymentCache.invalidatePaymentCache(paymentData.filters);
    
    // Tahsilatları yeniden getir
    await paymentData.fetchPayments();
  }, [paymentData, paymentCache]);

  return {
    // PaymentData hook'undan gelen tüm fonksiyon ve state'ler
    ...paymentData,
    
    // PaymentUI hook'undan gelen formatters
    ...paymentUI,
    
    // İzinler
    permissions,
    
    // Önbellek yönetimi
    invalidateCache: paymentCache.invalidatePaymentCache,
    
    // Manuel yenileme işlemi
    handleRefresh,
  };
};

// Default export
export default usePaymentManagement;