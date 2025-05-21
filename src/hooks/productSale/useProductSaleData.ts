'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductSaleWithPayments, Payment } from '@/types/product';
import { ApiService } from '@/services/api';
import { useProductSalePermissions } from './useProductSalePermissions';
import { useProductSaleUI } from './useProductSaleUI';

export interface UseProductSaleDataOptions {
  initialSales?: ProductSaleWithPayments[];
  autoFetch?: boolean;
  showToasts?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface UseProductSaleDataResult {
  sales: ProductSaleWithPayments[];
  selectedSale: ProductSaleWithPayments | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  setSales: React.Dispatch<React.SetStateAction<ProductSaleWithPayments[]>>;
  setSelectedSale: React.Dispatch<React.SetStateAction<ProductSaleWithPayments | null>>;
  fetchSales: () => Promise<void>;
  handleCreateSale: (saleData: any) => Promise<ProductSaleWithPayments | null>;
  handleUpdateSale: (id: string, updateData: any) => Promise<ProductSaleWithPayments | null>;
  handleDeleteSale: (id: string) => Promise<boolean>;
  handleCreatePayment: (productSaleId: string, paymentData: any) => Promise<Payment | null>;
  handleDeletePayment: (id: string) => Promise<boolean>;
}

/**
 * Ürün satışı verilerini yöneten hook
 */
export const useProductSaleData = ({
  initialSales = [],
  autoFetch = true,
  showToasts = true,
  dateRange = {
    startDate: new Date(),
    endDate: new Date()
  }
}: UseProductSaleDataOptions = {}): UseProductSaleDataResult => {
  // Data states
  const [sales, setSales] = useState<ProductSaleWithPayments[]>(initialSales);
  const [selectedSale, setSelectedSale] = useState<ProductSaleWithPayments | null>(null);
  
  // Status states
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Last operation tracking for optimizations
  const lastOperationTime = useRef<number>(Date.now());
  
  // Helper hooks
  const { permissions } = useProductSalePermissions();
  
  // UI hook'unu kullan
  const { formatProductSale, showSuccessToast, showErrorToast } = useProductSaleUI();
  
  /**
   * Satışları getiren fonksiyon - Request debounce'lama ile
   */
  const fetchSales = useCallback(async () => {
    if (!permissions.canView) {
      return;
    }
    
    // Eğer zaten yükleme yapılıyorsa, çalışmasını engelle (yükleme kilitlemesi)
    if (loading) {
      console.log('[useProductSaleData] Zaten yükleme yapılıyor, yeni istek engellendi');
      return;
    }
    
    // Son çağrıdan sonra yeterli süre geçmediyse, isteği engelle (rate limiting)
    const now = Date.now();
    const timeSinceLastOperation = now - lastOperationTime.current;
    const minInterval = 2000; // Minimum 2 saniye aralıkla istek gönder
    
    if (timeSinceLastOperation < minInterval) {
      console.log(`[useProductSaleData] Çok sık istek engellendi. Son istekten ${timeSinceLastOperation}ms geçti, ${minInterval}ms bekleniyor`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const startDate = dateRange.startDate?.toISOString().split("T")[0];
      const endDate = dateRange.endDate?.toISOString().split("T")[0];
      
      console.log(`[useProductSaleData] Satışlar getiriliyor: ${startDate} - ${endDate}`);
      
      // Olası hata durumlarına karşı try-catch ile koruma
      try {
        const response = await ApiService.productSales.getList({
          startDate,
          endDate,
          showToast: false // Burada showToasts yerine false kullanıyoruz, çünkü her yenileme için bildirim göstermek istemiyoruz
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Ürün satışları listesi alınamadı');
        }
        
        setSales(response.data || []);
      } catch (apiError) {
        console.error('[useProductSaleData] API çağrısı hatası:', apiError);
        // Hata durumunda kullanıcıya sadece gerekirse göster
        if (showToasts) {
          showErrorToast('Veri yükleme sırasında bir sorun oluştu, lütfen daha sonra tekrar deneyin.');
        }
        throw apiError; // Üst catch bloğuna aktar
      }
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Satışlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [permissions.canView, dateRange, showToasts, showErrorToast, loading]);
  
  /**
   * Yeni satış oluşturma
   */
  const handleCreateSale = useCallback(async (saleData: any): Promise<ProductSaleWithPayments | null> => {
    if (!permissions.canAdd) {
      if (showToasts) {
        showErrorToast('Satış oluşturma yetkiniz bulunmamaktadır');
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await ApiService.productSales.create(saleData, showToasts);
      
      if (!response.success) {
        throw new Error(response.error || 'Ürün satışı oluşturulamadı');
      }
      
      const newSale = response.data;
      
      // Satış listesini güncelle
      await fetchSales();
      
      return newSale;
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Satış oluşturulurken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Satış oluşturulurken bir hata oluştu');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canAdd, showToasts, showErrorToast, fetchSales]);
  
  /**
   * Satış güncelleme
   */
  const handleUpdateSale = useCallback(async (id: string, updateData: any): Promise<ProductSaleWithPayments | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        showErrorToast('Satış güncelleme yetkiniz bulunmamaktadır');
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await ApiService.productSales.update(id, updateData, showToasts);
      
      if (!response.success) {
        throw new Error(response.error || `Ürün satışı güncellenemedi (ID: ${id})`);
      }
      
      const updatedSale = response.data;
      
      // Satış listesini güncelle (yerel state güncelleme)
      setSales(prevSales => 
        prevSales.map(sale => 
          sale.id === id ? {...sale, ...updatedSale} : sale
        )
      );
      
      // Seçili satışı güncelle
      if (selectedSale && selectedSale.id === id) {
        setSelectedSale({...selectedSale, ...updatedSale});
      }
      
      return updatedSale;
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Satış güncellenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Satış güncellenirken bir hata oluştu');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canEdit, showToasts, showErrorToast, selectedSale]);
  
  /**
   * Satış silme
   */
  const handleDeleteSale = useCallback(async (id: string): Promise<boolean> => {
    if (!permissions.canDelete) {
      if (showToasts) {
        showErrorToast('Satış silme yetkiniz bulunmamaktadır');
      }
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await ApiService.productSales.delete(id, showToasts);
      
      if (response.success) {
        // Yerel state'den silinen öğeyi kaldır (API çağrısını beklemeden)
        setSales(prevSales => prevSales.filter(sale => sale.id !== id));
        
        // Seçili satış silindiyse seçimi kaldır
        if (selectedSale && selectedSale.id === id) {
          setSelectedSale(null);
        }
        
        if (showToasts) {
          showSuccessToast(response.message || 'Satış başarıyla silindi');
        }
        
        return true;
      } else {
        throw new Error(response.message || 'Silme işlemi başarısız oldu');
      }
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Satış silinirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Satış silinirken bir hata oluştu');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canDelete, showToasts, showErrorToast, showSuccessToast, selectedSale]);
  
  /**
   * Yeni ödeme ekleme
   */
  const handleCreatePayment = useCallback(async (productSaleId: string, paymentData: any): Promise<Payment | null> => {
    if (!permissions.canEdit) {
      if (showToasts) {
        showErrorToast('Ödeme ekleme yetkiniz bulunmamaktadır');
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await ApiService.productSales.createPayment({
        ...paymentData,
        productSaleId
      }, showToasts);
      
      if (!response.success) {
        throw new Error(response.error || 'Ödeme eklenemedi');
      }
      
      const newPayment = response.data;
      
      // İlgili satışın ödemelerini güncelleyerek satış listesini güncelle
      await fetchSales();
      
      return newPayment;
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Ödeme eklenirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Ödeme eklenirken bir hata oluştu');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canEdit, showToasts, showErrorToast, fetchSales]);
  
  /**
   * Ödeme silme
   */
  const handleDeletePayment = useCallback(async (id: string): Promise<boolean> => {
    if (!permissions.canEdit) { // Ödeme silme yetkisi, satış düzenleme yetkisine bağlı
      if (showToasts) {
        showErrorToast('Ödeme silme yetkiniz bulunmamaktadır');
      }
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await ApiService.productSales.deletePayment(id, showToasts);
      
      if (response.success) {
        // Satış listesini güncelle
        await fetchSales();
        
        if (showToasts) {
          showSuccessToast(response.message || 'Ödeme başarıyla silindi');
        }
        
        return true;
      } else {
        throw new Error(response.message || 'Ödeme silme işlemi başarısız oldu');
      }
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Ödeme silinirken bir hata oluştu');
      if (showToasts) {
        showErrorToast(error instanceof Error ? error.message : 'Ödeme silinirken bir hata oluştu');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [permissions.canEdit, showToasts, showErrorToast, showSuccessToast, fetchSales]);
  
  // İlk yükleme için özel işlev - sadece KULLANICININ sayfayı yüklemesi durumunda çalışır
  const isInitialLoadCompletedRef = useRef(false);
  
  useEffect(() => {
    // Uygulama için gerekli olduğunda ve daha önce yüklenmemişse veriyi getir
    if (autoFetch && !isInitialLoadCompletedRef.current) {
      console.log('[useProductSaleData] İlk yükleme gerçekleşiyor');
      isInitialLoadCompletedRef.current = true;
      
      // Yüklemeden önce kısa bir bekletme, sayfanın render olması için
      setTimeout(() => {
        fetchSales();
      }, 300);
    }
  }, []);
  
  // Tarih aralığı değiştiğinde satışları yeniden getir - değişiklik sayıcısı ile önlem
  const dateChangeCountRef = useRef(0);
  
  useEffect(() => {
    // İlk yüklemeyi geç (sıfırıncı değişiklik)
    if (dateChangeCountRef.current === 0) {
      dateChangeCountRef.current++;
      return;
    }
    
    // Tarih değişikliğine sadece 1 kez yanıt ver, sonraki değişiklikler için bekle
    if (dateChangeCountRef.current > 3) { // Çok fazla değişiklik olmuşsa sınırla
      console.log('[useProductSaleData] Tarih filtresinde çok fazla değişiklik, senkronizasyon sınırlandı');
      return;
    }
    
    // 1 saniye debounce uygula
    const handler = setTimeout(() => {
      if (permissions.canView && autoFetch) {
        console.log('[useProductSaleData] Tarih değişikliğinden sonra veri yenileniyor');
        fetchSales();
        dateChangeCountRef.current++;
      }
    }, 1000);
    
    return () => clearTimeout(handler);
  }, [dateRange.startDate.toISOString(), dateRange.endDate.toISOString()]);
  
  return {
    sales,
    selectedSale,
    loading,
    submitting,
    error,
    setSales,
    setSelectedSale,
    fetchSales,
    handleCreateSale,
    handleUpdateSale,
    handleDeleteSale,
    handleCreatePayment,
    handleDeletePayment
  };
};
