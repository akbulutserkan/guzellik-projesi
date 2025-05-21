# Mimari Tasarım Kılavuzu

Bu belge, proje mimarisinin yapısını, katmanlar arasındaki ilişkileri ve kodlama standartlarını açıklar.

## Mimari Yapı

Projemiz iki temel servis katmanı kullanır:

1. **Client Servisleri** (`/src/services/*.ts`): Client-side kod içinde kullanılan, API çağrıları yapan servisler.
2. **DB Servisleri** (`/src/services/db/**/*.ts`): Sunucu tarafında çalışan, doğrudan veritabanı işlemleri yapan servisler.

## Katmanlar Arası İlişkiler

```
[UI Bileşenleri] -> [Client Servisleri] -> [API Route] -> [DB Servisleri] -> [Veritabanı]
```

### Client Servisleri:

- **Amaç**: API çağrıları yapmak, UI ile sunucu arasında arabulucu görevi görmek
- **Sorumlulukları**:
  - API endpoint'lerine çağrı yapmak
  - Temel hata yönetimini gerçekleştirmek
  - Sonuçları UI'a uygun formatta dönmek
- **Kullanım**: Client-side kod içinde, `'use client'` direktifi ile
- **İsimlendirme**: `entityService.ts` (örn: `productService.ts`)

### DB Servisleri:

- **Amaç**: Veritabanı işlemlerini gerçekleştirmek, iş mantığını uygulamak
- **Sorumlulukları**:
  - Veritabanı CRUD işlemlerini gerçekleştirmek
  - Veri doğrulama ve iş kurallarını uygulamak
  - İleri düzey veri manipülasyonu yapmak
  - Uygun hata mesajları vermek
- **Kullanım**: Sunucu tarafında, API route'ları içinden
- **İsimlendirme**: `entity/index.ts` veya `entity/entityDbService.ts` (örn: `product/index.ts`)

### API Route:

- **Amaç**: Client isteklerini DB servislerine yönlendirmek
- **Sorumlulukları**:
  - İstek parametrelerini doğrulamak
  - İlgili DB servislerine çağrı yapmak
  - HTTP cevaplarını formatlamak
  - Temel hata yönetimini gerçekleştirmek
- **Organizasyon**: Entity bazlı modüler yapı (önerilen)

## Kodlama Standartları

### Client Servisleri:

```typescript
'use client';

/**
 * Client tarafı entity servisi.
 * Bu servis yalnızca API çağrıları yapar ve arabulucu (proxy) görevi görür.
 * Tüm iş mantığı ve veri işlemleri db/entity servisinde gerçekleştirilir.
 * @see /src/services/db/entity/index.ts Veritabanı tarafı entity servisi
 */

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Entity listesini getir
 * @param params Filtreleme parametreleri
 * @returns Entity listesi yanıtı
 */
export async function getEntities(params) {
  return await callMcpApi('get-entities', params, {
    showToast: false,
    customErrorMsg: 'Entity listesi alınırken bir hata oluştu'
  });
}

// Diğer CRUD işlemleri...
```

### DB Servisleri:

```typescript
/**
 * Entity veritabanı servisleri
 * Bu servis, tüm entity işlemleri için veritabanı işlemlerini ve iş mantığını içerir.
 * Client tarafında kullanılan /services/entityService.ts dosyası ile çalışır.
 * @see /src/services/entityService.ts Client taraflı entity servisi
 */
import { prisma } from '@/lib/prisma';

/**
 * Tüm entityleri veritabanından getir
 * @param options Filtreleme seçenekleri
 * @returns Entity listesi yanıtı
 */
export async function getEntitiesFromDb(options = {}) {
  try {
    // Veritabanı işlemleri ve iş mantığı
    // ...
    return { success: true, data: result };
  } catch (error) {
    console.error('[DB] Entity işlemi hatası:', error);
    return { success: false, error: 'Entity işlemi başarısız oldu' };
  }
}

// Diğer CRUD işlemleri...
```

### API Route Handler:

```typescript
/**
 * Entity işlemleri için merkezi işlem fonksiyonu
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns API yanıtı ve durum kodu
 */
async function handleEntityOperations(toolName, toolArgs) {
  try {
    const { 
      getEntitiesFromDb, 
      getEntityByIdFromDb,
      // Diğer fonksiyonlar...
    } = await import('@/services/db/entity');
    
    let result, statusCode;
    
    switch (toolName) {
      case 'get-entities':
        result = await getEntitiesFromDb(toolArgs);
        statusCode = result.success ? 200 : 500;
        break;
      
      // Diğer operasyonlar...
      
      default:
        result = { success: false, error: 'Bilinmeyen işlem' };
        statusCode = 400;
    }
    
    return { result, statusCode };
  } catch (error) {
    return { 
      result: { success: false, error: `Beklenmeyen hata: ${error.message}` }, 
      statusCode: 500 
    };
  }
}
```

## Veri Akışı

1. UI bileşeni, client servisindeki bir fonksiyonu çağırır
2. Client servisi, `callMcpApi` fonksiyonu ile API'ye istek atar
3. API route, isteği alır ve uygun DB servisine yönlendirir
4. DB servisi, veritabanı işlemlerini gerçekleştirir ve sonucu döner
5. API route, DB servisinden aldığı sonucu uygun HTTP yanıtı olarak formatlar
6. Client servisi, API yanıtını alır ve gerekirse işler
7. UI bileşeni, client servisinden gelen veriyi görüntüler

## API İsimlendirme Standartları

Tüm API endpoint'leri şu deseni takip etmelidir:

- `get-entities`: Liste getirme
- `get-entity-by-id`: Tekil kayıt getirme
- `create-entity`: Yeni kayıt oluşturma
- `update-entity`: Kayıt güncelleme
- `delete-entity`: Kayıt silme

## Hata Yönetimi

1. DB Servisleri: Tüm hataları yakalamalı ve şu formatta dönmelidir:
   ```typescript
   { success: false, error: 'Anlaşılır hata mesajı' }
   ```

2. API Route: HTTP durum kodlarını uygun şekilde ayarlamalıdır:
   - 200: Başarılı işlemler
   - 400: İstemci hataları (geçersiz istek, vb.)
   - 404: Kaynak bulunamadı
   - 500: Sunucu hataları

3. Client Servisleri: API hatalarını ele almalı ve kullanıcı dostu mesajlar vermelidir.

## Best Practices

1. **Tek Sorumluluk İlkesi**: Her servis yalnızca kendi alanıyla ilgili işlemleri yapmalıdır.
2. **İş Mantığı**: Tüm iş mantığı DB servislerinde olmalıdır.
3. **Client Servisleri**: Yalnızca API çağrıları yapmalıdır, iş mantığı içermemelidir.
4. **JSDoc Kullanımı**: Tüm fonksiyonlar ve servisler için açıklayıcı JSDoc dokümanları yazılmalıdır.
5. **Tekrarlayan Kod**: Aynı mantık birden fazla yerde kullanılıyorsa, yardımcı fonksiyonlara çıkarılmalıdır.
