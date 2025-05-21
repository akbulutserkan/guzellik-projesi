'use client';

import { useCallback } from 'react';
import { 
  Product, 
  CreateProductParams,
  UpdateProductParams
} from '@/services/productService';

// Alt hook'ları içe aktar
import { useProductData } from './useProductData';
import { useProductUI } from './useProductUI';
import { useProductPermissions } from './useProductPermissions';
import { useProductCache } from './useProductCache';
import { useProductStatus } from './useProductStatus';
import { useProductInventory } from './useProductInventory';

/**
 * Hook props
 */
interface UseProductManagementProps {
  initialProducts?: Product[];
  autoFetch?: boolean;
  showToasts?: boolean;
  cacheOptions?: {
    enabled?: boolean;
    expirationTime?: number;
  };
}

/**
 * Ürün Yönetimi Ana Hook'u
 * Alt hook'ları birleştirerek tek bir API sağlar
 */
export const useProductManagement = ({
  initialProducts = [],
  autoFetch = true,
  showToasts = true,
  cacheOptions = {}
}: UseProductManagementProps = {}) => {
  // Alt hook'ları kullan
  const {
    formData,
    formErrors,
    selectedProduct,
    setFormData,
    resetForm,
    validateForm,
    setSelectedProduct
  } = useProductUI();
  
  const { permissions } = useProductPermissions();
  
  // Önbellek hook'u
  const { 
    getCachedData, 
    cacheData, 
    invalidateCache, 
    invalidateCacheEntry 
  } = useProductCache(cacheOptions);
  
  // Ürün durumu yönetimi
  const {
    getProductStatus,
    updateProductStatus,
    isActive,
    isInactive,
    isOutOfStock,
    getStatusText,
    getStatusColor
  } = useProductStatus(showToasts);
  
  // Stok yönetimi
  const {
    addStock,
    removeStock,
    setStock,
    movementHistory
  } = useProductInventory(showToasts);
  
  const {
    products,
    loading,
    error,
    fetchProducts,
    handleCreateProduct: createProduct,
    handleUpdateProduct: updateProduct,
    handleDeleteProduct,
    handleProductStock
  } = useProductData({
    initialProducts,
    autoFetch,
    showToasts
  });
  
  /**
   * Form verisini kullanarak yeni ürün oluştur
   */
  const handleCreateProduct = useCallback(async () => {
    // Form doğrulama
    if (!validateForm()) {
      return null;
    }
    
    // Form verisini hazırla
    const createData: CreateProductParams = {
      name: formData.name,
      price: formData.price,
      stock: formData.stock
    };
    
    if (formData.description?.trim()) {
      createData.description = formData.description.trim();
    }
    
    // Alt hook'un createProduct fonksiyonunu çağır
    const result = await createProduct(createData);
    
    // Başarılıysa formu sıfırla
    if (result) {
      resetForm();
    }
    
    return result;
  }, [validateForm, formData, createProduct, resetForm]);
  
  /**
   * Form verisini kullanarak ürün güncelle
   */
  const handleUpdateProduct = useCallback(async (id: string) => {
    // Form doğrulama
    if (!validateForm()) {
      return null;
    }
    
    // Form verisini hazırla
    const updateData: UpdateProductParams = {
      name: formData.name,
      price: formData.price,
      stock: formData.stock
    };
    
    if (formData.description !== undefined) {
      updateData.description = formData.description.trim() || null;
    }
    
    // Alt hook'un updateProduct fonksiyonunu çağır
    return await updateProduct(id, updateData);
  }, [validateForm, formData, updateProduct]);

  return {
    // State
    products,
    loading,
    error,
    formData,
    formErrors,
    selectedProduct,
    movementHistory,
    
    // Form işlemleri
    setFormData,
    resetForm,
    validateForm,
    setSelectedProduct,
    
    // Veri operasyonları
    fetchProducts,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleProductStock,
    invalidateCache,
    
    // Status yönetimi
    getProductStatus,
    updateProductStatus,
    isActive,
    isInactive,
    isOutOfStock,
    getStatusText,
    getStatusColor,
    
    // Envanter yönetimi
    addStock,
    removeStock,
    setStock,
    
    // Yetkilendirme
    permissions
  };
};

export default useProductManagement;