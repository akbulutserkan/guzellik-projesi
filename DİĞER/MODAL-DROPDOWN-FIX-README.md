# Modal Dropdown Arama ve Seçili Öğe Gösterimi Sorunları Çözümü

Bu belge, randevu takvim modalındaki hizmet düzenleme dropdown'larının iki temel sorununu ve çözümlerini açıklamaktadır:

1. Dropdown arama kısmının modal dışında çalışmaması
2. Seçili öğelerin arama sonuçlarında gereksiz yere tekrar gösterilmesi

## İlk Sorun: Modal Dışında Dropdown Arama Çalışmaması

Takvim sayfasında randevu üzerine tıklandığında açılan modalda, hizmetleri düzenlemek için kullanılan dropdown menülerindeki arama kısmı:

- **Modal içinde**: Düzgün çalışıyordu
- **Modal dışında**: Çalışmıyordu (arama yapılamıyordu)

## Neden Modal İçinde ve Dışında Farklı Davranıyordu?

Bu sorunun temel nedeni, Radix UI Dialog (Modal) bileşeninin varsayılan davranışıydı. İşte teknik detaylar:

1. **Modal Davranışı**: Dialog bileşeni `modal={true}` (varsayılan) ayarıyla çalıştığında:
   - Modal dışındaki tüm içerik için erişilebilirlik (a11y) nedenleriyle etkileşimler engellenir
   - Focus yönetimi modalın içinde tutulur
   - Dış tıklamalar/odaklanmalar yakalanır ve işlenir

2. **createPortal Kullanımı**: Dropdown menüler React'ın `createPortal` API'si ile document.body içine render ediliyordu. Bu, dropdown'ları DOM ağacında fiziksel olarak modalın dışına yerleştiriyordu, ancak React'ın olay (event) sistemi içinde hala bileşen hiyerarşisindeki orijinal konumlarında davranıyorlardı.

3. **Olay Engelleme**: Radix UI Dialog, modal dışındaki odaklanma olaylarını engellemek için özel olay işleyicileri kullanır:

```javascript
// Radix UI Dialog kodundan:
onFocusOutside: (0, import_primitive.composeEventHandlers)(
  props.onFocusOutside,
  (event) => event.preventDefault()
)
```

Bu, portal ile document.body'ye render edilen dropdown'ların içindeki input alanlarına odaklanmayı ve yazmayı engelliyordu.

## Sorun Nasıl Tespit Edildi?

Sorunun temel nedeni, Radix UI'nin Dialog bileşenindeki modal davranışı ve React'ın portal API'si arasındaki etkileşimdi. Source kodunu incelediğimde:

1. Dialog bileşeninin `modal` prop'unun true olarak ayarlandığını gördüm
2. Radix UI Dialog kodunda modal=true durumunda dış odaklanma ve tıklama olaylarının nasıl ele alındığını inceledim
3. DismissableLayer bileşeninin dış etkileşimleri nasıl engellediğini analiz ettim

## İlk Sorunun Çözümü

Çözüm şaşırtıcı derecede basit oldu. Dialog bileşeninin `modal` prop'unu false olarak ayarladık:

```diff
- <Dialog open={open} onOpenChange={handleDialogOpenChange} modal={true}>
+ <Dialog open={open} onOpenChange={handleDialogOpenChange} modal={false}>
```

## Bu Neden İşe Yaradı?

`modal={false}` ayarı ile Dialog bileşeni:

1. **Dış Etkileşimleri Engellemiyor**: Bu, dropdown'ları document.body'ye portal olarak render etsek bile, kullanıcıların bunlarla etkileşime girmesine izin verir
2. **Focus Kısıtlaması Yok**: Modalın dışındaki öğelere odaklanma izni verilir
3. **Event Propagation**: Olayların (events) doğal akışını bozmuyor, böylece input öğelerinin normal işlevi korunuyor

Bu yaklaşım, modalın dışındaki dropdown'lar ve bunların içindeki arama kısımlarının düzgün çalışmasını sağlar.

## Teknik Notlar

### Radix UI Dialog'da modal={true} vs modal={false}

**modal={true} (varsayılan)**:
- Modal dışında kalan her şeyi etkileşimsiz hale getirir
- Focus'u modal içinde tutar
- Modal dışındaki içeriği screen reader'lar için gizler
- Dış tıklamaları engeller (DismissableLayer ile)

**modal={false}**:
- Modal dışında etkileşime izin verir
- Focus'un modalın dışına çıkmasına izin verir
- Modalın dışındaki UI öğelerinin tam işlevselliğini korur

### createPortal ve Olay Dağıtımı

React'taki Portal'lar, DOM ağacında farklı bir konuma render edilseler bile, React'ın olay sisteminde orijinal konumlarında davranırlar. Ancak tarayıcının doğal focus olayları DOM hiyerarşisine dayalıdır. Bu, modal=true ile portal ve focus davranışı arasında çakışmaya neden olur.

## İkinci Sorun: Seçili Öğelerin Dropdown İçinde Gereksiz Tekrarı

İlk sorunu çözdükten sonra, bir başka kullanım sorunu daha ortaya çıktı:

- Hizmet veya personel dropdown'unda arama yapıldığında, seçili olan öğe hem dropdown butonu üzerinde hem de arama sonuçlarının üstünde gösteriliyordu
- Bu durum kullanıcı deneyimini olumsuz etkiliyordu çünkü:
  - Ekran alanı gereksiz yere kullanılıyordu
  - Seçili öğe her arama sonucunun üstünde kalıyordu
  - Seçili öğe zaten dropdown butonunda gösterildiği için tekrar görüntüye gerek yoktu

### İkinci Sorunun Çözümü

Dropdown bileşenlerindeki seçili öğelerin arama sonuçlarının üstünde gösterilmesini kaldırdık:

```diff
// src/components/appointments/AppointmentDetailModal/components/EditorSections.tsx

- {/* Seçili hizmeti göster */}
- {appointment?.serviceId && (
-   <div 
-     className="p-2 bg-blue-50 border-l-4 border-blue-500 cursor-pointer flex justify-between"
-   >
-     <span className="font-medium">{appointment.service?.name}</span>
-     <span className="text-green-600">
-       {appointment.service?.price ? parseFloat(appointment.service.price).toLocaleString("tr-TR") : "0"} ₺
-     </span>
-   </div>
- )}
+ {/* Seçili hizmetin arama sonuçlarının üstünde gösterilmesini kaldırdık */}
```

Benzer şekilde, personel dropdown'u için de aynı değişikliği yaptık:

```diff
- {/* Seçili personeli vurgulayarak göster */}
- {appointment?.staffId && (
-   <div className="p-2 bg-blue-50 border-l-4 border-blue-500 cursor-pointer">
-     <span className="font-medium truncate block overflow-hidden text-ellipsis w-full">
-       {appointment.staff?.name}
-     </span>
-   </div>
- )}
+ {/* Seçili personelin dropdown içinde gösterilmesini kaldırdık */}
```

### İkinci Çözümün Faydaları

1. **Daha Temiz Kullanıcı Arayüzü**: Seçili öğe artık sadece bir yerde (dropdown butonu üzerinde) gösteriliyor
2. **Arama Sonuçları Netliği**: Arama yapıldığında, sonuçlar seçili öğe ile karışmıyor
3. **Tutarlı Davranış**: Dropdown'lar standart davranışa uygun hale geldi
4. **Verimli Ekran Kullanımı**: Sınırlı dropdown alanı daha verimli kullanılıyor

## Gelecekte Benzer Sorunlardan Kaçınmak İçin

1. Modal içindeki dropdown'lar için portal kullanırken, modalın `modal` prop'unu kontrol edin
2. Etkileşimli öğelere portal ile modalın dışında render ederken dikkatli olun
3. Karmaşık UI senaryolarında React DevTools kullanarak olay dağıtımını anlamaya çalışın
4. Bileşenlerin prop değerlerinin varsayılan davranışlarını bildiğinizden emin olun
5. Dropdown'larda seçili öğelerin gösterilme biçimine dikkat edin, tekrarlardan kaçının
6. Kullanıcı deneyimini basitleştirmek için, aynı bilgiyi birden fazla yerde göstermekten kaçının

Bu tip sorunlar React'ta oldukça teknik ve tespit edilmesi zor olabilir, çünkü DOM yapısı ve React'ın olay sistemi farklı çalışır.