# Personel (Staff) Modülünün Merkezi API Yapısına Geçişi v1.1

## 1. Yapılan Değişiklikler

### A. Veritabanı Servis Katmanı
* `/src/lib/staff-service/index.ts` dosyası oluşturuldu
* Personelle ilgili tüm veritabanı işlemleri bu dosyaya taşındı:
  * `getStaffFromDb()`: Tüm personel listesini getirme
  * `getStaffByIdFromDb()`: ID'ye göre personel detayı getirme
  * `createStaffInDb()`: Yeni personel oluşturma
  * `updateStaffInDb()`: Personel bilgilerini güncelleme
  * `deleteStaffFromDb()`: Personel silme (soft delete)
  * `updateStaffPermissionsInDb()`: Personel izinlerini güncelleme
  * `getStaffScheduleFromDb()`: Personel çalışma saatlerini getirme
  * `getStaffAvailabilityFromDb()`: Personel uygunluk durumunu getirme
  * `validateWorkingHoursFromDb()`: Çalışma saatlerini doğrulama

### B. MCP API Güncellemesi
* `/src/app/api/mcp/route.ts` dosyası güncellendi
* Personelle ilgili handler'lar doğrudan veritabanı servislerini kullanacak şekilde değiştirildi
* Eski mcpTools yöntemleri yerine import ile servis fonksiyonları çağrılıyor
* Başarı/hata durumlarına göre uygun HTTP durum kodları döndürülüyor

### C. API Route Güncellemesi
* `/src/app/api/staff/route.ts` dosyası güncellendi
* `/src/app/api/staff/[id]/route.ts` dosyası oluşturuldu
* `/src/app/api/staff/[id]/permissions/route.ts` dosyası oluşturuldu
* API route handler'lar artık doğrudan veritabanı işlemleri yerine MCP API üzerinden istek yapıyor

### D. İstemci Tarafı Hook Eklenmesi
* `/src/hooks/useStaff.ts` dosyası oluşturuldu
* Bileşenlerin personel verilerine erişimi için modern bir hook sağlıyor
* Hem merkezi ApiService hem de doğrudan API endpoint'i çağırma yeteneği sunuyor

### E. ApiService Genişletilmesi
* `/src/services/api/apiService.ts` dosyasındaki staff modülü genişletildi
* Tüm personel işlemleri için yeni, daha kapsamlı metodlar eklendi
* Geriye uyumluluk için bazı metodlar korundu

## 2. Mimari Değişiklikler

Bu refactoring çalışması ile merkezi API sistemine uygun bir mimari oluşturuldu:

1. İstemci Tarafı:
   * Bileşenler → useStaff Hook → ApiService → callMcpApi → /api/mcp endpoint

2. Sunucu Tarafı:
   * /api/mcp → Veritabanı Servisleri → Veritabanı İşlemleri

3. API Routes:
   * API route'lar artık veritabanını doğrudan kullanmak yerine MCP API'yi çağırıyor
   * İstemci/sunucu sınırı net olarak korunuyor

## 3. Mimari Avantajlar

Yapılan değişiklikler aşağıdaki avantajları sağlıyor:

* **İstemci/Sunucu Sınırı**: Net bir şekilde korunmuş oluyor
* **Merkezi Yapı**: Tüm API çağrıları tek bir merkezden yönetiliyor
* **Tip Güvenliği**: TypeScript ile uyumlu ve tip kontrolleri var
* **Hata Yönetimi**: Tutarlı hata işleme ve raporlama
* **Modülerlik**: İşlemler mantıksal bölümlere ayrılmış
* **Bakım Kolaylığı**: Herhangi bir sorun kolayca izlenebilir ve çözülebilir
* **Tekrar Kullanılabilirlik**: Aynı veritabanı servisleri farklı endpoint'lerden çağrılabilir

## 4. Kullanım Örnekleri

### İstemci Tarafında Kullanım

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useStaff } from '@/hooks/useStaff';

export default function StaffList() {
  const { staff, loading, error, fetchStaff } = useStaff();
  
  useEffect(() => {
    // Personel listesini getir
    fetchStaff(true); // Aktif olmayan personeli de dahil et
  }, [fetchStaff]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return (
    <div>
      <h1>Personel Listesi</h1>
      <ul>
        {staff.map(member => (
          <li key={member.id}>
            {member.name} - {member.position || 'Pozisyon belirtilmemiş'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Doğrudan API Service Kullanımı

```tsx
'use client';
import { useEffect, useState } from 'react';
import { ApiService } from '@/services/api';

export default function StaffDetails({ staffId }) {
  const [staffMember, setStaffMember] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadStaffDetails() {
      try {
        const result = await ApiService.staff.getById(staffId);
        
        if (result.success) {
          setStaffMember(result.data);
        } else {
          console.error('Personel detayı yüklenemedi:', result.error);
        }
      } catch (error) {
        console.error('Hata:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadStaffDetails();
  }, [staffId]);
  
  // ...
}
```

## 5. Sonraki Adımlar

1. Diğer eksik modülleri de benzer şekilde merkezi yapıya geçirmek (Services, Packages, vb.)
2. Önbelleğe alma mekanizmaları eklemek
3. API sonuçları için özel tip tanımlamaları geliştirmek
4. Ortak veri dönüşüm fonksiyonları oluşturmak
5. Birim testleri eklemek

## 6. Geçiş Süreci Güncellemesi (v1.1)

* Eski `staffTools` içeriği tamamen kaldırıldı
* Geriye uyumluluk için eski dosya yapısı korundu ancak içerik yeniden yönlendirmeler ile güncellendi
* Tüm MCP Staff araçları merkezi servis katmanına doğru yönlendiriliyor
* Import ifadeleri güncellendi

Bu sayede, var olan bütün kodların işlevini koruyarak, iç çalışma mekaniği tamamen merkezi API yapısına geçirildi. Böylece gelecekteki güncellemeler daha kolay ve tutarlı şekilde yapılabilecek.