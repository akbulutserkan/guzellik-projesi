'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Product, updateProductStock, getProductById } from '@/services/productService';
import { useProductPermissions } from './useProductPermissions';

export interface InventoryMovement {
  productId: string;
  quantity: number;
  type: 'in' | 'out';
  note?: string;
  timestamp: Date;
}

export interface UseProductInventoryResult {
  addStock: (productId: string, quantity: number, note?: string) => Promise<Product | null>;
  removeStock: (productId: string, quantity: number, note?: string) => Promise<Product | null>;
  setStock: (productId: string, newStock: number, note?: string) => Promise<Product | null>;
  movementHistory: InventoryMovement[];
  loading: boolean;
  error: string | null;
}

/**
 * Ürün stok ve envanter yönetimini sağlayan hook
 */
export const useProductInventory = (showToasts: boolean = true): UseProductInventoryResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [movementHistory, setMovementHistory] = useState<InventoryMovement[]>([]);
  
  const { toast } = useToast();
  const { permissions } = useProductPermissions();

  /**
   * Stok hareketini kaydet (uygulama içi geçmişi)
   */
  const recordMovement = useCallback((movement: Omit<InventoryMovement, 'timestamp'>) => {
    const fullMovement: InventoryMovement = {
      ...movement,
      timestamp: new Date()
    };
    
    setMovementHistory(prev => [fullMovement, ...prev]);
    
    // NOT: Gerçek uygulamada bu hareketler API'ye de kaydedilebilir
  }, []);

  /**
   * Ürüne stok ekle
   */
  const addStock = useCallback(async (
    productId: string, 
    quantity: number,
    note?: string
  ): Promise<Product | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Stok ekleme yetkiniz bulunmamaktadır"
        });
      }
      return null;
    }
    
    if (quantity <= 0) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Eklenecek stok miktarı 0'dan büyük olmalıdır"
        });
      }
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Önce mevcut ürün bilgilerini al
      const product = await getProductById(productId);
      if (!product) {
        throw new Error('Ürün bulunamadı');
      }
      
      // Yeni stok değerini hesapla
      const newStock = (product.stock || 0) + quantity;
      
      // Stok güncelleme işlemini yap
      const updatedProduct = await updateProductStock(
        productId, 
        newStock,
        showToasts
      );
      
      // Stok hareketini kaydet
      recordMovement({
        productId,
        quantity,
        type: 'in',
        note
      });
      
      return updatedProduct;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stok eklenirken bir hata oluştu';
      setError(errorMessage);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: errorMessage
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canEdit, showToasts, toast, recordMovement]);

  /**
   * Üründen stok çıkar
   */
  const removeStock = useCallback(async (
    productId: string, 
    quantity: number,
    note?: string
  ): Promise<Product | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Stok çıkarma yetkiniz bulunmamaktadır"
        });
      }
      return null;
    }
    
    if (quantity <= 0) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Çıkarılacak stok miktarı 0'dan büyük olmalıdır"
        });
      }
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Önce mevcut ürün bilgilerini al
      const product = await getProductById(productId);
      if (!product) {
        throw new Error('Ürün bulunamadı');
      }
      
      // Yeni stok değerini hesapla
      const newStock = Math.max(0, (product.stock || 0) - quantity);
      
      // Stok güncelleme işlemini yap
      const updatedProduct = await updateProductStock(
        productId, 
        newStock,
        showToasts
      );
      
      // Stok hareketini kaydet
      recordMovement({
        productId,
        quantity,
        type: 'out',
        note
      });
      
      return updatedProduct;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stok çıkarılırken bir hata oluştu';
      setError(errorMessage);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: errorMessage
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canEdit, showToasts, toast, recordMovement]);

  /**
   * Ürün stoğunu belirli bir değere ayarla
   */
  const setStock = useCallback(async (
    productId: string, 
    newStock: number,
    note?: string
  ): Promise<Product | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Stok değiştirme yetkiniz bulunmamaktadır"
        });
      }
      return null;
    }
    
    if (newStock < 0) {
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Stok miktarı 0'dan küçük olamaz"
        });
      }
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API çağrısı
      const updatedProduct = await updateProductStock(productId, newStock, showToasts);
      
      // Stok hareketini kaydet (stok ayarlama işlemi)
      recordMovement({
        productId,
        quantity: newStock,
        type: newStock === 0 ? 'out' : 'in', // 0'a ayarlanırsa "out" olarak işaretle
        note: note || 'Stok manuel olarak ayarlandı'
      });
      
      return updatedProduct;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stok güncellenirken bir hata oluştu';
      setError(errorMessage);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: errorMessage
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canEdit, showToasts, toast, recordMovement]);

  return {
    addStock,
    removeStock,
    setStock,
    movementHistory,
    loading,
    error
  };
};

export default useProductInventory;