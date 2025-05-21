/**
 * Hizmet önbelleğinin yönetiminden sorumlu hook.
 */
import { useCallback } from 'react';
import { Service } from './useServiceData';
import { ServiceCategory } from './useServiceCategory';

interface UseServiceCacheProps {
  refreshInterval?: number;
}

/**
 * Hizmet önbellekleme hook'u
 */
export const useServiceCache = ({ 
  refreshInterval = 30000 // 30 saniye
}: UseServiceCacheProps = {}) => {
  
  /**
   * Sessiz yenileme - loading state'i etkilemeden verileri günceller
   */
  const silentRefresh = useCallback(async (
    lastOperationTime: React.MutableRefObject<number>,
    fetchServices: () => Promise<void>,
    fetchCategories: () => Promise<void>
  ) => {
    try {
      const now = Date.now();
      const timeSinceLastOperation = now - lastOperationTime.current;
      
      // Son işlemden beri belirlenen aralıktan fazla zaman geçmişse
      if (timeSinceLastOperation > refreshInterval) {
        console.log(`Son işlemden ${Math.floor(timeSinceLastOperation/1000)} saniye geçti, sessiz güncelleme yapılıyor...`);
        
        // Sessiz yenileme yap - loading state'i etkilemeden
        await Promise.all([fetchCategories(), fetchServices()]);
        
        // İşlem zamanını güncelle
        lastOperationTime.current = Date.now();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sessiz yenileme sırasında hata:', error);
      return false;
    }
  }, [refreshInterval]);
  
  /**
   * Yerel servisleri kategorilerle birleştiren fonksiyon
   */
  const mergeServicesWithCategories = useCallback((
    services: Service[], 
    categories: ServiceCategory[]
  ): Service[] => {
    return services.map(service => {
      const category = categories.find(c => c.id === service.categoryId);
      return {
        ...service,
        categoryName: category?.name || 'Kategori Bulunamadı'
      };
    });
  }, []);
  
  /**
   * Hizmet oluşturma/güncelleme sonrası yerel veriyi güncelleyen fonksiyon
   */
  const updateLocalService = useCallback((
    services: Service[],
    newService: Service,
    categories: ServiceCategory[]
  ): Service[] => {
    const category = categories.find(c => c.id === newService.categoryId);
    const updatedService = {
      ...newService,
      categoryName: category?.name || 'Kategori Bulunamadı'
    };
    
    // Servis daha önce varsa güncelle, yoksa ekle
    const serviceExists = services.some(s => s.id === newService.id);
    
    if (serviceExists) {
      return services.map(service => 
        service.id === newService.id ? updatedService : service
      );
    } else {
      return [...services, updatedService];
    }
  }, []);
  
  return {
    silentRefresh,
    mergeServicesWithCategories,
    updateLocalService,
    refreshInterval
  };
};

export default useServiceCache;