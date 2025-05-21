"use client";

import { withPageAuth } from "@/lib/auth";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import PackageSalesDateFilter from "../package-sales/PackageSalesDateFilter";
import { useProductSaleManagement } from "@/hooks/productSale/useProductSaleManagement";
import { formatDate, formatPrice } from "@/utils/productSale/formatters";
import NewProductSaleModal from "@/components/product-sales/NewProductSaleModal";
import EditProductSaleModal from "@/components/product-sales/EditProductSaleModal";
import PaymentsModal from "@/components/product-sales/PaymentsModal";
import { ProductSaleWithPayments } from "@/services/productSaleService";

function ProductSalesPage() {
  // Veri yüklenme durumunu takip et
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [selectedPaymentsSale, setSelectedPaymentsSale] = useState<ProductSaleWithPayments | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0); // Güncelleme tetikleyici

  // ÖNEMLİ: useProductSaleManagement hook'unu diğer kodlardan önce çağır
  const {
    sales = [],
    products = [],
    customers = [],
    staffs = [],
    loading = false,
    selectedSale,
    setSelectedSale,
    dateRange,
    setDateRange,
    fetchSales,
    handleDeleteSale,
    permissions = { canView: true, canAdd: true, canEdit: true, canDelete: true },
  } = useProductSaleManagement({ 
    autoFetch: true,
    shouldRefreshOnDateChange: true // Sadece tarih değişiminde yenileme yap
  }) || {}; // Default boş obje ekle, eğer undefined dönerse hata oluşmasın

  // Client-side'da olduğumuzu kontrol etmek için
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Zorunlu yükleme timeout'u ekle - maksimum 5 saniye bekleyecek
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDataLoaded) {
        console.log("[ProductSalesPage] Zorla veri yükleme durumu değiştiriliyor");
        setIsDataLoaded(true);
        
        // Logları izleyelim ve kullanıcıya bir bilgi verelim
        console.log("[ProductSalesPage] Veri yükleme zaman aşımına uğradı");
        console.log("[ProductSalesPage] Hook durumları:", { loading, salesLength: sales?.length, productsLength: products?.length });
        
        // sayfa yenileme denemesi (opsiyonel)
        try {
          if (typeof fetchSales === 'function') {
            console.log("[ProductSalesPage] Son bir veri çekme denemesi yapılıyor...");
            fetchSales();
          }
        } catch (err) {
          console.error("[ProductSalesPage] Son denemede hata:", err);
        }
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isDataLoaded, loading, sales, products, fetchSales]);

  // Yükleme durumunu izle - loading kullanıldığı için hook çağrısından sonra tanımlanmalı
  useEffect(() => {
    console.log(`[ProductSalesPage] Yükleme durumu: loading=${loading}, sales=${sales?.length}, products=${products?.length}`);
    
    if (!loading && Array.isArray(sales) && Array.isArray(products)) {
      console.log(`[ProductSalesPage] Veriler yüklendi: ${sales.length} satış, ${products.length} ürün`);
      setIsDataLoaded(true);
    }
  }, [loading, sales, products]);

  // Güncelleme ve veri yenilemeyi optimize edilmiş şekilde yönet
  const handleDataRefresh = useCallback(() => {
    console.log('[ProductSalesPage] handleDataRefresh çağrıldı');
    setUpdateCounter(prev => prev + 1);
  }, []);
  
  // Modal kapatma işlemi
  const handleModalClosed = useCallback(() => {
    console.log('[ProductSalesPage] Modal kapatıldı, güncelleme başlayacak');
    handleDataRefresh();
  }, [handleDataRefresh]);

  const localFetchSales = useCallback(() => {
    // Bu işlev, hata ayıklama için fetchSales'i sarar
    console.log("[ProductSalesPage] localFetchSales çalıştırılıyor");
    
    try {
      if (typeof fetchSales === 'function') {
        console.log("[ProductSalesPage] fetchSales fonksiyonu çağrılıyor");
        Promise.resolve(fetchSales())
          .then(result => {
            console.log("[ProductSalesPage] fetchSales başarılı tamamlandı", result);
          })
          .catch(error => {
            console.error("[ProductSalesPage] fetchSales içinde hata:", error);
            // API hata ayıklama bilgileri ekleme
            console.log("[ProductSalesPage] Tarih aralığı:", dateRange);
            console.log("[ProductSalesPage] Veri durumu:", { 
              satışlar: sales?.length || 0, 
              ürünler: products?.length || 0, 
              müşteriler: customers?.length || 0,
              personeller: staffs?.length || 0
            });
          });
      } else {
        console.error("[ProductSalesPage] fetchSales bir fonksiyon değil:", fetchSales);
      }
    } catch (err) {
      console.error("[ProductSalesPage] Satış verisi yüklenirken hata:", err);
      // Yedek yöntem: fetchSales hata veriyorsa, zorunlu olarak yükleme durumunu güncelle
      setIsDataLoaded(true);
    }
  }, [fetchSales, sales, products, customers, staffs, dateRange]);

  // İlk yükleme için veri çekme
  useEffect(() => {
    console.log('[ProductSalesPage] İlk yükleme için veri çekme');
    if (typeof fetchSales === 'function') {
      localFetchSales();
    }
  }, [localFetchSales]);

  // Güncelleme tetikleyicisi değiştiğinde verileri yeniden getir
  useEffect(() => {
    if (updateCounter > 0 && typeof fetchSales === 'function') {
      console.log(`[ProductSalesPage] UpdateCounter değişti: ${updateCounter}`);
      localFetchSales();
    }
  }, [updateCounter, localFetchSales]);

  const handleViewPayments = useCallback((sale: ProductSaleWithPayments) => {
    console.log("Ödeme modalı açılıyor:", sale.id);
    setSelectedPaymentsSale(sale);
  }, []);

  const handleEditSale = useCallback((sale: ProductSaleWithPayments) => {
    if (!permissions?.canEdit) {
      return;
    }
    
    // Düzenleme modalını aç
    setSelectedSale(sale);
    setIsEditSaleModalOpen(true);
  }, [permissions, setSelectedSale]);

  const handleDateFilterChange = (newDateRange: {
    startDate: string;
    endDate: string;
  }) => {
    setDateRange({
      startDate: new Date(newDateRange.startDate),
      endDate: new Date(newDateRange.endDate),
    });
  };

  if (!permissions?.canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
          <p className="mt-2">
            Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  // Yükleniyor durumunda skeleton göster
  if (loading && !isDataLoaded) {
    console.log(`[ProductSalesPage] Yükleme durumu gösteriliyor - loading:${loading}, isDataLoaded:${isDataLoaded}`);
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Ürün Satışları</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ürün Satışları</h1>
        {permissions?.canAdd && (
          <Button
            onClick={() => setIsNewSaleModalOpen(true)}
            className="bg-pink-400 hover:bg-pink-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Satış
          </Button>
        )}
      </div>

      {/* Tarih Filtresi */}
      <PackageSalesDateFilter
        initialDates={dateRange || { startDate: new Date(), endDate: new Date() }}
        onDateFilterChange={handleDateFilterChange}
      />

      {/* Satış Listesi */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satış</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahsilat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kalan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satış Tarihi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(sales) && sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{sale.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(sale.totalPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(sale.totalPayments || 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(sale.remainingAmount || sale.totalPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.staffName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(sale.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleViewPayments(sale)} 
                        className="text-blue-600 hover:text-blue-900"
                        title="Ödemeler"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                      {permissions?.canEdit && (
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {permissions?.canDelete && (
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  Henüz satış kaydı bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Yeni Satış Modal */}
      {isBrowser && (
        <>
          <NewProductSaleModal
            open={isNewSaleModalOpen}
            onOpenChange={(open) => {
              setIsNewSaleModalOpen(open);
              if (!open) handleModalClosed();
            }}
            onSuccess={() => {
              setIsNewSaleModalOpen(false);
              handleModalClosed();
            }}
            products={products || []}
            customers={customers || []}
            staffs={staffs || []}
          />
          
          {/* Düzenleme Modal */}
          {selectedSale && (
            <EditProductSaleModal
              open={isEditSaleModalOpen}
              onOpenChange={(open) => {
                setIsEditSaleModalOpen(open);
                if (!open) {
                  setSelectedSale(null);
                  handleModalClosed();
                }
              }}
              onSuccess={() => {
                setIsEditSaleModalOpen(false);
                setSelectedSale(null);
                handleModalClosed();
              }}
              products={products || []}
              customers={customers || []}
              staffs={staffs || []}
              productSale={selectedSale}
            />
          )}

          {/* Ödemeler Modalı */}
          {selectedPaymentsSale && createPortal(
            <PaymentsModal
              open={true}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedPaymentsSale(null);
                  handleModalClosed();
                }
              }}
              sale={selectedPaymentsSale}
              onSuccess={() => {
                setSelectedPaymentsSale(null);
                handleModalClosed();
              }}
              key={selectedPaymentsSale.id}
            />,
            document.body
          )}
        </>
      )}
    </div>
  );
}

export default withPageAuth(ProductSalesPage);
