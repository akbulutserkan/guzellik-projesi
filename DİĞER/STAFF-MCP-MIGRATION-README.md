# Personel (Staff) API'sinin MCP API'ye Taşınması

Bu dokümantasyon, personel (staff) API'lerinin MCP API sistemine taşınma sürecini açıklamaktadır.

## Yapılan Değişiklikler

1. **MCP API Araçları Oluşturuldu**
   - Personel işlemleri için MCP API araçları yazıldı
   - `/src/app/mcp-tools/staff/index.ts` içerisinde tanımlandı
   - Ana MCP API modülüne entegre edildi

2. **Frontend Bileşenlerinin Güncellenmesi**
   - `StaffPage` bileşeni MCP API çağrılarını kullanacak şekilde güncellendi
   - `StaffTable` bileşeni MCP API ile çalışır hale getirildi
   - İlgili CRUD operasyonları MCP API üzerinden yapılacak şekilde değiştirildi

3. **API Yardımcı Fonksiyonları**
   - `/src/lib/mcp/staff/index.ts` dosyasında MCP API çağrıları için yardımcı fonksiyonlar oluşturuldu

4. **Eski API Kaldırıldı ve Yedeklendi**
   - `/src/app/api/staff` altındaki tüm API endpoint'leri kaldırıldı
   - Tüm dosyalar `/STAFF_API_BACKUP` altında yedeklendi

## MCP API Araçları

### Yeni Personel API'leri

```typescript
// Personel listeleme
get-staff

// Personel detayı getirme
get-staff-by-id

// Yeni personel oluşturma
create-staff

// Personel güncelleme
update-staff

// Personel silme
delete-staff

// Personel izinlerini güncelleme
update-staff-permissions
```

## Önemli Değişiklikler ve Dikkat Edilmesi Gerekenler

1. **API Yanıt Formatı**
   - REST API doğrudan verileri döndürürken, MCP API `{ success: true, data: ... }` formatında yanıt döndürür
   - Hata durumunda `{ success: false, error: ... }` formatında yanıt döndürür

2. **Hata İşleme**
   - Kullanıcı adı çakışmaları gibi özel hata durumları için custom error objeler kullanıldı
   - MCP API'den gelen hatalar için detaylı error handling eklendi

3. **Güvenlik Kontrolleri**
   - Zorunlu alan kontrolleri MCP API tarafında güçlendirildi
   - Veri formatlaması ve temizliği işlemleri MCP API tarafında yapılıyor

## MCP API Kullanım Örnekleri

### Personel Listeleme

```typescript
import { getStaff } from '@/lib/mcp/staff';

// Tüm personeli getir
const staff = await getStaff();
```

### Personel Detayı Getirme

```typescript
import { getStaffById } from '@/lib/mcp/staff';

// ID'ye göre personel detaylarını getir
const staff = await getStaffById('staff-id');
```

### Yeni Personel Oluşturma

```typescript
import { createStaff } from '@/lib/mcp/staff';

// Yeni personel oluştur
const newStaff = await createStaff({
  username: 'ahmet',
  password: 'guvenli_sifre',
  name: 'Ahmet Yılmaz',
  phone: '5321234567',
  email: 'ahmet@example.com',
  accountType: 'STAFF'
});
```

### Personel Güncelleme

```typescript
import { updateStaff } from '@/lib/mcp/staff';

// Personel bilgilerini güncelle
const updatedStaff = await updateStaff('staff-id', {
  name: 'Ahmet Yılmaz',
  phone: '5321234567',
  email: 'ahmet.yilmaz@example.com',
  serviceGender: 'UNISEX',
  services: ['service-id-1', 'service-id-2']
});
```

### Personel Silme

```typescript
import { deleteStaff } from '@/lib/mcp/staff';

// Personel sil (soft delete)
await deleteStaff('staff-id');
```

### Personel İzinlerini Güncelleme

```typescript
import { updateStaffPermissions } from '@/lib/mcp/staff';

// Personel izinlerini güncelle
await updateStaffPermissions('staff-id', ['VIEW_APPOINTMENTS', 'EDIT_APPOINTMENTS']);
```

## Yedeklenen Dosyalar

Eski API kodları `/STAFF_API_BACKUP` altında yedeklenmiştir. Herhangi bir sorun durumunda bu dosyalara başvurulabilir.

## Yapılacak İlave İşlemler ve İyileştirmeler

1. **Performans İzleme**
   - MCP API performansı ve hata oranları izlenmelidir
   - Gerekirse optimizasyonlar yapılmalıdır

2. **Ekstra Fonksiyonlar**
   - PermissionsModal bileşeninin MCP API ile güncellenmesi tamamlanabilir
   - Çalışma saatleri için özel MCP API araçları eklenebilir

3. **Test ve Doğrulama**
   - Tüm fonksiyonlar kapsamlı şekilde test edilmelidir
   - Edge case'ler ve hata senaryoları ele alınmalıdır

## Genel API Mimarisi

Geçiş süreciyle oluşan genel mimari şu şekildedir:

1. **Frontend Bileşenleri**: MCP API yardımcı fonksiyonlarını kullanır
2. **MCP API Yardımcı Fonksiyonları**: Frontend ile MCP araçları arasında bir sarmalayıcı (wrapper) görevi görür
3. **MCP API Araçları**: Veritabanı işlemlerini gerçekleştirir ve standart yanıt formatında sonuçları döndürür
4. **MCP API Controller**: Tüm MCP API isteklerini işler ve uygun araçları çağırır

Bu katmanlı mimari, kodun daha modüler olmasını ve bakımının kolaylaşmasını sağlar.
