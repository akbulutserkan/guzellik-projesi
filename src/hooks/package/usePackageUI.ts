'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { PackageFormData, Package } from '@/types/package';
import { usePackageFormValidation } from './usePackageFormValidation';

export interface UsePackageUIResult {
  formData: PackageFormData;
  setFormData: React.Dispatch<React.SetStateAction<PackageFormData>>;
  formErrors: Record<string, string>;
  isFormValid: boolean;
  clearForm: () => void;
  validateForm: (data?: PackageFormData) => boolean;
  
  // UI işlemleri için yeni fonksiyonlar
  formatPackage: (packageData: any) => Package;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Paket UI durumunu yöneten hook
 */
export const usePackageUI = (): UsePackageUIResult => {
  // Form state
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    price: 0,
    sessionCount: 1,
    categoryId: '',
    serviceIds: [] as string[]
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  
  // Form doğrulama hook'unu kullan
  const { validateForm: validateFormWithErrors, validateUpdateForm } = usePackageFormValidation();
  
  // Form alanlarını temizler
  const clearForm = useCallback(() => {
    setFormData({
      name: '',
      price: 0,
      sessionCount: 1,
      categoryId: '',
      serviceIds: [] as string[]
    });
    setFormErrors({});
    setIsFormValid(false);
  }, []);
  
  // Form doğrulama - useCallback ile optimize edildi
  const validateForm = useCallback((data?: PackageFormData): boolean => {
    const formToValidate = data || formData;
    console.log("Form doğrulanıyor, mevcut veriler:", JSON.stringify(formToValidate, null, 2));

    // Kısmi güncelleme mi yoksa tam form mu kontrol et
    const isPartialUpdate = !!(data && (!data.name || !data.categoryId || !data.serviceIds));

    let validationErrors;
    if (isPartialUpdate) {
      // Kısmi güncelleme için farklı doğrulama kullan
      validationErrors = validateUpdateForm(formToValidate as Partial<PackageFormData>);
    } else {
      // Tam form için normal doğrulamayı kullan
      validationErrors = validateFormWithErrors(formToValidate);
    }

    // Form errors'a taşı
    setFormErrors(validationErrors);

    // Form geçerli mi?
    const valid = Object.keys(validationErrors).length === 0;
    console.log("Form doğrulama sonucu:", valid ? "Geçerli" : "Geçersiz", validationErrors);
    setIsFormValid(valid);

    return valid;
  }, [formData, validateFormWithErrors, validateUpdateForm]);
  
  // Form değişikliklerini dinle ve validasyon durumunu güncelle
  useEffect(() => {
    validateForm(formData);
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
   * Paket verilerini görüntüleme için formatlar
   */
  const formatPackage = useCallback((packageData: any): Package => {
    return {
      ...packageData,
      id: packageData.id || '',
      name: packageData.name || '',
      price: typeof packageData.price === 'number' ? packageData.price : 0,
      sessionCount: typeof packageData.sessionCount === 'number' ? packageData.sessionCount : 1,
      serviceIds: Array.isArray(packageData.serviceIds) ? packageData.serviceIds : [],
      services: Array.isArray(packageData.services) ? packageData.services : [],
      categoryId: packageData.categoryId || '',
      categoryName: packageData.categoryName || '',
      createdAt: packageData.createdAt || new Date().toISOString()
    };
  }, []);
  
  return {
    formData,
    setFormData,
    formErrors,
    isFormValid,
    clearForm,
    validateForm,
    
    // UI işlemleri
    formatPackage,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};
