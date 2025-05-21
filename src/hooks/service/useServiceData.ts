'use client';

import { useState, useCallback, useRef } from 'react';

// Import servis fonksiyonları
import { getServices, getServiceById, createService as apiCreateService, updateService as apiUpdateService, deleteService as apiDeleteService } from '@/services/serviceService';
import { useServiceUI } from './useServiceUI';

// Tip tanımlamaları
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  categoryId: string;
  categoryName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceFilterOptions {
  categoryId?: string;
  isActive?: boolean;
  searchQuery?: string;
  includeDeleted?: boolean;
}

interface UseServiceDataProps {
  initialServices?: Service[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

/**
 * Hizmet verileri hook'u
 */
export const useServiceData = ({
  initialServices = [],
  autoFetch = true,
  showToasts = true
}: UseServiceDataProps = {}) => {
  // State
  const [services, setServices] = useState<Service[]>(initialServices);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  // İşlem takibi için referanslar
  const lastOperationTime = useRef(Date.now());
  
  // Filtreler
  const [filters, setFilters] = useState<ServiceFilterOptions>({
    categoryId: undefined,
    isActive: undefined,
    searchQuery: ''
  });
  
  // Form state
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    price: 0,
    duration: 30,
    categoryId: '',
    isActive: true
  });
  
  // UI hook'unu kullan
  const { formatService, showSuccessToast, showErrorToast } = useServiceUI();
  
  /**
   * Hizmetleri getiren fonksiyon
   */
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getServices(filters.includeDeleted);
      
      if (!response.success) {
        throw new Error(response.error || 'Hizmetler yüklenirken bir hata oluştu');
      }
      
      let filteredServices = response.data;
      
      // Backend API'de filtre yoksa client tarafında filtreleyelim
      if (Array.isArray(filteredServices)) {
        // Kategori ID filtresi
        if (filters.categoryId) {
          filteredServices = filteredServices.filter(service => 
            service.categoryId === filters.categoryId
          );
        }
        
        // Aktiflik durumu filtresi
        if (filters.isActive !== undefined) {
          filteredServices = filteredServices.filter(service => 
            service.isActive === filters.isActive
          );
        }
        
        // Arama sorgusu filtresi
        if (filters.searchQuery) {
          const searchLower = filters.searchQuery.toLowerCase();
          filteredServices = filteredServices.filter(service => 
            service.name.toLowerCase().includes(searchLower)
          );
        }
      }
      
      setServices(Array.isArray(filteredServices) ? filteredServices : []);
      
      // Veri çekme işlemi başarılı olduysa son işlem zamanını güncelle
      lastOperationTime.current = Date.now();
    } catch (error) {
      setError('Hizmetler yüklenirken bir hata oluştu');
      console.error('Hizmetler yüklenirken hata:', error);
      if (showToasts) {
        showErrorToast(error.message || 'Hizmetler yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, showToasts, showErrorToast]);
  
  /**
   * ID'ye göre hizmet detayını getiren fonksiyon
   */
  const fetchServiceDetails = useCallback(async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getServiceById(serviceId);
      
      if (!response.success) {
        throw new Error(response.error || 'Hizmet detayları yüklenirken bir hata oluştu');
      }
      
      const service = response.data;
      setSelectedService(service);
      
      // Form verilerini doldur
      setServiceFormData({
        name: service.name || '',
        price: service.price || 0,
        duration: service.duration || 30,
        categoryId: service.categoryId || '',
        isActive: service.isActive !== undefined ? service.isActive : true
      });
      
      return service;
    } catch (error) {
      setError('Hizmet detayları yüklenirken bir hata oluştu');
      console.error('Hizmet detayları yüklenirken hata:', error);
      if (showToasts) {
        showErrorToast(error.message || 'Hizmet detayları yüklenirken bir hata oluştu');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);
  
  /**
   * Yeni hizmet oluşturan fonksiyon
   */
  const createService = useCallback(async (serviceData = serviceFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("createService çağrıldı, form verileri:", serviceData);
      
      // Form verilerini kontrol et
      if (!serviceData.name || !serviceData.categoryId) {
        console.error("Eksik hizmet verileri:", 
          !serviceData.name ? "Hizmet adı eksik" : "", 
          !serviceData.categoryId ? "Kategori ID eksik" : ""
        );
        throw new Error("Hizmet adı ve kategori ID gereklidir");
      }
      
      // Açıklama alanını hariç tutarak yeni hizmet oluştur
      const { name, price, duration, categoryId, isActive } = serviceData;
      const newServiceData = { name, price, duration, categoryId, isActive };
      
      const response = await apiCreateService(newServiceData);
      console.log("Hizmet API yanıtı:", response);
      
      if (!response.success) {
        throw new Error(response.error || 'Hizmet oluşturulurken bir hata oluştu');
      }
      
      const newService = response.data;
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      if (showToasts) {
        showSuccessToast('Hizmet başarıyla oluşturuldu');
      }
      
      return newService;
    } catch (error: any) {
      console.error("Hizmet oluşturma hatası:", error);
      setError(error instanceof Error ? error.message : 'Hizmet oluşturulurken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast(error.message || 'Hizmet oluşturulurken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [serviceFormData, showToasts, showSuccessToast, showErrorToast]);
  
  /**
   * Hizmet güncelleyen fonksiyon
   */
  const updateService = useCallback(async (serviceId: string, serviceData = serviceFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Hizmet güncelleniyor, veriler:', { id: serviceId, ...serviceData });
      
      // Yeni API yapısına uygun güncelleme verileri (açıklama alanını hariç tutuyoruz)
      const { name, price, duration, categoryId, isActive } = serviceData;
      const updatedData = { name, price, duration, categoryId, isActive };
      
      const response = await apiUpdateService(serviceId, updatedData);
      console.log('API yanıtı:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Hizmet güncellenirken bir hata oluştu');
      }
      
      const updatedService = response.data;
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      if (showToasts) {
        showSuccessToast('Hizmet başarıyla güncellendi');
      }
      
      return updatedService;
    } catch (error: any) {
      console.error('Hizmet güncelleme hatası:', error);
      setError(error instanceof Error ? error.message : 'Hizmet güncellenirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast(error.message || 'Hizmet güncellenirken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [serviceFormData, showToasts, showSuccessToast, showErrorToast]);
  
  /**
   * Hizmet silen fonksiyon
   */
  const deleteService = useCallback(async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[SİLME-DETAY] useServiceData - deleteService: Başlatılıyor, serviceId: ${serviceId}`);
      
      const response = await apiDeleteService(serviceId);
      
      console.log(`[SİLME-DETAY] useServiceData - deleteService: API yanıtı alındı:`, response);
      
      if (!response.success) {
        console.error(`[SİLME-DETAY] useServiceData - deleteService: API hatası:`, response.error);
        throw new Error(response.error || 'Hizmet silinirken bir hata oluştu');
      }
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      console.log(`[SİLME-DETAY] useServiceData - deleteService: İşlem başarılı`);
      
      if (showToasts) {
        showSuccessToast('Hizmet başarıyla silindi');
      }
      
      return true;
    } catch (error) {
      setError('Hizmet silinirken bir hata oluştu');
      console.error('[SİLME-DETAY] useServiceData - deleteService: HATA:', error);
      console.error('[SİLME-DETAY] useServiceData - deleteService: HATA MESAJI:', error.message || 'Bilinmeyen hata');
      
      if (showToasts) {
        showErrorToast(error.message || 'Hizmet silinirken bir hata oluştu');
      }
      
      return false;
    } finally {
      setLoading(false);
      console.log(`[SİLME-DETAY] useServiceData - deleteService: İşlem tamamlandı`);
    }
  }, [showToasts, showSuccessToast, showErrorToast]);
  
  /**
   * Hizmet durumunu değiştiren fonksiyon (aktif/pasif)
   */
  const toggleServiceStatus = useCallback(async (serviceId: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      // ServicesService.update kullanarak sadece isActive durumunu güncelle
      const response = await apiUpdateService(serviceId, { isActive });
      
      if (!response.success) {
        throw new Error(response.error || `Hizmet ${isActive ? 'aktifleştirilirken' : 'pasifleştirilirken'} bir hata oluştu`);
      }
      
      const updatedService = response.data;
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      if (showToasts) {
        showSuccessToast(`Hizmet başarıyla ${isActive ? 'aktifleştirildi' : 'pasifleştirildi'}`);
      }
      
      return updatedService;
    } catch (error) {
      const errorMessage = `Hizmet ${isActive ? 'aktifleştirilirken' : 'pasifleştirilirken'} bir hata oluştu`;
      setError(errorMessage);
      console.error(errorMessage, error);
      
      if (showToasts) {
        showErrorToast(error.message || errorMessage);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, showSuccessToast, showErrorToast]);
  
  /**
   * Filtre değişikliklerini işleyen fonksiyon
   */
  const handleFilterChange = useCallback((newFilters: Partial<ServiceFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  /**
   * Hizmet form verilerini değiştiren fonksiyon
   */
  const handleServiceFormChange = useCallback((field: string, value: any) => {
    setServiceFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  return {
    // State
    services,
    selectedService,
    setSelectedService,
    loading,
    error,
    filters,
    serviceFormData,
    setServiceFormData,
    
    // CRUD İşlemleri
    fetchServices,
    fetchServiceDetails,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    
    // Form işlemleri
    handleServiceFormChange,
    handleFilterChange,
    
    // Referanslar
    lastOperationTime
  };
};

export default useServiceData;