# Personel Çalışma Saatlerinin Takvime Entegrasyonu - README

Bu doküman, personel çalışma saatlerinin takvim sistemine doğru şekilde entegrasyonunu sağlayan kodları ve yaklaşımı açıklar. Bu README'yi kullanarak, sistemi sıfırdan kurabilir ve personel çalışma saatlerinin takvimde doğru şekilde gösterilmesini sağlayabilirsiniz.

## İçindekiler

1. [Veri Yapısı](#1-veri-yapısı)
2. [API Entegrasyonu](#2-api-entegrasyonu)
3. [Format Dönüştürme Fonksiyonu](#3-format-dönüştürme-fonksiyonu)
4. [Takvim Bileşeni Entegrasyonu](#4-takvim-bileşeni-entegrasyonu)
5. [CSS Sınıfları](#5-css-sınıfları)
6. [Sorun Giderme](#6-sorun-giderme)

## 1. Veri Yapısı

### Veritabanı Şeması (Prisma)

```prisma
model Staff {
  id               String           @id @default(cuid())
  // ... diğer alanlar
  workingHours     Json[]           // Personel çalışma saatleri
  showInCalendar   Boolean          @default(true)
  // ... diğer alanlar
}
```

### Çalışma Saatleri Formatları

**Format 1 (Personel Düzenleme Formu - Dizi Formatı):**
```javascript
[
  { day: 1, isWorking: true, startTime: "09:00", endTime: "18:00" },  // Pazartesi
  { day: 2, isWorking: true, startTime: "09:00", endTime: "18:00" },  // Salı
  // ... diğer günler
]
```

**Format 2 (Takvim Bileşeni - Obje Formatı):**
```javascript
{
  monday: { enabled: true, start: "09:00", end: "18:00" },
  tuesday: { enabled: true, start: "09:00", end: "18:00" },
  // ... diğer günler
}
```

## 2. API Entegrasyonu

### Staff API Düzenlemesi (/api/staff/route.ts)

Personel verisi getirilirken workingHours alanının dahil edilmesi gerekir:

```javascript
// src/app/api/staff/route.ts dosyasındaki getStaff fonksiyonu
async function getStaff(req: NextRequest) {
  try {
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        // ... diğer alanlar
        serviceGender: true,
        showInCalendar: true,
        workingHours: true,  // Çalışma saatleri verisini getir
        services: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Staff fetch error:', error);
    return NextResponse.json(
      { error: 'Personel listesi alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
```

## 3. Format Dönüştürme Fonksiyonu

Personel düzenleme formunda kullanılan format ile takvim bileşeninde kullanılan format arasında dönüşüm sağlayan fonksiyon:

```typescript
// src/components/Calendar/CalendarClient.tsx dosyasına eklenecek
// Çalışma saatleri formatını dönüştüren yardımcı fonksiyon
const convertWorkingHoursFormat = (staff: Staff[]) => {
  return staff.map(s => {
    console.log(`${s.name} için çalışma saati formatı:`, s.workingHours ? typeof s.workingHours : 'Yok');
    
    // Çalışma saatleri yoksa boş bırak
    if (!s.workingHours) {
      console.log(`${s.name} için çalışma saati verisi bulunamadı. Boş bırakılıyor.`);
      return s;
    }
    
    // Dizi formatında ise (yeni format), eski formata dönüştür
    if (Array.isArray(s.workingHours)) {
      console.log(`${s.name} için çalışma saatleri dizisi:`, s.workingHours);
      const oldFormat: any = {};
      const dayMapping: {[key: number]: string} = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday'
      };
      
      // Yeni format dizisini döngüye sok
      s.workingHours.forEach((dayData: any) => {
        const dayKey = dayData.day !== undefined ? dayData.day : 
                      (dayData.dayOfWeek !== undefined ? dayData.dayOfWeek : null);
                      
        if (dayKey === null) {
          console.log(`${s.name} için geçersiz gün verisi:`, dayData);
          return;
        }
        
        const dayName = typeof dayKey === 'number' ? dayMapping[dayKey] : dayKey;
        if (dayName) {
          oldFormat[dayName] = {
            enabled: dayData.isWorking || dayData.isWorkingDay || false,
            start: dayData.startTime || '09:00',
            end: dayData.endTime || '19:00'
          };
        }
      });
      
      // Tüm günlerin tanımlandığından emin ol
      Object.keys(dayMapping).forEach(dayIndex => {
        const dayName = dayMapping[Number(dayIndex)];
        if (!oldFormat[dayName]) {
          oldFormat[dayName] = {
            enabled: false,
            start: '09:00',
            end: '19:00'
          };
        }
      });
      
      console.log(`[Format Dönüştürme] ${s.name} için çalışma saatleri dönüştürüldü:`, oldFormat);
      return {...s, workingHours: oldFormat};
    }
    
    // JSON string olarak geliyorsa parse et
    if (typeof s.workingHours === 'string') {
      try {
        const parsed = JSON.parse(s.workingHours);
        console.log(`${s.name} için string olarak gelen çalışma saatleri parse edildi:`, parsed);
        return {...s, workingHours: parsed};
      } catch (e) {
        console.error(`${s.name} için çalışma saatleri parse edilemedi:`, e);
      }
    }
    
    // Zaten doğru formatta ise olduğu gibi döndür
    console.log(`${s.name} için çalışma saatleri zaten uygun formatta:`, s.workingHours);
    return s;
  });
};
```

## 4. Takvim Bileşeni Entegrasyonu

### Tipler (src/types/appointment.ts)

```typescript
export interface Staff {
  id: string;
  name: string;
  phone: string
  workingHours: any; // Hem dizi hem de obje formatını desteklemek için any
  showInCalendar: boolean;
  // ... diğer özellikler
}
```

### API'den Veri Çekme (CalendarClient.tsx)

```typescript
const fetchCalendarData = useCallback(async () => {
  try {
    // ... diğer kodlar
    
    const [staffRes, appointmentsRes] = await Promise.all([
      fetch('/api/staff'),
      fetch('/api/appointments?view=calendar')
    ]);

    if (!staffRes.ok || !appointmentsRes.ok) throw new Error('Veri yüklenirken hata oluştu');

    const [staffData, appointmentsData] = await Promise.all([staffRes.json(), appointmentsRes.json()]);
    console.log('Staff Data before conversion:', staffData);
    
    // Çalışma saatleri formatını dönüştür
    const formattedStaff = convertWorkingHoursFormat(staffData);
    console.log('Staff Data after conversion:', formattedStaff);
    
    // Dönüştürülmüş personel verilerini kullan
    setStaff(prev => (isEqual(prev, formattedStaff) ? prev : formattedStaff));
    
    // ... diğer kodlar
  } catch (error) {
    console.error('Veri yüklenirken hata oluştu:', error);
    setError(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu');
  } finally {
    // ... diğer kodlar
  }
}, [showDetailModal, selectedEvent, businessHours]);
```

### Zaman Dilimi Sınıfının Güncellenmesi (TimeSlotWrapper)

```typescript
interface TimeSlotWrapperProps {
  children: React.ReactNode;
  resource?: string | number;
  value: Date;
  staff: Staff[];
  businessHours: Record<string, { enabled: boolean; start: string; end: string }>;
}

const TimeSlotWrapper = ({ children, resource, value, staff, businessHours }: TimeSlotWrapperProps) => {
  console.log('TimeSlotWrapper called for time:', moment(value).format('YYYY-MM-DD HH:mm'), 'resource:', resource);
  
  // İlgili staff member'ı bul (resource ID ile)
  const staffMember = staff.find(s => s.id === resource?.toString());
  const slotTime = moment(value);
  const day = dayNames[slotTime.day()];
  const dayOfWeek = slotTime.day(); // Sayısal gün değeri (0-6)
  const dayStart = slotTime.clone().startOf('day');

  // İşletme saatleri kontrolü
  const dayHours = businessHours?.[day];
  const businessStart = dayHours?.start ? dayStart.clone().add(moment.duration(dayHours.start)) : null;
  const businessEnd = dayHours?.end ? dayStart.clone().add(moment.duration(dayHours.end)) : null;
  const isBusinessOpen = dayHours?.enabled && businessStart && businessEnd && slotTime.isBetween(businessStart, businessEnd, null, '[)');

  // Önemli: Varsayılan olarak staff çalışmıyor kabul edilir
  let isStaffWorking = false; 
  
  // Personel ve çalışma saatleri bilgisi var mı?
  if (staffMember) {
    console.log(`Checking working hours for ${staffMember.name} at ${moment(value).format('YYYY-MM-DD HH:mm')}`);
    
    // Working hours bilgisini kontrol et
    if (staffMember.workingHours) {
      // workingHours bir obje ise (dönüştürülmüş format)
      if (typeof staffMember.workingHours === 'object' && !Array.isArray(staffMember.workingHours)) {
        const staffDayHours = staffMember.workingHours[day];
        
        if (staffDayHours) {
          // enabled değeri false ise personel çalışmıyor
          if (staffDayHours.enabled === false) {
            isStaffWorking = false;
          } else {
            const staffStart = staffDayHours.start ? 
              dayStart.clone().add(moment.duration(staffDayHours.start)) : null;
            const staffEnd = staffDayHours.end ? 
              dayStart.clone().add(moment.duration(staffDayHours.end)) : null;
            
            if (staffStart && staffEnd) {
              isStaffWorking = slotTime.isBetween(staffStart, staffEnd, undefined, '[)');
            } else {
              // Başlangıç veya bitiş saati yoksa işletme saatinde çalışıyor kabul et
              isStaffWorking = isBusinessOpen;
            }
          }
        } else {
          // O gün için bilgi yoksa, işletme açıksa çalışıyor kabul et
          isStaffWorking = isBusinessOpen;
        }
      } else {
        // Working hours formatı bilinmiyorsa, işletme açıksa çalışıyor kabul et
        isStaffWorking = isBusinessOpen;
      }
    } else {
      // Working hours bilgisi yoksa, işletme açıksa çalışıyor kabul et
      isStaffWorking = isBusinessOpen;
    }
  } else {
    // Staff member yoksa, bu hücre için çalışma saati kontrolü yapma
    isStaffWorking = true; // Genel bir alan ise normal görüntülensin
  }

  // CSS sınıfını belirle
  let className = '';
  if (!isBusinessOpen) {
    className = 'non-working-hours';
  } else if (!isStaffWorking) {
    className = 'staff-non-working';
  } else {
    className = 'working-hours';
  }

  // Takvim hücresinin son durumunu özetleyen log
  console.log(`TAKVIM HÜCRESI: Personel: ${staffMember?.name || 'Yok'}, Tarih: ${slotTime.format('YYYY-MM-DD')}, Saat: ${slotTime.format('HH:mm')}, İşletme Açık mı: ${isBusinessOpen ? 'Evet' : 'Hayır'}, Personel Çalışıyor mu: ${isStaffWorking ? 'Evet' : 'Hayır'}, Sınıf: ${className}`);

  return (
    <div className={`rbc-time-slot ${className}`}>
      {children}
    </div>
  );
};
```

## 5. CSS Sınıfları

Takvimde farklı durumlar için CSS sınıflarını ekleyin (@/styles/calendar.css):

```css
/* Çalışma saatleri için CSS sınıfları */
.working-hours {
  background-color: #ffffff;
}

.non-working-hours {
  background-color: #f0f0f0;
  opacity: 0.7;
  pointer-events: none;
}

.staff-non-working {
  background-color: #f9f9f9; 
  background-image: repeating-linear-gradient(45deg, #f0f0f0 0, #f0f0f0 5px, transparent 0, transparent 10px);
  pointer-events: none;
}
```

## 6. Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

1. **Sorun**: Personel çalışma saatleri API yanıtında gelmiyor.
   **Çözüm**: `/api/staff/route.ts` dosyasında `select` alanına `workingHours: true` eklediğinizden emin olun.

2. **Sorun**: Çalışma saatleri formatı dönüştürme hatası.
   **Çözüm**: Format dönüştürme fonksiyonunu kontrol edin, gelen veri formatını loglarla inceleyin ve gerekirse uyumlu hale getirin.

3. **Sorun**: Takvimde çalışma saatleri gösterilmiyor.
   **Çözüm**: TimeSlotWrapper bileşeninde staffMember.workingHours verisinin doğru şekilde işlendiğinden emin olun.

4. **Sorun**: Personel silme hatası.
   **Çözüm**: `/api/staff/[id]/route.ts` dosyasında DELETE metodunu hard delete yerine soft delete yapacak şekilde güncelleyin.

### Format Kontrolü

Takvim yüklendiğinde konsola detaylı loglar ekleyerek formatı kontrol edin:

```javascript
useEffect(() => {
  console.log('=== TAKVİM DURUMU ===');
  console.log(`Yüklenme durumu: ${loading ? 'Yükleniyor...' : 'Tamamlandı'}`);
  console.log(`İşletme saatleri yüklenme durumu: ${businessHoursLoading ? 'Yükleniyor...' : 'Tamamlandı'}`);
  console.log(`Toplam personel sayısı: ${staff.length}`);
  console.log(`Çalışma saati tanımlanmış personel sayısı: ${staff.filter(s => s.workingHours).length}`);
  
  if (staff.length > 0 && !loading) {
    console.log('=== PERSONEL ÇALIŞMA DURUMU ÖZETİ ===');
    staff.forEach(s => {
      console.log(`${s.name}: ${s.workingHours ? 'Çalışma saatleri tanımlı' : 'İşletme saatleri kullanılıyor'}`)
    });
  }
  
  console.log('===========================');
}, [loading, businessHoursLoading, businessHours, staff]);
```

Bu README belgesi, personel çalışma saatlerinin takvime başarılı bir şekilde entegrasyonu için gerekli tüm bilgileri içerir. Bu belgeyi takip ederek, sisteminizi sıfırdan kurabilir ve doğru şekilde çalışmasını sağlayabilirsiniz.