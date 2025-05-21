'use client';

import AppointmentEditor from '../AppointmentEditor';
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/solid";
import { PlusCircle } from "lucide-react";
import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { AppointmentEventBus } from '../hooks/useAppointmentModal';
import dynamic from 'next/dynamic';
import { deleteAppointment, getCustomerAppointments } from '@/services/appointmentService';
import { getProductSalesByCustomer, deleteProductSale, getAuthorizedStaff } from '@/services/productSaleService';
import { getServices } from '@/services/serviceService';

// Lazy load the product sale modal
const NewProductSaleModal = dynamic(() => import('@/components/product-sales/NewProductSaleModal'), { 
  ssr: false,
  loading: () => <div className="loading-spinner">Yükleniyor...</div>
});

// Ürün satışı düzenleyici bileşeni
const ProductSaleEditor = dynamic(() => import('@/components/product-sales/ProductSaleEditor'), {
  ssr: false,
  loading: () => <div className="loading-spinner">Yükleniyor...</div>
});

// İyileştirilmiş NewProductSaleModal - z-index kontrolü ile
const EnhancedNewProductSaleModal = memo(({ ...props }) => (
  <div className="relative z-[1500]" onClick={(e) => e.stopPropagation()}>
    <NewProductSaleModal {...props} />
  </div>
));

interface AppointmentListProps {
  appointment: any;
  allAppointments: any[];
  refreshKey: number;
  onUpdate: (appointmentId: string) => Promise<void>;
  forceRefresh: () => void;
  toast: any;
  editingAppointmentId: string | null;
  setEditingAppointmentId: (id: string | null) => void;
  updateTotalAmount: (newPrice: number) => void;
  addNewService: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  loading: boolean;
  editingSaleId: string | null;
  setEditingSaleId: (id: string | null) => void;
}

export default memo(function AppointmentList({
  appointment,
  allAppointments,
  refreshKey,
  onUpdate,
  forceRefresh,
  toast,
  editingAppointmentId,
  setEditingAppointmentId,
  updateTotalAmount,
  addNewService,
  loading,
  editingSaleId,
  setEditingSaleId
}: AppointmentListProps) {
  // Ürün satışlarının hepsini beraber render etmeyi engelleyen state
  const [renderingAppointments, setRenderingAppointments] = useState(true);
  
  // Randevuları sıralama - daima en erken başlayan en üstte olacak
  const sortedAppointments = useMemo(() => {
    if (!allAppointments || allAppointments.length === 0) return [];
    
    // Tüm randevuları başlangıç saatine göre sırala
    return [...allAppointments].sort((a, b) => {
      // Zaman bilgilerini al
      const timeA = a.start || a.startTime; 
      const timeB = b.start || b.startTime;
      
      // Tarih objelerine çevir
      const dateA = timeA ? new Date(timeA) : new Date(0);
      const dateB = timeB ? new Date(timeB) : new Date(0);
      
      // Zamanı karşılaştır
      return dateA.getTime() - dateB.getTime();
    });
  }, [allAppointments]);
  
  // Ana randevu - her zaman en erken başlayan randevu
  const mainAppointment = useMemo(() => {
    return sortedAppointments.length > 0 ? sortedAppointments[0] : appointment;
  }, [sortedAppointments, appointment]);
  
  // Alt randevular - ana randevu dışındaki tüm randevular
  const subAppointments = useMemo(() => {
    return sortedAppointments.filter(apt => apt.id !== mainAppointment.id);
  }, [sortedAppointments, mainAppointment]);
  
  // Randevu silme fonksiyonu - MCP API ile
  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      // Önce kullanıcıdan onay al
      if (!confirm(`Bu randevuyu silmek istediğinizden emin misiniz?`)) {
        return;
      }
      
      console.log(`[AppointmentList] Randevu silme işlemi başlatılıyor, ID: ${appointmentId}`);
      
      // Merkezi API servis modülü üzerinden randevu silme
      const result = await deleteAppointment(appointmentId);

      if (!result.success) {
        throw new Error(result.error || "Randevu silinirken bir hata oluştu.");
      }

      toast({
        title: "Başarılı",
        description: "Randevu silindi",
      });

      // Önce locally güncelle sonra modal ve takvim güncellemeleri için onUpdate'i çağır
      await onUpdate(appointmentId);
      
      // Tüm modalı yenile
      forceRefresh();
      
      // Toplam tutarı güncelle
      if (typeof updateTotalAmount === 'function') {
        console.log('Randevu silindi, toplam tutar güncelleniyor');
        setTimeout(() => {
          updateTotalAmount(0);
          
          // Yeniden render için refreshKey'i güncelle
          const forceRenderEvent = new CustomEvent('force_payment_refresh', { 
            detail: { timestamp: Date.now() }
          });
          document.dispatchEvent(forceRenderEvent);
        }, 100);
      }
      
      // Tüm randevuları güncelleyecek olay tetikle
      const updateEvent = new CustomEvent('appointment_list_updated', {
        detail: { appointmentId }
      });
      document.dispatchEvent(updateEvent);
      
      // Ödeme bölümünü yenileme olayını tetikle
      const paymentEvent = new CustomEvent('force_payment_refresh', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(paymentEvent);
      
    } catch (error) {
      console.error('Randevu silme hatası:', error);
      
      // Kullanıcıya hata mesajı göster
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Randevu silinirken bir hata oluştu"
      });
    }
  };

  // Ürün satışı silme fonksiyonu - MCP API ile
  const handleDeleteProductSale = async (saleId: string) => {
    try {
      // Merkezi API servis modülü üzerinden ürün satışı silme
      const result = await deleteProductSale(saleId);

      if (!result.success) {
        throw new Error(result.error || "Ürün satışı silinirken bir hata oluştu.");
      }

      toast({
        title: "Başarılı",
        description: "Ürün satışı silindi",
      });

      // Ürün satışı silindiğini hemen bildir - bu anlık güncelleme için önemli
      if (appointment?.customerId) {
        // Special detail ile hemen güncelleme gerektiğini belirt
        const updateEvent = new CustomEvent('product_sale_updated', {
          detail: { customerId: appointment.customerId, immediate: true }
        });
        document.dispatchEvent(updateEvent);
        
        // Ödeme bölümünü yenileme olayını tetikle
        const paymentEvent = new CustomEvent('force_payment_refresh', {
          detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(paymentEvent);
      }
      
      // Ürün satışlarını güncelle
      await fetchCustomerProductSales();
      
      // Toplam tahsilat tutarını güncelle
      if (typeof updateTotalAmount === 'function') {
        updateTotalAmount(0);
      }
      
      // UI güncellemesi
      forceRefresh();
      
    } catch (error) {
      console.error('Ürün satışı silme hatası:', error);
      // Hata mesajı zaten showToast: true aracılığıyla gösterildiği için burada tekrar göstermeye gerek yok
    }
  };
  
  // Birden fazla randevu var mı kontrolü
  const hasMultipleAppointments = allAppointments.length > 1;
  
  // Ürün satışı modalı için state
  const [showProductSaleModal, setShowProductSaleModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);
  
  // Ürün satışlarını göstermek için state
  const [productSales, setProductSales] = useState<any[]>([]);
  const [showingProductSales, setShowingProductSales] = useState(false);
  
  // Müşteri ID'sini al
  const customerId = appointment?.customerId || appointment?.customer?.id;
  
  // Müşterinin ürün satışlarını MCP API ile getir
  const fetchCustomerProductSales = useCallback(async () => {
    if (!customerId) return;
    
    try {
      setShowingProductSales(true);
      
      // Merkezi API servis modülü ile müşteri ürün satışlarını getir
      const result = await getProductSalesByCustomer(customerId);
      
      // API yanıtını işle
      if (!result.success) {
        throw new Error(result.error || 'Müşteri ürün satışları getirilemedi');
      }
      
      // API yanıtındaki veriler
      const salesData = result.data || [];
      
      setProductSales(salesData);
      console.log('Müşterinin ürün satışları:', salesData);
    } catch (error) {
      console.error('Ürün satışlarını getirme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürün satışları getirilemedi.",
      });
    }
  }, [customerId, toast]);
  
  // Sayfa yüklenirken ürün satışlarını getir
  useEffect(() => {
    fetchCustomerProductSales();
    
    // Ürün satışı modalını açma isteği dinle
    const handleProductSaleModalOpen = () => {
      setShowProductSaleModal(true);
    };
    
    document.addEventListener('product_sale_modal_open_requested', handleProductSaleModalOpen);
    
    return () => {
      document.removeEventListener('product_sale_modal_open_requested', handleProductSaleModalOpen);
    };
  }, [fetchCustomerProductSales]);

  // Ürün ve personel verilerini yükle - MCP API ile
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!showProductSaleModal) return;
        
        // Ürünleri MCP API ile getir
        const productsResult = await getServices(false);

        if (!productsResult.success) {
          throw new Error(productsResult.error || 'Ürünler yüklenirken bir hata oluştu');
        }
        
        // API yanıtını işle
        setProducts(productsResult.data || []);

        // Personelleri API servis modülü üzerinden getir
        const staffResult = await getAuthorizedStaff();
        
        if (!staffResult.success) {
          throw new Error(staffResult.error || 'Personel verileri yüklenirken bir hata oluştu');
        }
        
        // API yanıtını işle
        setStaffData(staffResult.data || []);

        // Müşteri bilgisini hazırla
        if (appointment?.customer) {
          setCustomerData([{
            id: appointment.customerId || appointment.customer.id,
            name: appointment.customer.name || 'Müşteri'
          }]);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Ürün ve personel verileri yüklenirken bir hata oluştu."
        });
      }
    };

    if (showProductSaleModal) {
      fetchData();
    }
  }, [showProductSaleModal, appointment, toast]);
  
  // Seçili randevunun tarihini al
  const getSelectedDate = useCallback(() => {
    if (!mainAppointment?.start) return null;
    
    const date = new Date(mainAppointment.start);
    return date;
  }, [mainAppointment]);
  
  // Formatlanmış tarih 
  const formattedDate = useMemo(() => {
    const date = getSelectedDate();
    if (!date) return "";
    
    // Türkçe tarih formatı
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [getSelectedDate]);
  
  return (
    <div className="px-4 pb-0">
      <div className="flex items-center">
        <div className="flex-grow">
          <AppointmentEditor 
            key={`main-${refreshKey}-${mainAppointment.id}`}
            appointment={mainAppointment}
            onUpdate={onUpdate}
            toast={toast}
            forceRefresh={forceRefresh}
            updateTotalAmount={updateTotalAmount}
            editingAppointmentId={editingAppointmentId}
            setEditingAppointmentId={setEditingAppointmentId}
            editingSaleId={editingSaleId}
          />
        </div>
        <div className="ml-2" style={{ width: '40px', textAlign: 'center' }}>
          {hasMultipleAppointments ? (
            <Button 
              variant="secondary" 
              className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-8 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg p-0"
              onClick={() => handleDeleteAppointment(mainAppointment.id)}
              disabled={loading || (editingAppointmentId && editingAppointmentId !== mainAppointment.id)}
              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            >
              <div className="flex items-center justify-center">
                <TrashIcon className="h-4 w-4" />
              </div>
            </Button>
          ) : (
            <div className="w-8 h-8"></div>
          )}
        </div>
      </div>
      
      {subAppointments.length > 0 && (
        <div className="mt-3">
          {subAppointments.map(apt => {
            // Başlangıç tarihini kontrol et ve görüntüle
            const aptStartDate = apt.start ? new Date(apt.start) : null;
            const startTime = aptStartDate ? 
              `${aptStartDate.getHours().toString().padStart(2, '0')}:${aptStartDate.getMinutes().toString().padStart(2, '0')}` : '';
              
            return (
              <div key={`sub-container-${apt.id}`} className="flex items-center mt-1">
                <div className="flex-grow">
                  <AppointmentEditor
                    key={`sub-${refreshKey}-${apt.id}`}
                    appointment={apt}
                    onUpdate={onUpdate}
                    toast={toast}
                    forceRefresh={forceRefresh}
                    updateTotalAmount={updateTotalAmount}
                    editingAppointmentId={editingAppointmentId}
                    setEditingAppointmentId={setEditingAppointmentId}
                    editingSaleId={editingSaleId}
                  />
                </div>
                <div className="ml-2" style={{ width: '40px', textAlign: 'center' }}>
                  {hasMultipleAppointments ? (
                    <Button 
                      variant="secondary" 
                      className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-8 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg p-0"
                      onClick={() => handleDeleteAppointment(apt.id)}
                      disabled={loading || (editingAppointmentId && editingAppointmentId !== apt.id)}
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    >
                      <div className="flex items-center justify-center">
                        <TrashIcon className="h-4 w-4" />
                      </div>
                    </Button>
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {productSales.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Müşterinin Ürün Satışları</h4>
          <div>
            {productSales.map((sale) => (
              <div key={sale.id} className="flex items-center mb-1">
                <div className="flex-grow">
                  <ProductSaleEditor
                    key={`product-sale-${sale.id}`}
                    sale={sale}
                    toast={toast}
                    forceRefresh={() => {
                      fetchCustomerProductSales();
                      forceRefresh();
                    }}
                    editingSaleId={editingSaleId}
                    setEditingSaleId={setEditingSaleId}
                    loading={loading}
                    editingAppointmentId={editingAppointmentId}
                  />
                </div>
                <div className="ml-2" style={{ width: '40px', textAlign: 'center' }}>
                  {!editingSaleId ? (
                    <Button
                      variant="secondary"
                      className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-8 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg p-0"
                      onClick={() => handleDeleteProductSale(sale.id)}
                      disabled={loading || (editingSaleId !== null)}
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    >
                      <div className="flex items-center justify-center">
                        <TrashIcon className="h-4 w-4" />
                      </div>
                    </Button>
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showProductSaleModal && customerId && (
        <EnhancedNewProductSaleModal
          open={showProductSaleModal}
          onOpenChange={setShowProductSaleModal}
          onSuccess={() => {
            setShowProductSaleModal(false);
            
            // Önce yeni ürün satışı eklendiğini bildir - hemen işlem için
            if (appointment?.customerId) {
              const updateEvent = new CustomEvent('product_sale_updated', {
                detail: { customerId: appointment.customerId, immediate: true }
              });
              document.dispatchEvent(updateEvent);
              
              // Ödeme bölümünü zorla yenileme eventi tetikle
              const paymentEvent = new CustomEvent('force_payment_refresh', {
                detail: { timestamp: Date.now() }
              });
              document.dispatchEvent(paymentEvent);
            }
            
            // Ürün satışı eklendikten sonra ürün satışlarını yeniden getir
            fetchCustomerProductSales();
            
            // Modal içindeki toplamı güncelle
            if (updateTotalAmount) {
              updateTotalAmount(0);
            }
            
            // UI güncellemesi
            forceRefresh();
          }}          
          products={products}
          customers={customerData}
          staffs={staffData}
          defaultCustomerId={customerId}
          disableCustomerSelection={true}
          hidePaymentOptions={true}
        />
      )}
    </div>
  );
});