'use client';

import { useState, useCallback, useRef } from 'react';
import { createPackage as apiCreatePackage, updatePackage as apiUpdatePackage, deletePackage as apiDeletePackage, getPackages } from '@/services/packageService';
import {
  Package,
  PackageWithServices,
  PackageFormData
} from '@/types/package';
import { usePackageUI } from './usePackageUI';
import { validatePackageDataWithMessages } from '@/utils/package/formatters';
import { usePackageCache } from './usePackageCache';

export interface UsePackageDataOptions {
  showToasts?: boolean;
  cacheEnabled?: boolean;
}

export interface UsePackageDataResult {
  packages: PackageWithServices[];
  loading: boolean;
  error: string | null;
  selectedPackage: PackageWithServices | null;
  setSelectedPackage: (pkg: PackageWithServices | null) => void;
  fetchPackages: (includeInactive?: boolean) => Promise<void>;
  fetchPackageById: (id: string) => Promise<PackageWithServices | null>;
  createPackage: (data: PackageFormData) => Promise<Package | null>;
  updatePackage: (id: string, data: PackageFormData) => Promise<Package | null>;
  deletePackage: (id: string, skipConfirm?: boolean) => Promise<boolean>;
}

/**
 * Paket verilerini yöneten hook
 */
export const usePackageData = ({
  showToasts = true,
  cacheEnabled = true
}: UsePackageDataOptions = {}): UsePackageDataResult => {
  const [packages, setPackages] = useState<PackageWithServices[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageWithServices | null>(null);
  const operationInProgress = useRef(false);
  
  // UI hook'unu kullan
  const { showSuccessToast, showErrorToast, formatPackage } = usePackageUI();
  
  // Önbellek hook'unu kullan
  const {
    fetchPackages: fetchPackagesFromCache,
    fetchPackageById: fetchPackageByIdFromCache,
    invalidatePackageCache
  } = usePackageCache({
    cacheEnabled
  });
  
  /**
   * Tüm paketleri getiren fonksiyon - önbellek entegrasyonlu
   */
  // API'ye doğrudan erişim denemelerini izleyen değişken
  const triedDirectAPI = useRef(false);
  
  const fetchPackages = useCallback(async (includeInactive: boolean = false) => {
    try {
      console.log("[PAKET-SORUN] fetchPackages çağrıldı, includeInactive:", includeInactive);
      console.log("[PAKET-SORUN] Şu anki saat:", new Date().toISOString());
      setLoading(true);
      setError(null);
      
      // Her yeni fetchPackages çağrısında triedDirectAPI durumunu sıfırla
      triedDirectAPI.current = false;
      
      let data;
      try {
        console.log("[PAKET-SORUN] Önbellekten paketler çekiliyor...");
        data = await fetchPackagesFromCache(includeInactive);
        console.log("[PAKET-SORUN] fetchPackagesFromCache yanıt tipi:", typeof data);
        console.log("[PAKET-SORUN] fetchPackagesFromCache yanıtı dizi mi:", Array.isArray(data));
        
        if (data === null || data === undefined) {
          console.log("[PAKET-SORUN] Önbellekten NULL veya UNDEFINED yanıt geldi, doğrudan API'ye geçiliyor");
          
          // Önbellek başarısız olduysa, doğrudan servis üzerinden deneyelim
          console.log("[PAKET-SORUN] Doğrudan packageService.getPackages çağrılıyor...");
          triedDirectAPI.current = true; // Doğrudan API erişimi denediğimizi işaretle
          
          const directResponse = await getPackages({ includeDeleted: includeInactive });
          console.log("[PAKET-SORUN] Doğrudan API yanıtı:", JSON.stringify(directResponse, null, 2));
          
          if (directResponse && directResponse.success && Array.isArray(directResponse.data)) {
            console.log("[PAKET-SORUN] Doğrudan API yanıtı BAŞARILI, veri bulundu");
            data = directResponse.data;
          } else {
            console.error("[PAKET-SORUN] Doğrudan API yanıtı BAŞARISIZ:", directResponse);
            throw new Error(directResponse?.error || "API'den paketler alınamadı");
          }
        }
        
        console.log("[PAKET-SORUN] Önbellek/API yanıt verileri:", JSON.stringify(data, null, 2));
      } catch (cacheError) {
        console.error("[PAKET-SORUN] Önbellek hatası:", cacheError);
        console.error("[PAKET-SORUN] Önbellek hata yığını:", cacheError.stack);
        throw cacheError; // Asıl try/catch blokarına yeniden fırlat
      }
      
      console.log("[PAKET-SORUN] Paketler alındı, sonuç:", data);
      console.log("[PAKET-SORUN] Paket sayısı:", Array.isArray(data) ? data.length : 'array değil');
      
      // Data kontrolü - Boş dizi kontrolü artık daha akıllı
      if (Array.isArray(data) && data.length === 0) {
        console.log("[PAKET-SORUN] Paket listesi boş, ancak bu normal bir durum olabilir.");
        
        // Eğer daha önce doğrudan API'ye erişimi denemediyse ve cacheEnabled true ise, bir kez daha dene
        if (!triedDirectAPI.current && cacheEnabled) {
          console.log("[PAKET-SORUN] Şimdi doğrudan API'ye erişim deniyoruz (kontrollü)...");
          triedDirectAPI.current = true; // API erişimi denediğimizi işaretle
          
          try {
            // Önbellek temizleme
            console.log("[PAKET-SORUN] Önbellek temizleniyor...");
            invalidatePackageCache(); // Önbelleği temizle
            
            // Doğrudan API'den veri al
            console.log("[PAKET-SORUN] Önbellek temizleme sonrası doğrudan API'ye erişiliyor");
            const directResponse = await getPackages({ includeDeleted: includeInactive });
            console.log("[PAKET-SORUN] Doğrudan API yanıtı (sonra):", JSON.stringify(directResponse, null, 2));
            
            if (directResponse && directResponse.success && Array.isArray(directResponse.data)) {
              data = directResponse.data;
              console.log("[PAKET-SORUN] Doğrudan API'den", data.length, "paket bulundu");
            }
          } catch (directApiError) {
            console.error("[PAKET-SORUN] Doğrudan API erişimi sırasında hata:", directApiError);
            // Hatayı yukarı fırlatmıyoruz - boş veri durumunu kabul ediyoruz
          }
        } else {
          console.log("[PAKET-SORUN] Boş dizi normal karşılanıyor, API'ye tekrar erişim yapılmıyor.");
        }
      }
      
      if (Array.isArray(data) && data.length > 0) {
        console.log("[PAKET-SORUN] İlk paket örneği:", data[0]);
        console.log("[PAKET-SORUN] İlk paket JSON formatı:", JSON.stringify(data[0], null, 2));
        
        // Önemli alanları kontrol et
        const firstPackage = data[0];
        console.log("[PAKET-SORUN] İlk paket alanları:", Object.keys(firstPackage));
        console.log("[PAKET-SORUN] services alanı var mı?", !!firstPackage.services);
        console.log("[PAKET-SORUN] category alanı var mı?", !!firstPackage.category);
        console.log("[PAKET-SORUN] İlk hizmet görünümü:", firstPackage.services ? firstPackage.services[0] : 'Yok');
        
        // Her paketin services ve category ilişkisini kontrol et ve düzelt
        data = data.map(pkg => {
          // Eğer paket zaten doğru formatta ise değiştirme
          if (pkg.services && pkg.category) {
            return pkg;
          }
          
          // Services alanını düzelt
          if (!pkg.services && pkg.packageServices) {
            pkg.services = pkg.packageServices.map(ps => ({
              id: ps.serviceId,
              name: ps.service?.name || 'Bilinmeyen Hizmet',
              duration: ps.service?.duration || 0,
              price: ps.service?.price || 0,
              category: ps.service?.category || null
            }));
          }
          
          return pkg;
        });
      } else {
        console.error("[PAKET-SORUN] KRİTİK: Paket verisi boş veya dizi değil! Veri tipi:", typeof data);
        if (data === null) console.error("[PAKET-SORUN] Veri NULL");
        if (data === undefined) console.error("[PAKET-SORUN] Veri UNDEFINED");
        if (typeof data === 'object') console.error("[PAKET-SORUN] Veri OBJE ama dizi değil");
        
        // Hata durumunda boş dizi ayarla
        data = [];
      }
      
      // Paketleri state'e kaydet
      console.log("[PAKET-SORUN] setPackages çağrılıyor, veri tipi:", typeof data);
      setPackages(Array.isArray(data) ? data : []);
      console.log("[PAKET-SORUN] Paketler state'e kaydedildi");
      
      return data; // Veriyi döndür (yeni eklendi)
    } catch (error) {
      console.error('[PAKET-SORUN] Paketler yüklenirken hata:', error);
      console.error('[PAKET-SORUN] Hata tipi:', error instanceof Error ? 'Error' : typeof error);
      console.error('[PAKET-SORUN] Hata mesajı:', error instanceof Error ? error.message : 'Bilinmeyen hata');
      console.error('[PAKET-SORUN] Hata yığını:', error instanceof Error ? error.stack : 'Yok');
      
      setError('Paketler yüklenirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Paketler yüklenirken bir hata oluştu');
      }
      
      // Boş dizi döndür
      return [];
    } finally {
      setLoading(false);
      console.log("[PAKET-SORUN] fetchPackages tamamlandı, oturum sona erme zaman damgası:", new Date().toISOString());
    }
  }, [showToasts, fetchPackagesFromCache, invalidatePackageCache, showErrorToast, packages.length, cacheEnabled]);
  
  /**
   * ID'ye göre paket detaylarını getirir - önbellek entegrasyonlu
   */
  const fetchPackageById = useCallback(async (id: string): Promise<PackageWithServices | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Önbellekten paket detaylarını al
      const packageData = await fetchPackageByIdFromCache(id);
      setSelectedPackage(packageData);
      return packageData;
    } catch (error) {
      console.error(`Paket detayları alınırken hata (ID: ${id}):`, error);
      setError('Paket detayları alınamadı');
      setSelectedPackage(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPackageByIdFromCache]);
  
  /**
   * Yeni paket oluşturur
   */
  const createPackage = useCallback(async (data: PackageFormData): Promise<Package | null> => {
    console.log("[PACKAGE-DATA] createPackage çağrıldı, gelen veriler:", data);
    
    // İşlem devam ediyorsa çift gönderimi engelle
    if (operationInProgress.current) {
      console.log("[PACKAGE-DATA] İşlem zaten devam ediyor, yeni istek engellendi");
      return null;
    }
    
    try {
      operationInProgress.current = true;
      console.log("[PACKAGE-DATA] operationInProgress = true olarak ayarlandı");
      setLoading(true);
      setError(null);
      
      console.log("[PACKAGE-DATA] Paket oluşturma başlatılıyor, veri kontrolleri yapılıyor...");
      console.log("[PACKAGE-DATA] Gönderilecek veriler:", JSON.stringify(data, null, 2));
      
      // Paket verilerini doğrula
      const errors = validatePackageDataWithMessages(data);
      // Eğer hata varsa, ilk hatayı fırlat
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        console.error("[PACKAGE-DATA] Validation hatası:", errors);
        throw new Error(errors[errorKeys[0]]);
      }
      
      console.log("[PACKAGE-DATA] Validasyon başarılı, API çağrısı yapılıyor...");
      
      // API çağrısını yap
      console.log("[PACKAGE-DATA] packageService.createPackage çağrılıyor");
      const result = await apiCreatePackage(data);
      console.log("[PACKAGE-DATA] packageService.createPackage yanıtı:", result);
      console.log("[PACKAGE-DATA] Yanıt detayı:", {
        success: result.success,
        data: result.data,
        error: result.error
      });
      
      // Yanıt başarısızsa hata fırlat
      if (!result.success) {
        console.error("[PACKAGE-DATA] API yanıtı başarısız:", result.error);
        throw new Error(result.error || 'Paket oluşturulurken bir hata oluştu');
      }
      
      console.log("[PACKAGE-DATA] API yanıtı başarılı, yeni paket:", result.data);
      
      if (showToasts) {
        showSuccessToast("Paket başarıyla eklendi");
      }
      
      // Önbelleği temizle - yeni veri eklendi
      console.log("[PACKAGE-DATA] Önbellek temizleniyor...");
      invalidatePackageCache();
      
      // Paket listesini güncelle
      console.log("[PACKAGE-DATA] fetchPackages çağrılıyor...");
      await fetchPackages();
      console.log("[PACKAGE-DATA] fetchPackages tamamlandı");
      
      return result.data;
    } catch (error) {
      console.error('Paket oluşturulurken hata:', error);
      console.error('Hata detayları:', error instanceof Error ? { 
        message: error.message, 
        stack: error.stack,
        name: error.name
      } : error);
      
      setError(error instanceof Error ? error.message : 'Paket oluşturulurken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Paket oluşturulurken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
      operationInProgress.current = false;
    }
  }, [showToasts, fetchPackages, invalidatePackageCache, showSuccessToast, showErrorToast]);
  
  /**
   * Mevcut paketi günceller - kısmi güncelleme desteği eklendi
   */
  const updatePackage = useCallback(async (id: string, data: Partial<PackageFormData>): Promise<Package | null> => {
    // Eğer id 'new' ise, yeni paket oluştur
    if (id === 'new') {
      console.warn("'new' ID'si ile çağrılan updatePackage - yeni paket oluşturuluyor");
      return createPackage(data as PackageFormData);
    }
    
    // İşlem devam ediyorsa çift gönderimi engelle
    if (operationInProgress.current) {
      console.log("İşlem zaten devam ediyor, yeni istek engellendi");
      return null;
    }
    
    console.log('[PAKET-GUNCELLEME] [2] usePackageData.updatePackage çağrıldı');
    console.log('[PAKET-GUNCELLEME] [2] Güncellenecek paket ID:', id);
    console.log('[PAKET-GUNCELLEME] [2] Gelen güncelleme verileri:', JSON.stringify(data, null, 2));
    
    try {
      operationInProgress.current = true;
      setLoading(true);
      setError(null);
      
      // Güncelleme için gönderilen verilerin tam mı yoksa kısmi mi olduğunu kontrol et
      // Gelen verilerin içinde sadece price, sessionCount gibi kısmi güncelleme alanları varsa
      // Bu, muhtemelen hızlı güncelleme düğmesine basılması durumudur
      const hasPartialFields = (data.price !== undefined || data.sessionCount !== undefined);
      const hasMajorFields = (data.name !== undefined || data.categoryId !== undefined || data.serviceIds !== undefined);
      const isPartialUpdate = hasPartialFields && !hasMajorFields;
      console.log('[PAKET-GUNCELLEME] [2] Kısmi güncelleme mi?', isPartialUpdate ? 'EVET' : 'HAYIR', 
               'hasPartialFields:', hasPartialFields, 'hasMajorFields:', hasMajorFields);
      
      // Bileşenler
      let completeData = data;
      
      if (isPartialUpdate) {
        console.log('[PAKET-GUNCELLEME] [2] Kısmi güncelleme tespit edildi, mevcut paket verileriyle birleştiriliyor');
        
        // Mevcut paketi bul
        const existingPackage = packages.find(p => p.id === id);
        if (!existingPackage) {
          console.error('[PAKET-GUNCELLEME] [2] HATA: Güncellenecek paket bulunamadı, ID:', id);
          throw new Error('Güncellenecek paket bulunamadı');
        }
        
        console.log('[PAKET-GUNCELLEME] [2] Mevcut paket bulundu:', JSON.stringify(existingPackage, null, 2));
        
        // Kısmi verileri mevcut paket verileriyle birleştir
        completeData = {
          name: existingPackage.name,
          categoryId: existingPackage.categoryId || existingPackage.category?.id,
          serviceIds: existingPackage.services?.map(s => s.id) || [],
          sessionCount: existingPackage.sessionCount,
          price: existingPackage.price,
          ...data // Kısmi güncellemeler bunu ezecek
        };
        
        console.log('[PAKET-GUNCELLEME] [2] Birleştirilmiş tam veri:', JSON.stringify(completeData, null, 2));
      }
      
      // Normal güncelleme durumu - tam form verileri için regüler doğrulama yap
      if (!isPartialUpdate) {
        console.log('[PAKET-GUNCELLEME] [2] Tam güncelleme, standart doğrulama yapılıyor');
        const errors = validatePackageDataWithMessages(data as PackageFormData);
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          console.error('[PAKET-GUNCELLEME] [2] Tam doğrulama hatası:', errors);
          throw new Error(errors[errorKeys[0]]);
        }
      } else {
        // Kısmi güncelleme için sadece gönderilen alanları doğrula
        console.log('[PAKET-GUNCELLEME] [2] Kısmi güncelleme, sadece değişen alanlar doğrulanıyor');
        const { validateUpdateForm } = require('./usePackageFormValidation').usePackageFormValidation();
        const errors = validateUpdateForm(data);
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          console.error('[PAKET-GUNCELLEME] [2] Kısmi doğrulama hatası:', errors);
          throw new Error(errors[errorKeys[0]]);
        }
      }
      
      console.log('[PAKET-GUNCELLEME] [2] Doğrulama başarılı, API çağrısı yapılıyor...');
      const updatedPackage = await apiUpdatePackage(id, completeData);
      console.log('[PAKET-GUNCELLEME] [2] API yanıtı alındı:', JSON.stringify(updatedPackage, null, 2));
      
      if (showToasts) {
        showSuccessToast("Paket başarıyla güncellendi");
      }
      
      // Önbelleği ve verileri zorla yenile
      console.log('[PAKET-GUNCELLEME] [2] Önbellek temizleniyor...');
      invalidatePackageCache(id);
      
      // Paket listesini güncelle
      console.log('[PAKET-GUNCELLEME] [2] Paketler yeniden yükleniyor...');
      await fetchPackages();
      console.log('[PAKET-GUNCELLEME] [2] Paketler yeniden yüklendi');
      
      return updatedPackage;
    } catch (error) {
      console.error('[PAKET-GUNCELLEME] [2] Güncelleme hatası:', error);
      setError(error instanceof Error ? error.message : 'Paket güncellenirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Paket güncellenirken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
      operationInProgress.current = false;
      console.log('[PAKET-GUNCELLEME] [2] Güncelleme işlemi tamamlandı');
    }
  }, [showToasts, fetchPackages, invalidatePackageCache, createPackage, showSuccessToast, showErrorToast, packages]);
  
  /**
   * Paketi siler
   * @param id Silinecek paketin ID'si
   * @param skipConfirm Windows tarayıcı onayını atlayıp atlamama durumu
   */
  const deletePackage = useCallback(async (id: string, skipConfirm: boolean = false): Promise<boolean> => {
    // skipConfirm true ise tarayıcı onayını atla
    if (!skipConfirm && !window.confirm('Bu paketi silmek istediğinizden emin misiniz?')) {
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await apiDeletePackage(id);
      
      if (showToasts) {
        showSuccessToast("Paket başarıyla silindi");
      }
      
      // Önbelleği temizle - veri silindi
      invalidatePackageCache(id);
      
      // Paket listesini güncelle
      await fetchPackages();
      
      return true;
    } catch (error) {
      console.error(`Paket silinirken hata (ID: ${id}):`, error);
      
      // İlişkili kayıt hatası varsa
      if (error instanceof Error && (error as any).details) {
        const details = (error as any).details;
        
        // İlişkili kayıtları insanların anlayabileceği bir şekilde göster
        const relatedItems: string[] = [];
        
        if (details.packageSales > 0) {
          relatedItems.push(`${details.packageSales} paket satışı`);
        }
        
        if (details.packageSessions > 0) {
          relatedItems.push(`${details.packageSessions} paket seansı`);
        }
        
        if (details.appointments > 0) {
          relatedItems.push(`${details.appointments} randevu`);
        }
        
        const errorMessage = `Bu pakete ait ${relatedItems.join(', ')} kaydı olduğu için silinemez`;
        setError(errorMessage);
        
        if (showToasts) {
          showErrorToast(errorMessage);
        }
      } else {
        setError(error instanceof Error ? error.message : 'Paket silinirken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(error instanceof Error ? error.message : 'Paket silinirken bir hata oluştu');
        }
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToasts, fetchPackages, invalidatePackageCache, showSuccessToast, showErrorToast]);

  return {
    packages,
    loading,
    error,
    selectedPackage, 
    setSelectedPackage,
    fetchPackages,
    fetchPackageById,
    createPackage,
    updatePackage,
    deletePackage
  };
};
