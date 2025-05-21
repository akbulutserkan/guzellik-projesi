# Müşteriler API'sinin MCP API'ye Taşınması

Bu dokümantasyon, müşteriler (customers) API'lerinin MCP API sistemine taşınma sürecini açıklamaktadır.

## Yapılan Değişiklikler

1. **MCP API Araçları Oluşturuldu**
   - Müşteri işlemleri için MCP API araçları yazıldı
   - `/src/app/mcp-tools/customers/index.ts` içerisinde tanımlandı
   - Ana MCP API modülüne entegre edildi

2. **Frontend Bileşenlerinin Güncellenmesi**
   - `CustomersPage` bileşeni MCP API çağrılarını kullanacak şekilde güncellendi
   - `NewCustomerModal`, `EditCustomerModal` ve `CustomerDetailModal` bileşenleri MCP API ile çalışır hale getirildi
   - İlgili bileşenlere `mcpApi` bayrağı eklendi (hybrid çalışma için)

3. **API Yardımcı Fonksiyonları**
   - `/src/lib/mcp/customers/index.ts` dosyasında MCP API çağrıları için yardımcı fonksiyonlar oluşturuldu
   - `/src/lib/mcp/utils/index.ts` içerisinde tüm MCP API çağrıları için genel helper fonksiyon eklendi

4. **Eski API Kaldırıldı ve Yedeklendi**
   - `/src/app/api/customers` altındaki tüm API endpoint'leri kaldırıldı
   - Tüm dosyalar `/CUSTOMERS_API_BACKUP` altında yedeklendi

## MCP API Araçları

### Yeni Müşteri API'leri

```typescript
// Müşterileri listeleme
get-customers

// Müşteri detayı getirme
get-customer-by-id

// Yeni müşteri oluşturma
create-customer

// Müşteri güncelleme
update-customer

// Müşteri silme
delete-customer
```

## Önemli Değişiklikler ve Dikkat Edilmesi Gerekenler

1. **API Yanıt Formatı**
   - REST API doğrudan verileri döndürürken, MCP API `{ success: true, data: ... }` formatında yanıt döndürür
   - Hata durumunda `{ success: false, error: ... }` formatında yanıt döndürür

2. **Hata İşleme**
   - Telefon numarası çakışmaları gibi özel hata durumları için custom error objeler kullanıldı
   - MCP API'den gelen hatalar için detaylı error handling eklendi

3. **Hybrid Çalışma Modu**
   - Tüm müşteri bileşenleri hem eski REST API hem de yeni MCP API ile çalışabilir
   - `mcpApi` prop'u ile hangi API'nin kullanılacağı belirlenebilir

4. **Geri Dönüş Planı**
   - Herhangi bir sorun durumunda eski REST API'ye dönüş yapılabilir
   - Bileşenlerin `mcpApi` bayrağını `false` olarak ayarlamak yeterlidir

## MCP API Kullanım Örnekleri

### Müşteri Listeleme

```typescript
import { getCustomers } from '@/lib/mcp/customers';

// Tüm müşterileri getir
const customers = await getCustomers();
```

### Müşteri Detayı Getirme

```typescript
import { getCustomerById } from '@/lib/mcp/customers';

// ID'ye göre müşteri detaylarını getir
const customer = await getCustomerById('customer-id');
```

### Yeni Müşteri Oluşturma

```typescript
import { createCustomer } from '@/lib/mcp/customers';

// Yeni müşteri oluştur
const newCustomer = await createCustomer({
  name: 'Ahmet Yılmaz',
  phone: '5321234567',
  email: 'ahmet@example.com',
  notes: 'VIP müşteri'
});
```

### Müşteri Güncelleme

```typescript
import { updateCustomer } from '@/lib/mcp/customers';

// Müşteri bilgilerini güncelle
const updatedCustomer = await updateCustomer('customer-id', {
  name: 'Ahmet Yılmaz',
  phone: '5321234567',
  email: 'ahmet.yilmaz@example.com',
  notes: 'VIP müşteri - Aylık paket'
});
```

### Müşteri Silme

```typescript
import { deleteCustomer } from '@/lib/mcp/customers';

// Müşteri sil
await deleteCustomer('customer-id');
```

## Yedeklenen Dosyalar

Eski API kodları `/CUSTOMERS_API_BACKUP` altında yedeklenmiştir. Herhangi bir sorun durumunda bu dosyalara başvurulabilir.

## Yapılacak İlave İşlemler ve İyileştirmeler

1. **Performans İzleme**
   - MCP API performansı ve hata oranları izlenmelidir
   - Gerekirse optimizasyonlar yapılmalıdır

2. **Ekstra Fonksiyonlar**
   - Gelecekte müşteri arama, filtreleme gibi ekstra fonksiyonlar eklenebilir
   - Sayfalama (pagination) desteği eklenebilir

3. **Test ve Doğrulama**
   - Tüm fonksiyonlar kapsamlı şekilde test edilmelidir
   - Edge case'ler ve hata senaryoları ele alınmalıdır
