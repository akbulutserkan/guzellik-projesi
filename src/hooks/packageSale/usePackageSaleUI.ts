'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { toLocalISOString } from '@/utils/packageSale/formatters';
import { PackageSale } from '@/types/package';

export interface UsePackageSaleUIProps {
  defaultDateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface UsePackageSaleUIResult {
  // UI State
  saleToEdit: any | null;
  saleToDelete: any | null;
  selectedPaymentsSale: any | null;
  isNewSaleModalOpen: boolean;
  isBrowser: boolean;
  dateFilter: {
    startDate: string;
    endDate: string;
  };
  currentPage: number;
  saleDate: string;
  expiryDate: string;
  
  // UI State Setters
  setSaleToEdit: (sale: any | null) => void;
  setSaleToDelete: (sale: any | null) => void;
  setSelectedPaymentsSale: (sale: any | null) => void;
  setIsNewSaleModalOpen: (isOpen: boolean) => void;
  setCurrentPage: (page: number) => void;
  handleDateFilterChange: (newFilter: { startDate: string; endDate: string }) => void;
  onSaleDateChange: (date: string) => void;
  onExpiryDateChange: (date: string) => void;
  
  // UI işlemleri için eklenen fonksiyonlar
  formatPackageSale: (sale: any) => PackageSale;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

/**
 * Paket satışı UI durumunu yöneten hook
 */
export const usePackageSaleUI = ({
  defaultDateRange
}: UsePackageSaleUIProps = {}): UsePackageSaleUIResult => {
  // State for modal handling
  const [saleToEdit, setSaleToEdit] = useState<any | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<any | null>(null);
  const [selectedPaymentsSale, setSelectedPaymentsSale] = useState<any | null>(null);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State: Date defaults
  const today = toLocalISOString(new Date());
  const [saleDate, setSaleDate] = useState<string>(today);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return toLocalISOString(date);
  });

  // State: Date filter
  const [dateFilter, setDateFilter] = useState(() => {
    if (defaultDateRange) {
      return defaultDateRange;
    }
    
    // Default: Last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: toLocalISOString(startDate),
      endDate: toLocalISOString(endDate)
    };
  });

  // Check if we're in the browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Date filter change handler
  const handleDateFilterChange = useCallback((newFilter: { startDate: string; endDate: string }) => {
    // Prevent unnecessary re-renders if filter hasn't changed
    if (newFilter.startDate === dateFilter.startDate && newFilter.endDate === dateFilter.endDate) return;
    
    setDateFilter(newFilter);
    setCurrentPage(1); // Reset to first page
  }, [dateFilter]);

  // Date handler functions
  const onSaleDateChange = useCallback((date: string) => {
    setSaleDate(date);
    
    // Update expiry date to be 1 year after sale date
    const newExpiryDate = new Date(date);
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
    setExpiryDate(toLocalISOString(newExpiryDate));
  }, []);
  
  const onExpiryDateChange = useCallback((date: string) => {
    setExpiryDate(date);
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
   * Paket satışı verilerini görüntüleme için formatlar
   */
  const formatPackageSale = useCallback((sale: any): PackageSale => {
    return {
      ...sale,
      id: sale.id || '',
      packageId: sale.packageId || '',
      packageName: sale.packageName || sale.package?.name || '',
      customerId: sale.customerId || '',
      customerName: sale.customerName || sale.customer?.name || '',
      price: typeof sale.price === 'number' ? sale.price : 0,
      saleDate: sale.saleDate || today,
      expiryDate: sale.expiryDate || '',
      status: sale.status || 'ACTIVE',
      remainingSessions: typeof sale.remainingSessions === 'number' ? sale.remainingSessions : 0,
      totalSessions: typeof sale.totalSessions === 'number' ? sale.totalSessions : 0
    };
  }, [today]);

  return {
    // UI State
    saleToEdit,
    saleToDelete,
    selectedPaymentsSale,
    isNewSaleModalOpen,
    isBrowser,
    dateFilter,
    currentPage,
    saleDate,
    expiryDate,
    
    // UI State Setters
    setSaleToEdit,
    setSaleToDelete,
    setSelectedPaymentsSale,
    setIsNewSaleModalOpen,
    setCurrentPage,
    handleDateFilterChange,
    onSaleDateChange,
    onExpiryDateChange,
    
    // UI işlemleri
    formatPackageSale,
    showSuccessToast,
    showErrorToast,
    showWarningToast
  };
};
