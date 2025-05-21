'use client';

import { useCallback } from 'react';
import { PackageFormData } from '@/types/package';
import {
  isValidPackageName,
  isValidPrice,
  isValidSessionCount,
  isValidCategoryId,
  isValidServiceIds,
  validatePackageDataWithMessages
} from '@/utils/package/formatters';

export interface UsePackageFormValidationResult {
  validateForm: (data: PackageFormData) => Record<string, string>;
  validateUpdateForm: (data: Partial<PackageFormData>) => Record<string, string>;
  validateName: (name: string) => string;
  validatePrice: (price: number) => string;
  validateSessionCount: (count: number) => string;
  validateCategoryId: (categoryId: string) => string;
  validateServiceIds: (serviceIds: string[]) => string;
}

/**
 * Paket form doğrulamasını yöneten hook
 */
export const usePackageFormValidation = (): UsePackageFormValidationResult => {
  // Form alanı doğrulama fonksiyonları
  const validateName = useCallback((name: string): string => {
    if (!name) return 'Paket adı gereklidir';
    if (!isValidPackageName(name)) return 'Geçerli bir paket adı giriniz';
    return '';
  }, []);
  
  const validatePrice = useCallback((price: number): string => {
    if (!isValidPrice(price)) return 'Geçerli bir fiyat giriniz';
    return '';
  }, []);
  
  const validateSessionCount = useCallback((count: number): string => {
    if (!isValidSessionCount(count)) return 'Geçerli bir seans sayısı giriniz (1-100 arası)';
    return '';
  }, []);
  
  const validateCategoryId = useCallback((categoryId: string): string => {
    if (!isValidCategoryId(categoryId)) return 'Kategori seçimi gereklidir';
    return '';
  }, []);
  
  const validateServiceIds = useCallback((serviceIds: string[]): string => {
    if (!isValidServiceIds(serviceIds)) return 'En az bir hizmet seçmelisiniz';
    return '';
  }, []);
  
  // Tüm formu doğrulayan ana fonksiyon
  const validateForm = useCallback((data: PackageFormData): Record<string, string> => {
    // Merkezi doğrulama fonksiyonunu kullan
    return validatePackageDataWithMessages(data);
  }, []);
  
  // Sadece güncelleme işlemleri için gerekli alanları doğrulayan fonksiyon
  const validateUpdateForm = useCallback((data: Partial<PackageFormData>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Fiyat kontrolü (eğer sağlanmışsa)
    if (data.price !== undefined && !isValidPrice(data.price)) {
      errors.price = 'Geçerli bir fiyat giriniz (0 veya daha büyük)';
    }
    
    // Seans sayısı kontrolü (eğer sağlanmışsa)
    if (data.sessionCount !== undefined && !isValidSessionCount(data.sessionCount)) {
      errors.sessionCount = 'Geçerli bir seans sayısı giriniz (en az 1)';
    }
    
    return errors;
  }, []);

  return {
    validateForm,
    validateUpdateForm,
    validateName,
    validatePrice,
    validateSessionCount,
    validateCategoryId,
    validateServiceIds
  };
};
