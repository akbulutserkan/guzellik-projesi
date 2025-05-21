# Tahsilat Sistemi İyileştirmeleri ve Yetki Düzenlemeleri

Bu belge, tahsilat (payments) modülü için yapılan yetki sistemi düzenlemelerini ve iyileştirmeleri açıklamaktadır. Ayrıca paket satışlarındaki tahsilat güncelleme sorunu için yapılan çözümü de içermektedir.

## İçindekiler
1. [Tahsilat Yetki Sistemi İyileştirmeleri](#tahsilat-yetki-sistemi-iyileştirmeleri)
2. [Paket Satışlarında Tahsilat Güncelleme Sorunu](#paket-satışlarında-tahsilat-güncelleme-sorunu)
3. [Yapılan Değişiklikler](#yapılan-değişiklikler)
4. [Test Edilmesi Gereken Durumlar](#test-edilmesi-gereken-durumlar)

## Tahsilat Yetki Sistemi İyileştirmeleri

Tahsilat modülü için yetki sistemi aşağıdaki şekilde düzenlenmiş ve optimize edilmiştir:

### 1. Yetkiler ve Tanımları

- **VIEW_PAYMENTS**: Tahsilatları görüntüleyebilir
- **EDIT_PAYMENTS**: Yeni tahsilat oluşturabilir
- **DELETE_PAYMENTS**: Tahsilatları silebilir

### 2. Yetki Hiyerarşisi

Düzenleme ve silme yetkileri için, otomatik olarak görüntüleme yetkisi de verilir. Örneğin:
- EDIT_PAYMENTS yetkisi verildiğinde, VIEW_PAYMENTS yetkisi otomatik olarak eklenir
- DELETE_PAYMENTS yetkisi verildiğinde, VIEW_PAYMENTS yetkisi otomatik olarak eklenir

### 3. API Koruma Mekanizmaları

Tahsilat modülünün yanı sıra, tahsilatlar için gereken diğer API'lere erişime izin vermek için çoklu yetki kontrolü sistemi uygulanmıştır:

- Müşteri API'si (VIEW_CUSTOMERS, VIEW_PACKAGE_SALES, VIEW_PAYMENTS)
- Paket Satışları API'si (VIEW_PACKAGE_SALES, VIEW_PAYMENTS)
- Ürün Satışları API'si (VIEW_PRODUCT_SALES, VIEW_PAYMENTS)
- Personel API'si (VIEW_STAFF, VIEW_PACKAGE_SALES, VIEW_PAYMENTS)

Bu sayede, sadece tahsilat yetkisi olan bir kullanıcı, ilgili müşteri, paket, ürün veya personel verilerine erişebilir.

## Paket Satışlarında Tahsilat Güncelleme Sorunu

Paket satışları güncelleme modalında "Tahsil Edilen Toplam" alanı değiştirildiğinde, arayüzde başarılı mesajı gösterilmesine rağmen veritabanında güncelleme yapılmıyordu. Bunun için aşağıdaki sorunlar tespit edilip çözülmüştür:

### Tespit Edilen Sorunlar

1. Paket satışı güncelleme API'sinde (`/api/package-sales/update/[id]/route.ts`) ödeme verilerini işlemek için bir mekanizma yoktu
2. Modaldan gönderilen `payment` verileri backend'de kullanılmıyordu
3. Güncellemede `payments` verisi include edilmiyordu

### Çözüm Yaklaşımı

1. Backend API'de ödeme verilerini işleyen bir mekanizma eklendi:
   - Mevcut ödemeleri kontrol eden
   - Ödeme tutarı değişmişse mevcut ödemeleri silip yenisini oluşturan
   - Response'da payments verilerini dahil eden

2. Frontend'deki modal bileşeninde (`EditPackageSaleModal.tsx`) fiyat ve ödeme tutarı arasındaki ilişkiyi kontrol eden logic eklendi

## Yapılan Değişiklikler

### 1. Yetki Sistemi Dosyaları

- `/Frontend/src/components/staff/components/PermissionsModal.tsx`: Tahsilat yetkilerinin etiketleri ve gruplaması güncellendi
- `/Frontend/src/hooks/usePermissions.ts`: Mevcut tahsilat yetkileri korundu

### 2. API Koruma Mekanizmaları

- `/Frontend/src/app/api/payments/route.ts`: Tahsilat API'si için NextRequest tipine güncellendi
- `/Frontend/src/app/api/payments/[id]/route.ts`: Dinamik tahsilat rotası oluşturuldu ve yetkilendirildi
- `/Frontend/src/app/api/customers/route.ts`: Tahsilat yetkisi için erişim eklendi
- `/Frontend/src/app/api/package-sales/route.ts`: Tahsilat yetkisi için erişim eklendi
- `/Frontend/src/app/api/product-sales/route.ts`: Tahsilat yetkisi için erişim eklendi
- `/Frontend/src/app/api/staff/route.ts`: Tahsilat yetkisi için erişim eklendi

### 3. Tahsilat Sayfası Güncellemeleri

- `/Frontend/src/app/(protected)/payments/page.tsx`: Mevcut yetki kontrolleri korundu
- `/Frontend/src/app/(protected)/payments/new/page.tsx`: withPageAuth ile sayfa koruma eklendi
- `/Frontend/src/app/(protected)/payments/[id]/page.tsx`: withPageAuth ile sayfa koruma eklendi

### 4. Paket Satışları Tahsilat Güncellemesi

- `/Frontend/src/app/api/package-sales/update/[id]/route.ts`: Ödeme verileri işleme mekanizması eklendi
- `/Frontend/src/components/package-sales/EditPackageSaleModal.tsx`: Fiyat ve ödeme miktarı kontrolü eklendi

## Test Edilmesi Gereken Durumlar

### Tahsilat Yetkileri

1. VIEW_PAYMENTS yetkisine sahip kullanıcının:
   - Tahsilatlar sayfasını görüntüleyebilmesi
   - Müşteri, paket, ürün ve personel verilerine erişebilmesi
   - Yeni tahsilat ekleyememesi veya silememesi

2. EDIT_PAYMENTS yetkisine sahip kullanıcının:
   - Tahsilatlar sayfasını görüntüleyebilmesi
   - Yeni tahsilat oluşturabilmesi
   - Müşteri, paket, ürün ve personel verilerine erişebilmesi

3. DELETE_PAYMENTS yetkisine sahip kullanıcının:
   - Tahsilat silebilmesi

### Paket Satışları Tahsilat Güncellemesi

1. Paket satışı güncelleme modalında:
   - "Tahsil Edilen Toplam" alanının değiştirilmesi
   - Değişikliğin veritabanında kaydedilmesi
   - Güncellenen verinin arayüzde doğru gösterilmesi

2. Fiyat ve Ödeme İlişkisi:
   - Fiyat, ödeme tutarından küçük olmamalı
   - Fiyat düşürüldüğünde ödeme tutarı otomatik olarak ayarlanmalı