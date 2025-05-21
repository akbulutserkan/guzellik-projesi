'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ApiService } from '@/services/api';
import { usePackageCache } from './usePackageCache';
import { PackageWithServices } from '@/types/package';

export interface UsePackageCategoriesOptions {
  showToasts?: boolean;
  cacheEnabled?: boolean;
  packages?: PackageWithServices[];
}

export interface UsePackageCategoriesResult {
  categories: any[];
  services: any[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  fetchServices: (categoryId?: string) => Promise<void>;
  createCategory: (name: string) => Promise<any | null>;
  updateCategory: (id: string, name: string) => Promise<any | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  groupedPackages: Record<string, PackageWithServices[]>;
  groupPackagesByCategory: (packages: PackageWithServices[]) => Record<string, PackageWithServices[]>;
}

/**
 * Paket kategorilerini yöneten hook
 */
export const usePackageCategories = ({
  showToasts = true,
  cacheEnabled = true,
  packages = []
}: UsePackageCategoriesOptions = {}): UsePackageCategoriesResult => {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [groupedPackages, setGroupedPackages] = useState<Record<string, PackageWithServices[]>>({});
  
  const { toast } = useToast();
  
  // Önbellek hook'unu kullan
  const {
    fetchCategories: fetchCategoriesFromCache,
    fetchServices: fetchServicesFromCache
  } = usePackageCache({
    cacheEnabled
  });
  
  /**
   * Paket kategorilerini getiren fonksiyon - önbellek entegrasyonlu
   */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      // Önbellekten kategorileri al
      const categoriesData = await fetchCategoriesFromCache();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: 'Kategoriler yüklenirken bir hata oluştu'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, fetchCategoriesFromCache]);
  
  /**
   * Hizmetleri getiren fonksiyon - önbellek entegrasyonlu
   */
  const fetchServices = useCallback(async (categoryId?: string) => {
    try {
      setLoading(true);
      
      // Önbellekten hizmetleri al
      const servicesData = await fetchServicesFromCache(categoryId);
      setServices(servicesData);
    } catch (error) {
      console.error('Hizmetler yüklenirken hata:', error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: 'Hizmetler yüklenirken bir hata oluştu'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, fetchServicesFromCache]);
  
  /**
   * Yeni kategori oluşturur
   */
  const createCategory = useCallback(async (name: string): Promise<any | null> => {
    try {
      setLoading(true);
      
      const result = await ApiService.packages.createPackageCategory(name);
      
      if (showToasts) {
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla oluşturuldu"
        });
      }
      
      // Kategorileri yeniden yükle
      await fetchCategories();
      
      return result;
    } catch (error) {
      console.error('Kategori oluşturulurken hata:', error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error instanceof Error ? error.message : 'Kategori oluşturulurken bir hata oluştu'
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, fetchCategories]);
  
  /**
   * Kategori günceller
   */
  const updateCategory = useCallback(async (id: string, name: string): Promise<any | null> => {
    try {
      setLoading(true);
      
      const result = await ApiService.packages.updatePackageCategory(id, name);
      
      if (showToasts) {
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla güncellendi"
        });
      }
      
      // Kategorileri yeniden yükle
      await fetchCategories();
      
      return result;
    } catch (error) {
      console.error('Kategori güncellenirken hata:', error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error instanceof Error ? error.message : 'Kategori güncellenirken bir hata oluştu'
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, fetchCategories]);
  
  /**
   * Kategori siler
   */
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      await ApiService.packages.deletePackageCategory(id);
      
      if (showToasts) {
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla silindi"
        });
      }
      
      // Kategorileri yeniden yükle
      await fetchCategories();
      
      return true;
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error instanceof Error ? error.message : 'Kategori silinirken bir hata oluştu'
        });
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, fetchCategories]);

  /**
   * Paketleri kategorilerine göre gruplandırır
   */
  const groupPackagesByCategory = useCallback((packageList: PackageWithServices[]): Record<string, PackageWithServices[]> => {
    console.log("[PACKAGE-CATEGORIES] groupPackagesByCategory çağrıldı, paket sayısı:", packageList.length);
    console.log("[PACKAGE-CATEGORIES] [DETAY] İlk paket:", packageList.length > 0 ? JSON.stringify(packageList[0], null, 2) : "Paket yok");
    
    const grouped: Record<string, PackageWithServices[]> = {};
    
    // Her paketi kategorisine göre grupla
    packageList.forEach((pkg, index) => {
      if (!pkg) {
        console.warn("[PACKAGE-CATEGORIES] NULL veya tanımsız paket bulundu!");
        return;
      }
      
      // Pakete ait kategorinin adını belirle
      let categoryName = pkg.category?.name || '';
      console.log(`[PACKAGE-CATEGORIES] [DETAY] Paket #${index}, id: ${pkg.id}, kategori adı: ${categoryName || 'yok'}`);
      console.log(`[PACKAGE-CATEGORIES] [DETAY] Paket #${index} kategori nesnesi:`, pkg.category);
      
      // Eğer paket doğrudan bir kategoriye sahip değilse ama hizmetleri varsa
      // ilk hizmetin kategorisini kullan
      if (!categoryName && pkg.services && pkg.services.length > 0) {
        console.log(`[PACKAGE-CATEGORIES] [DETAY] Paket #${index} hizmetleri:`, pkg.services);
        
        if (pkg.services[0].category) {
          categoryName = pkg.services[0].category.name;
          console.log(`[PACKAGE-CATEGORIES] [DETAY] Paket #${index} için hizmet kategorisi kullanıldı: ${categoryName}`);
        } else {
          console.log(`[PACKAGE-CATEGORIES] [DETAY] Paket #${index} hizmetlerinde de kategori bulunamadı`);
        }
      }
      
      // Eğer hala kategori bulunamadıysa, bu paketi gösterme
      if (!categoryName) {
        console.warn(`[PACKAGE-CATEGORIES] Kategorisi olmayan paket bulundu, ID: ${pkg.id}`);
        return;
      }
      
      // Eğer bu kategori için dizi yoksa oluştur
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
        console.log(`[PACKAGE-CATEGORIES] [DETAY] Yeni kategori oluşturuldu: ${categoryName}`);
      }
      
      // Paketi kategorisine ekle
      grouped[categoryName].push(pkg);
      console.log(`[PACKAGE-CATEGORIES] [DETAY] Paket #${index} '${categoryName}' kategorisine eklendi`);
    });
    
    console.log("[PACKAGE-CATEGORIES] Gruplandırma sonucu kategori sayısı:", Object.keys(grouped).length);
    console.log("[PACKAGE-CATEGORIES] Kategoriler:", Object.keys(grouped));
    
    return grouped;
  }, [categories]);
  
  // Paketler değiştiğinde gruplandırmayı güncelle
  useEffect(() => {
    console.log("[PACKAGE-CATEGORIES] [LOG] useEffect tetiklendi - packages sayısı:", packages.length);
    
    if (packages.length > 0) {
      console.log("[PACKAGE-CATEGORIES] [LOG] İlk 2 paket örneği:", JSON.stringify(packages.slice(0, 2), null, 2));
      console.log("[PACKAGE-CATEGORIES] Paketler değişti, yeniden gruplandırılıyor. Paket sayısı:", packages.length);
      const grouped = groupPackagesByCategory(packages);
      console.log("[PACKAGE-CATEGORIES] [LOG] Gruplandırma sonucu:", JSON.stringify(grouped, null, 2));
      setGroupedPackages(grouped);
    } else if (Object.keys(groupedPackages).length > 0 && packages.length === 0) {
      // Eğer paket kalmadıysa gruplandırmayı temizle
      console.log("[PACKAGE-CATEGORIES] Paket kalmadı, gruplandırma temizleniyor");
      setGroupedPackages({});
    }
  }, [packages, groupPackagesByCategory]);
  
  return {
    categories,
    services,
    loading,
    fetchCategories,
    fetchServices,
    createCategory,
    updateCategory,
    deleteCategory,
    groupedPackages,
    groupPackagesByCategory
  };
};
