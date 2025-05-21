# API Standardizasyon Kılavuzu

Bu belge, projede kullanılan API endpoint adlandırmalarını ve yapılarını standardize etmek amacıyla hazırlanmıştır.

## API İsimlendirme Kuralları

Tüm API endpointleri için aşağıdaki standardı uygulayın:

### 1. İstek Metodu ve İsimlendirme

| İşlem Tipi     | HTTP Metod | İsimlendirme Formatı    | Örnek                     |
|----------------|------------|-------------------------|---------------------------|
| Liste Getirme  | GET        | `get-{entity}s`         | `get-products`            |
| Detay Getirme  | GET        | `get-{entity}-by-id`    | `get-product-by-id`       |
| Oluşturma      | POST       | `create-{entity}`       | `create-product`          |
| Güncelleme     | PUT/PATCH  | `update-{entity}`       | `update-product`          |
| Silme          | DELETE     | `delete-{entity}`       | `delete-product`          |
| Özel İşlem     | POST       | `{operation}-{entity}`  | `update-product-stock`    |

### 2. Çoğul/Tekil Kullanımı

- Liste döndüren endpointler için çoğul isim: `get-products`
- Tekil işlemler için tekil isim: `get-product-by-id`

### 3. İsimlendirmede Kebab-Case Kullanımı

API endpoint adları kebab-case (kısa çizgi ile ayrılmış küçük harfler) olmalıdır.

- **Doğru:** `get-products`, `update-product-stock`
- **Yanlış:** `getProducts`, `UpdateProductStock`, `get_products`

## HTTP Durum Kodları

API yanıtları için standart HTTP durum kodları kullanılmalıdır:

| Durum Kodu | Anlamı                          | Kullanım Durumu                  |
|------------|--------------------------------|----------------------------------|
| 200        | Başarılı                        | Başarılı işlemler                |
| 201        | Oluşturuldu                     | Yeni kayıt oluşturulduğunda      |
| 400        | Hatalı İstek                    | Validasyon hatalarında           |
| 401        | Kimlik Doğrulama Hatası         | Oturum açma/yetki hatalarında    |
| 403        | Yetkisiz Erişim                 | Erişim izni olmadığında          |
| 404        | Bulunamadı                      | Kayıt bulunamadığında            |
| 500        | Sunucu Hatası                   | Beklenmeyen hatalarda            |

## Yanıt Formatı

Tüm API yanıtları aşağıdaki formatta olmalıdır:

```json
{
  "success": true/false,  // İşlem başarılı mı
  "data": {...},          // (Başarılıysa) Yanıt verileri
  "error": "...",         // (Başarısızsa) Hata mesajı
  "message": "...",       // (Opsiyonel) Bilgi mesajı
  "meta": {...}           // (Opsiyonel) Meta veriler (sayfalama vb.)
}
```

## İstek Parametreleri

### 1. Liste İstekleri İçin Filtreler

```json
{
  "search": "...",        // Arama terimi
  "filters": {...},       // Özel filtreler
  "pagination": {
    "page": 1,            // Sayfa numarası
    "perPage": 25         // Sayfa başına öğe sayısı
  },
  "sort": {
    "field": "...",       // Sıralama alanı
    "order": "asc/desc"   // Sıralama yönü
  }
}
```

### 2. Kayıt İşlemleri İçin

```json
{
  "entity": {...},        // Oluşturulacak/güncellenecek varlık verisi
  "options": {...}        // Opsiyonel işlem seçenekleri
}
```

## Eski Adlandırma Uyumluluk Kılavuzu

Projenin önceki sürümlerinde kullanılan API adlandırmaları ve yeni standartlaştırılmış adlandırmalar arasındaki karşılıkları:

| Eski Adlandırma          | Yeni Standart Adlandırma   |
|--------------------------|----------------------------|
| `get-products`           | `get-products`             |
| `get-product-by-id`      | `get-product-by-id`        |
| `create-product`         | `create-product`           |
| `update-product`         | `update-product`           |
| `delete-product`         | `delete-product`           |
| `update-product-stock`   | `update-product-stock`     |
| `add-package`            | `create-package`           |
| `add-package-category`   | `create-package-category`  |
| `get-product-sales`      | `get-product-sales`        |

## Dönüşüm Stratejisi

1. Yeni API'ler tamamen yeni standartlarla oluşturulacak
2. Mevcut API'ler geriye uyumluluk için korunacak ancak zaman içinde kaldırılacak
3. İsimlendirme hatalarının düzeltilmesi için yönlendirme mekanizması kullanılacak (örneğin, `add-package` çağrısı `create-package` çağrısına yönlendirilecek)

## Örnek Kullanım

```typescript
// API isimlendirme örnekleri
const products = await callMcpApi('get-products', { search: 'telefon' });
const product = await callMcpApi('get-product-by-id', { id: '123' });
const newProduct = await callMcpApi('create-product', { name: 'Yeni Ürün', price: 100 });
const updatedProduct = await callMcpApi('update-product', { id: '123', name: 'Güncel Ürün' });
const deletedProduct = await callMcpApi('delete-product', { id: '123' });
```
