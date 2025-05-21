# MCP API Entegrasyonu Hataları ve Çözümleri

Bu README dosyası, MCP API entegrasyonu sırasında karşılaşılan yaygın hataları ve bunların çözüm yollarını belgelemektedir. Yeni bir frontend bileşeni MCP API'ye geçirilirken referans olarak kullanılabilir.

## Tahsilatlar Sayfası Hataları

### Hata 1: Bilinmeyen Metod veya Tool Hatası

**Hata Mesajı:**
```
MCP API çağrısı başarısız (get-payments): Error: Bilinmeyen metod veya tool
Tahsilatlar yüklenirken hata: Error: Bilinmeyen metod veya tool
```

**Konsolda Görülen Detaylar:**
```
MCP API hatası (400): › Object
MCP API çağrısı başarısız (get-payments): Error: Bilinmeyen metod veya tool
  at callMcpApi (index.ts:25:13)
  at async PaymentsPage.useCallback [as fetchPayments] (page.tsx:50:22)
```

**Hatanın Nedeni:**
Frontend kodunda `get-payments` adında bir MCP API metodu çağrılıyor, ancak backend MCP sunucusunda bu metod tanımlanmamış.

**Çözüm Adımları:**
1. MCP API tanımlamalarının bulunduğu `/src/app/mcp-tools` dizinindeki ilgili araçları kontrol et
2. İlgili metodun (get-payments) backend'de tanımlanıp tanımlanmadığını kontrol et
3. Aşağıdaki seçeneklerden birini uygula:
   - Backend'de bu metodu tanımla
   - Frontend kodunu, backend'de tanımlı olan doğru metod ismiyle güncelle
   - Benzer işlevi olan mevcut bir metodu kullan

**Örnek Backend Tanımı:**
```javascript
// payments.ts dosyasına ekle
export function registerPaymentTools(server: any) {
  // Get all payments
  server.tool(
    'get-payments',
    {
      startDate: z.string().optional(),
      endDate: z.string().optional()
    },
    async ({ startDate, endDate }) => {
      return await paymentTools.getPayments(startDate, endDate);
    }
  );
  
  // Diğer ödeme metodları...
}
```

### Hata 2: Eksik MCP API Metodları

**Tahsilatlar sayfası için gerekli metodlar:**
- `get-payments`: Tüm tahsilatları listelemek için
- `get-payment-by-id`: Belirli bir tahsilatın detaylarını görmek için
- `create-payment`: Yeni tahsilat eklemek için 
- `update-payment-status`: Tahsilat durumunu güncellemek için (örn. iade işlemi)

**Çözüm:**
Backend'de bu metodları tanımlarken, frontend'de kullanılan veri yapısına uygun yanıtlar döndürdüğünden emin ol. Özellikle:

1. Müşteri verileri yapısı (firstName+lastName vs name)
2. Tarih formatları
3. Durum (status) değerleri
4. Ödeme tipleri ve metodları

## Genel MCP API Entegrasyon Prensipleri

### 1. Frontend-Backend Uyum Kontrolü

- Bir bileşeni MCP API'ye geçirmeden önce, backend'de ilgili metodların tanımlı olduğunu kontrol et
- Backend metod isimlerini ve parametre yapılarını frontend kodunda doğru şekilde kullan
- Dönen veri yapılarını frontend'de doğru şekilde işle

### 2. Yaygın Gözetim Noktaları

- **Customer/Müşteri Yapısı**: MCP API'de `name` kullanılırken, eski API'de `firstName` ve `lastName` ayrı olabilir
- **Tarih Formatları**: MCP API'nin ve frontend'in beklediği tarih formatlarının uyumlu olduğundan emin ol
- **Parametre İsimleri**: Backend'deki parametre isimleriyle frontend'den gönderilen parametre isimlerinin aynı olduğunu kontrol et

### 3. Hata Ayıklama Yöntemleri

- Browser konsolunda API çağrılarını ve yanıtlarını incele
- Backend loglarını kontrol et
- `console.log` kullanarak ara değerleri yazdır
- Sorunun frontend'de mi yoksa backend'de mi olduğunu belirlemeye çalış

### 4. Geçiş Stratejisi

1. Önce verileri getiren (GET) metodları geçir
2. Sonra veri değiştiren (POST, PATCH, DELETE) metodları geçir
3. Her değişiklikten sonra test et
4. Yedek yolları (fallback) ancak test edildikten sonra kaldır

## Diğer Bileşenlerde MCP API'ye Geçişte Dikkat Edilecek Noktalar

1. **Paket Satışları**: müşteri ve personel (staff) verilerinde MCP API dönüş yapısını kontrol et
2. **Ürün Satışları**: ürün ve müşteri verilerinde MCP API dönüş yapısını kontrol et
3. **Tahsilatlar**: tüm ödeme tiplerinin backend'de tanımlı olduğundan emin ol
4. **Randevular**: tarih formatleri ve durum değerlerinin uyumlu olduğundan emin ol

Bu doküman, MCP API entegrasyonu sırasında karşılaşılan sorunları belgelemek ve çözmek için sürekli güncellenmelidir.
