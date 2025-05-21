'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Product } from '@/services/productService';
import { validateProductData } from '@/utils/product/formatters';

export interface UseProductUIResult {
  formData: {
    name: string;
    price: string;
    stock: string;
    description?: string;
  };
  formErrors: Record<string, string>;
  selectedProduct: Product | null;
  setFormData: (data: any) => void;
  resetForm: () => void;
  validateForm: () => boolean;
  setSelectedProduct: (product: Product | null) => void;
  
  // UI işlemleri için yeni fonksiyonlar
  formatProduct: (product: any) => Product;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Ürün UI durumunu yöneten hook
 */
export const useProductUI = (): UseProductUIResult => {
  // Form state'leri
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    description: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  /**
   * Formu doğrulama işlemi
   */
  const validateForm = useCallback((): boolean => {
    const validation = validateProductData({
      name: formData.name,
      price: formData.price,
      stock: formData.stock
    });
    
    setFormErrors(validation.errors);
    return validation.valid;
  }, [formData]);
  
  /**
   * Formu sıfırlama işlemi
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      price: '',
      stock: '',
      description: ''
    });
    setFormErrors({});
  }, []);
  
  // Seçili ürün değiştiğinde formu güncelle
  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name,
        price: selectedProduct.price.toString(),
        stock: selectedProduct.stock.toString(),
        description: selectedProduct.description || ''
      });
    } else {
      resetForm();
    }
  }, [selectedProduct, resetForm]);
  
  // Form değişikliklerinde doğrulamayı çalıştır
  useEffect(() => {
    // Form değiştiğinde, formda değerlerin olduğundan emin olursak doğrulama yapabiliriz
    if (formData.name || formData.price || formData.stock) {
      validateForm();
    }
  }, [formData, validateForm]);

  /**
   * Başarı toast mesajı gösterir
   */
  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: 'Başarılı',
      description: message,
      variant: 'default'
    });
  }, []);
  
  /**
   * Hata toast mesajı gösterir
   */
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: 'Hata',
      description: message,
      variant: 'destructive'
    });
  }, []);
  
  /**
   * Uyarı toast mesajı gösterir
   */
  const showWarningToast = useCallback((message: string) => {
    toast({
      title: 'Uyarı',
      description: message,
      variant: 'warning'
    });
  }, []);
  
  /**
   * Ürün verilerini görüntüleme için formatlar
   */
  const formatProduct = useCallback((product: any): Product => {
    return {
      ...product,
      id: product.id || '',
      name: product.name || '',
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
      stock: typeof product.stock === 'number' ? product.stock : parseInt(product.stock) || 0,
      description: product.description || '',
      isActive: product.isActive !== undefined ? product.isActive : true
    };
  }, []);

  return {
    formData,
    formErrors,
    selectedProduct,
    setFormData,
    resetForm,
    validateForm,
    setSelectedProduct,
    
    // UI işlemleri
    formatProduct,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};
