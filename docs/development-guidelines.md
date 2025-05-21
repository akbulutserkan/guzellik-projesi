# Yazılım Geliştirme Standartları ve Kuralları

Bu belge, proje geliştirme sürecinde uyulması gereken yazılım geliştirme standartlarını ve kurallarını içerir.

## Mimari Yapı

Proje aşağıdaki katmanlı mimariye sahiptir:

```
[UI Bileşenleri] -> [BFF (Client)] -> [API Gateway] -> [Domain Servisleri] -> [Veritabanı]
```

### Katmanlar ve Sorumlulukları

1. **UI Bileşenleri**: Kullanıcı arayüzü, React bileşenleri
2. **BFF (Backend For Frontend)**: UI spesifik veri manipülasyonu, istek formatlaması
3. **API Gateway**: İstekleri ilgili servislere yönlendirme
4. **Domain Servisleri**: İş mantığı, veri doğrulama, veritabanı işlemleri
5. **Veritabanı**: Veri saklama

## Kodlama Standartları

### 1. Dosya Organizasyonu

- Her modül/domain için ayrı klasör oluşturulmalıdır
- İlgili dosyalar uygun klasörlerde gruplanmalıdır
- İsimlendirme tutarlı olmalıdır

```
/src
  /domain         # Domain katmanı (iş mantığı)
    /product
    /customer
    /order
  /services       # Servis katmanı
    /db           # Veritabanı servisleri
    /utils        # Yardımcı servisler
  /bff            # Backend For Frontend
  /app            # Next.js uygulaması
  /components     # UI bileşenleri
  /lib            # Kütüphaneler, yardımcılar
  /types          # Tip tanımlamaları
  /docs           # Belgelendirme
```

### 2. İsimlendirme Kuralları

- **Dosyalar**: Modül amacını ve türünü belirten anlamlı isimler
  - Örnek: `productService.ts`, `customerRepository.ts`

- **Klasörler**: Tek kelime, küçük harf, anlamlı
  - Örnek: `product`, `customer`, `order`

- **Bileşenler ve Sınıflar**: PascalCase
  - Örnek: `ProductList`, `CustomerDetails`

- **Fonksiyonlar ve Metodlar**: camelCase, eylem/fiil ile başlar
  - Örnek: `getProductById()`, `createCustomer()`

- **Değişkenler ve Parametreler**: camelCase, anlamlı isimler
  - Örnek: `productList`, `customerName`

- **Sabitler**: UPPER_SNAKE_CASE
  - Örnek: `MAX_PRODUCT_COUNT`, `DEFAULT_PAGE_SIZE`

- **Tip ve Arayüzler**: PascalCase, açıklayıcı isimler
  - Örnek: `Product`, `CustomerResponse`

### 3. Kod Yazım Kuralları

- TypeScript kullanımı ve tip güvenliği gereklidir
- Her dosya için açıklayıcı JSDoc açıklamaları eklenmelidir
- Fonksiyonlar ve metodlar için JSDoc belgelendirmesi eklenmelidir
- Tek bir fonksiyon tek bir iş yapmalıdır (Single Responsibility Principle)
- Kod tekrarından kaçınılmalıdır (DRY - Don't Repeat Yourself)
- Tutarlı girinti (2 boşluk) kullanılmalıdır
- Fonksiyonlar 30 satırı, dosyalar 300 satırı geçmemelidir

### 4. Yorum Yazma

- Karmaşık mantık için açıklayıcı yorumlar eklenmelidir
- Kod kendini açıklayıcı olmalı, gereksiz yorumlardan kaçınılmalıdır
- `TODO`, `FIXME` gibi özel yorum etiketleri kullanılmalıdır

### 5. Hata İşleme

- Tüm asenkron işlemlerde try-catch kullanılmalıdır
- Hata mesajları anlamlı ve kullanıcı dostu olmalıdır
- Hatalar loglama sistemine kaydedilmelidir
- Beklenmeyen hatalar üst katmanlara yayılmamalıdır

## Domain-Driven Design (DDD) Prensipleri

### 1. Varlık (Entity) Tanımları

- Her domain için varlık modelleri oluşturulmalıdır
- Varlık tipi, oluşturma ve güncelleme tipleri ayrı tanımlanmalıdır
- İş kuralları domain modelinde bulunmalıdır

### 2. Repository Deseni

- Veritabanı işlemleri repository sınıflarında toplanmalıdır
- Repository, domain modellerini döndürmelidir
- Her repository tek bir aggregate root'u yönetmelidir

### 3. Servis Katmanı

- İş mantığı servis sınıflarında olmalıdır
- Servisler, repository'leri kullanarak veri işlemleri yapmalıdır
- Kompleks iş kuralları servis katmanında uygulanmalıdır

### 4. Controller/API Katmanı

- İstemci isteklerini kabul eder ve yanıtları formatlar
- Yetkilendirme kontrollerini yapar
- İş mantığını servis katmanına devreder

## Backend For Frontend (BFF) Prensipleri

1. UI spesifik veri biçimlendirmesi BFF'de yapılmalıdır
2. BFF, birden fazla API çağrısını birleştirebilir
3. BFF, client tarafında hata yönetimi sağlamalıdır
4. BFF, ekstra doğrulama ve kullanıcı dostu mesajlar içerebilir

## Test Stratejisi

1. Her domain için birim testleri yazılmalıdır
2. Servis katmanı için entegrasyon testleri yazılmalıdır
3. API endpointleri için e2e testleri yazılmalıdır
4. Test kapsamı en az %70 olmalıdır

## Performans ve Güvenlik Kuralları

### Performans

1. Gereksiz veritabanı sorgularından kaçınılmalıdır
2. İlişkili verilerin yüklenmesi için eager/lazy loading stratejileri belirlenmelidir
3. Sayfalama ve filtreleme sunucu tarafında yapılmalıdır
4. Büyük veri kümeleri için önbellek kullanılmalıdır

### Güvenlik

1. Tüm kullanıcı girdileri doğrulanmalıdır
2. OWASP Top 10 güvenlik açıkları önlenmelidir
3. Hassas veriler şifrelenmelidir
4. Token tabanlı yetkilendirme kullanılmalıdır
5. İşlem bazlı yetkilendirme kontrolleri yapılmalıdır

## Kod İnceleme Süreci

1. Her PR için en az bir onay alınmalıdır
2. Kod kalitesi kontrolleri otomatize edilmelidir
3. Kod gözden geçirme kriterlerine uyum sağlanmalıdır
4. PR açıklamaları detaylı olmalıdır

## Dokümantasyon

1. Her modül için README dosyası bulunmalıdır
2. API endpointleri belgelenmelidir
3. Karmaşık iş kuralları dokümante edilmelidir
4. Mimari değişiklikler ve kararlar belgelenmelidir

## Teknik Borç Yönetimi

1. Teknik borçlar gözle görülür şekilde belgelenmeli
2. Her sprint'te teknik borç azaltma çalışması yapılmalı
3. Yeni özelliklerden önce kritik teknik borçlar giderilmeli
4. Teknik borç oluşturan kararlar gerekçeleriyle belirtilmeli

Bu kurallar, projenin kalitesini ve sürdürülebilirliğini artırmak, ekip üyeleri arasında tutarlı bir geliştirme süreci sağlamak amacıyla hazırlanmıştır. Bu kurallara uyulması, projenin uzun vadeli başarısı için kritik öneme sahiptir.
