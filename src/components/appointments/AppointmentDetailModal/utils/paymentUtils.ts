/**
 * Utility functions for payment and price calculations
 */

// Calculate the total price of all appointments for a customer
export const calculateTotalPrice = (allAppointments: any[], productSales: any[] = []) => {
  let totalPrice = 0;
  
  // Calculate service prices from appointments
  if (allAppointments && allAppointments.length > 0) {
    // Değişiklik: önce toplamı detaylı logla - her bir hizmetin fiyatını göster
    console.log('Hizmet fiyatları hesaplanıyor. Randevu sayısı:', allAppointments.length);
    allAppointments.forEach(apt => {
      if (apt.service && apt.service.price) {
        const price = parseFloat(apt.service.price);
        console.log(`Hizmet: ${apt.service.name}, Fiyat: ${price} TL`);
        totalPrice += price;
      } else if (apt.price) {
        // Bazı randevuların service değil direkt price alanı olabilir
        const price = parseFloat(apt.price);
        console.log(`Hizmet (price): ${apt.title || 'İsimsiz'}, Fiyat: ${price} TL`);
        totalPrice += price;
      } else {
        console.log('Fiyat bilgisi eksik:', apt);
      }
    });
    
    console.log('Toplam hizmet tutarı:', totalPrice);
  }
  
  // Add product sales prices to the total
  if (productSales && productSales.length > 0) {
    console.log('Product sales sayısı:', productSales.length);
    
    const productTotal = productSales.reduce((sum, sale) => {
      console.log('ParseFloat öncesi ürün satış bilgisi:', sale);
      // Önce totalPrice alanını dene, yoksa unitPrice'a bak
      const price = sale.totalPrice || sale.unitPrice || sale.price || 0;
      const quantity = sale.quantity || 1;
      
      // Eğer price bir string ise parse et
      const parsedPrice = typeof price === 'string' ? parseFloat(price) : price;
      
      // Hatalı veri kontrolü
      if (isNaN(parsedPrice)) {
        console.warn('Geçersiz fiyat değeri:', price, 'satış:', sale);
        return sum;
      }
      
      // Fiyat zaten toplam fiyat ise quantity çarpmaya gerek yok
      if (sale.totalPrice) {
        console.log(`Ürün: ${sale.product?.name || 'Bilinmeyen'}, Toplam fiyat: ${parsedPrice} TL`);
        return sum + parsedPrice;
      } else {
        const calculatedPrice = parsedPrice * quantity;
        console.log(`Ürün: ${sale.product?.name || 'Bilinmeyen'}, Birim fiyat: ${parsedPrice} x Miktar: ${quantity} = ${calculatedPrice} TL`);
        return sum + calculatedPrice;
      }
    }, 0);
    
    console.log('Toplam ürün tutarı:', productTotal);
    totalPrice += productTotal;
  }
  
  console.log('Hesaplanan toplam tutar (hizmetler + ürünler):', totalPrice);
  return totalPrice;
};

// Format currency to display
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Update total amount when a single appointment price changes
export const updateTotalAmount = (
  newPrice: number,
  allAppointments: any[],
  setCustomPrice: (price: string) => void,
  setPaymentAmount: (amount: string) => void,
  forceRefresh: () => void,
  productSales: any[] = []
) => {
  console.log(`Price updated: ${newPrice} - Updating total, appointments:`, allAppointments);
  
  // Recalculate total for all appointments and product sales
  const total = calculateTotalPrice(allAppointments, productSales);
  console.log('New total amount:', total);
  
  // Update total amount states
  setCustomPrice(total.toString());
  setPaymentAmount(total.toString());
  
  // Refresh UI
  forceRefresh();
  
  // Zorla ödeme bölümünü yenileme eventi tetikle
  setTimeout(() => {
    const updateEvent = new CustomEvent('force_payment_refresh', { 
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(updateEvent);
  }, 100);
};