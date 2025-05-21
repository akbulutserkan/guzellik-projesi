/**
 * Hizmet durumunun yönetiminden sorumlu hook.
 */
import { useCallback, useMemo } from 'react';
import { Service } from './useServiceData';
import { ServiceCategory } from './useServiceCategory';

/**
 * Hizmet durumu hook'u
 */
export const useServiceStatus = (services: Service[], categories: ServiceCategory[]) => {
  
  /**
   * Servislerin aktiflik durumu istatistikleri
   */
  const activeServicesCount = useMemo(() => 
    services.filter(service => service.isActive).length, 
    [services]
  );
  
  const inactiveServicesCount = useMemo(() => 
    services.filter(service => !service.isActive).length, 
    [services]
  );
  
  /**
   * Kategorilere göre servis gruplandırması
   */
  const servicesByCategory = useMemo(() => {
    const result: Record<string, Service[]> = {};
    
    categories.forEach(category => {
      result[category.id] = services.filter(service => service.categoryId === category.id);
    });
    
    return result;
  }, [services, categories]);
  
  /**
   * Hizmeti olmayan kategoriler
   */
  const emptyCategories = useMemo(() => 
    categories.filter(category => 
      !services.some(service => service.categoryId === category.id)
    ),
    [categories, services]
  );
  
  /**
   * Kategoriye göre servis sayıları
   */
  const serviceCounts = useMemo(() => {
    const result: Record<string, { total: number, active: number }> = {};
    
    categories.forEach(category => {
      const categoryServices = services.filter(service => service.categoryId === category.id);
      const activeServices = categoryServices.filter(service => service.isActive);
      
      result[category.id] = {
        total: categoryServices.length,
        active: activeServices.length
      };
    });
    
    return result;
  }, [services, categories]);
  
  /**
   * Kategorinin adını bulan fonksiyon
   */
  const getCategoryName = useCallback((categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Kategori Bulunamadı';
  }, [categories]);
  
  /**
   * Kategori bazlı hizmet istatistikleri için yardımcı fonksiyon
   */
  const getCategoryStats = useCallback((categoryId: string) => {
    const categoryServices = services.filter(service => service.categoryId === categoryId);
    const activeCount = categoryServices.filter(service => service.isActive).length;
    const inactiveCount = categoryServices.length - activeCount;
    
    return {
      total: categoryServices.length,
      active: activeCount,
      inactive: inactiveCount,
      isEmpty: categoryServices.length === 0
    };
  }, [services]);
  
  return {
    // Hesaplanan değerler
    activeServicesCount,
    inactiveServicesCount,
    servicesByCategory,
    emptyCategories,
    serviceCounts,
    
    // Yardımcı fonksiyonlar
    getCategoryName,
    getCategoryStats
  };
};

export default useServiceStatus;