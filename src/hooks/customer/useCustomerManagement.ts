'use client';

import { useMemo } from 'react';
import { Customer, CustomerCreateData, CustomerUpdateData } from '@/types/customer';

// Alt hook'ları içe aktar
import { useCustomerData } from './useCustomerData';
import { useCustomerPermissions } from './useCustomerPermissions';
import { useCustomerUI } from './useCustomerUI';
import { useCustomerSearch } from './useCustomerSearch';
import { useCustomerRelations } from './useCustomerRelations';

/**
 * Müşteri yönetimi ana hook'u
 * 
 * Alt hook'ları birleştirerek tek bir API arayüzü sunar
 */
export const useCustomerManagement = (options: { autoFetch?: boolean; showToasts?: boolean } = {}) => {
  // UI state hook'unu çağır
  const {
    selectedCustomer,
    formData,
    formErrors,
    isFormValid,
    selectCustomer,
    setFormData,
    clearForm,
    handlePhoneChange
  } = useCustomerUI();
  
  // Yetki hook'unu çağır
  const { permissions } = useCustomerPermissions();
  
  // Veri hook'unu çağır (UI hook'undan seçili müşteriyi alır)
  const {
    customers,
    isLoading,
    error,
    loadCustomers,
    loadCustomerDetail,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    sortedCustomers
  } = useCustomerData(options, selectedCustomer, selectCustomer);
  
  // Arama hook'unu çağır
  const {
    searchResults,
    isSearching,
    searchCustomers
  } = useCustomerSearch();
  
  // İlişkili veriler hook'unu çağır
  const {
    getCustomerAppointments,
    getCustomerProductSales,
    getCustomerPackageSales
  } = useCustomerRelations();
  
  /**
   * Müşteri oluşturma form işlemi
   */
  const handleCreateCustomer = useMemo(() => async () => {
    try {
      // Form doğrulama
      if (!isFormValid) {
        return null;
      }
      
      // Müşteri oluştur
      return await createCustomer(formData);
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      return null;
    }
  }, [formData, isFormValid, createCustomer]);
  
  /**
   * Müşteri güncelleme form işlemi
   */
  const handleUpdateCustomer = useMemo(() => async (id: string) => {
    try {
      // Form doğrulama
      if (!isFormValid) {
        return null;
      }
      
      // Müşteri güncelle
      return await updateCustomer(id, formData);
    } catch (error) {
      console.error('Müşteri güncelleme hatası:', error);
      return null;
    }
  }, [formData, isFormValid, updateCustomer]);

  return {
    // State
    customers: sortedCustomers,
    selectedCustomer,
    isLoading,
    error,
    searchResults,
    isSearching,
    permissions,
    formData,
    setFormData,
    formErrors,
    isFormValid,
    
    // Form fonksiyonları
    clearForm,
    handlePhoneChange,
    handleCreateCustomer,
    handleUpdateCustomer,
    
    // Ana fonksiyonlar
    loadCustomers,
    loadCustomerDetail,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    selectCustomer,
    
    // İlişkili veri fonksiyonları
    getCustomerAppointments,
    getCustomerProductSales,
    getCustomerPackageSales
  };
};

export default useCustomerManagement;