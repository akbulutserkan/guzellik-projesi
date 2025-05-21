'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getCustomers, getCustomerById, createCustomer as apiCreateCustomer, updateCustomer as apiUpdateCustomer, deleteCustomer as apiDeleteCustomer } from '@/services/customerService';
import { Customer, CustomerCreateData, CustomerUpdateData } from '@/types/customer';
import { useCustomerCache } from './useCustomerCache';
import { useCustomerUI } from './useCustomerUI';

export interface UseCustomerDataOptions {
  autoFetch?: boolean;
  showToasts?: boolean;
}

export interface UseCustomerDataResult {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  loadCustomers: (forceRefresh?: boolean) => Promise<void>;
  loadCustomerDetail: (id: string) => Promise<void>;
  createCustomer: (data: CustomerCreateData) => Promise<Customer | null>;
  updateCustomer: (id: string, data: CustomerUpdateData) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  sortedCustomers: Customer[];
  handleCreateCustomer: (formData: CustomerCreateData, isFormValid: boolean) => Promise<Customer | null>;
  handleUpdateCustomer: (id: string, formData: CustomerUpdateData, isFormValid: boolean) => Promise<Customer | null>;
}

/**
 * Müşteri verilerini yöneten hook
 */
export const useCustomerData = (
  options: UseCustomerDataOptions = {},
  selectedCustomer: Customer | null,
  setSelectedCustomer: (customer: Customer | null) => void
): UseCustomerDataResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // İlk yüklemeyi takip etmek için bir ref
  const initialFetchDone = useRef<boolean>(false);
  
  // Cache hook'unu kullan
  const { 
    getCache, 
    getCachedCustomer, 
    updateCache, 
    addToCache, 
    updateInCache, 
    removeFromCache, 
    isCacheValid 
  } = useCustomerCache();
  
  // UI hook'unu kullan
  const {
    formatCustomer,
    showSuccessToast,
    showErrorToast
  } = useCustomerUI();
  
  /**
   * Tüm müşterileri yükler
   */
  const loadCustomers = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let data;
      
      if (isCacheValid() && !forceRefresh) {
        // Önbellekteki verileri kullan
        data = getCache();
        console.log('Müşteri verileri önbellekten yüklendi', data?.length);
      } else {
        // Yeni veri yükle
        const result = await getCustomers();
        
        if (!result.success) {
          throw new Error(result.error || 'Müşteri listesi alınırken bir hata oluştu');
        }
        
        data = result.data;
        
        // Önbelleğe al
        updateCache(data);
        console.log('Müşteri verileri API\'den yüklendi', data.length);
      }
      
      // Görüntüleme için formatla - UI hook'unu kullan
      const formattedData = (data || []).map(customer => formatCustomer(customer));
      
      setCustomers(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Müşteri listesi yüklenirken bir hata oluştu';
      setError(errorMessage);
      
      // UI hook'unu kullan
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getCache, isCacheValid, updateCache, formatCustomer, showErrorToast]);
  
  /**
   * Müşteri detayını yükler
   */
  const loadCustomerDetail = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Önce önbellekte ara
      const cachedCustomer = getCachedCustomer(id);
      
      let customerData;
      
      if (cachedCustomer) {
        // Önbellekte varsa kullan
        customerData = cachedCustomer;
        console.log('Müşteri detayı önbellekten yüklendi', id);
      } else {
        // API'den getir
        const result = await getCustomerById(id);
        
        if (!result.success) {
          throw new Error(result.error || `Müşteri detayı alınırken bir hata oluştu (ID: ${id})`);
        }
        
        customerData = result.data;
        console.log('Müşteri detayı API\'den yüklendi', id);
      }
      
      // Görüntüleme için formatla - UI hook'unu kullan
      const formattedData = formatCustomer(customerData);
      
      setSelectedCustomer(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Müşteri detayı yüklenirken bir hata oluştu (ID: ${id})`;
      setError(errorMessage);
      
      // UI hook'unu kullan
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getCachedCustomer, setSelectedCustomer, formatCustomer, showErrorToast]);
  
  /**
   * Yeni müşteri oluşturur
   */
  const createCustomer = useCallback(async (data: CustomerCreateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API'yi çağır
      const result = await apiCreateCustomer(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteri oluşturulurken bir hata oluştu');
      }
      
      const newCustomer = result.data;
      
      // Önbelleğe ekle
      addToCache(newCustomer);
      
      // Görüntüleme için formatla - UI hook'unu kullan
      const formattedCustomer = formatCustomer(newCustomer);
      
      // Listeyi güncelle
      setCustomers(prevCustomers => [...prevCustomers, formattedCustomer]);
      
      // UI hook'unu kullan
      showSuccessToast('Müşteri başarıyla oluşturuldu');
      
      return formattedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Müşteri oluşturulurken bir hata oluştu';
      setError(errorMessage);
      
      // UI hook'unu kullan
      showErrorToast(errorMessage);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addToCache, formatCustomer, showSuccessToast, showErrorToast]);
  
  /**
   * Müşteri bilgilerini günceller
   */
  const updateCustomer = useCallback(async (id: string, data: CustomerUpdateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API'yi çağır
      const result = await apiUpdateCustomer(id, data);
      
      if (!result.success) {
        throw new Error(result.error || `Müşteri güncellenirken bir hata oluştu (ID: ${id})`);
      }
      
      const updatedCustomer = result.data;
      
      // Önbelleği güncelle
      updateInCache(id, updatedCustomer);
      
      // Görüntüleme için formatla - UI hook'unu kullan
      const formattedCustomer = formatCustomer(updatedCustomer);
      
      // Listeyi güncelle
      setCustomers(prevCustomers => 
        prevCustomers.map(c => c.id === id ? formattedCustomer : c)
      );
      
      // Seçili müşteriyi güncelle
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(formattedCustomer);
      }
      
      // UI hook'unu kullan
      showSuccessToast('Müşteri bilgileri güncellendi');
      
      return formattedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Müşteri güncellenirken bir hata oluştu (ID: ${id})`;
      setError(errorMessage);
      
      // UI hook'unu kullan
      showErrorToast(errorMessage);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedCustomer, setSelectedCustomer, updateInCache, formatCustomer, showSuccessToast, showErrorToast]);
  
  /**
   * Müşteri siler
   */
  const deleteCustomer = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API'yi çağır
      const result = await apiDeleteCustomer(id);
      
      if (!result.success) {
        throw new Error(result.error || `Müşteri silinirken bir hata oluştu (ID: ${id})`);
      }
      
      // Önbelleği güncelle
      removeFromCache(id);
      
      // Listeyi güncelle
      setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== id));
      
      // Seçili müşteriyi temizle
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      
      // UI hook'unu kullan
      showSuccessToast('Müşteri silindi');
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Müşteri silinirken bir hata oluştu (ID: ${id})`;
      setError(errorMessage);
      
      // UI hook'unu kullan
      showErrorToast(errorMessage);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [removeFromCache, selectedCustomer, setSelectedCustomer, showSuccessToast, showErrorToast]);
  
  /**
   * Müşteri oluşturma form işlemi
   */
  const handleCreateCustomer = useCallback(async (formData: CustomerCreateData, isFormValid: boolean) => {
    try {
      // Form doğrulama
      if (!isFormValid) {
        showErrorToast('Lütfen tüm zorunlu alanları doldurun');
        return null;
      }
      
      // Müşteri oluştur
      return await createCustomer(formData);
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      return null;
    }
  }, [createCustomer, showErrorToast]);
  
  /**
   * Müşteri güncelleme form işlemi
   */
  const handleUpdateCustomer = useCallback(async (id: string, formData: CustomerUpdateData, isFormValid: boolean) => {
    try {
      // Form doğrulama
      if (!isFormValid) {
        showErrorToast('Lütfen tüm zorunlu alanları doldurun');
        return null;
      }
      
      // Müşteri güncelle
      return await updateCustomer(id, formData);
    } catch (error) {
      console.error('Müşteri güncelleme hatası:', error);
      return null;
    }
  }, [updateCustomer, showErrorToast]);
  
  // İlk yükleme
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Eğer autoFetch true ise ve ilk yükleme henüz yapılmadıysa
    if (options.autoFetch !== false && !initialFetchDone.current) {
      initialFetchDone.current = true;
      loadCustomers();
    }
  }, []);  // Boş bağımlılık dizisi - sadece bir kez çalışır
  
  // Sıralanmış müşteriler
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [customers]);

  return {
    customers,
    isLoading,
    error,
    loadCustomers,
    loadCustomerDetail,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    sortedCustomers,
    handleCreateCustomer,
    handleUpdateCustomer
  };
};
