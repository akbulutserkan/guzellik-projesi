'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ApiService } from '@/services/api';
import { Product, Customer, Staff } from '@/types/product';

export interface UseProductSaleEntitiesOptions {
  autoFetch?: boolean;
  showToasts?: boolean;
}

export interface UseProductSaleEntitiesResult {
  products: Product[];
  customers: Customer[];
  staffs: Staff[];
  productsLoading: boolean;
  customersLoading: boolean;
  staffsLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchStaffs: () => Promise<void>;
}

/**
 * Ürün satışı için gerekli varlıkları (ürünler, müşteriler, personel) getiren hook
 */
export const useProductSaleEntities = ({
  autoFetch = true,
  showToasts = true
}: UseProductSaleEntitiesOptions = {}): UseProductSaleEntitiesResult => {
  // Entity states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  
  // Loading states
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);
  const [staffsLoading, setStaffsLoading] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Helper hooks
  const { toast } = useToast();
  
  /**
   * Ürünleri getiren fonksiyon
   */
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setError(null);
      
      const response = await ApiService.products.getList(false, showToasts);
      
      if (!response || Array.isArray(response)) {
        // Eğer doğrudan dizi döndüyse, kullan
        setProducts(response || []);
      } else if (response.success) {
        // API yanıtında success ve data varsa kullan
        setProducts(response.data || []);
      } else {
        throw new Error(response.error || 'Ürünler yüklenirken bir hata oluştu');
      }
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Ürünler yüklenirken bir hata oluştu');
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Ürünler yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      }
    } finally {
      setProductsLoading(false);
    }
  }, [showToasts, toast]);
  
  /**
   * Müşterileri getiren fonksiyon
   */
  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      setError(null);
      
      // Müşterileri API üzerinden al
      const response = await ApiService.customers.getList(false);
      
      if (!response || Array.isArray(response)) {
        // Eğer doğrudan dizi döndüyse kullan
        setCustomers(response || []);
      } else if (response.success) {
        // API yanıtında success ve data varsa kullan
        setCustomers(response.data || []);
      } else {
        throw new Error(response.error || 'Müşteriler yüklenirken bir hata oluştu');
      }
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Müşteriler yüklenirken bir hata oluştu');
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Müşteriler yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      }
    } finally {
      setCustomersLoading(false);
    }
  }, [showToasts, toast]);
  
  /**
   * Personelleri getiren fonksiyon
   */
  const fetchStaffs = useCallback(async () => {
    try {
      setStaffsLoading(true);
      setError(null);
      
      const response = await ApiService.productSales.getAuthorizedStaff(showToasts);
      
      if (!response.success) {
        throw new Error(response.error || 'Yetkili personel listesi alınamadı');
      }
      
      // API cevap formatına göre gerekli alanı çıkar
      let staffData = response.data;
      
      // Backend API yanıt formatını normalize et
      if (response.data?.activeStaff) {
        staffData = response.data.activeStaff;
      } else if (response.data?.allStaff) {
        staffData = response.data.allStaff;
      }
      
      setStaffs(staffData || []);
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Personeller yüklenirken bir hata oluştu');
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Personeller yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      }
    } finally {
      setStaffsLoading(false);
    }
  }, [showToasts, toast]);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
      fetchCustomers();
      fetchStaffs();
    }
  }, [autoFetch, fetchProducts, fetchCustomers, fetchStaffs]);
  
  return {
    products,
    customers,
    staffs,
    productsLoading,
    customersLoading,
    staffsLoading,
    error,
    fetchProducts,
    fetchCustomers,
    fetchStaffs
  };
};
