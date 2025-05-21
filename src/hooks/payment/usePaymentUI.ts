'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from '@/components/ui/use-toast';
import { validatePaymentData } from '@/utils/payment/formatters';
import { CreatePaymentParams, Payment } from '@/types/payment';

/**
 * usePaymentUI hook parametreleri
 */
export interface UsePaymentUIProps {
  formValidationDelay?: number;
}

/**
 * usePaymentUI hook dönüş değeri
 */
export interface UsePaymentUIResult {
  // Form state'leri
  formData: {
    customerId: string;
    amount: string;
    paymentType: string;
    paymentMethod: string;
    packageSaleId: string;
    productSaleId?: string;
    installment: string;
    receiptNumber: string;
    notes: string;
    processedBy: string;
  };
  formErrors: Record<string, string>;
  
  // Form işlemleri
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validateForm: () => boolean;
  resetForm: () => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  getSubmitData: () => CreatePaymentParams | null;
  
  // UI yardımcıları
  printPayment: () => void;
  clearFormErrors: () => void;
  setCustomFormError: (field: string, message: string) => void;
  
  // Form değişiklik takibi
  formIsDirty: boolean;
  resetFormDirty: () => void;
  
  // UI işlemleri için eklenen fonksiyonlar
  formatPayment: (payment: any) => Payment;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Tahsilat UI işlemleri hook'u
 */
export const usePaymentUI = ({
  formValidationDelay = 500
}: UsePaymentUIProps = {}): UsePaymentUIResult => {
  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    paymentType: 'Nakit',
    paymentMethod: 'Hizmet Ödemesi',
    packageSaleId: '',
    productSaleId: '',
    installment: '',
    receiptNumber: '',
    notes: '',
    processedBy: ''
  });
  
  // Form hataları
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Form değişikliği takibi
  const [formIsDirty, setFormIsDirty] = useState(false);
  
  /**
   * Form doğrulama
   */
  const validateForm = useCallback((): boolean => {
    const validation = validatePaymentData(formData);
    setFormErrors(validation.errors);
    return validation.valid;
  }, [formData]);
  
  /**
   * Form reset
   */
  const resetForm = useCallback(() => {
    setFormData({
      customerId: '',
      amount: '',
      paymentType: 'Nakit',
      paymentMethod: 'Hizmet Ödemesi',
      packageSaleId: '',
      productSaleId: '',
      installment: '',
      receiptNumber: '',
      notes: '',
      processedBy: ''
    });
    setFormErrors({});
    setFormIsDirty(false);
  }, []);
  
  /**
   * Form değişikliği işleyicisi
   */
  const handleFormChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Form değişikliği takibi
    setFormIsDirty(true);
    
    // Seçime bağlı alanları temizle
    if (name === 'paymentMethod') {
      if (value !== 'Paket Ödemesi') {
        setFormData(prev => ({ ...prev, packageSaleId: '', [name]: value }));
      }
      if (value !== 'Ürün Ödemesi') {
        setFormData(prev => ({ ...prev, productSaleId: '', [name]: value }));
      }
    }
    
    if (name === 'paymentType' && value !== 'Kredi Kartı') {
      setFormData(prev => ({ ...prev, installment: '', [name]: value }));
    }
  }, []);
  
  /**
   * Gönderim için form verisini hazırlama
   */
  const getSubmitData = useCallback((): CreatePaymentParams | null => {
    if (!validateForm()) {
      return null;
    }
    
    return {
      customerId: formData.customerId,
      amount: parseFloat(formData.amount),
      paymentType: formData.paymentType,
      paymentMethod: formData.paymentMethod,
      packageSaleId: formData.packageSaleId || undefined,
      productSaleId: formData.productSaleId || undefined,
      installment: formData.installment ? parseInt(formData.installment) : undefined,
      receiptNumber: formData.receiptNumber || undefined,
      notes: formData.notes || undefined,
      processedBy: formData.processedBy,
      status: 'Tamamlandı',
      date: new Date().toISOString()
    };
  }, [formData, validateForm]);
  
  /**
   * Tahsilat yazdırma
   */
  const printPayment = useCallback(() => {
    window.print();
  }, []);
  
  /**
   * Form hatalarını temizleme
   */
  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);
  
  /**
   * Özel form hatası ekleme
   */
  const setCustomFormError = useCallback((field: string, message: string) => {
    setFormErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);
  
  /**
   * Form değişiklik takibini sıfırlama
   */
  const resetFormDirty = useCallback(() => {
    setFormIsDirty(false);
  }, []);
  
  // Form değişikliği takibi için ek bellek optimizasyonu
  const formDataSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  
  // Form değiştiğinde doğrulama
  useEffect(() => {
    // Performans için gecikme ile doğrulama yap
    const timeoutId = setTimeout(() => {
      if (formIsDirty) {
        validateForm();
      }
    }, formValidationDelay);
    
    return () => clearTimeout(timeoutId); // Temizlik
  }, [formDataSnapshot, validateForm, formIsDirty, formValidationDelay]);
  
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
   * Tahsilat verilerini görüntüleme için formatlar
   */
  const formatPayment = useCallback((payment: any): Payment => {
    return {
      ...payment,
      id: payment.id || '',
      customerId: payment.customerId || '',
      customerName: payment.customerName || payment.customer?.name || '',
      amount: typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0,
      paymentType: payment.paymentType || 'Nakit',
      paymentMethod: payment.paymentMethod || 'Hizmet Ödemesi',
      status: payment.status || 'Tamamlandı',
      date: payment.date || new Date().toISOString(),
      processedBy: payment.processedBy || ''
    };
  }, []);

  return {
    // Form state'leri
    formData,
    formErrors,
    
    // Form işlemleri
    setFormData,
    validateForm,
    resetForm,
    handleFormChange,
    getSubmitData,
    
    // UI yardımcıları
    printPayment,
    clearFormErrors,
    setCustomFormError,
    
    // Form değişiklik takibi
    formIsDirty,
    resetFormDirty,
    
    // UI işlemleri
    formatPayment,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};
