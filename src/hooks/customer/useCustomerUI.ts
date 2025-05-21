'use client';

import { useState, useCallback, useMemo } from 'react';
import { Customer, CustomerCreateData, CustomerUpdateData } from '@/types/customer';
import { toast } from '@/components/ui/use-toast';
import { formatCustomerForDisplay } from '@/utils/customer/formatters';

export interface UseCustomerUIResult {
  selectedCustomer: Customer | null;
  formData: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
  formErrors: {
    name: string;
    phone: string;
    email: string;
  };
  isFormValid: boolean;
  selectCustomer: (customer: Customer | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    email: string;
    notes: string;
  }>>;
  clearForm: () => void;
  handlePhoneChange: (value: string) => void;
  
  // UI işlemleri için yeni fonksiyonlar
  formatCustomer: (customer: any) => Customer;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  validateForm: (data: any) => boolean;
}

/**
 * Müşteri UI durumu hook'u
 */
export const useCustomerUI = (): UseCustomerUIResult => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form yönetimi için state'ler
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    email: ''
  });
  
  /**
   * Form alanlarının geçerli olup olmadığını kontrol et
   */
  const isFormValid = useMemo(() => {
    // Basit doğrulama: Ad ve telefon zorunlu
    return !!formData.name && !!formData.phone && !formErrors.name && !formErrors.phone && !formErrors.email;
  }, [formData, formErrors]);
  
  /**
   * Formu temizler
   */
  const clearForm = useCallback(() => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: ''
    });
    
    setFormErrors({
      name: '',
      phone: '',
      email: ''
    });
  }, []);
  
  /**
   * Telefon numarasını günceller
   */
  const handlePhoneChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    
    // Telefon doğrulama
    if (value && value.length < 10) {
      setFormErrors(prev => ({ ...prev, phone: 'Geçerli bir telefon numarası gerekli' }));
    } else {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  }, []);
  
  /**
   * Müşteri seçer
   */
  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

  /**
   * Müşteri verilerini görüntüleme için formatlar
   */
  const formatCustomer = useCallback((customer: any): Customer => {
    return formatCustomerForDisplay(customer);
  }, []);
  
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
   * Form verilerini doğrulama
   */
  const validateForm = useCallback((data: any): boolean => {
    if (!data.name) {
      showErrorToast('Lütfen müşteri adını girin');
      return false;
    }
    
    if (!data.phone) {
      showErrorToast('Lütfen telefon numarası girin');
      return false;
    }
    
    return true;
  }, [showErrorToast]);

  return {
    selectedCustomer,
    formData,
    formErrors,
    isFormValid,
    selectCustomer,
    setFormData,
    clearForm,
    handlePhoneChange,
    
    // UI işlemleri
    formatCustomer,
    showSuccessToast,
    showErrorToast,
    validateForm
  };
};
