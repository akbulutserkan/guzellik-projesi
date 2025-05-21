'use client';

import { useCallback, useEffect } from 'react';
import {
  Package,
  PackageWithServices,
  PackageFormData
} from '@/types/package';

// Alt hook'ları içe aktar
import { usePackageData } from './usePackageData';
import { usePackageUI } from './usePackageUI';
import { usePackagePermissions } from './usePackagePermissions';
import { usePackageCategories } from './usePackageCategories';

// Daha organize bir arayüz için alt arayüzlere ayırma
interface PackageState {
  packages: PackageWithServices[];
  loading: boolean;
  error: string | null;
  selectedPackage: PackageWithServices | null;
  categories: any[];
  services: any[];
}

interface PackageFormState {
  formData: PackageFormData;
  setFormData: React.Dispatch<React.SetStateAction<PackageFormData>>;
  formErrors: Record<string, string>;
  isFormValid: boolean;
  clearForm: () => void;
  validateForm: (data?: PackageFormData) => boolean;
}

interface PackageOperations {
  fetchPackages: () => Promise<void>;
  fetchPackageById: (id: string) => Promise<PackageWithServices | null>;
  handleCreatePackage: () => Promise<Package | null>;
  handleUpdatePackage: (id: string, data?: any) => Promise<Package | null>;
  handleDeletePackage: (id: string, skipConfirm?: boolean) => Promise<boolean>;
  handleCreatePackageWithData: (data: any) => Promise<{success: boolean; error?: string; data?: Package}>;
}

interface PackageHelpers {
  fetchCategories: () => Promise<void>;
  fetchServices: (categoryId?: string) => Promise<void>;
  fetchPackageSales: (packageId: string) => Promise<any[]>;
  groupByCategory: () => Record<string, PackageWithServices[]>;
  groupedPackages: Record<string, PackageWithServices[]>;
}

interface PackagePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface UsePackageManagementResult {
  state: PackageState;
  form: PackageFormState;
  operations: PackageOperations;
  helpers: PackageHelpers;
  permissions: PackagePermissions;
}

interface UsePackageManagementProps {
  initialPackages?: PackageWithServices[];
  autoFetch?: boolean;
  showToasts?: boolean;
  cacheEnabled?: boolean;
}

/**
 * Paket yönetimi ana hook'u
 * 
 * Alt hook'ları birleştirerek tek bir API arayüzü sunar
 */
export const usePackageManagement = ({
  initialPackages = [],
  autoFetch = true,
  showToasts = true,
  cacheEnabled = true
}: UsePackageManagementProps = {}): UsePackageManagementResult => {
  // Alt hook'ları çağır
  const {
    formData,
    setFormData,
    formErrors,
    isFormValid,
    clearForm,
    validateForm
  } = usePackageUI();
  
  const { permissions } = usePackagePermissions();
  
  const {
    packages,
    loading: dataLoading,
    error,
    selectedPackage,
    setSelectedPackage,
    fetchPackages,
    fetchPackageById,
    createPackage,
    updatePackage,
    deletePackage
  } = usePackageData({
    showToasts,
    cacheEnabled
  });
  
  const {
    categories,
    services,
    loading: categoriesLoading,
    fetchCategories,
    fetchServices,
    groupedPackages,
    groupPackagesByCategory
  } = usePackageCategories({
    showToasts,
    cacheEnabled,
    packages // Paketleri hook'a geçiriyoruz, gruplandırma için kullanılacak
  });
  
  console.log("[PACKAGE-MANAGEMENT] [LOG] usePackageCategories hook'una geçirilen paketler:", 
              packages ? `${packages.length} paket` : "paket yok",
              "groupedPackages'daki kategoriler:", Object.keys(groupedPackages));

  // Paket listesinde değişiklik olduğunda log ekleyelim
  useEffect(() => {
    console.log("[PACKAGE-MANAGEMENT] [LOG] packages değişti - yeni paket sayısı:", 
                packages ? packages.length : "paket yok");
    
    if (packages && packages.length > 0) {
      console.log("[PACKAGE-MANAGEMENT] [LOG] İlk paket özeti:", {
        id: packages[0].id,
        name: packages[0].name,
        categoryId: packages[0].categoryId,
        hasCategory: !!packages[0].category,
        hasServices: !!packages[0].services,
        servicesCount: packages[0].services ? packages[0].services.length : 0
      });
    }
  }, [packages]);
  
  // Sayfa yüklenirken otomatik olarak paketleri ve kategorileri getir
  useEffect(() => {
    if (autoFetch) {
      console.log("[PACKAGE-MANAGEMENT] [LOG] autoFetch aktif, paketler otomatik olarak yükleniyor...");
      const loadData = async () => {
        try {
          console.log("[PACKAGE-MANAGEMENT] [LOG] fetchPackages çağrılıyor...");
          await fetchPackages();
          console.log("[PACKAGE-MANAGEMENT] [LOG] fetchPackages tamamlandı");
          
          console.log("[PACKAGE-MANAGEMENT] [LOG] fetchCategories çağrılıyor...");
          await fetchCategories();
          console.log("[PACKAGE-MANAGEMENT] [LOG] fetchCategories tamamlandı");
          
          console.log("[PACKAGE-MANAGEMENT] [LOG] fetchServices çağrılıyor...");
          await fetchServices();
          console.log("[PACKAGE-MANAGEMENT] [LOG] fetchServices tamamlandı");
          
          console.log("[PACKAGE-MANAGEMENT] [LOG] Tüm veriler başarıyla yüklendi.");
        } catch (error) {
          console.error("[PACKAGE-MANAGEMENT] [LOG] Veriler yüklenirken hata:", error);
        }
      };
      
      loadData();
    }
  }, [autoFetch, fetchPackages, fetchCategories, fetchServices]);
  
  // İki yükleme durumunu birleştir
  const loading = dataLoading || categoriesLoading;
  
  /**
   * Yeni paket oluşturur
   */
  const handleCreatePackage = useCallback(async (): Promise<Package | null> => {
    // Form doğrulama
    if (!validateForm(formData)) {
      return null;
    }
    
    // Alt hook'tan createPackage fonksiyonunu çağır
    const result = await createPackage(formData);
    
    // Başarılıysa formu temizle
    if (result) {
      clearForm();
    }
    
    return result;
  }, [formData, validateForm, createPackage, clearForm]);
  
  /**
   * Mevcut paketi günceller
   */
  const handleUpdatePackage = useCallback(async (id: string, data?: any): Promise<Package | null> => {
    // Güncellenecek veriyi belirle
    const updateData = data || formData;
    
    // Kısmi güncelleme mi kontrol et (sadece fiyat/seans sayısı güncellemesi olabilir)
    const isPartialUpdate = data && 
                          (!data.name && !data.categoryId && !data.serviceIds) && 
                          (data.price !== undefined || data.sessionCount !== undefined);
    
    // Form doğrulama - kısmi güncelleme ise daha basit doğrulama yapalım
    if (isPartialUpdate) {
      // Sadece sayısal değerlerin doğrulaması
      let isValid = true;
      if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
        console.log('[PAKET-GUNCELLEME] Kısmi güncelleme fiyat doğrulama hatası');
        isValid = false;
      }
      if (data.sessionCount !== undefined && (isNaN(data.sessionCount) || data.sessionCount < 1)) {
        console.log('[PAKET-GUNCELLEME] Kısmi güncelleme seans doğrulama hatası');
        isValid = false;
      }
      
      if (!isValid) {
        return null;
      }
    } else {
      // Tam form doğrulama
      if (!validateForm(updateData)) {
        return null;
      }
    }
    
    // Alt hook'tan updatePackage fonksiyonunu çağır
    return await updatePackage(id, updateData);
  }, [formData, validateForm, updatePackage]);
  
  /**
   * Paketleri kategoriye göre gruplandırır
   * Mevcut gruplandırmayı döndürür veya paketleri yeniden gruplandırır
   */
  const groupByCategory = useCallback(() => {
    if (Object.keys(groupedPackages).length === 0 && packages.length > 0) {
      // Eğer gruplandırma boşsa ve paketler varsa, yeniden gruplandırma yap
      console.log("[PACKAGE-MANAGEMENT] groupByCategory: Gruplandırma yeniden yapılıyor");
      return groupPackagesByCategory(packages);
    }
    return groupedPackages;
  }, [groupedPackages, packages, groupPackagesByCategory]);
  
  /**
   * Paket satışlarını getiren fonksiyon
   */
  const fetchPackageSales = useCallback(async (packageId: string) => {
    // Bu özellik henüz implemente edilmemiş
    return [];
  }, []);

  /**
   * Form verileriyle direkt paket oluşturur 
   * Bu fonksiyon PackageModal bişeninden çağrılıyor
   */
  const handleCreatePackageWithData = useCallback(async (data: any): Promise<{success: boolean; error?: string; data?: Package}> => {
    // Alt hook'tan createPackage fonksiyonunu direkt çağır
    console.log("handleCreatePackageWithData çağrıldı, veriler:", data);
    console.log("Veri tipleri:", {
      name: typeof data.name,
      sessionCount: typeof data.sessionCount,
      price: typeof data.price,
      categoryId: typeof data.categoryId,
      serviceIds: Array.isArray(data.serviceIds) ? `array (${data.serviceIds.length})` : typeof data.serviceIds
    });
    
    try {
      // Gerekli veri tip dönüşümleri ve kontrolleri yapalım
      const cleanedData = {
        name: String(data.name),
        sessionCount: Number(data.sessionCount),
        price: Number(data.price),
        categoryId: String(data.categoryId),
        serviceIds: Array.isArray(data.serviceIds) ? data.serviceIds : []
      };
      
      console.log("Temizlenmiş veriler:", cleanedData);
      
      // Validation
      if (!cleanedData.name || cleanedData.name.trim() === '') {
        return {
          success: false,
          error: "Paket adı gereklidir"
        };
      }
      
      if (isNaN(cleanedData.sessionCount) || cleanedData.sessionCount < 1) {
        return {
          success: false,
          error: "Geçerli bir seans sayısı girilmelidir"
        };
      }
      
      if (isNaN(cleanedData.price) || cleanedData.price < 0) {
        return {
          success: false,
          error: "Geçerli bir fiyat girilmelidir"
        };
      }
      
      if (!cleanedData.categoryId) {
        return {
          success: false,
          error: "Kategori seçimi gereklidir"
        };
      }
      
      if (!cleanedData.serviceIds.length) {
        return {
          success: false,
          error: "En az bir hizmet seçilmelidir"
        };
      }
      
      const result = await createPackage(cleanedData);
      console.log("Paket oluşturma sonucu:", result);
      
      if (!result) {
        return {
          success: false,
          error: "Paket oluşturulurken beklenmeyen bir hata oluştu"
        };
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Paket oluşturma hatası:", error);
      console.error("Hata detayları:", error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Paket oluşturulurken bir hata oluştu"
      };
    }
  }, [createPackage]);

  return {
    // Durum bilgileri
    state: {
      packages,
      loading,
      error,
      selectedPackage,
      categories,
      services
    },
    
    // Form işlemleri
    form: {
      formData,
      setFormData,
      formErrors,
      isFormValid,
      clearForm,
      validateForm
    },
    
    // Temel CRUD operasyonları
    operations: {
      fetchPackages,
      fetchPackageById,
      handleCreatePackage,
      handleUpdatePackage,
      handleDeletePackage: deletePackage,
      handleCreatePackageWithData
    },
    
    // Yardımcı fonksiyonlar
    helpers: {
      fetchCategories,
      fetchServices,
      fetchPackageSales,
      groupByCategory,
      groupedPackages
    },
    
    // Yetkilendirme bilgileri
    permissions
  };
};

export default usePackageManagement;