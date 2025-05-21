'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface PaymentSectionProps {
  showPaymentSection: boolean;
  appointment: any;
}

/**
 * Toplam tahsilat tutarını gösteren bileşen.
 */
export default function PaymentSection({
  showPaymentSection,
  appointment
}: PaymentSectionProps) {
  console.log('👛 PaymentSection - Render başladı, showPaymentSection:', showPaymentSection);
  // Toplam fiyatı tutan state
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  // Zorunlu yenileme için ref
  const forceUpdateRef = useRef<number>(0);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  
  // Ürün satışlarını almak için state
  const [productSales, setProductSales] = useState<any[]>([]);
  
  // Ürün satışlarını getir
  useEffect(() => {
    // Eğer customerId yoksa ürün satışlarını getirmeye gerek yok
    if (!appointment?.customerId) return;
    
    const fetchProductSales = async () => {
      try {
        // MCP API ile callMcpApi kullanarak veri çekelim
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'call_tool',
            params: {
              name: 'get-product-sales-by-customer',
              arguments: { 
                customerId: appointment.customerId,
                includeStaff: true
              }
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // MCP API yanıt formatını kontrol et ve veriyi çıkar
          let salesData = [];
          if (result.success && result.data) {
            salesData = result.data;
          } else if (result.content && result.content[0]?.text) {
            try {
              const parsedContent = JSON.parse(result.content[0].text);
              if (parsedContent.success && parsedContent.data) {
                salesData = parsedContent.data;
              }
            } catch (e) {
              console.error('MCP API yanıtını ayrıştırma hatası:', e);
            }
          }
          
          console.log('Ürün satışları getirildi:', salesData);
          setProductSales(salesData);
        } else {
          console.error('Ürün satışları yanıt hatası:', response.status);
        }
      } catch (error) {
        console.error('Ürün satışlarını getirme hatası:', error);
      }
    };
    
    fetchProductSales();
  }, [appointment?.customerId]);
  
  // Toplam tutarı hesaplayan fonksiyon
  const calculateTotal = useCallback(() => {
    console.log('👛 PaymentSection - calculateTotal çağrıldı, forceUpdate:', forceUpdate);
    let total = 0;
    
    // Müşterinin tüm randevularını alabilmek için
    if (appointment?._allAppointments && Array.isArray(appointment._allAppointments)) {
      const allAppointments = appointment._allAppointments;
      
      // Tüm randevuları dolaş ve fiyatları topla
      allAppointments.forEach(apt => {
        // Önce service.price'a bak
        if (apt.service?.price) {
          const price = typeof apt.service.price === 'string' ? 
            parseFloat(apt.service.price) : apt.service.price;
          if (!isNaN(price)) {
            total += price;
            console.log(`Hizmet: ${apt.service.name}, Fiyat: ${price} TL`);
          }
        }
        // Service yoksa doğrudan price alanına bak
        else if (apt.price) {
          const price = typeof apt.price === 'string' ? 
            parseFloat(apt.price) : apt.price;
          if (!isNaN(price)) {
            total += price;
            console.log(`Hizmet (price): ${apt.title || 'Belirtilmemiş'}, Fiyat: ${price} TL`);
          }
        }
      });
      
      console.log(`Randevulardan Hesaplanan Tahsilat: ${total} TL (${allAppointments.length || 0} randevu)`);
    } else {
      // Tek bir randevu varsa
      if (appointment?.service?.price) {
        const price = typeof appointment.service.price === 'string' ? 
          parseFloat(appointment.service.price) : appointment.service.price;
        if (!isNaN(price)) {
          total = price;
          console.log(`Tek Hizmet: ${appointment.service.name}, Fiyat: ${price} TL`);
        }
      } else if (appointment?.price) {
        const price = typeof appointment.price === 'string' ? 
          parseFloat(appointment.price) : appointment.price;
        if (!isNaN(price)) {
          total = price;
          console.log(`Tek Hizmet (price): ${appointment.title || 'Belirtilmemiş'}, Fiyat: ${price} TL`);
        }
      }
      
      console.log(`Randevulardan Hesaplanan Tahsilat (tek randevu): ${total} TL`);
    }
    
    // Ürün satışlarını da hesaba kat
    if (productSales && productSales.length > 0) {
      let productTotal = 0;
      
      productSales.forEach(sale => {
        // Önce totalPrice alanını dene, yoksa unitPrice'a bak
        const price = sale.totalPrice || sale.unitPrice || sale.price || 0;
        const quantity = sale.quantity || 1;
        
        // Eğer price bir string ise parse et
        const parsedPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        // Hatalı veri kontrolü
        if (isNaN(parsedPrice)) {
          console.warn('Geçersiz fiyat değeri:', price, 'satış:', sale);
          return;
        }
        
        // Fiyat zaten toplam fiyat ise quantity çarpmaya gerek yok
        if (sale.totalPrice) {
          productTotal += parsedPrice;
          console.log(`Ürün: ${sale.productName || 'Bilinmeyen'}, Toplam fiyat: ${parsedPrice} TL`);
        } else {
          const calculatedPrice = parsedPrice * quantity;
          productTotal += calculatedPrice;
          console.log(`Ürün: ${sale.productName || 'Bilinmeyen'}, Birim fiyat: ${parsedPrice} x Miktar: ${quantity} = ${calculatedPrice} TL`);
        }
      });
      
      console.log(`Ürün Satışlarından Hesaplanan Tahsilat: ${productTotal} TL (${productSales.length} ürün)`);
      total += productTotal;
    }
    
    console.log(`Toplam Tahsilat Tutarı (randevular + ürünler): ${total} TL`);
    setTotalPrice(total);
  }, [appointment, productSales]);

  // useEffect ile toplam tutarı hesaplama
  useEffect(() => {
    console.log('👛 PaymentSection - Toplam tutar hesaplanıyor');
    calculateTotal();
  }, [calculateTotal]); // forceUpdate bağımlılığı kaldırıldı, sonsuz döngü riski önlendi
  
  // Sadece forceUpdate değiştiğinde toplam tutarı yeniden hesapla
  useEffect(() => {
    if (forceUpdate > 0) { // İlk render'da çalışmasını engelle
      console.log('👛 PaymentSection - forceUpdate değişti, toplam tutar yeniden hesaplanıyor');
      calculateTotal();
    }
  }, [forceUpdate, calculateTotal]); // Ayrı bir effect ile forceUpdate değişikliklerini izle
  
  // Event dinleyicileri için useEffect
  useEffect(() => {
    console.log('👛 PaymentSection - Event dinleyicileri useEffect çalıştırıldı, customerId:', appointment?.customerId);
    // Hizmet eklendiğinde, silindiğinde veya değiştiğinde çağrılacak handler
    const handleServiceChange = () => {
      console.log('PaymentSection: Hizmet değişikliği algılandı, toplam tutar güncelleniyor');
      forceUpdateRef.current += 1; // Değeri artır
      setForceUpdate(prev => prev + 1); // State güncelleme ile yeniden render tetikle
    };
    
    // Ürün satışı güncellemesi için handler
    const handleProductSaleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('PaymentSection: Ürün satışı değişikliği algılandı, toplam tutar güncelleniyor', customEvent.detail);
      
      // Ürün satışlarını yeniden getir
      if (appointment?.customerId) {
        // MCP API ile çağrı
        fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'call_tool',
            params: {
              name: 'get-product-sales-by-customer',
              arguments: { 
                customerId: appointment.customerId,
                includeStaff: true
              }
            }
          })
        })
          .then(response => {
            if (response.ok) return response.json();
            throw new Error('Ürün satışları getirilemedi');
          })
          .then(result => {
            // MCP API yanıt formatını kontrol et ve veriyi çıkar
            let salesData = [];
            if (result.success && result.data) {
              salesData = result.data;
            } else if (result.content && result.content[0]?.text) {
              try {
                const parsedContent = JSON.parse(result.content[0].text);
                if (parsedContent.success && parsedContent.data) {
                  salesData = parsedContent.data;
                }
              } catch (e) {
                console.error('MCP API yanıtını ayrıştırma hatası:', e);
              }
            }
            
            console.log('Ürün satışları güncellendi:', salesData);
            setProductSales(salesData);
            forceUpdateRef.current += 1; // Değeri artır
            setForceUpdate(prev => prev + 1); // State güncelleme ile yeniden render tetikle
          })
          .catch(error => {
            console.error('Ürün satışlarını getirme hatası:', error);
          });
      }
    };
    
    // Geldi butonuna basıldığında çağrılacak handler
    const handleAttendanceChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.status === 'showed') {
        console.log('PaymentSection: Geldi durumu algılandı, toplam tutar güncelleniyor');
        forceUpdateRef.current += 1; // Değeri artır
        setForceUpdate(prev => prev + 1); // State güncelleme ile yeniden render tetikle
      }
    };
    
    // Ödeme bölümünü zorla yenileme eventi
    const handleForcePaymentRefresh = () => {
      console.log('PaymentSection: Force payment refresh algılandı');
      forceUpdateRef.current += 1; // Değeri artır
      setForceUpdate(prev => prev + 1); // State güncelleme ile yeniden render tetikle
    };
    
    // Event dinleyicilerini ekle
    document.addEventListener('service_updated', handleServiceChange);
    document.addEventListener('appointment_list_updated', handleServiceChange);
    document.addEventListener('product_sale_updated', handleProductSaleChange);
    document.addEventListener('attendance_status_changed', handleAttendanceChange);
    document.addEventListener('force_payment_refresh', handleForcePaymentRefresh);
    
    // Component unmount olduğunda event dinleyicilerini temizle
    return () => {
      document.removeEventListener('service_updated', handleServiceChange);
      document.removeEventListener('appointment_list_updated', handleServiceChange);
      document.removeEventListener('product_sale_updated', handleProductSaleChange);
      document.removeEventListener('attendance_status_changed', handleAttendanceChange);
      document.removeEventListener('force_payment_refresh', handleForcePaymentRefresh);
    };
  }, [appointment?.customerId]);

  if (!showPaymentSection) {
    return null;
  }

  // Daha kompakt ve tutarlı bir görünüm sağlandı
  return (
    <div className="mt-2">
      <div className="w-full flex items-center justify-between bg-white border-0 rounded-[8px] px-3 py-2 text-left shadow-md hover:shadow-lg transition-all"
           style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <span className="text-base font-medium">
          Toplam Tahsilat Tutarı
        </span>
        <div className="flex items-center">
          <span className="text-2xl font-semibold text-[#4F7942]">
            {totalPrice.toLocaleString('tr-TR')}
          </span>
          <span className="text-[#4F7942] font-medium ml-1">₺</span>
        </div>
      </div>
    </div>
  );
}