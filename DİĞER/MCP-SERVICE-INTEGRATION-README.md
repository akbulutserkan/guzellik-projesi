# MCP Entegrasyonu Dönüşüm Rehberi

Bu döküman, hizmetler (services) modülünün REST API'den MCP (Model Context Protocol) API'ye dönüştürülmesini açıklar.

## Yapılan Değişiklikler

### 1. MCP Hizmet Araçları

MCP hizmet araçları için yardımcı fonksiyonlar oluşturuldu:
- `/src/lib/mcp/services.ts` - MCP hizmet API çağrıları için yardımcı fonksiyonlar

### 2. Hizmetler Sayfası MCP Entegrasyonu

Hizmetler sayfası, MCP API'sini kullanacak şekilde güncellendi:
- `/src/app/(protected)/services/page.tsx` - REST API yerine MCP API kullanacak şekilde değiştirildi

### 3. Randevu Sistemi MCP Entegrasyonu 

Randevu sistemi servis fonksiyonları MCP kullanacak şekilde güncellendi:
- `/src/components/appointments/NewAppointmentModal/services/mcp-api.ts` - MCP API entegrasyon fonksiyonları
- `/src/components/appointments/NewAppointmentModal/services/api.ts` - Mevcut API fonksiyonları MCP kullanacak şekilde güncellendi
- `/src/components/appointments/NewAppointmentModal/services/dataPreloader.ts` - Veri önbelleği MCP ile güncelleştirildi

## MCP API'ye Geçiş Kontrol Mekanizması

`/src/components/appointments/NewAppointmentModal/services/mcp-api.ts` dosyasında tanımlanan `useMcpServices` değişkeni ile MCP kullanımı kontrol edilebilir:

```typescript
export const useMcpServices = true; // MCP API kullanımını kontrol eden flag
```

Bu değişkeni `false` yaparak eski REST API'ye geri dönülebilir.

## Ek Yapılacak İşlemler

1. Diğer MCP araçlarının eklenmesi:
   - Personel hizmetlerini getirmek için personele özel MCP aracı eklenmeli
   - Kategori ekleme, silme ve güncelleme için MCP araçları eklenmeli
   - Hizmet ekleme, silme ve güncelleme için MCP araçları eklenmeli

2. Test ve hata ayıklama:
   - MCP entegrasyonunu test etmek için kapsamlı testler yapılmalı
   - Performans karşılaştırması yapılmalı (REST API vs MCP API)

## Sonuç

Artık hizmetler modülü MCP API'sini kullanarak çalışıyor. Bu değişiklikler, sistemin daha modüler ve tutarlı bir yapıya kavuşmasını sağlıyor.

- Hizmetler sayfası şimdi MCP API ile çalışıyor
- Randevu sistemi hizmet API çağrıları MCP kullanıyor
- Gelecekte tüm API çağrıları MCP'ye taşınabilir

## İlgili Dosyalar
- `/src/lib/mcp/services.ts`
- `/src/app/(protected)/services/page.tsx`
- `/src/app/(protected)/services/page-original.tsx` (yedek)
- `/src/components/appointments/NewAppointmentModal/services/mcp-api.ts`
- `/src/components/appointments/NewAppointmentModal/services/api.ts`
- `/src/components/appointments/NewAppointmentModal/services/dataPreloader.ts`
