"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CreditCard, ChevronDown } from "lucide-react";
import NewPackageSaleModal from "@/components/package-sales/NewPackageSaleModal";
import EditPackageSaleModal from "@/components/package-sales/EditPackageSaleModal";
import PaymentsModal from "@/components/package-sales/PaymentsModal";
import PackageSalesDateFilter from "./PackageSalesDateFilter";
import {
  SolidAlertDialog,
  SolidAlertDialogAction,
  SolidAlertDialogCancel,
  SolidAlertDialogContent,
  SolidAlertDialogDescription,
  SolidAlertDialogFooter,
  SolidAlertDialogHeader,
  SolidAlertDialogTitle
} from "@/components/ui/solid-alert-dialog";

// Merkezi yapıyı kullan
import { countCompletedSessions } from "@/utils/packageSale/formatters";
import { usePackageSaleManagement } from "@/hooks/packageSale";

const PackageSalesClient = () => {
  const {
    // Veri
    sales,
    loading,
    error,
    totalPages,
    currentPage,
    saleToEdit,
    saleToDelete,
    selectedPaymentsSale,
    packages,
    customers,
    staffList,
    dateFilter,
    
    // Form durumu
    saleDate,
    expiryDate,
    
    // Hesaplanmış özellikler
    isBrowser,
    
    // UI durumu
    isNewSaleModalOpen,
    
    // İzinler
    permissions: {
      canView: canViewPackageSales,
      canAdd: canAddPackageSales,
      canEdit: canEditPackageSales,
      canDelete: canDeletePackageSales
    },
    
    // Metodlar
    fetchSales,
    fetchInitialData,
    setSaleToEdit,
    setSaleToDelete,
    setSelectedPaymentsSale,
    setIsNewSaleModalOpen,
    setCurrentPage,
    handleDateFilterChange,
    handleCreateSale,
    handleUpdateSale,
    handleDeleteSale,
    handleAddPayment,
    handleDeletePayment,
    getPackageSaleById,
    onSaleDateChange,
    onExpiryDateChange,
    handleNewCustomer,
    
    // Yardımcı fonksiyonlar
    formatPrice,
    formatDate,
    calculateTotalReceived,
    calculateRemainingAmount
  } = usePackageSaleManagement();

  // Yeni paket satışı ekledikten sonra yapılacak işlemler
  const handleNewSale = async (newSale) => {
    setIsNewSaleModalOpen(false);
    
    // Listeleme sayfasını güncelle
    await fetchSales(1, dateFilter); // Her zaman ilk sayfaya dön
    
    // 1.5 saniye sonra tekrar kontrol et (bazen ilk yenileme yeterli olmayabilir)
    setTimeout(() => {
      fetchSales(1, dateFilter);
    }, 1500);
  };

  // Güncelleme işlemi tamamlandıktan sonra
  const handleUpdateSuccess = (updatedSale) => {
    setSaleToEdit(null);
    fetchSales(currentPage, dateFilter);
  };

  // Ödeme işlemleri tamamlandıktan sonra
  const handlePaymentSuccess = () => {
    fetchSales(currentPage, dateFilter);
  };

  // Yetkisi var mı kontrolü
  if (!canViewPackageSales) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-500">Paket satışlarını görüntüleme yetkiniz bulunmuyor.</p>
        </div>
      </div>
    );
  }

  // Loading durumu
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Paket Satışları</h1>
          {canAddPackageSales && (
            <Button
              onClick={() => setIsNewSaleModalOpen(true)}
              className="bg-[#204937] hover:bg-[#183b2d] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Paket Satışı
            </Button>
          )}
        </div>

        <PackageSalesDateFilter
          initialDates={{
            startDate: dateFilter.startDate ? new Date(dateFilter.startDate) : null,
            endDate: dateFilter.endDate ? new Date(dateFilter.endDate) : null,
          }}
          onDateFilterChange={handleDateFilterChange}
        />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {sales.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          Henüz satış bulunmamaktadır.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Paketlere göre gruplandırılmış satışlar */}
          {Array.from(new Set(sales.map(sale => sale.package.id))).map(packageId => {
            const packageSales = sales.filter(sale => sale.package.id === packageId);
            const packageInfo = packageSales[0].package;
            
            return (
              <div key={packageId} className="rounded-lg overflow-hidden bg-white transition-all mb-2 shadow-md">
                {/* Paket Başlığı */}
                <div className="px-4 py-3 flex justify-between items-center bg-gray-200">
                  <div className="flex-1 flex items-center">
                    <h3 className="text-sm font-medium">{packageInfo.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500 mr-3">
                      {packageSales.length} satış
                    </div>
                  </div>
                </div>
                
                {/* Paket Satışları */}
                <div className="p-4 space-y-3">
                  {packageSales.map(sale => {
                    const completedSessions = countCompletedSessions(sale);
                    const totalReceived = calculateTotalReceived(sale.payments);
                    const remainingAmount = calculateRemainingAmount(sale.price, sale.payments);
                    
                    return (
                      <div 
                        key={sale.id} 
                        className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all hover:shadow hover:bg-white"
                      >
                        <div className="flex flex-col">
                          <div className="font-medium">{sale.customer.name}</div>
                          <div className="text-xs text-gray-500">
                            Satış: {formatDate(sale.saleDate)} | Personel: {sale.staff ? ("name" in sale.staff ? sale.staff.name : `${sale.staff.firstName || ''} ${sale.staff.lastName || ''}`) : "Belirtilmemiş"}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-medium">{formatPrice(sale.price)}</div>
                            <div className="text-xs text-gray-500">
                              Tahsil: {formatPrice(totalReceived)} | Kalan: {formatPrice(remainingAmount)}
                            </div>
                          </div>
                          
                          <div className="text-sm bg-blue-50 px-2 py-1 rounded text-blue-800">
                            {completedSessions} / {sale.package.sessionCount}
                          </div>
                          
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => setSelectedPaymentsSale(sale)} 
                              className="text-blue-600 hover:text-blue-900 bg-white hover:bg-gray-50 flex items-center justify-center w-7 h-7 rounded-full shadow-sm border border-gray-200"
                              title="Ödemeler"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                            
                            {canEditPackageSales && (
                              <button 
                                onClick={() => setSaleToEdit(sale)} 
                                className="text-yellow-600 hover:text-yellow-900 bg-white hover:bg-gray-50 flex items-center justify-center w-7 h-7 rounded-full shadow-sm border border-gray-200"
                                title="Düzenle"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            
                            {canDeletePackageSales && (
                              <button 
                                onClick={() => setSaleToDelete(sale)} 
                                className="text-red-600 hover:text-red-900 bg-white hover:bg-gray-50 flex items-center justify-center w-7 h-7 rounded-full shadow-sm border border-gray-200"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1 
                      ? "bg-[#204937] text-white" 
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Ödemeler Modalı */}
      {isBrowser && selectedPaymentsSale && createPortal(
        <PaymentsModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedPaymentsSale(null);
          }}
          sale={selectedPaymentsSale}
          onSuccess={handlePaymentSuccess}
          key={selectedPaymentsSale.id}
          onAddPayment={handleAddPayment}
          onDeletePayment={handleDeletePayment}
          onGetSaleById={getPackageSaleById}
        />,
        document.body
      )}

      {/* Yeni Paket Satışı Modalı */}
      <NewPackageSaleModal
        open={isNewSaleModalOpen}
        onOpenChange={setIsNewSaleModalOpen}
        onSuccess={handleNewSale}
        packages={packages}
        customers={customers}
        staffList={staffList}
        onNewCustomer={handleNewCustomer}
        fetchPackages={fetchInitialData}
        saleDate={saleDate}
        expiryDate={expiryDate}
        onSaleDateChange={onSaleDateChange}
        onExpiryDateChange={onExpiryDateChange}
        onCreateSale={handleCreateSale}
      />

      {/* Paket Satışı Düzenleme Modalı */}
      <EditPackageSaleModal
        open={saleToEdit !== null}
        onOpenChange={(open) => !open && setSaleToEdit(null)}
        sale={saleToEdit}
        onSuccess={handleUpdateSuccess}
        onUpdateSale={handleUpdateSale}
      />

      {/* Silme Onay Modalı */}
      <SolidAlertDialog 
        open={saleToDelete !== null} 
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <SolidAlertDialogContent className="bg-white rounded-lg">
          <SolidAlertDialogHeader>
            <SolidAlertDialogTitle>Paket Satışını Sil</SolidAlertDialogTitle>
            <SolidAlertDialogDescription>
              Bu paket satışını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </SolidAlertDialogDescription>
          </SolidAlertDialogHeader>
          <SolidAlertDialogFooter>
            <SolidAlertDialogCancel>İptal</SolidAlertDialogCancel>
            <SolidAlertDialogAction 
              onClick={handleDeleteSale} 
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </SolidAlertDialogAction>
          </SolidAlertDialogFooter>
        </SolidAlertDialogContent>
      </SolidAlertDialog>
    </div>
  );
};

export default PackageSalesClient;