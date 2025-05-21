# Merkezi API Yapısına Geçiş: Hizmetler Modülü

Bu dokümantasyon, Hizmetler (Services) modülünün merkezi API yapısına geçişini açıklar. Bu geçiş ile birlikte istemci-sunucu sınırı korunmuş, veritabanı işlemleri merkezi bir servis katmanına taşınmış ve API yapısı standardize edilmiştir.

## 1. Yapılan Değişiklikler

### A. Veritabanı Servis Katmanı

* `/src/lib/service-service/index.ts` dosyası oluşturuldu
* Hizmetlerle ilgili tüm veritabanı işlemleri bu dosyaya taşındı:
  * `getServicesFromDb()`: Tüm hizmetleri getirme
  * `getServiceByIdFromDb()`: ID'ye göre hizmet detayı getirme
  * `createServiceInDb()`: Yeni hizmet oluşturma
  * `updateServiceInDb()`: Hizmet güncelleme
  * `deleteServiceFromDb()`: Hizmet silme (soft delete)
  * `getServiceCategoriesFromDb()`: Tüm hizmet kategorilerini getirme
  * `getServiceCategoryByIdFromDb()`: ID'ye göre kategori detayı getirme
  * `createServiceCategoryInDb()`: Yeni kategori oluşturma
  * `updateServiceCategoryInDb()`: Kategori güncelleme
  * `deleteServiceCategoryFromDb()`: Kategori silme
  * `getServicesByCategoryFromDb()`: Kategori ID'sine göre hizmetleri getirme

### B. MCP API Güncellemesi

* `/src/app/api/mcp/route.ts` dosyası güncellendi
* Hizmetlerle ilgili tüm handler'lar doğrudan veritabanı servislerini kullanacak şekilde değiştirildi
* Eski mcpTools yöntemleri yerine, servis fonksiyonları kullanılıyor
* Başarı/hata durumlarına göre uygun HTTP durum kodları döndürülüyor

### C. API Route Güncellemesi

Aşağıdaki API route'lar oluşturuldu veya güncellendi:

* `/src/app/api/service-categories/route.ts`: Kategori listesi ve oluşturma
* `/src/app/api/service-categories/[id]/route.ts`: Kategori okuma, güncelleme ve silme
* `/src/app/api/service-categories/[id]/services/route.ts`: Kategori ID'sine göre hizmetleri listeleme
* `/src/app/api/services/route.ts`: Hizmet listesi ve oluşturma
* `/src/app/api/services/[id]/route.ts`: Hizmet okuma, güncelleme ve silme

### D. İstemci Tarafı Hook

* `/src/hooks/useServices.ts` dosyası oluşturuldu
* React bileşenlerinin hizmetlere erişimi için modern bir hook sağlıyor
* Merkezi ApiService kullanarak veri alış-verişi yapıyor

## 2. Mimari Değişiklikler

Bu refactoring çalışması ile merkezi API sistemine uygun bir mimari oluşturuldu:

1. İstemci Tarafı:
   * Bileşenler → useServices hook → ApiService → callMcpApi → /api/mcapi endpoint
2. Sunucu Tarafı:
   * /api/mcapi → /api/mcp → Veritabanı Servisleri → Veritabanı İşlemleri
3. API Routes:
   * API route'lar artık doğrudan veritabanı servislerini çağırıyor
   * İstemci ve sunucu tarafı arasındaki sınır net bir şekilde korunuyor

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
import { useServices } from '@/hooks/useServices';

export default function ServicesList() {
  const { 
    services, 
    loading, 
    error, 
    fetchServices 
  } = useServices();
  
  useEffect(() => {
    // Aktif hizmetleri getir
    fetchServices({
      isActive: true
    });
  }, [fetchServices]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return (
    <div>
      <h1>Hizmetler</h1>
      <ul>
        {services.map(service => (
          <li key={service.id}>
            {service.name} - {service.price}₺ - {service.duration} dk
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

export default function CategoryServices({ categoryId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadServices() {
      try {
        const result = await ApiService.services.getByCategory(categoryId);
        
        if (result.success) {
          setServices(result.data);
        } else {
          console.error('Hizmetler yüklenemedi:', result.error);
        }
      } catch (error) {
        console.error('Hata:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadServices();
  }, [categoryId]);
  
  // ...
}
```

## 5. Sonraki Adımlar

1. Hizmetleri kategorilere göre filtreleme özelliğinin geliştirilmesi
2. Hizmet fiyat geçmişi takibi ve raporlaması
3. Birlikte satılan hizmetler için paket oluşturma desteği
4. Arama ve filtreleme performansının iyileştirilmesi
5. Hizmet bazlı kaynakların yönetimi (örn. personel, malzeme, vb.)
