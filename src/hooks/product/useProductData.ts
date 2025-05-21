'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Product, 
  CreateProductParams,
  UpdateProductParams,
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  updateProductStock, 
  deleteProduct 
} from '@/services/productService';
import { useProductPermissions } from './useProductPermissions';
import { useProductCache } from './useProductCache';
import { useProductUI } from './useProductUI';

export interface UseProductDataOptions {
  initialProducts?: Product[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

export interface UseProductDataResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (skipCache?: boolean) => Promise<void>;
  handleCreateProduct: (productData: CreateProductParams) => Promise<Product | null>;
  handleUpdateProduct: (id: string, productData: UpdateProductParams) => Promise<Product | null>;
  handleDeleteProduct: (id: string) => Promise<boolean>;
  handleProductStock: (id: string, newStock: number | string) => Promise<Product | null>;
  invalidateCache: () => void;
}

/**
 * Ürün verilerini yöneten hook
 */
export const useProductData = ({
  initialProducts = [],
  autoFetch = true,
  showToasts = true
}: UseProductDataOptions = {}): UseProductDataResult => {
  // Temel state'ler
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  // UI hook'unu kullan
  const { showSuccessToast, showErrorToast, formatProduct } = useProductUI();
  
  // İzinler hook'u
  const { permissions } = useProductPermissions();
  
  // Önbellek hook'u
  const { 
    getCachedData, 
    cacheData, 
    invalidateCache, 
    invalidateCacheEntry 
  } = useProductCache();
  
  /**
   * Tüm ürünleri getir
   */
  const fetchProducts = useCallback(async (skipCache: boolean = false) => {
    if (!permissions.canView) {
      if (showToasts) {
        showErrorToast("Ürünleri görüntüleme yetkiniz bulunmamaktadır");
      }
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Önbellekten veri kontrolü
      if (!skipCache) {
        const cachedProducts = getCachedData();
        if (cachedProducts) {
          setProducts(cachedProducts);
          setLoading(false);
          return;
        }
      }
      
      // API'den veri çek
      const data = await getProducts(false, showToasts);
      const productList = Array.isArray(data) ? data : [];
      
      // Verileri ayarla
      setProducts(productList);
      
      // Önbelleğe kaydet
      cacheData({}, productList);
    } catch (error) {
      setError('Ürünler yüklenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Ürünler yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  }, [permissions.canView, showToasts, showErrorToast, getCachedData, cacheData]);
  
  /**
   * Yeni ürün oluştur
   */
  const handleCreateProduct = useCallback(async (productData: CreateProductParams): Promise<Product | null> => {
    if (!permissions.canAdd) {
      if (showToasts) {
        showErrorToast("Ürün ekleme yetkiniz bulunmamaktadır");
      }
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API çağrısı
      const newProduct = await createProduct(productData, showToasts);
      
      // Listeyi güncelle
      setProducts(prev => [...prev, newProduct]);
      
      // Önbelleği geçersiz kıl
      invalidateCache();
      
      return newProduct;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ürün eklenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Ürün eklenirken bir hata oluştu.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canAdd, showToasts, showErrorToast, invalidateCache]);
  
  /**
   * Ürün güncelle
   */
  const handleUpdateProduct = useCallback(async (id: string, productData: UpdateProductParams): Promise<Product | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        showErrorToast("Ürün güncelleme yetkiniz bulunmamaktadır");
      }
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API çağrısı
      const updatedProduct = await updateProduct(id, productData, showToasts);
      
      // Listeyi güncelle
      setProducts(prev => prev.map(product => 
        product.id === id ? updatedProduct : product
      ));
      
      // Önbelleği geçersiz kıl
      invalidateCache();
      
      return updatedProduct;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ürün güncellenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Ürün güncellenirken bir hata oluştu.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canEdit, showToasts, showErrorToast, invalidateCache]);
  
  /**
   * Ürün sil
   */
  const handleDeleteProduct = useCallback(async (id: string): Promise<boolean> => {
    if (!permissions.canDelete) {
      if (showToasts) {
        showErrorToast("Ürün silme yetkiniz bulunmamaktadır");
      }
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API çağrısı
      const result = await deleteProduct(id, showToasts);
      
      if (result.success) {
        // Listeyi güncelle (hard veya soft delete'e göre)
        if (result.deleteType === 'hard') {
          setProducts(prev => prev.filter(product => product.id !== id));
        } else {
          await fetchProducts(true); // Soft delete ise tüm listeyi yenile
        }
        
        // Önbelleği geçersiz kıl
        invalidateCache();
        
        return true;
      }
      
      return false;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ürün silinirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Ürün silinirken bir hata oluştu.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [permissions.canDelete, showToasts, showErrorToast, fetchProducts]);
  
  /**
   * Ürün stok güncelle
   */
  const handleProductStock = useCallback(async (id: string, newStock: number | string): Promise<Product | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        showErrorToast("Ürün güncelleme yetkiniz bulunmamaktadır");
      }
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API çağrısı
      const updatedProduct = await updateProductStock(id, newStock, showToasts);
      
      // Listeyi güncelle
      setProducts(prev => prev.map(product => 
        product.id === id ? updatedProduct : product
      ));
      
      // Önbelleği geçersiz kıl
      invalidateCache();
      
      return updatedProduct;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Stok güncellenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Stok güncellenirken bir hata oluştu.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canEdit, showToasts, showErrorToast, invalidateCache]);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleProductStock,
    invalidateCache
  };
};
