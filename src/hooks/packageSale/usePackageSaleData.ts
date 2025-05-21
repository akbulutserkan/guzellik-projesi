'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiService } from '@/services/api';
import { PackageSale } from '@/types/package';
import { usePackageSaleUI } from './usePackageSaleUI';

export interface UsePackageSaleDataOptions {
  initialSales?: PackageSale[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

export interface UsePackageSaleDataResult {
  sales: PackageSale[];
  currentSale: PackageSale | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  packages: any[];
  customers: any[];
  staffList: any[];
  fetchSales: (page?: number, filter?: any) => Promise<void>;
  fetchInitialData: () => Promise<void>;
  createSale: (data: any) => Promise<PackageSale | null>;
  updateSale: (id: string, data: any) => Promise<PackageSale | null>;
  deleteSale: (id: string) => Promise<boolean>;
  getSaleById: (id: string) => Promise<PackageSale | null>;
  fetchSalesByCustomer: (customerId: string) => Promise<PackageSale[]>;
  handleNewCustomer: (customer: any) => void;
}

/**
 * Paket satışı verilerini yöneten hook
 */
export const usePackageSaleData = ({
  initialSales = [],
  autoFetch = true,
  showToasts = true
}: UsePackageSaleDataOptions = {}): UsePackageSaleDataResult => {
  const [sales, setSales] = useState<PackageSale[]>(initialSales);
  const [currentSale, setCurrentSale] = useState<PackageSale | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  
  // Gerekli veriler
  const [packages, setPackages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  // UI hook'unu kullan
  const { formatPackageSale, showSuccessToast, showErrorToast, showWarningToast } = usePackageSaleUI();
  
  /**
   * Paket satışlarını getirme
   */
  const fetchSales = useCallback(async (page: number = 1, filter: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        ...filter
      };
      
      const result = await ApiService.packageSales.getList(params);
      
      if (result.success) {
        setSales(result.data || []);
        
        // Pagination bilgisini ayarla
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
        }
      } else {
        setError(result.error || 'Paket satışları yüklenirken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(result.error || 'Paket satışları yüklenirken bir hata oluştu');
        }
      }
    } catch (err) {
      console.error('Paket satışları yüklenirken hata:', err);
      setError('Paket satışları yüklenirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast('Paket satışları yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);
  
  /**
   * Temel veri yükleme
   */
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Paketleri çek
      try {
        console.log('[usePackageSaleData] Paketler getiriliyor...');
        const packagesRes = await ApiService.packages.getList();
        
        console.log('[usePackageSaleData] Paket API yanıtı:', {
          success: packagesRes.success, 
          error: packagesRes.error || null,
          dataCount: packagesRes.data ? packagesRes.data.length : 0
        });
        
        if (packagesRes.success) {
          setPackages(packagesRes.data || []);
          console.log(`[usePackageSaleData] ${packagesRes.data?.length || 0} paket başarıyla yüklendi`);
        } else {
          // Başarısız yanıt durumunda kullanıcıyı bilgilendir ama uygulamayı çalışır durumda tut
          console.warn('[usePackageSaleData] Paketler yüklenirken API hatası:', packagesRes.error);
          
          if (showToasts) {
            showWarningToast(`Paketler yüklenirken bir sorun oluştu: ${packagesRes.error || 'Bilinmeyen hata'}`);
          }
          
          // Boş dizi ile devam et (uygulama çalışmaya devam etsin)
          setPackages([]);
        }
      } catch (error) {
        console.error('[usePackageSaleData] Paketler yüklenirken ciddi hata:', error);
        
        if (showToasts) {
          showWarningToast('Paketler yüklenirken bir sorun oluştu. Diğer özellikler kullanılabilir durumda.');
        }
        
        // Boş dizi ile devam et (uygulama çalışmaya devam etsin)
        setPackages([]);
      }
      
      // Müşterileri çek
      try {
        console.log('[usePackageSaleData] Müşteriler yükleniyor...');
        const customersRes = await ApiService.customers.getAll();
        
        if (customersRes.success) {
          setCustomers(customersRes.data || []);
          console.log(`[usePackageSaleData] ${customersRes.data?.length || 0} müşteri başarıyla yüklendi`);
        } else {
          console.error('[usePackageSaleData] Müşteriler yüklenirken API hatası:', customersRes.error);
          
          // Müşteri yükleme hatasını kullanıcıya göster
          if (showToasts) {
            showWarningToast(`Müşteriler yüklenirken sorun oluştu: ${customersRes.error || 'Bilinmeyen hata'}`);
          }
          
          // Boş liste ile devam et
          setCustomers([]);
        }
      } catch (error) {
        console.error('[usePackageSaleData] Müşteriler yüklenirken ciddi hata:', error);
        
        if (showToasts) {
          showWarningToast('Müşteriler yüklenirken sorun oluştu. Diğer özellikler kullanılabilir.');
        }
        
        // Boş liste ile devam et
        setCustomers([]);
      }
      
      // Personel çek
      try {
        const staffRes = await ApiService.staff.getAll();
        if (staffRes.success) {
          setStaffList(staffRes.data || []);
        }
      } catch (error) {
        console.error('Personel yüklenirken hata:', error);
      }
    } catch (error) {
      console.error('Temel veri yüklenirken hata:', error);
      
      if (showToasts) {
        showErrorToast('Temel veriler yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);
  
  /**
   * ID'ye göre paket satışı detayını getir
   */
  const getSaleById = useCallback(async (id: string): Promise<PackageSale | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.getById(id);
      
      if (result.success) {
        setCurrentSale(result.data);
        return result.data;
      } else {
        setError(result.error || 'Paket satışı detayı getirilirken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(result.error || 'Paket satışı detayı getirilirken bir hata oluştu');
        }
        
        return null;
      }
    } catch (err) {
      console.error('Paket satışı detayı getirilirken hata:', err);
      setError('Paket satışı detayı getirilirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast('Paket satışı detayı getirilirken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);
  
  /**
   * Yeni paket satışı oluştur
   */
  const createSale = useCallback(async (data: any): Promise<PackageSale | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.create(data);
      
      if (result.success) {
        // Listeyi güncelle
        setSales(prev => [result.data, ...prev]);
        
        if (showToasts) {
          showSuccessToast('Paket satışı başarıyla oluşturuldu');
        }
        
        return result.data;
      } else {
        setError(result.error || 'Paket satışı oluşturulurken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(result.error || 'Paket satışı oluşturulurken bir hata oluştu');
        }
        
        return null;
      }
    } catch (err) {
      console.error('Paket satışı oluşturulurken hata:', err);
      setError('Paket satışı oluşturulurken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast('Paket satışı oluşturulurken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);
  
  /**
   * Paket satışını güncelle
   */
  const updateSale = useCallback(async (id: string, data: any): Promise<PackageSale | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.update(id, data);
      
      if (result.success) {
        // Listeyi güncelle
        setSales(prev => prev.map(sale => 
          sale.id === id ? result.data : sale
        ));
        
        // Seçili satışı güncelle
        if (currentSale && currentSale.id === id) {
          setCurrentSale(result.data);
        }
        
        if (showToasts) {
          showSuccessToast('Paket satışı başarıyla güncellendi');
        }
        
        return result.data;
      } else {
        setError(result.error || 'Paket satışı güncellenirken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(result.error || 'Paket satışı güncellenirken bir hata oluştu');
        }
        
        return null;
      }
    } catch (err) {
      console.error('Paket satışı güncellenirken hata:', err);
      setError('Paket satışı güncellenirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast('Paket satışı güncellenirken bir hata oluştu');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSale, showToasts, showSuccessToast, showErrorToast]);
  
  /**
   * Paket satışını sil
   */
  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.delete(id);
      
      if (result.success) {
        // Listeyi güncelle
        setSales(prev => prev.filter(sale => sale.id !== id));
        
        // Seçili satış silinirse temizle
        if (currentSale && currentSale.id === id) {
          setCurrentSale(null);
        }
        
        if (showToasts) {
          showSuccessToast('Paket satışı başarıyla silindi');
        }
        
        return true;
      } else {
        setError(result.error || 'Paket satışı silinirken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(result.error || 'Paket satışı silinirken bir hata oluştu');
        }
        
        return false;
      }
    } catch (err) {
      console.error('Paket satışı silinirken hata:', err);
      setError('Paket satışı silinirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast('Paket satışı silinirken bir hata oluştu');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentSale, showToasts, showSuccessToast, showErrorToast]);
  
  /**
   * Müşteriye göre paket satışlarını getir
   */
  const fetchSalesByCustomer = useCallback(async (customerId: string): Promise<PackageSale[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.getByCustomer(customerId);
      
      if (result.success) {
        return result.data || [];
      } else {
        setError(result.error || 'Müşterinin paket satışları getirilirken bir hata oluştu');
        
        if (showToasts) {
          showErrorToast(result.error || 'Müşterinin paket satışları getirilirken bir hata oluştu');
        }
        
        return [];
      }
    } catch (err) {
      console.error('Müşterinin paket satışları getirilirken hata:', err);
      setError('Müşterinin paket satışları getirilirken bir hata oluştu');
      
      if (showToasts) {
        showErrorToast('Müşterinin paket satışları getirilirken bir hata oluştu');
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToasts, showErrorToast]);
  
  /**
   * Yeni müşteri eklendiğinde müşteri listesini güncelle
   */
  const handleNewCustomer = useCallback((customer: any) => {
    setCustomers(prev => [...prev, customer]);
  }, []);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch) {
      fetchInitialData();
      fetchSales();
    }
  }, [autoFetch, fetchInitialData, fetchSales]);

  return {
    sales,
    currentSale,
    loading,
    error,
    totalPages,
    packages,
    customers,
    staffList,
    fetchSales,
    fetchInitialData,
    createSale,
    updateSale,
    deleteSale,
    getSaleById,
    fetchSalesByCustomer,
    handleNewCustomer
  };
};
