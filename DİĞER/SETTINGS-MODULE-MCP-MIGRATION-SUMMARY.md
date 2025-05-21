# Settings (Ayarlar) Modülü Merkezi API Yapısına Geçiş Raporu

Bu belge, işletme ayarları (settings) modülünün merkezi API yapısına geçişinin tamamlandığını belgelemektedir.

## 1. Yapılan Değişiklikler

### 1.1. Oluşturulan Dosyalar
- `/src/services/settingsService.ts` - Ön yüz için merkezi API ile iletişim kuran servis
- `/src/lib/settings-service.ts` - Sunucu tarafı veritabanı işlemleri için servis

### 1.2. Güncellenen Dosyalar
- `/src/app/api/mcp/route.ts` - MCP API'ye ayarlar endpoint'leri eklendi
- `/src/app/mcp-tools/index.ts` - Ayarlar modülü tanımlamaları eklendi
- `/src/app/api/settings/route.ts` - Merkezi API'yi kullanacak şekilde güncellendi
- `/src/app/api/settings/business-days/route.ts` - Merkezi API'yi kullanacak şekilde güncellendi
- `/src/components/Settings/BusinessHoursForm.tsx` - Eski API çağrıları yerine merkezi API servisini kullanacak şekilde güncellendi
- `/src/components/Settings/SystemSettingsForm.tsx` - Yeni sistem ayarları formu oluşturuldu
- `/src/app/(protected)/settings/page.tsx` - Tab yapısı ve iki form bileşeni eklendi

## 2. API Yapısı

### 2.1. Ön Yüz (Frontend) Servisleri
```typescript
settingsService.getBusinessDays() - İşletme çalışma günlerini getirir
settingsService.updateBusinessDays(data) - İşletme çalışma günlerini günceller
settingsService.getSystemSettings() - Sistem ayarlarını getirir
settingsService.updateSystemSettings(data) - Sistem ayarlarını günceller
```

### 2.2. Sunucu Tarafı (Backend) Servisleri
```typescript
getBusinessDaysFromDb() - Veritabanından çalışma günlerini getirir
updateBusinessDaysInDb(data) - Veritabanında çalışma günlerini günceller
getSystemSettingsFromDb() - Veritabanından sistem ayarlarını getirir
updateSystemSettingsInDb(data) - Veritabanında sistem ayarlarını günceller
```

### 2.3. MCP API Endpoint'leri
```
get-business-days - İşletme çalışma günlerini getir
update-business-days - İşletme çalışma günlerini güncelle
get-system-settings - Sistem ayarlarını getir
update-system-settings - Sistem ayarlarını güncelle
```

## 3. UI Bileşenleri
- `BusinessHoursForm` - İşletme çalışma günlerini ayarlamak için form bileşeni
- `SystemSettingsForm` - Genel sistem ayarlarını yapmak için form bileşeni

## 4. Not

Ayarlar modülü artık tamamen merkezi API yapısı üzerinden çalışmakta ve eski direk veritabanı erişimleri kaldırılmıştır. Kullanıcılar aşağıdaki ayarları yönetebilirler:

- Çalışma günleri ve saatleri
- İşletme adı
- Saat dilimi
- Para birimi
- Vergi oranı 
- Sistem varsayılanları
- Bildirim tercihleri

## 5. Gelecek İyileştirmeler
- Takvim görünümü için çalışma saatleri önbelleğinin otomatik temizlenmesi
- E-posta ve SMS bildirim yapılandırması için ek ayarlar
- Kullanıcı bazlı ayar tercihleri
