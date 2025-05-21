# Çalışma Saatleri Modülü MCP Migrasyonu Özeti

Bu doküman, Çalışma Saatleri (Working Hours) modülünün merkezi API yapısına geçiş sürecini özetlemektedir.

## 1. Yapılan Değişiklikler

### A. Veritabanı Servis Katmanı

* `/src/lib/working-hours-service/index.ts` dosyası oluşturuldu
* Çalışma saatleriyle ilgili tüm veritabanı işlemleri bu dosyaya taşındı:
  * `getWorkingHoursFromDb()`: Tüm çalışma saatlerini getirme
  * `getWorkingHoursByStaffFromDb()`: Personele göre çalışma saatlerini getirme
  * `getWorkingHourByIdFromDb()`: ID'ye göre çalışma saati detayı getirme
  * `createWorkingHourInDb()`: Yeni çalışma saati oluşturma
  * `updateWorkingHourInDb()`: Çalışma saatini güncelleme
  * `deleteWorkingHourFromDb()`: Çalışma saatini silme
  * `getBusinessHoursFromDb()`: İşletme çalışma saatlerini getirme
  * `getWorkingHourExceptionsFromDb()`: Çalışma saati istisnalarını getirme
  * `createWorkingHourExceptionInDb()`: İstisna oluşturma
  * `updateWorkingHourExceptionInDb()`: İstisna güncelleme
  * `deleteWorkingHourExceptionFromDb()`: İstisna silme

### B. MCP API Güncellemesi

* `/src/app/api/mcp/route.ts` dosyası güncellendi
* Çalışma saatleriyle ilgili handler'lar doğrudan veritabanı servislerini kullanacak şekilde değiştirildi:
  * `get-working-hours`: Tüm çalışma saatlerini getirme
  * `get-working-hours-by-staff`: Personele göre çalışma saatlerini getirme
  * `get-working-hour-by-id`: ID'ye göre çalışma saati detayı getirme
  * `create-working-hour`: Yeni çalışma saati oluşturma
  * `update-working-hour`: Çalışma saatini güncelleme
  * `delete-working-hour`: Çalışma saatini silme
  * `get-business-hours-details`: İşletme çalışma saatlerini getirme
  * `get-working-hour-exceptions`: Çalışma saati istisnalarını getirme
  * `create-working-hour-exception`: İstisna oluşturma
  * `update-working-hour-exception`: İstisna güncelleme
  * `delete-working-hour-exception`: İstisna silme

### C. API Route Güncellemesi

* `/src/app/api/working-hours/route.ts` dosyası güncellendi
* API route handler artık istemci tarafı callMcpApi kullanmak yerine doğrudan sunucu tarafı servisleri çağırıyor

### D. İstemci Tarafı Hook

* `/src/hooks/useWorkingHours.ts` dosyası oluşturuldu
* Bileşenlerin çalışma saatlerine erişimi için modern bir hook sağlıyor
* Hem merkezi ApiService hem de gerekli state yönetimi yetenekleri sunuyor

### E. API Service Güncellemesi

* `/src/services/api/apiService.ts` dosyasında `workingHours` modülü tamamen merkezi mimariye uygun şekilde güncellendi
* Yeni API endpoint'leri için çağrı fonksiyonları eklendi

### F. Örnek UI Bileşenleri

* `/src/components/working-hours/WorkingHoursManager.tsx` örnek bileşen oluşturuldu
* `/src/app/calisma-saatleri/page.tsx` örnek sayfa oluşturuldu

## 2. Mimari Değişiklikler

Bu refactoring çalışması ile merkezi API sistemine uygun bir mimari oluşturuldu:

1. İstemci Tarafı:
   * Bileşenler → useWorkingHours Hook → ApiService → callMcpApi → /api/mcapi endpoint
   
2. Sunucu Tarafı:
   * /api/mcapi → /api/mcp → Veritabanı Servisleri → Veritabanı İşlemleri
   
3. API Routes:
   * API route'lar artık doğrudan veritabanı servislerini çağırıyor
   * İstemci tarafı callMcpApi kullanmak yerine proper sunucu tarafı işlemleri yapılıyor

## 3. Mimari Avantajlar

Yapılan değişiklikler aşağıdaki avantajları sağlıyor:

* **Istemci/Sunucu Sınırı**: Net bir şekilde korunmuş oluyor
* **Merkezi Yapı**: Tüm API çağrıları tek bir merkezden yönetiliyor
* **Tip Güvenliği**: TypeScript ile uyumlu ve tip kontrolleri var
* **Hata Yönetimi**: Tutarlı hata işleme ve raporlama
* **Modülerlik**: İşlemler mantıksal bölümlere ayrılmış
* **Bakım Kolaylığı**: Herhangi bir sorun kolayca izlenebilir ve çözülebilir
* **Tekrar Kullanılabilirlik**: Aynı veritabanı servisleri farklı endpoint'lerden çağrılabilir

## 4. Kullanım Örnekleri

### İstemci Tarafında useWorkingHours Hook Kullanımı

```jsx
'use client';

import { useWorkingHours } from '@/hooks/useWorkingHours';

export default function WorkingHoursList() {
  const { 
    workingHours, 
    loading, 
    error, 
    fetchWorkingHours 
  } = useWorkingHours();
  
  useEffect(() => {
    // Çalışma saatlerini getir
    fetchWorkingHours();
  }, [fetchWorkingHours]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return (
    <div>
      <h1>Çalışma Saatleri</h1>
      <ul>
        {workingHours.map(hour => (
          <li key={hour.id}>
            {daysOfWeek[hour.dayOfWeek]}: {hour.startTime} - {hour.endTime}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Doğrudan API Service Kullanımı

```jsx
'use client';

import { useEffect, useState } from 'react';
import { ApiService } from '@/services/api';

export default function StaffWorkingHours({ staffId }) {
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadWorkingHours() {
      try {
        const result = await ApiService.workingHours.getByStaff(staffId);
        
        if (result.success) {
          setWorkingHours(result.data.staffWorkingHours || []);
        } else {
          console.error('Çalışma saatleri yüklenemedi:', result.error);
        }
      } catch (error) {
        console.error('Hata:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadWorkingHours();
  }, [staffId]);
  
  // ...
}
```

## 5. Yapılan Temizleme İşlemleri

Geçiş sürecinde, eski versiyondaki kodlar temizlendi ve yeni versiyona yönlendirildi:

1. **Eski Fonksiyonlar İçin Yönlendirmeler**:
   - `/src/lib/staff-service` modülündeki `validateWorkingHoursFromDb` fonksiyonu, yeni `working-hours-service` modülündeki eşdeğerine yönlendirildi ve `@deprecated` olarak işaretlendi
   - `mcpTools` içindeki `validateWorkingHours` fonksiyonu da yeni servise yönlendirildi
   - ApiService içindeki `workingHours.checkStaffSchedule` fonksiyonu güncellenerek yeni API çağrısına yönlendirildi

2. **Eski API Endpoint Güncellemesi**:
   - `/src/app/api/working-hours/route.ts` dosyası güncellenerek, artık merkezi API mimarisini kullandığı belirtildi

3. **MCP Tool Tanımlamaları**:
   - `mcpToolDescriptions` array'ine yeni Working Hours modülü için tüm ilgili tool tanımlamaları eklendi

4. **Uyarı Mesajları**:
   - Eski yöntemlerin içine log mesajları eklenerek, kullanıcıların yeni servisi kullanmaları konusunda uyarılması sağlandı

## 6. Eski Versiyon -> Yeni Versiyon Kullanım Rehberi

Eğer eski versiyonu kullanıyorsak, aşağıdaki değişiklikleri yapmak gerekir:

| Eski Versiyon | Yeni Versiyon |
|---------------|---------------|
| `import { validateWorkingHoursFromDb } from '@/lib/staff-service'` | `import { validateWorkingHoursFromDb } from '@/lib/working-hours-service'` |
| `callMcpApi('get-staff-schedule', { staffId, date })` | `callMcpApi('get-working-hours-by-staff', { staffId, date })` |
| `ApiService.workingHours.checkStaffSchedule(staffId, date)` | `ApiService.workingHours.getByStaff(staffId, date)` |

## 7. Gelecek İyileştirmeler

1. Çalışma saatlerini takvim görünümünde göstermek için entegrasyonlar
2. İstisnalar için daha gelişmiş kullanıcı arayüzü
3. Tatiller için toplu eklemeler ve şablonlar
4. İşletme ve personel çalışma saatleri arasında çakışma kontrolü
5. Çalışma saati değişikliklerini takip edecek log sistemi
6. **Eski versiyondan kalan yönlendirme kodlarının tamamen kaldırılması** (gelecek sürümde)
