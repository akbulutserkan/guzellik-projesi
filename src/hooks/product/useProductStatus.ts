'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Product, updateProduct } from '@/services/productService';
import { useProductPermissions } from './useProductPermissions';

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface UseProductStatusResult {
  getProductStatus: (product: Product) => ProductStatus;
  updateProductStatus: (productId: string, newStatus: ProductStatus) => Promise<Product | null>;
  isActive: (product: Product) => boolean;
  isInactive: (product: Product) => boolean;
  isOutOfStock: (product: Product) => boolean;
  getStatusText: (status: ProductStatus) => string;
  getStatusColor: (status: ProductStatus) => string;
}

/**
 * Ürün durumunu yöneten hook
 */
export const useProductStatus = (showToasts: boolean = true): UseProductStatusResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { permissions } = useProductPermissions();

  /**
   * Ürünün durumunu belirle
   */
  const getProductStatus = useCallback((product: Product): ProductStatus => {
    if (!product) return 'inactive';
    
    if (!product.isActive || product.isDeleted) {
      return 'inactive';
    }
    
    if (!product.stock || product.stock <= 0) {
      return 'out_of_stock';
    }
    
    return 'active';
  }, []);

  /**
   * Ürün durumunu güncelle
   */
  const updateProductStatus = useCallback(async (
    productId: string, 
    newStatus: ProductStatus
  ): Promise<Product | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Ürün durumunu değiştirme yetkiniz bulunmamaktadır"
        });
      }
      return null;
    }
    
    try {
      setLoading(true);
      
      const updateData: any = {
        isActive: newStatus !== 'inactive'
      };
      
      // Stok durumunu da güncelle
      if (newStatus === 'out_of_stock') {
        updateData.stock = 0;
      }
      
      // API çağrısı
      const updatedProduct = await updateProduct(productId, updateData, showToasts);
      return updatedProduct;
    } catch (error) {
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Ürün durumu güncellenirken bir hata oluştu.'
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canEdit, showToasts, toast]);

  /**
   * Ürün aktif mi
   */
  const isActive = useCallback((product: Product): boolean => {
    return getProductStatus(product) === 'active';
  }, [getProductStatus]);

  /**
   * Ürün inaktif/pasif mi
   */
  const isInactive = useCallback((product: Product): boolean => {
    return getProductStatus(product) === 'inactive';
  }, [getProductStatus]);

  /**
   * Ürün stokta yok mu
   */
  const isOutOfStock = useCallback((product: Product): boolean => {
    return getProductStatus(product) === 'out_of_stock';
  }, [getProductStatus]);

  /**
   * Durum metnini al
   */
  const getStatusText = useCallback((status: ProductStatus): string => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      case 'out_of_stock':
        return 'Stokta Yok';
      default:
        return 'Bilinmeyen';
    }
  }, []);

  /**
   * Durum rengini al
   */
  const getStatusColor = useCallback((status: ProductStatus): string => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'inactive':
        return 'text-gray-500';
      case 'out_of_stock':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }, []);

  return {
    getProductStatus,
    updateProductStatus,
    isActive,
    isInactive,
    isOutOfStock,
    getStatusText,
    getStatusColor
  };
};

export default useProductStatus;