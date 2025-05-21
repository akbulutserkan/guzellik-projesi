# Takvim Sayfası Randevu Düzenleme Modalında Yeni Hizmet Ekleme Sistemi

Bu belge, takvim sayfasındaki randevu düzenleme modalında yeni hizmet ekleme özelliğinin nasıl çalıştığını ve daha önce karşılaşılan sorunların çözümlerini açıklar.

## Genel Bakış

Takvim sayfasında bir müşterinin randevusunu düzenlerken, o müşteriye aynı gün için birden fazla hizmet eklenebilmektedir. Her yeni hizmet, en son hizmetin bittiği saatte başlamalı ve aralarında gereksiz boşluklar olmamalıdır.

## Karşılaşılan Sorun

Daha önceki versiyonda, müşteriye ikinci bir hizmet eklendiğinde sorunsuz çalışıyordu, ancak üçüncü ve sonraki hizmetlerde aşağıdaki sorun yaşanıyordu:

1. İlk hizmet örneğin 09:15 - 10:15 saatleri arasında
2. İkinci hizmet 10:15 - 11:00 saatleri arasında 
3. Üçüncü hizmet için "Yeni Hizmet" butonuna tıklandığında, bu 11:00'de başlamak yerine 11:45'te başlıyordu (arada 45 dakikalık gereksiz boşluk)
4. Dördüncü ve sonraki hizmetlerde de benzer şekilde gereksiz boşluklar oluşuyordu

Yani 3. ve sonraki hizmetlerde, her zaman ilk hizmetten sonraki süre kadar fazladan boşluk ekleniyordu.

## Sorunun Teknik Nedeni

Sorun, aşağıdaki üç ana nedenle ortaya çıkıyordu:

1. **Son Randevu Hesaplama Sorunu**: `getLatestAppointmentEndTime` fonksiyonu, randevuları bitiş zamanına göre sıralıyor, ancak sıralamadan sonra karmaşık bir karşılaştırma mantığı kullanıyordu:
   - İlk randevu bitiş zamanını şimdiki zamanla karşılaştırıyor
   - Eğer ilk randevu şimdiden önceyse, en son randevunun bitiş zamanını döndürüyor
   - Aksi takdirde ilk randevunun bitiş zamanını döndürüyor
   - Bu da bazı durumlarda son randevu yerine ilk randevunun bitiş saatinin alınmasına neden oluyordu

2. **Tarih Sıralamasında Eksik Alanlar**: Randevular sıralanırken sadece `start` ve `end` alanları kontrol ediliyordu, ancak API yanıtında bazen `startTime` ve `endTime` alanları da olabiliyordu.

3. **Doğrudan Boşluksuz Randevu Denemesi Yoktu**: Yeni randevu eklenirken önce doğrudan son randevunun bitiş zamanında başlatma denemesi yapılmıyordu.

## Çözüm

Bu sorunu çözmek için, aşağıdaki değişiklikler uygulandı:

### 1. Son Randevu Bitiş Saati Hesaplaması (`getLatestAppointmentEndTime`)

```javascript
export const getLatestAppointmentEndTime = (appointment: any, allAppointments: any[]) => {
  console.log('⏱️ getLatestAppointmentEndTime çağrıldı');
  
  if (!appointment || !allAppointments || allAppointments.length === 0) {
    console.log('⏱️ Geçerli randevu veya randevu listesi yok, şimdiki zamanı döndürüyorum');
    return appointment?.end || new Date().toISOString();
  }
  
  // Filtrele ve müşterinin randevularını al
  const customerAppointments = allAppointments.filter(apt => 
    apt.customerId === appointment.customerId
  );
  
  console.log(`⏱️ Müşterinin toplam randevu sayısı: ${customerAppointments.length}`);
  
  if (customerAppointments.length === 0) {
    console.log('⏱️ Müşterinin hiç randevusu yok, mevcut randevunun bitiş zamanını döndürüyorum');
    return appointment.end;
  }
  
  // Tüm randevuları başlangıç tarihine göre sırala
  const sortedAppointments = [...customerAppointments].sort((a, b) => {
    const dateA = new Date(a.start || a.startTime);
    const dateB = new Date(b.start || b.startTime);
    return dateA.getTime() - dateB.getTime();
  });
  
  console.log('⏱️ Sıralanmış randevular:');
  sortedAppointments.forEach((apt, index) => {
    const startTime = new Date(apt.start || apt.startTime);
    const endTime = new Date(apt.end || apt.endTime);
    console.log(`⏱️ Randevu ${index + 1}: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()} (${apt.title || apt.service?.name || 'İsimsiz'})`);
  });
  
  // Her zaman en son randevunun bitiş zamanını kullan
  const latestAppointment = sortedAppointments[sortedAppointments.length - 1];
  const latestEndTime = new Date(latestAppointment.end || latestAppointment.endTime);
  
  console.log(`⏱️ En son randevunun bitiş zamanı: ${latestEndTime.toLocaleTimeString()} (${latestAppointment.title || latestAppointment.service?.name || 'İsimsiz'})`);
  
  return latestAppointment.end || latestAppointment.endTime;
};
```

Yapılan değişiklikler:
- Randevuları artık bitiş zamanı değil başlangıç zamanına göre sıralama
- Karmaşık karşılaştırma mantığını kaldırma (ilk/son randevu karşılaştırması)
- Her zaman direkt olarak en son randevunun bitiş zamanını döndürme
- Hem `start/end` hem de `startTime/endTime` alanlarını destekleme
- Kapsamlı debug log kayıtları ekleme

### 2. Randevu Sıralamalarında Tutarlılık Sağlama

AppointmentDetailModal'da ve useAppointmentModal hook'unda randevu sıralama işlemlerini aynı mantıkla güncelleme:

```javascript
// AppointmentDetailModal
updatedAppointments.sort((a, b) => {
  const startTimeA = a.start ? new Date(a.start || a.startTime).getTime() : 0;
  const startTimeB = b.start ? new Date(b.start || b.startTime).getTime() : 0;
  return startTimeA - startTimeB;
});

// useAppointmentModal
const sortedAppointments = sameDay.sort((a, b) => {
  const startTimeA = a.start ? new Date(a.start || a.startTime).getTime() : 0;
  const startTimeB = b.start ? new Date(b.start || b.startTime).getTime() : 0;
  return startTimeA - startTimeB;
});
```

### 3. Doğrudan Boşluksuz Randevu Denemesi

`autoScheduleAppointmentAfterService` fonksiyonunda, müsait saat aramadan önce doğrudan son randevunun bitişinden başlama denemesi ekleme:

```javascript
// Doğrudan bitiş saatini kullanarak yeni hizmet oluşturmayı deneyelim
// Bu, randevular arasında boşluk olmamasını sağlayacak
const directEndTime = new Date(previousEndTime.getTime() + serviceDuration * 60000);

console.log(`Direk başlangıç saati: ${previousEndTime.toLocaleTimeString()} - Bitiş saati: ${directEndTime.toLocaleTimeString()}`);

// İşletme çalışma saatleri kontrolü
const businessCheck = await checkIfOutsideBusinessHours(formData.staffId, previousEndTime, directEndTime);

if (!businessCheck.isOutside) {
  // Eğer mesai saatleri içindeyse, direkt randevu oluşturmayı dene
  try {
    // Randevu verisi oluştur ve kaydet...
    // ...
    return enrichedData; // Başarılı olursa sonucu dön
  } catch (directErr) {
    // Doğrudan oluşturma başarısız, müsait saat aramaya devam et
  }
}
```

## Çalışma Mantığı

Şu anda sistem aşağıdaki mantıkla çalışır:

1. Randevu düzenleme modalı açılır.
2. Müşterinin mevcut randevuları tarih sırasına göre listelenir.
3. "Yeni Hizmet" butonuna tıklandığında:
   - `findLatestAppointmentEndTime` fonksiyonu çağrılır ve müşterinin en son randevusunun bitiş zamanı bulunur.
   - Bu bitiş zamanı, yeni hizmetin başlangıç saati olarak kullanılır.
   - Önce doğrudan bu saatte hizmet oluşturulmaya çalışılır (boşluksuz).
   - Eğer çakışma veya mesai sorunu varsa, bir sonraki müsait saat bulunmaya çalışılır.
4. Yeni hizmet oluşturulduğunda:
   - AppointmentDetailModal içindeki randevu listesi güncellenir ve saat sırasına göre sıralanır.
   - Modal içindeki toplam tahsilat tutarı güncellenir.
   - Kalender görünümü arka planda güncellenir.

## Dikkat Edilmesi Gereken Noktalar

1. **Zaman Alanları**: API yanıtlarında ve bileşenler arasındaki veri akışında, zaman bilgileri `start/end` veya `startTime/endTime` şeklinde farklı alanlarla gelebilir. Tüm kod parçalarının her iki durumu da desteklediğinden emin olun.

2. **Debug Logları**: Sorun gidermede yardımcı olmaları için debug logları eklenmiştir. Bunlar sorunu izlemenize yardımcı olabilir:
   - `⏱️` ile başlayanlar zaman hesaplama ile ilgili
   - `🔴` ile başlayanlar randevu sıralama ile ilgili
   - `DETAYLI LOG` etiketi ile başlayanlar yeni hizmet ekleme işlemi ile ilgili

3. **Randevu Sıralaması**: Tüm kod parçalarında randevular başlangıç saatine göre sıralanır. Bu tutarlılık korunmalıdır.

## Test Edilmesi Gereken Durumlar

Herhangi bir değişiklik yapıldığında, aşağıdaki senaryoları test edin:

1. İlk randevu sonrası ikinci randevu ekleme - ikinci randevu tam olarak ilk randevu bitişinden başlamalı.
2. İkinci randevu sonrası üçüncü randevu ekleme - üçüncü randevu tam olarak ikinci randevu bitişinden başlamalı.
3. Üç veya daha fazla randevu eklendikten sonra orta sıradaki bir randevuyu silme ve ardından yeni randevu ekleme - yeni randevu en son randevunun bitişinden başlamalı.
4. Farklı randevu süreleri ile test (15 dk, 30 dk, 1 saat) - her durumda randevular arasında boşluk olmamalı.
5. Mesai saatleri dışına taşan randevular için uyarı gösterilmeli ve alternatif zaman önerilmeli.

## Sorun Tekrarlanırsa

Eğer benzer sorunlar tekrarlanırsa, aşağıdaki adımları izleyin:

1. Console log çıktılarını kontrol edin, özellikle:
   - `getLatestAppointmentEndTime` fonksiyonunun döndürdüğü zamanı
   - Sıralanmış randevu listesinin doğru sırada olup olmadığını
   - Yeni hizmet eklerken kullanılan başlangıç zamanının doğru olup olmadığını

2. Şu fonksiyonların son düzeltmelerle uyumlu olduğunu kontrol edin:
   - `/src/components/appointments/AppointmentDetailModal/services/api.ts` dosyasındaki `getLatestAppointmentEndTime`
   - `/src/components/appointments/NewAppointmentModal/hooks/useAppointmentForm.ts` dosyasındaki defaultStartTime kullanımı
   - `/src/components/appointments/NewAppointmentModal/utils/appointmentUtils.ts` dosyasındaki autoScheduleAppointmentAfterService

3. Yeni ve orjinal modaller arasında tutarsızlık olmadığından emin olun:
   - AppointmentDetailModal bileşeninin onSuccess metodunda randevu listesi güncellemesi
   - NewAppointmentModal bileşeninin defaultStartTime kullanımı

## Özet

Bu değişikliklerle birlikte, takvim sayfasında müşteriye birden fazla hizmet ekleme artık beklendiği gibi çalışmaktadır. Her yeni hizmet, bir önceki hizmetin tam bitişinde başlar ve aralarında gereksiz boşluklar oluşmaz. Bu, hem kullanıcı deneyimini iyileştirir hem de zamanlamanın doğru ve tutarlı olmasını sağlar.
