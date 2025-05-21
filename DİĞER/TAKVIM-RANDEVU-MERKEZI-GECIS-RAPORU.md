# Randevular (Appointments) Modülü Merkezi API Yapısına Geçiş Raporu

Bu rapor, Randevular (Appointments) modülünün merkezi API yapısına geçiş sürecini ve yapılan değişiklikleri belgelemektedir.

## 1. Yapılan Değişiklikler

### A. Veritabanı Servis Katmanı (TypeScript)

* `/src/lib/appointment-service/index.ts` dosyası TypeScript formatında yeniden yazıldı
* Randevularla ilgili tüm veritabanı işlemleri bu dosyaya taşındı:
  * `getAppointmentByIdFromDb()`: ID'ye göre randevu detayı getirme
  * `createAppointmentInDb()`: Yeni randevu oluşturma
  * `updateAppointmentInDb()`: Randevu güncelleme
  * `deleteAppointmentFromDb()`: Randevu silme
  * `updateAppointmentStatusInDb()`: Randevu durumunu güncelleme
  * `getCalendarDataFromDb()`: Takvim verilerini getirme (personel ve randevular)
  * `getCustomerAppointmentsFromDb()`: Müşterinin randevularını getirme
  * `checkStaffAvailabilityFromDb()`: Personel uygunluğunu kontrol etme
  * `updateAppointmentDragFromDb()`: Randevu taşıma (drag-drop)
  * `getBusinessHoursFromDb()`: İşletme çalışma saatlerini getirme
  * `getAppointmentsFromDb()`: Filtrelerle randevu listesini getirme

### B. İstemci Tarafı Hook

* `/src/hooks/useAppointments.ts` dosyası oluşturuldu
* Bileşenlerin randevulara erişimi için modern bir hook sağlandı
* Şu fonksiyonlar eklendi:
  * `fetchAppointments()`: Randevu listesini getirme
  * `fetchCalendarData()`: Takvim verilerini getirme
  * `fetchAppointmentById()`: ID'ye göre randevu detayını getirme
  * `createAppointment()`: Yeni randevu oluşturma
  * `updateAppointment()`: Randevu güncelleme
  * `deleteAppointment()`: Randevu silme
  * `updateAppointmentStatus()`: Randevu durumunu güncelleme
  * `checkStaffAvailability()`: Personel uygunluğunu kontrol etme
  * `updateAppointmentDrag()`: Randevu taşıma
  * `getBusinessHours()`: İşletme çalışma saatlerini getirme
  * `getCustomerAppointments()`: Müşterinin randevularını getirme

### C. MCP API Güncellemesi

* `/src/app/api/mcp/route.ts` içindeki randevu işlemleri servis fonksiyonlarını kullanacak şekilde düzenlendi
* Randevu ilgili MCP handler'lar ile veritabanı servisleri arasındaki bağlantı kuruldu

### D. API Route Güncellemesi

* `/src/app/api/appointments/route.ts` güncellendi
* `/src/app/api/appointments/[id]/route.ts` güncellendi
* API route handler artık istemci tarafı callMcpApi kullanmak yerine doğrudan sunucu tarafı veritabanı servislerini çağırıyor

### E. Merkezi API Servis (ApiService) Güncellemesi

* `/src/services/api/apiService.ts` içindeki `appointments` nesnesi yeni yapıya uygun olarak güncellendi
* Eksik metodlar eklendi ve mevcut metodlar güncellendi

## 2. Mimari Değişiklikler

Bu refactoring çalışması ile merkezi API sistemine uygun bir mimari oluşturuldu:

1. İstemci Tarafı:
   * Bileşenler → `useAppointments` hook → ApiService → callMcpApi → /api/mcp endpoint

2. Sunucu Tarafı:
   * /api/mcp → Veritabanı Servisleri → Veritabanı İşlemleri
   * /api/appointments → Veritabanı Servisleri → Veritabanı İşlemleri

## 3. Mimari Avantajlar

Yapılan değişiklikler aşağıdaki avantajları sağlamaktadır:

* **Istemci/Sunucu Sınırı**: Net bir şekilde korunmuş oluyor
* **Merkezi Yapı**: Tüm API çağrıları tek bir merkezden yönetiliyor
* **Tip Güvenliği**: TypeScript ile tam tip kontrolü sağlanıyor
* **Hata Yönetimi**: Tutarlı hata işleme ve raporlama
* **Modülerlik**: İşlemler mantıksal bölümlere ayrılmış
* **Bakım Kolaylığı**: Herhangi bir sorun kolayca izlenebilir ve çözülebilir
* **Tekrar Kullanılabilirlik**: Aynı veritabanı servisleri farklı endpoint'lerden çağrılabilir

## 4. Kullanım Örnekleri

### İstemci Tarafı Hook Kullanımı

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useAppointments } from '@/hooks/useAppointments';

export default function AppointmentList() {
  const { 
    appointments, 
    loading, 
    error, 
    fetchAppointments 
  } = useAppointments();
  
  useEffect(() => {
    // Randevuları getir
    fetchAppointments({
      startDate: '2025-01-01',
      endDate: '2025-03-31'
    });
  }, [fetchAppointments]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return (
    <div>
      <h1>Randevular</h1>
      <ul>
        {appointments.map(appointment => (
          <li key={appointment.id}>
            {appointment.customer?.name} - {appointment.service?.name} - {new Date(appointment.start).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Takvim Verileri Alma

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import Calendar from '@/components/Calendar';

export default function AppointmentCalendar() {
  const { 
    calendarData, 
    loading, 
    error, 
    fetchCalendarData 
  } = useAppointments();
  
  useEffect(() => {
    // Takvim verilerini getir
    fetchCalendarData({
      startDate: '2025-03-01',
      endDate: '2025-03-31'
    });
  }, [fetchCalendarData]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return (
    <div>
      <h1>Randevu Takvimi</h1>
      <Calendar 
        staff={calendarData.staff} 
        appointments={calendarData.appointments} 
      />
    </div>
  );
}
```

### Randevu Oluşturma

```typescript
'use client';
import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    customerId: '',
    staffId: '',
    serviceId: '',
    startTime: '',
    notes: ''
  });
  
  const { 
    createAppointment, 
    loading, 
    error 
  } = useAppointments();
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const result = await createAppointment(formData);
    
    if (result.success) {
      alert('Randevu başarıyla oluşturuldu!');
      // Form temizleme veya yönlendirme
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form alanları */}
      <button type="submit" disabled={loading}>
        {loading ? 'Kaydediliyor...' : 'Randevu Oluştur'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## 5. Sonraki Adımlar

Bu modülün merkezi API yapısına geçişi tamamlanmış olup, bir sonraki adımları şu şekilde önerebiliriz:

1. Diğer modüllerin de aynı mimari yapıya geçirilmesi (örneğin, Staff, Services, Customers, vb.)
2. Eksiksiz tip tanımlamalarının tüm servislere eklenmesi
3. Önbelleğe alma (caching) mekanizmalarının eklenmesi
4. Veri doğrulama (validation) ve dönüşüm (transformation) katmanlarının geliştirilmesi
5. Birim testlerinin eklenmesi

## 6. Kapanış

Bu çalışma sonucunda Randevular modülü modern, tip güvenli ve bakımı kolay bir API mimarisine kavuşturulmuştur. Bu yapı, geliştirme sürecini hızlandıracak ve hata ayıklamayı kolaylaştıracaktır.
