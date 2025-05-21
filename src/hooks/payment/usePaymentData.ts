'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment } from '@/services/paymentService';
import { getCustomers } from '@/services/customerService';
import { getPackageSales } from '@/services/packageSaleService';
import { calculateTotalAmount } from '@/utils/payment/formatters';
import { getPaymentTypeText, getPaymentMethodText, getStatusText } from '@/utils/payment/formatters';
import { Payment, CreatePaymentParams, UpdatePaymentParams, PaymentFilterOptions } from '@/types/payment';
import { usePaymentCache } from './usePaymentCache';
import { usePaymentPermissions } from './usePaymentPermissions';
import { usePaymentUI } from './usePaymentUI';

export interface UsePaymentDataOptions {
  autoFetch?: boolean;
  showToasts?: boolean;
  defaultFilters?: PaymentFilterOptions;
  cacheEnabled?: boolean;
  cacheExpirationTime?: number;
}

export interface UsePaymentDataResult {
  // Veri state'leri
  payments: Payment[];
  selectedPayment: Payment | null;
  customers: any[];
  packageSales: any[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  totalAmount: number;
  refreshing: boolean;
  
  // Filtreler
  filters: PaymentFilterOptions;
  
  // Setterlar
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setSelectedPayment: React.Dispatch<React.SetStateAction<Payment | null>>;
  setFilters: React.Dispatch<React.SetStateAction<PaymentFilterOptions>>;
  
  // Veri işlemleri
  fetchPayments: (newFilters?: PaymentFilterOptions) => Promise<void>;
  fetchPaymentById: (id: string) => Promise<Payment | null>;
  createNewPayment: (data: CreatePaymentParams) => Promise<Payment | null>;
  updatePaymentStatusFn: (id: string, status: string) => Promise<Payment | null>;
  deletePaymentFn: (id: string) => Promise<boolean>;
  handleRefresh: () => Promise<void>;
  
  // Yardımcı veriler
  fetchCustomers: () => Promise<any[]>;
  fetchPackageSales: (customerId?: string) => Promise<any[]>;
}

/**
 * Veri standartlaştırma yardımcı fonksiyonu
 */
const standardizePaymentData = (paymentData: CreatePaymentParams | UpdatePaymentParams) => {
  // Kopyalama ile veriyi değiştirmeden işleme
  const standardizedData = { ...paymentData };
  
  // Ödeme türü ve şeklini standartlaştır
  if ('paymentType' in standardizedData && standardizedData.paymentType) {
    standardizedData.paymentType = getPaymentTypeText(standardizedData.paymentType);
  }
  
  if ('paymentMethod' in standardizedData && standardizedData.paymentMethod) {
    standardizedData.paymentMethod = getPaymentMethodText(standardizedData.paymentMethod);
  }
  
  if ('status' in standardizedData && standardizedData.status) {
    standardizedData.status = getStatusText(standardizedData.status);
  }
  
  return standardizedData;
};

/**
 * Tahsilatlar ile ilgili veri yönetimi hook'u
 */
export const usePaymentData = ({
  autoFetch = true,
  showToasts = true,
  defaultFilters = {},
  cacheEnabled = true,
  cacheExpirationTime = 5 * 60 * 1000 // 5 dakika varsayılan
}: UsePaymentDataOptions = {}): UsePaymentDataResult => {
  // State tanımlamaları
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [packageSales, setPackageSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<PaymentFilterOptions>(defaultFilters);
  
  // Son işlem zamanı
  const lastOperationTime = useRef<number>(Date.now());
  
  // UI hook'unu kullan
  const { formatPayment, showSuccessToast, showErrorToast, showWarningToast } = usePaymentUI();
  
  // İzinler hook'u
  const { permissions } = usePaymentPermissions();
  
  // Önbellek hook'u
  const { 
    getPaymentsFromCache, 
    cachePaymentsData, 
    invalidatePaymentCache 
  } = usePaymentCache({ 
    cacheEnabled, 
    cacheExpirationTime 
  });
  
  /**
   * Tahsilatları getiren fonksiyon
   */
  const fetchPayments = useCallback(async (newFilters?: PaymentFilterOptions) => {
    if (!permissions.canView) {
      setError('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Yeni filtreler varsa güncelle
      const currentFilters = newFilters || filters;
      if (newFilters) {
        setFilters(newFilters);
      }
      
      // Önbellekten veri kontrolü
      const cachedData = getPaymentsFromCache(currentFilters);
      
      if (cachedData) {
        console.log('[usePaymentData] Önbellekten tahsilatlar yüklendi');
        setPayments(cachedData);
        
        // Toplam tahsilat tutarını hesapla
        const total = calculateTotalAmount(cachedData);
        setTotalAmount(total);
        
        setLoading(false);
        return;
      }
      
      // Önbellekte yok, API'dan getir
      console.log('[usePaymentData] Tahsilatlar API\'dan getiriliyor...', currentFilters);
      
      const response = await getPayments(currentFilters);
      
      if (!response.success) {
        throw new Error(response.error || 'Tahsilatlar yüklenemedi');
      }
      
      const data = response.data || [];
      
      setPayments(data);
      
      // Önbelleğe al
      cachePaymentsData(currentFilters, data);
      
      // Toplam tahsilat tutarını hesapla
      const total = calculateTotalAmount(data);
      setTotalAmount(total);
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
    } catch (error: any) {
      console.error('[usePaymentData] fetchPayments hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilatlar yüklenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Tahsilatlar yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [permissions.canView, filters, showToasts, getPaymentsFromCache, cachePaymentsData]);
  
  /**
   * ID'ye göre tahsilat getiren fonksiyon
   */
  const fetchPaymentById = useCallback(async (id: string): Promise<Payment | null> => {
    if (!permissions.canView) {
      setError('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPaymentById(id);
      
      if (!response.success) {
        throw new Error(response.error || 'Tahsilat detayları yüklenemedi');
      }
      
      const data = response.data;
      setSelectedPayment(data);
      return data;
    } catch (error: any) {
      console.error(`[usePaymentData] fetchPaymentById hatası:`, error);
      setError(error instanceof Error ? error.message : 'Tahsilat detayları yüklenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Tahsilat detayları yüklenirken bir hata oluştu');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.canView, showToasts, toast]);
  
  /**
   * Yeni tahsilat oluşturan fonksiyon
   */
  const createNewPayment = useCallback(async (data: CreatePaymentParams): Promise<Payment | null> => {
    if (!permissions.canAdd) {
      if (showToasts) {
        showErrorToast('Tahsilat oluşturma yetkiniz bulunmamaktadır');
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Veriyi standartlaştır
      const standardizedData = standardizePaymentData(data);
      
      const response = await createPayment(standardizedData);
      
      if (!response.success) {
        throw new Error(response.error || 'Tahsilat oluşturulamadı');
      }
      
      const newPayment = response.data;
      
      // Önbelleği geçersiz kıl
      invalidatePaymentCache(filters);
      
      // Tahsilat listesini güncelle (API çağrısı yapmadan)
      setPayments(prev => [newPayment, ...prev]);
      
      // Toplam miktarı güncelle
      if (newPayment.status === 'Tamamlandı') {
        setTotalAmount(prev => prev + newPayment.amount);
      }
      
      if (showToasts) {
        showSuccessToast('Tahsilat başarıyla oluşturuldu');
      }
      
      return newPayment;
    } catch (error: any) {
      console.error('[usePaymentData] createNewPayment hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilat oluşturulurken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Tahsilat oluşturulurken bir hata oluştu');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canAdd, filters, showToasts, toast, invalidatePaymentCache]);
  
  /**
   * Tahsilat durumunu güncelleyen fonksiyon
   */
  const updatePaymentStatusFn = useCallback(async (id: string, status: string): Promise<Payment | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        showErrorToast('Tahsilat durumunu güncelleme yetkiniz bulunmamaktadır');
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Durumu standartlaştır
      const standardStatus = getStatusText(status);
      
      const response = await updatePayment(id, { status: standardStatus });
      
      if (!response.success) {
        throw new Error(response.error || 'Tahsilat durumu güncellenemedi');
      }
      
      const updatedPayment = response.data;
      
      // Önbelleği geçersiz kıl
      invalidatePaymentCache(filters);
      
      // Tahsilatlar listesini güncelle (API çağrısı yapmadan)
      setPayments(prev => 
        prev.map(payment => 
          payment.id === id ? updatedPayment : payment
        )
      );
      
      // Seçili tahsilatı da güncelle
      if (selectedPayment && selectedPayment.id === id) {
        setSelectedPayment(updatedPayment);
      }
      
      // Toplam miktarı güncelle
      if (status !== 'Tamamlandı' && (selectedPayment?.status === 'Tamamlandı')) {
        // Tamamlandı durumundan başka bir duruma geçişte, tutarı toplam miktardan çıkar
        setTotalAmount(prev => prev - (selectedPayment?.amount || 0));
      } else if (status === 'Tamamlandı' && selectedPayment?.status !== 'Tamamlandı') {
        // Başka bir durumdan Tamamlandı durumuna geçişte, tutarı toplam miktara ekle
        setTotalAmount(prev => prev + (selectedPayment?.amount || 0));
      }
      
      if (showToasts) {
        showSuccessToast('Tahsilat durumu başarıyla güncellendi');
      }
      
      return updatedPayment;
    } catch (error: any) {
      console.error('[usePaymentData] updatePaymentStatusFn hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilat durumu güncellenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Tahsilat durumu güncellenirken bir hata oluştu');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canEdit, selectedPayment, showToasts, toast, filters, invalidatePaymentCache]);
  
  /**
   * Tahsilat silme (soft delete) fonksiyonu
   */
  const deletePaymentFn = useCallback(async (id: string): Promise<boolean> => {
    if (!permissions.canDelete) {
      if (showToasts) {
        showErrorToast('Tahsilat silme yetkiniz bulunmamaktadır');
      }
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // İlgili tahsilatı bul (toplam miktarı güncellemek için)
      const targetPayment = payments.find(p => p.id === id);
      
      const response = await deletePayment(id);
      
      if (!response.success) {
        throw new Error(response.error || 'Tahsilat silinemedi');
      }
      
      // Önbelleği geçersiz kıl
      invalidatePaymentCache(filters);
      
      // Tahsilatlar listesini güncelle (API çağrısı yapmadan)
      setPayments(prev => 
        prev.map(payment => 
          payment.id === id ? { ...payment, status: 'İptal Edildi' } : payment
        )
      );
      
      // Toplam miktarı güncelle
      if (targetPayment?.status === 'Tamamlandı') {
        setTotalAmount(prev => prev - (targetPayment?.amount || 0));
      }
      
      if (showToasts) {
        showSuccessToast('Tahsilat başarıyla iptal edildi');
      }
      
      return true;
    } catch (error: any) {
      console.error('[usePaymentData] deletePaymentFn hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilat silinirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Tahsilat silinirken bir hata oluştu');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canDelete, payments, showToasts, toast, filters, invalidatePaymentCache]);
  
  /**
   * Manuel yenileme işlemi
   */
  const handleRefresh = useCallback(async () => {
    // Önbelleği geçersiz kıl
    invalidatePaymentCache(filters);
    
    setRefreshing(true);
    await fetchPayments();
  }, [fetchPayments, filters, invalidatePaymentCache]);
  
  /**
   * Müşterileri getiren fonksiyon
   */
  const fetchCustomers = useCallback(async (): Promise<any[]> => {
    try {
      const response = await getCustomers();
      
      if (!response.success) {
        throw new Error(response.error || 'Müşteri listesi alınamadı');
      }
      
      const data = response.data || [];
      setCustomers(data);
      return data;
    } catch (error) {
      console.error('[usePaymentData] fetchCustomers hatası:', error);
      return [];
    }
  }, []);
  
  /**
   * Paket satışlarını getiren fonksiyon
   */
  const fetchPackageSales = useCallback(async (customerId?: string): Promise<any[]> => {
    try {
      // Son 3 aylık paket satışlarını getir
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      
      const packageFilters = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        customerId
      };
      
      const response = await getPackageSales(packageFilters);
      
      if (!response.success) {
        throw new Error(response.error || 'Paket satışları alınamadı');
      }
      
      const data = response.data || [];
      setPackageSales(data);
      return data;
    } catch (error) {
      console.error('[usePaymentData] fetchPackageSales hatası:', error);
      return [];
    }
  }, []);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch && permissions.canView) {
      fetchPayments();
    }
  }, [autoFetch, permissions.canView, fetchPayments]);
  
  return {
    // Veri state'leri
    payments,
    selectedPayment,
    customers,
    packageSales,
    loading,
    submitting,
    error,
    totalAmount,
    refreshing,
    
    // Filtreler
    filters,
    
    // Setterlar
    setPayments,
    setSelectedPayment,
    setFilters,
    
    // Veri işlemleri
    fetchPayments,
    fetchPaymentById,
    createNewPayment,
    updatePaymentStatusFn,
    deletePaymentFn,
    handleRefresh,
    
    // Yardımcı veriler
    fetchCustomers,
    fetchPackageSales
  };
};
