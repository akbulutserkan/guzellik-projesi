'use client';

import { useEffect, useRef } from 'react';
import { PackageSale } from '@/types/package';

// Tip tanımlamaları
interface AddPaymentData {
  packageSaleId: string;
  amount: number;
  date?: string;
  method?: string;
  notes?: string;
  staffId?: string | null;
}

interface CreatePackageSaleData {
  packageId: string;
  customerId: string;
  staffId: string;
  price: number;
  saleDate: string;
  expiryDate?: string;
  notes?: string;
  status?: string;
  initialPayment?: {
    amount: number;
    method?: string;
  };
}

interface UpdatePackageSaleData {
  packageId?: string;
  customerId?: string;
  staffId?: string;
  price?: number;
  saleDate?: string;
  expiryDate?: string;
  notes?: string;
  status?: string;
}

// Alt hook'ları içe aktar
import { usePackageSaleData } from './usePackageSaleData';
import { usePackageSaleUI } from './usePackageSaleUI';
import { usePackageSalePayments } from './usePackageSalePayments';
import { usePackageSalePermissions } from './usePackageSalePermissions';

// Hook props interface
interface UsePackageSaleManagementProps {
  initialSales?: PackageSale[];
  autoFetch?: boolean;
  showToasts?: boolean;
  defaultDateRange?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Paket satışı yönetimi ana hook'u
 * 
 * Alt hook'ları birleştirerek tek bir API arayüzü sunar
 */
export const usePackageSaleManagement = ({
  initialSales = [],
  autoFetch = true,
  showToasts = true,
  defaultDateRange
}: UsePackageSaleManagementProps = {}) => {
  // Alt hook'ları çağır
  const { permissions } = usePackageSalePermissions();
  
  const uiState = usePackageSaleUI({ defaultDateRange });
  
  const dataOps = usePackageSaleData({
    initialSales,
    autoFetch,
    showToasts
  });
  
  const paymentOps = usePackageSalePayments({
    showToasts,
    onSuccess: (_, packageSaleId) => {
      if (dataOps.currentSale && dataOps.currentSale.id === packageSaleId) {
        dataOps.getSaleById(packageSaleId);
      }
    }
  });
  
  // Initialize data on mount - tek seferlik çağırma
  useEffect(() => {
    let mounted = true;
    
    // Eğer bileşen hala mount durumundaysa veri yükle
    if (mounted) {
      dataOps.fetchInitialData();
    }
    
    // Cleanup fonksiyonu
    return () => {
      mounted = false;
    };
  }, []); // Boş bağımlılık listesi - sadece mount'ta çalışacak
  
  // fetchSales fonksiyonuna stable bir referans oluşturmak için useRef kullanıyoruz
  const fetchSalesRef = useRef(dataOps.fetchSales);
  
  // fetchSales değiştiğinde referansı güncelliyoruz
  useEffect(() => {
    fetchSalesRef.current = dataOps.fetchSales;
  }, [dataOps.fetchSales]);

  // Load sales data when page or filter changes
  useEffect(() => {
    // Ref aracılığıyla fonksiyonu çağırıyoruz - bu sayede effect'in bağımlılıklarında olmasa bile
    // her zaman güncel versiyonunu kullanabiliriz
    fetchSalesRef.current(uiState.currentPage, uiState.dateFilter);
  }, [uiState.currentPage, uiState.dateFilter]); // dataOps.fetchSales bağımlılığını kaldırdık
  
  // Handle delete sale (combines UI state and data operation)
  const handleDeleteSale = async () => {
    if (!uiState.saleToDelete) return false;
    
    const success = await dataOps.deleteSale(uiState.saleToDelete.id);
    
    if (success) {
      // Refresh the list after deletion
      await dataOps.fetchSales(uiState.currentPage, uiState.dateFilter);
      uiState.setSaleToDelete(null);
    }
    
    return success;
  };
  
  return {
    // Data
    sales: dataOps.sales,
    loading: dataOps.loading,
    error: dataOps.error,
    totalPages: dataOps.totalPages,
    packages: dataOps.packages,
    customers: dataOps.customers,
    staffList: dataOps.staffList,
    
    // UI state
    saleToEdit: uiState.saleToEdit,
    saleToDelete: uiState.saleToDelete,
    selectedPaymentsSale: uiState.selectedPaymentsSale,
    isNewSaleModalOpen: uiState.isNewSaleModalOpen,
    isBrowser: uiState.isBrowser,
    dateFilter: uiState.dateFilter,
    currentPage: uiState.currentPage,
    saleDate: uiState.saleDate,
    expiryDate: uiState.expiryDate,
    
    // UI setters
    setSaleToEdit: uiState.setSaleToEdit,
    setSaleToDelete: uiState.setSaleToDelete,
    setSelectedPaymentsSale: uiState.setSelectedPaymentsSale,
    setIsNewSaleModalOpen: uiState.setIsNewSaleModalOpen,
    setCurrentPage: uiState.setCurrentPage,
    handleDateFilterChange: uiState.handleDateFilterChange,
    onSaleDateChange: uiState.onSaleDateChange,
    onExpiryDateChange: uiState.onExpiryDateChange,
    
    // Data operations
    fetchSales: dataOps.fetchSales,
    fetchInitialData: dataOps.fetchInitialData,
    handleCreateSale: dataOps.createSale,
    handleUpdateSale: dataOps.updateSale,
    handleDeleteSale,
    handleAddPayment: paymentOps.addPayment,
    handleDeletePayment: paymentOps.deletePayment,
    getPackageSaleById: dataOps.getSaleById,
    handleNewCustomer: dataOps.handleNewCustomer,
    
    // Payment utilities
    calculateTotalPaid: paymentOps.calculateTotalPaid,
    calculateRemainingAmount: paymentOps.calculateRemainingAmount,
    
    // Permissions
    permissions
  };
};

export default usePackageSaleManagement;