'use client';

import { calculateTotalPrice } from "../utils/paymentUtils";

interface EventListenersProps {
  open: boolean;
  appointment: any;
  localAppointments: any[];
  setCustomPrice: (price: string) => void;
  setPaymentAmount: (amount: string) => void;
  forceRefresh: () => void;
  appointmentModalState: any;
  forceUpdate: (data: any) => void;
}

/**
 * Randevu detayları modalının dinlediği olayları yönetir
 */
export function setupEventListeners({
  open,
  appointment,
  localAppointments,
  setCustomPrice,
  setPaymentAmount,
  forceRefresh,
  appointmentModalState,
  forceUpdate
}: EventListenersProps) {
  
  if (open && appointment) {
    // Ürün satışı güncellendiğinde çağrılan işlev
    const updateProductTotals = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.customerId === appointment.customerId) {
        console.log('Ürün satışı güncellendi, toplamı hesaplıyorum');
        // Ürün satışlarını getir ve toplamı güncelle
        const fetchAndUpdateTotal = async () => {
          try {
            const response = await fetch(`/api/product-sales?customerId=${appointment.customerId}&includeStaff=true`);
            if (response.ok) {
              const productSales = await response.json();
              console.log('Ürün satışları yapısı:', productSales);
              
              // Hizmetler ve ürünleri beraber hesaplayarak toplamı güncelle
              const totalPrice = calculateTotalPrice(localAppointments, productSales);
              console.log('Toplam tutar:', totalPrice, 'Randevular:', localAppointments, 'Ürünler:', productSales);
              setCustomPrice(totalPrice.toString());
              setPaymentAmount(totalPrice.toString());
              forceRefresh();
            }
          } catch (error) {
            console.error('Ürün satışlarını getirme hatası:', error);
          }
        };
        
        fetchAndUpdateTotal();
      }
    };

    // Hizmet güncellendiğinde çağrılan işlev
    const updateServiceChanges = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Hizmet güncelleme olayı alındı:', customEvent.detail);
      
      try {
        // Modalı yenile
        const appointmentId = appointment.id.split('_')[0];
        const response = await fetch(`/api/appointments/${appointmentId}?includeServices=true`);
        
        if (response.ok) {
          const serverData = await response.json();
          
          // Güncel verileri state'e ayarlayıp modalı tamamen yenile
          if (serverData._allAppointments && Array.isArray(serverData._allAppointments)) {
            console.log('Hizmet güncellemesi sonrası tüm modal yenileniyor');
            appointmentModalState.setLocalAppointments([...serverData._allAppointments]);
            forceRefresh();
            forceUpdate({});
          }
        }
      } catch (error) {
        console.error('Hizmet güncellemesi sonrası yenileme hatası:', error);
      }
    };
    
    // Randevu listesi güncellendiğinde çağrılan işlev (silme işlemi sonrası)
    const handleAppointmentListUpdated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Randevu listesi güncelleme olayı alındı:', customEvent.detail);
      
      try {
        // Modalı yenile
        const appointmentId = appointment.id.split('_')[0];
        const response = await fetch(`/api/appointments/${appointmentId}?includeServices=true`);
        
        if (response.ok) {
          const serverData = await response.json();
          
          // Güncel verileri state'e ayarlayıp modalı tamamen yenile
          if (serverData._allAppointments && Array.isArray(serverData._allAppointments)) {
            console.log('Randevu listesi güncellemesi sonrası tüm modal yenileniyor');
            appointmentModalState.setLocalAppointments([...serverData._allAppointments]);
            forceRefresh();
            forceUpdate({});
          }
        }
      } catch (error) {
        console.error('Randevu listesi güncellemesi sonrası yenileme hatası:', error);
      }
    };
    
    // Toplamı güncellemeyi zorlayan olayı dinle
    const handleForcePaymentRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Force payment refresh eventi alındı:', customEvent.detail);
      
      // Toplam tutarı güncellemek için API'ye istek at
      if (appointment && appointment.id) {
        try {
          // API'den güncel bilgileri al
          fetch(`/api/appointments/${appointment.id.split('_')[0]}?includeServices=true`)
            .then(response => response.json())
            .then(data => {
              console.log('Force refresh sonrası veriler:', data);
              // Tüm randevuların toplamını hesapla
              let total = 0;
              if (data._allAppointments && Array.isArray(data._allAppointments)) {
                data._allAppointments.forEach(apt => {
                  if (apt.service && apt.service.price) {
                    total += parseFloat(apt.service.price);
                  }
                });
              }
              console.log('Güncellenen toplam tutar:', total);
              // Toplamı güncelle
              setCustomPrice(total.toString());
              setPaymentAmount(total.toString());
              forceRefresh(); // Yeniden yenile
              forceUpdate({}); // UI'a güncellemeleri yansıt
            });
        } catch (err) {
          console.error('Toplam tutar güncelleme hatası:', err);
        }
      }
    };
    
    // Olayları dinle
    document.addEventListener('product_sale_updated', updateProductTotals as EventListener);
    document.addEventListener('service_updated', updateServiceChanges as EventListener);
    document.addEventListener('appointment_list_updated', handleAppointmentListUpdated as EventListener);
    document.addEventListener('force_payment_refresh', handleForcePaymentRefresh as EventListener);
    
    // Cleanup function
    return () => {
      document.removeEventListener('product_sale_updated', updateProductTotals as EventListener);
      document.removeEventListener('service_updated', updateServiceChanges as EventListener);
      document.removeEventListener('appointment_list_updated', handleAppointmentListUpdated as EventListener);
      document.removeEventListener('force_payment_refresh', handleForcePaymentRefresh as EventListener);
    };
  }
  
  // Eğer modal açık değilse boş bir cleanup fonksiyonu döndür
  return () => {};
}
