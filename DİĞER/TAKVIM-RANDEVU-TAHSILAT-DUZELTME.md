# Takvim Sayfası Toplam Tahsilat Tutarı Düzeltmesi

Bu belge, takvim sayfasındaki randevu düzenleme modalında bulunan toplam tahsilat tutarı hesaplamasının düzeltilmesi için yapılan değişiklikleri açıklar.

## Sorun

Takvim sayfasında bir randevuyu düzenlediğimizde açılan modalda, toplam tahsilat tutarı düzgün çalışmıyordu. Aşağıdaki durumlarda toplam tahsilat tutarı güncel değerleri göstermiyordu:

1. Modal ilk açıldığında toplam tahsilat tutarı hesaplanmıyordu.
2. Müşterinin bir hizmeti silindiğinde toplam tahsilat tutarı güncellenmiyordu.
3. Yeni bir hizmet eklendiğinde toplam tahsilat tutarı güncellenmiyordu.
4. "Geldi" butonuna tıklandığında toplam tahsilat tutarı doğru hesaplanmıyordu.
5. Bir hizmetin fiyatı değiştirildiğinde toplam tutara yansımıyordu.
6. Ürün satışları toplam tahsilat tutarına eklenmiyordu.
7. Ürün satışlarına yapılan değişiklikler ancak modalı kapatıp tekrar açınca güncelleniyordu, anlık olarak yansımıyordu. 

## Çözüm

Sorun, PaymentSection bileşeninde ve onu kullanan diğer bileşenlerdeki veri akışındaki hatalardan kaynaklanıyordu. Yapılan değişiklikler ile:

1. PaymentSection bileşeni, props uyumsuzluğu düzeltildi
2. Olay (event) tabanlı güncelleme mekanizması eklendi
3. React'in dependency array ve useEffect hook'larının doğru kullanımı sağlandı
4. Değişiklikler olduğunda tahsilat toplamını yeniden hesaplama mantığı geliştirildi
5. Ürün satışlarını getirme ve hesaplama için entegrasyon eklendi
6. Ürün satışları için anlık güncelleme mekanizması eklendi

### Yapılan Teknik Değişiklikler

#### 1. PaymentSection Bileşeni

- `showPaymentSection` ve `appointment` proplarını alacak şekilde güncellendi.
- Ürün satışlarını almak ve göstermek için gerekli kodlar eklendi.
- Bileşen içinde toplam tutarı hesaplayan `calculateTotal` fonksiyonu `useCallback` ile optimize edildi.
- Toplam tutar hesaplamasına ürün satışları da dahil edildi.
- Bağımlılık (dependency) dizisi düzenlenerek gereksiz yeniden renderlar önlendi.
- useEffect içinde olay dinleyicileri eklenerek dış değişiklikler algılandı.
- Ürün satışları için özel bir event handler eklenerek anlık güncellemeler sağlandı.

```javascript
// Ürün satışı güncellemesi için özel handler
const handleProductSaleChange = (event: Event) => {
  const customEvent = event as CustomEvent;
  console.log('PaymentSection: Ürün satışı değişikliği algılandı, toplam tutar güncelleniyor', customEvent.detail);
  
  // Ürün satışlarını yeniden getir
  if (appointment?.customerId) {
    fetch(`/api/product-sales?customerId=${appointment.customerId}&includeStaff=true`)
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Ürün satışları getirilemedi');
      })
      .then(data => {
        console.log('Ürün satışları güncellendi:', data);
        setProductSales(data);
        forceUpdateRef.current += 1; // Değeri artır
        setForceUpdate(prev => prev + 1); // State güncelleme ile yeniden render tetikle
      })
      .catch(error => {
        console.error('Ürün satışlarını getirme hatası:', error);
      });
  }
};
```

#### 2. AppointmentList Bileşeni

- Ürün satışı silme fonksiyonu güncellenerek toplam tutarı anlık güncelleyecek şekilde düzenlendi:
- `immediate: true` parametresi eklenerek anlık güncelleme talep edildi
- Sıralama optimize edildi: önce eventi tetikle, sonra veriyi getir
- Gereksiz setTimeout'lar kaldırıldı

```javascript
// Ürün satışı silme fonksiyonu
const deleteProductSale = async (saleId: string) => {
  try {
    // Ürünü API üzerinden sil
    const response = await fetch(`/api/product-sales/${saleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      toast({ title: "Başarılı", description: "Ürün satışı silindi" });
      
      // Ürün satışı silindiğini hemen bildir - anlık güncelleme için önemli
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
      updateTotalAmount(0);
      
      // UI güncellemesi
      forceRefresh();
    }
  } catch (error) {
    console.error('Ürün satışı silme hatası:', error);
    toast({ variant: "destructive", title: "Hata", description: "Ürün satışı silinirken bir hata oluştu." });
  }
};
```

#### 3. Yeni Ürün Satışı Ekleme

`NewProductSaleModal` bileşeninden `onSuccess` fonksiyonu optimize edildi:

```javascript
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
  updateTotalAmount(0);
  
  // UI güncellemesi
  forceRefresh();
}}
```

## React Hook Kuralları ve Performans İyileştirmeleri

Yapılan değişiklikler, React'in "hooks" kurallarına uygunluğu da sağladı:

1. `useCallback` ile fonksiyonlar memoize edildi, gereksiz yeniden oluşturulmalar önlendi
2. `useEffect` dependency dizileri doğru şekilde ayarlandı
3. `useState` ve `useRef` hook'ları doğru şekilde kullanıldı
4. State güncellemeleri için fonksiyonel formlar kullanıldı (`setForceUpdate(prev => prev + 1)`)
5. Gereksiz setTimeout kullanımları kaldırılarak daha doğrudan güncellemeler sağlandı
6. Event sistemlerinde özel parametreler kullanılarak daha kesin kontrol sağlandı

## Test Edilmesi Gereken Durumlar

Yapılan değişikliklerin doğru çalıştığından emin olmak için aşağıdaki senaryolar test edilmelidir:

1. Modal ilk açıldığında toplam tahsilat tutarının doğru gösterilmesi (hizmetler ve ürünler dahil)
2. Müşterinin bir hizmeti silindiğinde toplam tahsilat tutarının anında güncellenmesi
3. Yeni bir hizmet eklendiğinde toplam tahsilat tutarının anında güncellenmesi
4. "Geldi" butonuna tıklandığında toplam tahsilat tutarının doğru güncellenmesi
5. Bir hizmetin fiyatı değiştirildiğinde toplam tutarın anında güncellenmesi
6. Müşterinin birden fazla randevusu olduğunda tüm tutarların doğru toplanması
7. Yeni ürün satışı eklendiğinde toplam tahsilat tutarının anında güncellenmesi
8. Bir ürün satışı silindiğinde toplam tahsilat tutarının anında güncellenmesi
9. Bir ürünün fiyatını değiştirdiğinizde toplam tahsilat tutarının anında güncellenmesi
10. Hizmet ve ürün satışlarının doğru şekilde toplamda gösterilmesi

## Sonuç

Bu düzeltmeler sayesinde, takvim sayfasındaki randevu düzenleme modalında toplam tahsilat tutarı artık doğru çalışmaktadır. Özellikle:

1. Geldi butonuna basıldığında toplam tutar anında güncelleniyor
2. Hizmet eklenip çıkarıldığında toplam tutar anında güncelleniyor
3. Ürün satışı eklenip silindiğinde toplam tutar anında güncelleniyor
4. Hizmet veya ürün fiyatı değiştirildiğinde toplam tutar anında güncelleniyor

Yapılan değişiklikler, hem hizmetlerin hem de ürün satışlarının tutarlarının doğru hesaplanmasını ve modalı kapatmadan tüm değişikliklerin anında toplam tahsilat tutarına yansımasını sağlamaktadır. Bu da kullanıcı deneyimini önemli ölçüde iyileştirmektedir.
