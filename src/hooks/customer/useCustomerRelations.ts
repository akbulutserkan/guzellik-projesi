'use client';

import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { callMcpApi } from '@/lib/mcp/helpers';

export interface UseCustomerRelationsResult {
  getCustomerAppointments: (customerId: string) => Promise<any[]>;
  getCustomerProductSales: (customerId: string) => Promise<any[]>;
  getCustomerPackageSales: (customerId: string) => Promise<any[]>;
}

/**
 * Müşteri ilişkili verilerini yöneten hook
 */
export const useCustomerRelations = (): UseCustomerRelationsResult => {
  /**
   * Müşteri randevularını getirir
   */
  const getCustomerAppointments = useCallback(async (customerId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await callMcpApi('get-customer-appointments', { customerId, sinceDate: today }, {
        showToast: false,
        customErrorMsg: 'Müşteri randevuları alınırken bir hata oluştu'
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteri randevuları alınırken bir hata oluştu');
      }
      
      return result.data;
    } catch (err) {
      console.error('Müşteri randevuları yüklenirken hata:', err);
      
      toast({
        title: 'Hata',
        description: 'Müşteri randevuları yüklenirken bir hata oluştu',
        variant: 'destructive'
      });
      
      return [];
    }
  }, []);
  
  /**
   * Müşteri ürün satışlarını getirir
   */
  const getCustomerProductSales = useCallback(async (customerId: string) => {
    try {
      const result = await callMcpApi('get-customer-product-sales', { customerId }, {
        showToast: false,
        customErrorMsg: 'Müşteri ürün satışları alınırken bir hata oluştu'
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteri ürün satışları alınırken bir hata oluştu');
      }
      
      return result.data;
    } catch (err) {
      console.error('Müşteri ürün satışları yüklenirken hata:', err);
      
      toast({
        title: 'Hata',
        description: 'Müşteri ürün satışları yüklenirken bir hata oluştu',
        variant: 'destructive'
      });
      
      return [];
    }
  }, []);
  
  /**
   * Müşteri paket satışlarını getirir
   */
  const getCustomerPackageSales = useCallback(async (customerId: string) => {
    try {
      const result = await callMcpApi('get-customer-package-sales', { customerId }, {
        showToast: false,
        customErrorMsg: 'Müşteri paket satışları alınırken bir hata oluştu'
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteri paket satışları alınırken bir hata oluştu');
      }
      
      return result.data;
    } catch (err) {
      console.error('Müşteri paket satışları yüklenirken hata:', err);
      
      toast({
        title: 'Hata',
        description: 'Müşteri paket satışları yüklenirken bir hata oluştu',
        variant: 'destructive'
      });
      
      return [];
    }
  }, []);

  return {
    getCustomerAppointments,
    getCustomerProductSales,
    getCustomerPackageSales
  };
};
