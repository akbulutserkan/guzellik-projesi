'use client';

import { calculateTotalPrice } from "../utils/paymentUtils";

interface ActionHandlersProps {
  appointment: any;
  appointmentModalState: any;
  saveNotesAction: any;
  setOriginalNotes: (notes: string) => void;
  handleStatusChange: (status: string) => void;
}

/**
 * Randevu detayları modalının eylem işleyicilerini yönetir
 */
export function useActionHandlers({
  appointment,
  appointmentModalState,
  saveNotesAction,
  setOriginalNotes,
  handleStatusChange
}: ActionHandlersProps) {
  
  /**
   * Not kaydetme işlevi
   */
  const saveNotes = async () => {
    console.log('🛠 ActionHandlers - saveNotes çağrıldı');
    const { notes, originalNotes, setIsEditingNotes, setLoading } = appointmentModalState;
    await saveNotesAction(notes, originalNotes, setIsEditingNotes, setLoading);
    setOriginalNotes(notes); // Update original notes after successful save
  };

  /**
   * Ödeme yöntemi seçme işlevi
   */
  const handleSelectPaymentMethod = async (
    method: string, 
    setSelectedPaymentMethod: (method: string) => void,
    setShowPaymentMethodModal: (show: boolean) => void,
    setLoading: (loading: boolean) => void,
    paymentAmount: string,
    customPrice: string,
    handleOpenChange: (open: boolean) => void,
    handlePaymentSaveAction: any,
    onUpdate: () => Promise<void>,
    toast: any,
    forceCloseModal: () => void
  ) => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethodModal(false);
    
    try {
      setLoading(true);
      
      // Router'ı geç ve ödeme işlevine ilet
      const router = typeof window !== 'undefined' ? {
        refresh: () => {
          console.log('Router.refresh() çağrıldı');
          onUpdate();
        }
      } : null;
      
      // Burada ödeme yöntemini gönderiyoruz (güçlü modal kapatma fonksiyonuyla birlikte)
      await handlePaymentSaveAction(paymentAmount, customPrice, handleOpenChange, setLoading, router, method, forceCloseModal);
      
      // 200ms sonra takvim verilerini güncelle (sayfa yenilemeden)
      setTimeout(() => {
        onUpdate();
      }, 200);
      
    } catch (error) {
      console.error('Ödeme yöntemi seçimi sırasında hata:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Ödeme işlemi sırasında bir hata oluştu',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * "Geldi" butonuna tıklandığında çağrılan işlev
   */
  const handleGeldiButtonClick = async () => {
    console.log('🛠 ActionHandlers - handleGeldiButtonClick çağrıldı');
    const { attendanceStatus, localAppointments, setCustomPrice, setPaymentAmount } = appointmentModalState;
    
    if (attendanceStatus !== 'showed') {
      // Geldi butonuna ilk kez basıldığında
      try {
        // Randevu için müşteri ID'sini al
        const customerId = appointment?.customerId;
        if (customerId) {
          // Ürün satışlarını getir
          const response = await fetch(`/api/product-sales?customerId=${customerId}&includeStaff=true`);
          if (response.ok) {
            const productSales = await response.json();
            console.log('Geldi butonunda ürün satışları yüklendi:', productSales);
            
            // Toplam fiyatı hesapla (hizmetler + ürünler)
            const totalPrice = calculateTotalPrice(localAppointments, productSales);
            console.log('Geldi butonunda hesaplanan toplam:', totalPrice);
            
            // Toplam tutarı güncelle
            setCustomPrice(totalPrice.toString());
            setPaymentAmount(totalPrice.toString());
            
            // Toplam tutarı güncellemek için event tetikle
            setTimeout(() => {
              const updateEvent = new CustomEvent('force_payment_refresh', { 
                detail: { timestamp: Date.now() }
              });
              document.dispatchEvent(updateEvent);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Geldi butonunda ürün satışlarını getirme hatası:', error);
      }
    }
    
    // Durum değişikliğini işle
    handleStatusChange('showed');
    
    // Attendance Status değiştiğini bildiren olayı tetikle
    const attendanceEvent = new CustomEvent('attendance_status_changed', {
      detail: { status: 'showed', timestamp: Date.now() }
    });
    document.dispatchEvent(attendanceEvent);
  };

  /**
   * Yeni hizmet ekleme butonu işlevi
   */
  const addNewService = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined, 
    showNewServiceModal: boolean,
    setShowNewServiceModal: (show: boolean) => void,
    findLatestAppointmentEndTime: () => string,
    checkForServiceConflict: (staffId: string, startTime: string) => Promise<any>,
    setConflictMessage: (message: string) => void,
    setShowShiftEndConflict: (show: boolean) => void
  ) => {
    console.log('🛠 ActionHandlers - addNewService çağrıldı, params:', { showNewServiceModal });
    console.log('DETAYLI LOG - addNewService çağrıldı');
    
    // Prevent default action and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Önemli: Eğer zaten bir modal açıksa, işlemi durduralım
    if (showNewServiceModal) {
      console.log('DETAYLI LOG - Modal zaten açık, yeni istek engellendi');
      return;
    }
    
    // Find customer's latest appointment end time
    const latestEndTime = findLatestAppointmentEndTime();
    const staffId = appointment.staffId || appointment.resourceId;
    
    // Öncelikle çakışma kontrolü yap
    const conflict = await checkForServiceConflict(staffId, latestEndTime);
    
    if (conflict?.hasConflict) {
      // Çakışma varsa uyarı modalini göster
      setConflictMessage(conflict.message);
      setShowShiftEndConflict(true);
    } else {
      // Çakışma yoksa yeni hizmet modalini aç
      setShowNewServiceModal(true);
    }
    
    // Debug log ekleyelim
    console.log('DETAYLI LOG - Yeni hizmet/çakışma kontrolü yapılıyor, müşteri ID:', appointment?.customerId);
  };

  return {
    saveNotes,
    handleSelectPaymentMethod,
    handleGeldiButtonClick,
    addNewService
  };
}
