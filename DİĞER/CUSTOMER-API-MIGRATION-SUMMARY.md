# Müşteriler (Customers) Modülü API Geçişi - Özet

Müşteriler modülü merkezi API yapısına başarıyla geçirilmiştir. Bu belge, yapılan değişiklikleri ve dikkat edilmesi gereken noktaları açıklar.

## Yapılan Değişiklikler

1. **Veritabanı Servis Katmanı**
   - `/src/lib/customer-service/index.ts` oluşturuldu
   - Tüm müşteri CRUD işlemleri servis katmanına taşındı

2. **API Route Dosyaları**
   - `/src/app/api/customers/route.ts`: Müşteri listeleme ve oluşturma
   - `/src/app/api/customers/[id]/route.ts`: ID bazlı işlemler (getirme, güncelleme, silme)

3. **İstemci Tarafı Hook**
   - `/src/hooks/useCustomers.ts` oluşturuldu
   - Tüm müşteri işlemleri için modern React hook API'si sunuyor

4. **ApiService Güncellemesi**
   - Merkezi `ApiService` içinde `customers` namespace'i güncellendi
   - `getAll` metodu eklendi, geriye uyumluluk için `getList` korundu

5. **Eski Kod Güncellemeleri ve Temizliği**
   - `useCustomerManagement` hook'unda `CustomerService` yerine `ApiService` kullanılacak şekilde güncellendi
   - İlgili müşteri bileşenleri `useCustomers` hook'unu içeri aktaracak şekilde güncellendi
   - `CustomerService` dosyasına geriye uyumluluk için güncellemeler ve uyarılar eklendi

## Eski vs Yeni Kullanım Örnekleri

### Eski Kullanım

```typescript
// Müşteri listesi getirme
const customers = await CustomerService.getList({ includeDeleted: false });

// Müşteri detayı getirme
const customer = await CustomerService.getById(id);
```

### Yeni Kullanım (ApiService)

```typescript
// Müşteri listesi getirme
const result = await ApiService.customers.getAll({ includeDeleted: false });
if (result.success) {
  const customers = result.data;
}

// Müşteri detayı getirme
const result = await ApiService.customers.getById(id);
if (result.success) {
  const customer = result.data;
}
```

### Yeni Kullanım (React Hook)

```tsx
'use client';

import { useCustomers } from '@/hooks/useCustomers';

function CustomerList() {
  const { customers, loading, error, fetchCustomers } = useCustomers();
  
  useEffect(() => {
    // İsteğe bağlı filtreler ile müşteri listesini getir
    fetchCustomers({ includeDeleted: false });
  }, [fetchCustomers]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

## Dikkat Edilmesi Gerekenler

1. Yeni geliştirmelerde `useCustomers` hook'unu veya doğrudan `ApiService.customers` metodlarını kullanın
2. `CustomerService` sınıfı sadece geriye uyumluluk için korunmuştur ve yeni geliştirmelerde kullanılmamalıdır
3. Bileşenlerde, gereken durumda hem `useCustomerManagement` (eski) hem de `useCustomers` (yeni) hook'ları birlikte kullanılabilir
4. Yeni API çağrıları her zaman `{ success, error, data }` formatında yanıt döndürür, bu durumu kontrol etmeyi unutmayın

## Diğer Geçiş Adayları

Bu başarılı geçişi takiben, aşağıdaki modüllerin de benzer şekilde merkezi API yapısına geçirilmesi önerilir:

1. Products (Ürünler)
2. Services (Hizmetler)
3. Staff (Personel)
4. Payments (Ödemeler)

Bu geçişler, uygulama genelinde daha tutarlı bir API kullanımı sağlayacak ve kod bakımını kolaylaştıracaktır.