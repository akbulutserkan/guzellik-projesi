'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ProductSaleWithPayments } from '@/types/product';
import { 
  validateSaleData, 
  validatePaymentData,
  toLocalISOString
} from '@/utils/productSale/formatters';

export interface UseProductSaleUIResult {
  // Sale form data
  saleFormData: {
    productId: string;
    customerId: string;
    staffId: string;
    quantity: string;
    unitPrice: string;
    date: string;
    paymentMethod: string;
    isFullyPaid: boolean;
  };
  formErrors: Record<string, string>;
  
  // Payment form data
  paymentFormData: {
    amount: string;
    paymentMethod: string;
    paymentType: string;
    date: string;
    notes: string;
  };
  paymentFormErrors: Record<string, string>;
  
  // UI state setters
  setSaleFormData: React.Dispatch<React.SetStateAction<{
    productId: string;
    customerId: string;
    staffId: string;
    quantity: string;
    unitPrice: string;
    date: string;
    paymentMethod: string;
    isFullyPaid: boolean;
  }>>;
  setPaymentFormData: React.Dispatch<React.SetStateAction<{
    amount: string;
    paymentMethod: string;
    paymentType: string;
    date: string;
    notes: string;
  }>>;
  
  // Methods
  validateSaleForm: () => boolean;
  validatePaymentForm: () => boolean;
  resetSaleForm: () => void;
  resetPaymentForm: () => void;
  updateFormFromSelectedSale: (selectedSale: ProductSaleWithPayments | null) => void;

  // UI işlemleri için eklenen fonksiyonlar
  formatProductSale: (sale: any) => ProductSaleWithPayments;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Ürün satışı UI durumlarını yöneten hook
 */
export const useProductSaleUI = (): UseProductSaleUIResult => {
  // Sale Form state
  const [saleFormData, setSaleFormData] = useState({
    productId: '',
    customerId: '',
    staffId: '',
    quantity: '1',
    unitPrice: '',
    date: toLocalISOString(new Date()),
    paymentMethod: '',
    isFullyPaid: true
  });
  
  // Payment Form state
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: '',
    paymentType: 'urun-satis',
    date: toLocalISOString(new Date()),
    notes: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentFormErrors, setPaymentFormErrors] = useState<Record<string, string>>({});
  
  /**
   * Satış formu doğrulama
   */
  const validateSaleForm = useCallback((): boolean => {
    const validation = validateSaleData({
      productId: saleFormData.productId,
      customerId: saleFormData.customerId,
      staffId: saleFormData.staffId,
      quantity: saleFormData.quantity,
      unitPrice: saleFormData.unitPrice,
      date: saleFormData.date
    });

    setFormErrors(validation.errors);
    
    // Ödeme seçenekleri kontrolü
    if (saleFormData.isFullyPaid && !saleFormData.paymentMethod) {
      setFormErrors(prev => ({
        ...prev,
        paymentMethod: 'Ödeme yöntemi seçilmelidir'
      }));
      return false;
    }
    
    return validation.valid && (!saleFormData.isFullyPaid || saleFormData.paymentMethod);
  }, [saleFormData]);
  
  /**
   * Ödeme formu doğrulama
   */
  const validatePaymentForm = useCallback((): boolean => {
    const validation = validatePaymentData({
      amount: paymentFormData.amount,
      paymentMethod: paymentFormData.paymentMethod,
      date: paymentFormData.date
    });

    setPaymentFormErrors(validation.errors);
    return validation.valid;
  }, [paymentFormData]);
  
  /**
   * Satış formunu sıfırlama
   */
  const resetSaleForm = useCallback(() => {
    setSaleFormData({
      productId: '',
      customerId: '',
      staffId: '',
      quantity: '1',
      unitPrice: '',
      date: toLocalISOString(new Date()),
      paymentMethod: '',
      isFullyPaid: true
    });
    setFormErrors({});
  }, []);
  
  /**
   * Ödeme formunu sıfırlama
   */
  const resetPaymentForm = useCallback(() => {
    setPaymentFormData({
      amount: '',
      paymentMethod: '',
      paymentType: 'urun-satis',
      date: toLocalISOString(new Date()),
      notes: ''
    });
    setPaymentFormErrors({});
  }, []);
  
  /**
   * Seçilen satışa göre form verilerini güncelle
   */
  const updateFormFromSelectedSale = useCallback((selectedSale: ProductSaleWithPayments | null) => {
    if (selectedSale) {
      setSaleFormData({
        productId: selectedSale.productId,
        customerId: selectedSale.customerId,
        staffId: selectedSale.staffId,
        quantity: selectedSale.quantity.toString(),
        unitPrice: selectedSale.unitPrice.toString(),
        date: selectedSale.date ? selectedSale.date.split('T')[0] : toLocalISOString(new Date()),
        paymentMethod: '',
        isFullyPaid: Boolean(selectedSale.paymentStatus === 'paid')
      });
    }
  }, []);
  
  // Form değiştiğinde hataları kontrol et
  useEffect(() => {
    const timer = setTimeout(() => {
      validateSaleForm();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [saleFormData, validateSaleForm]);
  
  // Ödeme formu değiştiğinde hataları kontrol et
  useEffect(() => {
    const timer = setTimeout(() => {
      validatePaymentForm();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [paymentFormData, validatePaymentForm]);
  
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
   * Ürün satışı verilerini görüntüleme için formatlar
   */
  const formatProductSale = useCallback((sale: any): ProductSaleWithPayments => {
    return {
      ...sale,
      id: sale.id || '',
      productId: sale.productId || '',
      productName: sale.productName || sale.product?.name || '',
      customerId: sale.customerId || '',
      customerName: sale.customerName || sale.customer?.name || '',
      staffId: sale.staffId || '',
      staffName: sale.staffName || sale.staff?.name || '',
      quantity: typeof sale.quantity === 'number' ? sale.quantity : parseInt(sale.quantity) || 1,
      unitPrice: typeof sale.unitPrice === 'number' ? sale.unitPrice : parseFloat(sale.unitPrice) || 0,
      totalPrice: typeof sale.totalPrice === 'number' ? sale.totalPrice : parseFloat(sale.totalPrice) || 0,
      date: sale.date || toLocalISOString(new Date()),
      paymentStatus: sale.paymentStatus || 'pending',
      payments: Array.isArray(sale.payments) ? sale.payments : []
    };
  }, []);

  return {
    saleFormData,
    formErrors,
    paymentFormData,
    paymentFormErrors,
    setSaleFormData,
    setPaymentFormData,
    validateSaleForm,
    validatePaymentForm,
    resetSaleForm,
    resetPaymentForm,
    updateFormFromSelectedSale,
    
    // UI işlemleri
    formatProductSale,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};
