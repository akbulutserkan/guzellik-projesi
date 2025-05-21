/**
 * Hizmet kategorilerinin yönetiminden sorumlu hook.
 */
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Import servis fonksiyonları
import { getServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory } from '@/services/serviceCategoryService';

// Tip tanımlamaları
export interface ServiceCategory {
  id: string;
  name: string;
  serviceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UseServiceCategoryProps {
  initialCategories?: ServiceCategory[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

/**
 * Hizmet kategorileri hook'u
 */
export const useServiceCategory = ({
  initialCategories = [],
  autoFetch = true,
  showToasts = true
}: UseServiceCategoryProps = {}) => {
  // State
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [categoryFormData, setCategoryFormData] = useState({
    name: ''
  });
  
  // İşlem takibi için referanslar
  const lastOperationTime = useRef(Date.now());
  
  // Yardımcı hook'lar
  const { toast } = useToast();
  
  /**
   * Hizmet kategorilerini getiren fonksiyon
   */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Kategoriler alınıyor...');
      const response = await getServiceCategories();
      console.log('Kategori yanıtı:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Kategoriler yüklenirken bir hata oluştu');
      }
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('ServiceCategoriesService.getList beklenmeyen formatta veri döndü:', response.data);
      }
      
      setCategories(Array.isArray(response.data) ? response.data : []);
      console.log('Kategoriler güncellendi:', Array.isArray(response.data) ? response.data : []);
      
      // Veri çekme işlemi başarılı olduysa son işlem zamanını güncelle
      lastOperationTime.current = Date.now();
    } catch (error) {
      setError('Kategoriler yüklenirken bir hata oluştu');
      console.error('Kategoriler yüklenirken hata:', error);
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error.message || 'Kategoriler yüklenirken bir hata oluştu',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast]);
  
  /**
   * Kategori form verilerini değiştiren fonksiyon
   */
  const handleCategoryFormChange = useCallback((field: string, value: any) => {
    console.log(`Kategori form değeri değiştiriliyor: ${field} = ${value}`);
    setCategoryFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      console.log('Yeni kategori form verisi:', newFormData);
      return newFormData;
    });
  }, []);
  
  /**
   * Yeni kategori oluşturan fonksiyon
   */
  const createCategory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Kategori oluşturuluyor:', categoryFormData.name);
      if (!categoryFormData.name || categoryFormData.name.trim() === '') {
        throw new Error('Kategori adı boş olamaz');
      }
      
      const response = await createServiceCategory({ name: categoryFormData.name });
      console.log('Kategori oluşturma yanıtı:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Kategori oluşturulurken bir hata oluştu');
      }
      
      const newCategory = response.data;
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      // Yerel state'i güncelle
      if (newCategory && newCategory.id) {
        setCategories(prevCategories => [...prevCategories, newCategory]);
      }
      
      // Form verilerini sıfırla
      setCategoryFormData({ name: '' });
      
      if (showToasts) {
        toast({
          title: 'Başarılı',
          description: 'Kategori başarıyla oluşturuldu',
          variant: 'default'
        });
      }
      
      return newCategory;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Kategori oluşturulurken bir hata oluştu';
      console.error('Kategori oluşturma hatası:', errorMsg, error);
      setError(errorMsg);
      
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error.message || 'Kategori oluşturulurken bir hata oluştu',
          variant: 'destructive'
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [categoryFormData.name, showToasts, toast]);
  
  /**
   * Kategori güncelleyen fonksiyon
   */
  const updateCategory = useCallback(async (categoryId: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateServiceCategory(categoryId, { name });
      
      if (!response.success) {
        throw new Error(response.error || 'Kategori güncellenirken bir hata oluştu');
      }
      
      const updatedCategory = response.data;
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      // Yerel state'i güncelle
      if (updatedCategory) {
        setCategories(prevCategories => 
          prevCategories.map(category => 
            category.id === categoryId ? updatedCategory : category
          )
        );
      }
      
      if (showToasts) {
        toast({
          title: 'Başarılı',
          description: 'Kategori başarıyla güncellendi',
          variant: 'default'
        });
      }
      
      return updatedCategory;
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Kategori güncellenirken bir hata oluştu');
      
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error.message || 'Kategori güncellenirken bir hata oluştu',
          variant: 'destructive'
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast]);
  
  /**
   * Kategori silen fonksiyon
   */
  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteServiceCategory(categoryId);
      
      if (!response.success) {
        throw new Error(response.error || 'Kategori silinirken bir hata oluştu');
      }
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
      
      // Yerel state'i güncelle
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== categoryId)
      );
      
      if (showToasts) {
        toast({
          title: 'Başarılı',
          description: 'Kategori başarıyla silindi',
          variant: 'default'
        });
      }
      
      return true;
    } catch (error) {
      setError('Kategori silinirken bir hata oluştu');
      console.error('Kategori silme hatası:', error);
      
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error.message || 'Kategori silinirken bir hata oluştu',
          variant: 'destructive'
        });
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast]);
  
  return {
    // State
    categories,
    loading,
    error,
    categoryFormData,
    
    // CRUD İşlemleri
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Form işlemleri
    handleCategoryFormChange,
    setCategoryFormData,
    
    // Referanslar
    lastOperationTime
  };
};

export default useServiceCategory;