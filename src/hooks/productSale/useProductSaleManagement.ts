'use client';

import { useCallback, useEffect } from 'react';
import { 
  useProductSaleData,
  useProductSaleUI,
  useProductSalePermissions,
  useProductSaleEntities,
  useProductSaleDateRange
} from './index';
import { ProductSaleWithPayments, Payment } from '@/types/product';

// Hook props tipi
interface UseProductSaleManagementProps {
  initialSales?: ProductSaleWithPayments[];
  autoFetch?: boolean;
  showToasts?: boolean;
  shouldRefreshOnDateChange?: boolean; // Tarih değişiminde otomatik yenileme yapılmalı mı?
}

/**
 * Ürün satışları yönetimi için ana React hook'u
 * Alt hook'ları birleştirerek tek bir API sağlar
 */
export const useProductSaleManagement = ({
  initialSales = [],
  autoFetch = true,
  showToasts = true,
  shouldRefreshOnDateChange = false
}: UseProductSaleManagementProps = {}) => {
  // Alt hook'ları kullan
  const {
    sales,
    selectedSale,
    loading,
    submitting,
    error,
    setSales,
    setSelectedSale,
    fetchSales,
    handleCreateSale: createSale,
    handleUpdateSale: updateSale,
    handleDeleteSale,
    handleCreatePayment: createPayment,
    handleDeletePayment
  } = useProductSaleData({
    initialSales,
    autoFetch,
    showToasts
  });
  
  const {
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
    updateFormFromSelectedSale
  } = useProductSaleUI();
  
  const { permissions } = useProductSalePermissions();
  
  const {
    products,
    customers,
    staffs,
    productsLoading,
    customersLoading,
    staffsLoading,
    fetchProducts,
    fetchCustomers,
    fetchStaffs
  } = useProductSaleEntities({
    autoFetch,
    showToasts
  });
  
  const { dateRange, setDateRange } = useProductSaleDateRange(shouldRefreshOnDateChange);
  
  /**
   * Yeni satış oluşturma işlemi
   */
  const handleCreateSale = useCallback(async (): Promise<ProductSaleWithPayments | null> => {
    // Form doğrulama
    if (!validateSaleForm()) {
      return null;
    }
    
    // Form verilerini hazırla
    const saleData = {
      productId: saleFormData.productId,
      customerId: saleFormData.customerId,
      staffId: saleFormData.staffId,
      quantity: Number(saleFormData.quantity),
      unitPrice: Number(saleFormData.unitPrice),
      date: saleFormData.date,
      paymentType: saleFormData.isFullyPaid ? saleFormData.paymentMethod : undefined,
      isFullyPaid: saleFormData.isFullyPaid
    };
    
    // Alt hook'un createSale fonksiyonunu çağır
    const result = await createSale(saleData);
    
    // Başarılıysa formu sıfırla
    if (result) {
      resetSaleForm();
    }
    
    return result;
  }, [validateSaleForm, saleFormData, createSale, resetSaleForm]);
  
  /**
   * Satış güncelleme işlemi
   */
  const handleUpdateSale = useCallback(async (id: string): Promise<ProductSaleWithPayments | null> => {
    // Form doğrulama
    if (!validateSaleForm()) {
      return null;
    }
    
    // Form verilerini hazırla
    const updateData = {
      quantity: Number(saleFormData.quantity),
      unitPrice: Number(saleFormData.unitPrice)
    };
    
    // Alt hook'un updateSale fonksiyonunu çağır
    return await updateSale(id, updateData);
  }, [validateSaleForm, saleFormData, updateSale]);
  
  /**
   * Yeni ödeme ekleme işlemi
   */
  const handleCreatePayment = useCallback(async (productSaleId: string): Promise<Payment | null> => {
    // Form doğrulama
    if (!validatePaymentForm()) {
      return null;
    }
    
    // Satış ve müşteri bilgisini alıyoruz
    const relatedSale = sales.find(sale => sale.id === productSaleId);
    if (!relatedSale) {
      return null;
    }
    
    // Ödeme verilerini hazırla
    const paymentData = {
      customerId: relatedSale.customerId,
      customerName: relatedSale.customerName,
      amount: Number(paymentFormData.amount),
      paymentType: paymentFormData.paymentType,
      paymentMethod: paymentFormData.paymentMethod,
      processedBy: paymentFormData.paymentMethod, // İşlemi gerçekleştiren kişi
      date: paymentFormData.date,
      notes: paymentFormData.notes || undefined
    };
    
    // Alt hook'un createPayment fonksiyonunu çağır
    const result = await createPayment(productSaleId, paymentData);
    
    // Başarılıysa formu sıfırla
    if (result) {
      resetPaymentForm();
    }
    
    return result;
  }, [validatePaymentForm, paymentFormData, sales, createPayment, resetPaymentForm]);
  
  // Seçilen satış değiştiğinde form verilerini güncelle
  useEffect(() => {
    updateFormFromSelectedSale(selectedSale);
  }, [selectedSale, updateFormFromSelectedSale]);
  
  return {
    // Data states
    sales,
    products,
    customers,
    staffs,
    selectedSale,
    dateRange,
    
    // Loading states
    loading,
    productsLoading,
    customersLoading,
    staffsLoading,
    submitting,
    
    // Error state
    error,
    
    // Form data
    saleFormData,
    formErrors,
    paymentFormData,
    paymentFormErrors,
    
    // Setters
    setSales,
    setSelectedSale,
    setSaleFormData,
    setPaymentFormData,
    setDateRange,
    
    // Methods
    fetchSales,
    fetchProducts,
    fetchCustomers,
    fetchStaffs,
    handleCreateSale,
    handleUpdateSale,
    handleDeleteSale,
    handleCreatePayment,
    handleDeletePayment,
    validateSaleForm,
    validatePaymentForm,
    resetSaleForm,
    resetPaymentForm,
    
    // Permissions
    permissions
  };
};

export default useProductSaleManagement;