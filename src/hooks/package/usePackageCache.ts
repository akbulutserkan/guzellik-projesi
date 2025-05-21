/**
 * Paket Önbellek Hook'u
 * 
 * Bu hook, paket verilerinin önbelleklenmesini sağlayarak
 * aynı verilerin tekrar tekrar API'den çekilmesini önler.
 * 
 * Ayrıca detaylı yükleme durumu yönetimi sağlar.
 */

import { useState, useCallback } from 'react';
import { packageCache, CacheKeys, cacheUtils } from '@/utils/cache/packageCache';
import { getPackages, getPackageById, getPackageCategories } from '@/services/packageService';
import { getServices } from '@/services/serviceService';
import { PackageWithServices } from '@/types/package';

// Yükleme durumu tipi - daha detaylı yükleme yönetimi için
enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface LoadingInfo {
  state: LoadingState;
  error?: string;
  lastUpdated?: number;
}

interface UsePackageCacheProps {
  cacheEnabled?: boolean;
  cacheDuration?: number; // milisaniye
}

/**
 * Paket verilerini önbellekleme hook'u
 */
export const usePackageCache = ({
  cacheEnabled = true,
  cacheDuration = 5 * 60 * 1000 // 5 dakika
}: UsePackageCacheProps = {}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingInfo>>({});

  // Hook başlatıldığında önbellek süresini ayarla
  packageCache.setCacheDuration(cacheDuration);

  /**
   * Belirli bir işlem için yükleme durumunu günceller
   */
  const setLoading = useCallback((key: string, state: LoadingState, error?: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        state,
        error,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  /**
   * Belirli bir işlem için yükleme durumunu verir
   */
  const getLoadingState = useCallback((key: string): LoadingInfo => {
    return loadingStates[key] || { state: LoadingState.IDLE };
  }, [loadingStates]);

  /**
   * Tüm paketleri getiren fonksiyon (önbellekten veya API'den)
   * @param includeInactive Silinmiş paketleri de dahil etme seçeneği
   * @param bypassCache Önbelleği atlayıp doğrudan API'den çekme seçeneği
   */
  const fetchPackages = useCallback(async (includeInactive: boolean = false, bypassCache: boolean = false): Promise<PackageWithServices[]> => {
    console.log(`[PACKAGE-CACHE] fetchPackages çağrıldı, includeInactive: ${includeInactive}, cacheEnabled: ${cacheEnabled}, bypassCache: ${bypassCache}`);
    console.log(`[PACKAGE-CACHE] Zaman damgası: ${new Date().toISOString()}`);
    
    // Yüklemede olduğunu belirt
    setLoading('packages', LoadingState.LOADING);
    console.log(`[PACKAGE-CACHE] setLoading('packages', LOADING) yapıldı`);

    try {
      const cacheKey = includeInactive ? CacheKeys.ALL_PACKAGES : CacheKeys.ACTIVE_PACKAGES;
      console.log(`[PACKAGE-CACHE] Kullanılacak cacheKey: ${cacheKey}`);

      // Eğer bypassCache true ise doğrudan API'den getir
      if (bypassCache || !cacheEnabled) {
        console.log(`[PACKAGE-CACHE] ${bypassCache ? 'bypassCache=true' : 'cacheEnabled=false'}, doğrudan API çağrısı yapılıyor...`);
        
        let result;
        try {
          console.log(`[PACKAGE-CACHE] API'yi direkt çağırıyoruz: getPackages(${{ includeDeleted: includeInactive }})`);          
          result = await getPackages({ includeDeleted: includeInactive });
          console.log(`[PACKAGE-CACHE] API yanıtı alındı, yanıt tipi: ${typeof result}`);
        } catch (apiError) {
          console.error(`[PACKAGE-CACHE] API çağrısında hata: ${apiError.message}`);
          console.error(`[PACKAGE-CACHE] API hata stack: ${apiError.stack}`);
          throw apiError;
        }
        
        console.log(`[PACKAGE-CACHE] API yanıtı alındı, başarılı: ${result.success}`);
        console.log(`[PACKAGE-CACHE] API hata var mı?: ${result.error ? 'EVET' : 'HAYIR'}`);
        console.log(`[PACKAGE-CACHE] Veri mevcut mu?: ${result.data ? 'EVET' : 'HAYIR'}`);
        console.log(`[PACKAGE-CACHE] Veri sayısı: ${result.data ? (Array.isArray(result.data) ? result.data.length : 'dizi değil') : 'veri yok'}`);
        
        // Bypasscache ile çağrıldıysa, önbelleğe kaydet (değersiz tekrarlamamak için)
        if (bypassCache && cacheEnabled && result.success && result.data) {
          console.log(`[PACKAGE-CACHE] Doğrudan API'den alınan veriler önbelleğe kaydediliyor...`);
          try {
            packageCache.set(cacheKey, result.data); 
            console.log(`[PACKAGE-CACHE] Veri önbelleğe kaydedildi: ${cacheKey}`);
          } catch (cacheSetError) {
            console.error(`[PACKAGE-CACHE] Önbelleğe kaydetme hatası: ${cacheSetError.message}`);
          }
        }
        
        setLoading('packages', LoadingState.SUCCESS);
        return result.data || [];
      }

      // Önbellek durumunu kontrol et
      try {
        const cachedData = packageCache.get(cacheKey);
        console.log(`[PACKAGE-CACHE] Önbellek kontrolü: ${cachedData ? 'Veri bulundu' : 'Veri yok'}`);
        if (cachedData) {
          console.log(`[PACKAGE-CACHE] Önbellekteki veri tipi: ${typeof cachedData}`); 
          console.log(`[PACKAGE-CACHE] Önbellekteki veri dizi mi: ${Array.isArray(cachedData)}`); 
          if (Array.isArray(cachedData)) {
            console.log(`[PACKAGE-CACHE] Önbellekteki veri sayısı: ${cachedData.length}`); 
          }
        }
      } catch (cacheCheckError) {
        console.error(`[PACKAGE-CACHE] Önbellek kontrolü sırasında hata: ${cacheCheckError.message}`);
      }

      // Normal akış - önbellekten veya API'den veriyi al
      if (cacheEnabled) {
        console.log(`[PACKAGE-CACHE] Önbellek etkin, cacheUtils.getOrFetch çağrılıyor...`);
        
        // getPackages çağrısını ayrıca logla
        console.log(`[PACKAGE-CACHE] getPackages fonksiyonu çağrılacak, parametreler: ${{ includeDeleted: includeInactive }}`);
        
        let result;
        try {
          result = await cacheUtils.getOrFetch(cacheKey, () => getPackages({ includeDeleted: includeInactive }));
          console.log(`[PACKAGE-CACHE] getOrFetch yanıtı alındı, yanıt tipi: ${typeof result}`);
          console.log(`[PACKAGE-CACHE] getOrFetch başarı durumu: ${result.success}`);
          console.log(`[PACKAGE-CACHE] getOrFetch hata var mı?: ${result.error ? 'EVET' : 'HAYIR'}`);
          if (result.error) {
            console.error(`[PACKAGE-CACHE] getOrFetch hatası: ${result.error}`);
          }
        } catch (fetchError) {
          console.error(`[PACKAGE-CACHE] getOrFetch sırasında hata: ${fetchError.message}`);
          console.error(`[PACKAGE-CACHE] Hata stack: ${fetchError.stack}`);
          throw fetchError;
        }
        
        console.log(`[PACKAGE-CACHE] getOrFetch yanıtı alındı, başarılı: ${result.success}`);
        console.log(`[PACKAGE-CACHE] Veri mevcut mu?: ${result.data ? 'EVET' : 'HAYIR'}`);
        
        if (result.data) {
          console.log(`[PACKAGE-CACHE] Veri tipi: ${typeof result.data}`);
          console.log(`[PACKAGE-CACHE] Veri dizi mi?: ${Array.isArray(result.data)}`);
          console.log(`[PACKAGE-CACHE] Veri sayısı: ${Array.isArray(result.data) ? result.data.length : 'dizi değil'}`);
          
          // İlk paketi kontrol et
          if (Array.isArray(result.data) && result.data.length > 0) {
            const firstPackage = result.data[0];
            console.log(`[PACKAGE-CACHE] İlk paket ID: ${firstPackage.id}`);
            console.log(`[PACKAGE-CACHE] İlk paket adı: ${firstPackage.name}`);
            console.log(`[PACKAGE-CACHE] İlk paket alanları: ${Object.keys(firstPackage).join(', ')}`);
            console.log(`[PACKAGE-CACHE] Services alanı var mı?: ${!!firstPackage.services}`);
            if (firstPackage.services) {
              console.log(`[PACKAGE-CACHE] Services tipi: ${typeof firstPackage.services}`);
              console.log(`[PACKAGE-CACHE] Services sayısı: ${Array.isArray(firstPackage.services) ? firstPackage.services.length : 'dizi değil'}`);
            }
          }
        }
        
        setLoading('packages', LoadingState.SUCCESS);
        console.log(`[PACKAGE-CACHE] Yükleme durumu SUCCESS olarak ayarlandı`);
        
        // Veriyi döndürmeden önce son kontrol yap
        if (!result.data) {
          console.warn(`[PACKAGE-CACHE] Dönüş verisi null veya undefined, boş dizi dönülüyor`);
          return [];
        }
        
        if (!Array.isArray(result.data)) {
          console.warn(`[PACKAGE-CACHE] Dönüş verisi dizi değil: ${typeof result.data}, boş dizi dönülüyor`);
          return [];
        }
        
        return result.data;
      } else {
        // Önbellek devre dışıysa direkt API'den al
        console.log(`[PACKAGE-CACHE] Önbellek devre dışı, doğrudan API çağrısı yapılıyor...`);
        
        let result;
        try {
          console.log(`[PACKAGE-CACHE] API'yi direkt çağırıyoruz: getPackages(${{ includeDeleted: includeInactive }})`);
          result = await getPackages({ includeDeleted: includeInactive });
          console.log(`[PACKAGE-CACHE] API yanıtı alındı, yanıt tipi: ${typeof result}`);
        } catch (apiError) {
          console.error(`[PACKAGE-CACHE] API çağrısında hata: ${apiError.message}`);
          console.error(`[PACKAGE-CACHE] API hata stack: ${apiError.stack}`);
          throw apiError;
        }
        
        console.log(`[PACKAGE-CACHE] API yanıtı alındı, başarılı: ${result.success}`);
        console.log(`[PACKAGE-CACHE] API hata var mı?: ${result.error ? 'EVET' : 'HAYIR'}`);
        console.log(`[PACKAGE-CACHE] Veri mevcut mu?: ${result.data ? 'EVET' : 'HAYIR'}`);
        console.log(`[PACKAGE-CACHE] Veri sayısı: ${result.data ? (Array.isArray(result.data) ? result.data.length : 'dizi değil') : 'veri yok'}`);
        
        setLoading('packages', LoadingState.SUCCESS);
        
        return result.data || [];
      }
    } catch (error) {
      // Hata durumunu kaydet
      console.error(`[PACKAGE-CACHE] Ana hata yakalandı: ${error.message}`);
      console.error(`[PACKAGE-CACHE] Hata detayları:`, error);
      console.error(`[PACKAGE-CACHE] Hata yığını: ${error.stack}`);
      
      // Daha ayrıntılı hata mesajları
      let errorMsg = 'Paketler alınırken hata oluştu';
      
      if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Sunucu bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.';
      } else if (error.code === 'TIMEOUT') {
        errorMsg = 'Sunucu yanıt vermede zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.';
      } else if (error.response?.status === 404) {
        errorMsg = 'İstenen kaynaklar bulunamadı.';
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      setLoading('packages', LoadingState.ERROR, errorMsg);
      console.log(`[PACKAGE-CACHE] Yükleme durumu ERROR olarak ayarlandı: ${errorMsg}`);
      
      // Boş dizi döndür
      return [];
    } finally {
      // İşlem tamamlandı bilgisi
      console.log(`[PACKAGE-CACHE] fetchPackages işlemi tamamlandı, zaman: ${new Date().toISOString()}`);
    }
  }, [cacheEnabled, setLoading, getPackages]);

  /**
   * ID'ye göre paket detaylarını getiren fonksiyon (önbellekten veya API'den)
   */
  const fetchPackageById = useCallback(async (id: string): Promise<PackageWithServices> => {
    // Yüklemede olduğunu belirt
    setLoading(`package:${id}`, LoadingState.LOADING);

    try {
      // Önbellekten veya API'den veriyi al
      if (cacheEnabled) {
        const cacheKey = CacheKeys.PACKAGE_BY_ID(id);
        const result = await cacheUtils.getOrFetch(cacheKey, () => getPackageById(id));
        setLoading(`package:${id}`, LoadingState.SUCCESS);
        return result.data;
      } else {
        // Önbellek devre dışıysa direkt API'den al
        const result = await getPackageById(id);
        setLoading(`package:${id}`, LoadingState.SUCCESS);
        return result.data;
      }
    } catch (error) {
      // Hata durumunu kaydet
      setLoading(`package:${id}`, LoadingState.ERROR, error instanceof Error ? error.message : 'Paket detayları alınırken hata oluştu');
      throw error;
    } finally {
      // Yükleme durumunu güncelleme artık burada yapılmıyor
    }
  }, [cacheEnabled, setLoading]);

  /**
   * Paket kategorilerini getiren fonksiyon (önbellekten veya API'den)
   */
  const fetchCategories = useCallback(async (): Promise<any[]> => {
    // Yüklemede olduğunu belirt
    setLoading('categories', LoadingState.LOADING);

    try {
      // Önbellekten veya API'den veriyi al
      if (cacheEnabled) {
        const result = await cacheUtils.getOrFetch(CacheKeys.CATEGORIES, () => getPackageCategories());
        setLoading('categories', LoadingState.SUCCESS);
        return result.data || [];
      } else {
        // Önbellek devre dışıysa direkt API'den al
        const result = await getPackageCategories();
        setLoading('categories', LoadingState.SUCCESS);
        return result.data || [];
      }
    } catch (error) {
      // Hata durumunu kaydet
      setLoading('categories', LoadingState.ERROR, error instanceof Error ? error.message : 'Kategoriler alınırken hata oluştu');
      throw error;
    } finally {
      // Yükleme durumunu güncelleme artık burada yapılmıyor
    }
  }, [cacheEnabled, setLoading]);

  /**
   * Hizmetleri getiren fonksiyon (API isteği sayısını azalttık)
   */
  const fetchServices = useCallback(async (categoryId?: string): Promise<any[]> => {
    // Yüklemede olduğunu belirt
    const loadingKey = categoryId ? `services:${categoryId}` : 'services';
    setLoading(loadingKey, LoadingState.LOADING);

    try {
      let servicesData = [];
      
      // İstekleri azaltmak için basitleştirilmiş yöntem kullan
      try {
        const response = await fetch('/api/services');
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          servicesData = result.data;
          
          // Önbellekte sakla
          if (cacheEnabled) {
            const cacheKey = categoryId ? 
              CacheKeys.SERVICES_BY_CATEGORY(categoryId) : 
              CacheKeys.SERVICES;
              
            packageCache.set(cacheKey, { success: true, data: servicesData });
          }
        }
      } catch (error) {
        console.error(`[PACKAGE-CACHE] Servis yükleme hatası:`, error);
      }
      
      // Kategori filtresi uygulanmışsa, filtreleme yap
      if (categoryId && servicesData.length > 0) {
        servicesData = servicesData.filter(service => service.categoryId === categoryId);
      }

      setLoading(loadingKey, LoadingState.SUCCESS);
      return servicesData;
    } catch (error) {
      // Hata durumunu kaydet
      setLoading(loadingKey, LoadingState.ERROR, 
        error instanceof Error ? error.message : 'Hizmetler alınırken hata oluştu');
      
      // Boş dizi döndür - uygulamayı çalışmaya devam etmesi için
      return [];
    }
  }, [cacheEnabled, setLoading]);

  /**
   * Paket ile ilgili önbelleği temizleyen fonksiyon
   */
  const invalidatePackageCache = useCallback((id?: string) => {
    console.log(`[PACKAGE-CACHE] invalidatePackageCache çağrıldı${id ? ` (ID: ${id})` : ''}`);
    
    if (id) {
      // Belirli bir paketi önbellekten temizle
      console.log(`[PACKAGE-CACHE] ${CacheKeys.PACKAGE_BY_ID(id)} önbellekten temizleniyor...`);
      packageCache.remove(CacheKeys.PACKAGE_BY_ID(id));
    }
    
    // Tüm paket listesini önbellekten temizle
    console.log(`[PACKAGE-CACHE] ${CacheKeys.ALL_PACKAGES} önbellekten temizleniyor...`);
    packageCache.remove(CacheKeys.ALL_PACKAGES);
    
    console.log(`[PACKAGE-CACHE] ${CacheKeys.ACTIVE_PACKAGES} önbellekten temizleniyor...`);
    packageCache.remove(CacheKeys.ACTIVE_PACKAGES);
    
    console.log(`[PACKAGE-CACHE] Paket önbelleği temizlendi${id ? ` (ID: ${id})` : ''}`);
  }, []);
  
  /**
   * Paket önbelleğini temizleyip paket listesini yeniden yükleyen fonksiyon
   */
  const forceRefreshPackages = useCallback(async (includeInactive: boolean = false) => {
    console.log(`[PACKAGE-CACHE] forceRefreshPackages çağrıldı, tüm önbellek zorla temizleniyor...`);
    
    // Önce tüm paket önbelleğini temizle
    invalidatePackageCache();
    
    // Sonra paketleri yeniden yükle
    try {
      console.log(`[PACKAGE-CACHE] Paketler yeniden yükleniyor...`);
      const result = await fetchPackages(includeInactive);
      console.log(`[PACKAGE-CACHE] Paketler yeniden yüklendi, ${Array.isArray(result) ? result.length : 0} paket alındı`);
      return result;
    } catch (error) {
      console.error(`[PACKAGE-CACHE] Paketleri yeniden yüklerken hata:`, error);
      throw error;
    }
  }, [invalidatePackageCache]);

  /**
   * Tüm önbelleği temizleyen fonksiyon
   */
  const clearAllCache = useCallback(() => {
    packageCache.clear();
    console.log('Tüm önbellek temizlendi');
  }, []);

  /**
   * Belirli bir işlem yükleniyor mu?
   */
  const isLoading = useCallback((key: string): boolean => {
    return getLoadingState(key).state === LoadingState.LOADING;
  }, [getLoadingState]);

  /**
   * Belirli bir işlem hata verdi mi?
   */
  const isError = useCallback((key: string): boolean => {
    return getLoadingState(key).state === LoadingState.ERROR;
  }, [getLoadingState]);

  /**
   * Belirli bir işlem başarılı oldu mu?
   */
  const isSuccess = useCallback((key: string): boolean => {
    return getLoadingState(key).state === LoadingState.SUCCESS;
  }, [getLoadingState]);

  /**
   * Belirli bir işlemin hatası nedir?
   */
  const getError = useCallback((key: string): string | undefined => {
    return getLoadingState(key).error;
  }, [getLoadingState]);

  /**
   * Hook içinden erişilebilecek fonksiyonları dışa aktar
   */
  return {
    // Veri alma fonksiyonları
    fetchPackages,
    fetchPackageById,
    fetchCategories,
    fetchServices,
    
    // Önbellek yönetimi
    invalidatePackageCache,
    clearAllCache,
    forceRefreshPackages, // Yeni eklendi
    
    // Yükleme durumu fonksiyonları
    isLoading,
    isError,
    isSuccess,
    getError,
    getLoadingState,
    
    // Yükleme durumu sabitleri
    LoadingState,
    
    // Tüm yükleme durumları
    loadingStates
  };
};

export default usePackageCache;