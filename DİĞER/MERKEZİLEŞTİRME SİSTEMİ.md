------PROJE YAPISI----

serkan@SERKAN-MacBook-Air claude % find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | sort
.
./.next
./.next/build
./.next/build/chunks
./.next/cache
./.next/server
./.next/server/app
./.next/server/app/(protected)
./.next/server/app/(protected)/appointments
./.next/server/app/(protected)/appointments/page
./.next/server/app/(protected)/calendar
./.next/server/app/(protected)/calendar/page
./.next/server/app/(protected)/package-sales
./.next/server/app/(protected)/package-sales/page
./.next/server/app/(protected)/packages
./.next/server/app/(protected)/packages/page
./.next/server/app/(protected)/product-sales
./.next/server/app/(protected)/product-sales/page
./.next/server/app/(protected)/products
./.next/server/app/(protected)/products/page
./.next/server/app/(protected)/services
./.next/server/app/(protected)/services/page
./.next/server/app/(protected)/staff
./.next/server/app/(protected)/staff/page
./.next/server/app/api
./.next/server/app/api/appointments
./.next/server/app/api/appointments/[id]
./.next/server/app/api/appointments/[id]/route
./.next/server/app/api/appointments/availability
./.next/server/app/api/appointments/availability/route
./.next/server/app/api/appointments/route
./.next/server/app/api/auth
./.next/server/app/api/auth/[...nextauth]
./.next/server/app/api/auth/[...nextauth]/route
./.next/server/app/api/mcp
./.next/server/app/api/mcp/route
./.next/server/app/api/product-sales
./.next/server/app/api/product-sales/route
./.next/server/app/api/settings
./.next/server/app/api/settings/business-days
./.next/server/app/api/settings/business-days/route
./.next/server/app/api/staff
./.next/server/app/api/staff/route
./.next/server/app/page
./.next/server/chunks
./.next/server/chunks/ssr
./.next/server/edge
./.next/server/edge/chunks
./.next/server/middleware
./.next/static
./.next/static/chunks
./.next/static/development
./.next/static/media
./.next/types
./node_modules
./prisma
./prisma/migrations
./prisma/migrations/20250314080201_init
./prisma/migrations/20250314100421_add_project_data
./prisma/migrations/20250314182130_add_service_price_history
./prisma/migrations/20250314191746_add_code_examples
./prisma/migrations/20250319045121_remove_package_description
./prisma/scripts
./public
./public/js
./src
./src/app
./src/app/(protected)
./src/app/(protected)/appointments
./src/app/(protected)/appointments/[id]
./src/app/(protected)/appointments/[id]/edit
./src/app/(protected)/appointments/new
./src/app/(protected)/calendar
./src/app/(protected)/customers
./src/app/(protected)/customers/[id]
./src/app/(protected)/customers/[id]/edit
./src/app/(protected)/customers/new
./src/app/(protected)/package-sales
./src/app/(protected)/packages
./src/app/(protected)/packages/[id]
./src/app/(protected)/packages/[id]/edit
./src/app/(protected)/packages/new
./src/app/(protected)/payments
./src/app/(protected)/payments/[id]
./src/app/(protected)/payments/new
./src/app/(protected)/product-sales
./src/app/(protected)/products
./src/app/(protected)/products/new
./src/app/(protected)/services
./src/app/(protected)/services/bulk-update
./src/app/(protected)/settings
./src/app/(protected)/staff
./src/app/(protected)/staff/[id]
./src/app/(protected)/staff/[id]/edit
./src/app/(protected)/staff/new
./src/app/(public)
./src/app/api
./src/app/api/appointments
./src/app/api/appointments/[id]
./src/app/api/appointments/[id]/payment
./src/app/api/appointments/availability
./src/app/api/auth
./src/app/api/auth/[...nextauth]
./src/app/api/claude
./src/app/api/claude-ai-memory
./src/app/api/claude-bridge
./src/app/api/claude-context
./src/app/api/customers
./src/app/api/customers/[id]
./src/app/api/mcapi
./src/app/api/mcp
./src/app/api/mcp-context
./src/app/api/mcp/getVerifiedCodes
./src/app/api/mcp/testAndSave
./src/app/api/package-categories
./src/app/api/package-sessions
./src/app/api/package-sessions/[id]
./src/app/api/payments-by-package
./src/app/api/product-sales
./src/app/api/service-categories
./src/app/api/service-categories/[id]
./src/app/api/settings
./src/app/api/settings/business-days
./src/app/api/staff
./src/app/api/staff/[id]
./src/app/api/staff/services
./src/app/api/test-db
./src/app/api/unpaid-sales
./src/app/api/working-hours
./src/app/auth
./src/app/auth/login
./src/app/claude-bridge
./src/app/claude-with-context
./src/app/mcp-tools
./src/app/mcp-tools/appointments
./src/app/mcp-tools/customers
./src/app/mcp-tools/package-sales
./src/app/mcp-tools/packages
./src/app/mcp-tools/payments
./src/app/mcp-tools/payments/backup
./src/app/mcp-tools/product-sales
./src/app/mcp-tools/products
./src/app/mcp-tools/staff
./src/components
./src/components/Calendar
./src/components/Calendar/components
./src/components/Calendar/components/Header
./src/components/Calendar/hooks
./src/components/Calendar/utils
./src/components/Services
./src/components/Settings
./src/components/appointments
./src/components/appointments/AppointmentDetailModal
./src/components/appointments/AppointmentDetailModal/components
./src/components/appointments/AppointmentDetailModal/components/PaymentMethodModal
./src/components/appointments/AppointmentDetailModal/events
./src/components/appointments/AppointmentDetailModal/handlers
./src/components/appointments/AppointmentDetailModal/hooks
./src/components/appointments/AppointmentDetailModal/hooks/useConflictCheck
./src/components/appointments/AppointmentDetailModal/hooks/useNotesManager
./src/components/appointments/AppointmentDetailModal/hooks/usePaymentSection
./src/components/appointments/AppointmentDetailModal/modals
./src/components/appointments/AppointmentDetailModal/services
./src/components/appointments/AppointmentDetailModal/state
./src/components/appointments/AppointmentDetailModal/utils
./src/components/appointments/NewAppointmentModal
./src/components/appointments/NewAppointmentModal/components
./src/components/appointments/NewAppointmentModal/hooks
./src/components/appointments/NewAppointmentModal/services
./src/components/appointments/NewAppointmentModal/utils
./src/components/claude
./src/components/claude/bridge
./src/components/claude/conversation
./src/components/common
./src/components/customers
./src/components/customers/modals
./src/components/layout
./src/components/package-sales
./src/components/packages
./src/components/product-sales
./src/components/product-sales/ProductSaleEditor
./src/components/products
./src/components/providers
./src/components/staff
./src/components/ui
./src/components/ui/alert-dialog
./src/components/ui/dropdown-menu
./src/components/ui/radio-group
./src/hooks
./src/lib
./src/lib/appointment-service
./src/lib/claude
./src/lib/claude-context-loader
./src/lib/claude/context
./src/lib/customer-service
./src/lib/mcp
./src/lib/mcp/appointments
./src/lib/mcp/context
./src/lib/mcp/customers
./src/lib/mcp/helpers
./src/lib/mcp/product-sales
./src/lib/mcp/products
./src/lib/mcp/staff
./src/lib/mcp/utils
./src/pages
./src/pages/api
./src/scripts
./src/services
./src/services/api
./src/styles
./src/styles/base
./src/styles/calendar
./src/styles/components
./src/types
./src/utils
./src/utils/appointment
./src/utils/cache
./src/utils/calendar
./src/utils/customer
./src/utils/package
./src/utils/packageSale
./src/utils/payment
./src/utils/product
./src/utils/productSale
./src/utils/service
./src/utils/staff
./utils
./utils/appointments


-----------

Merhaba Claude, projemizdeki [MODÜL_ADI] modülünü dengeli ve merkezi yapıya dönüştürmek istiyorum. Bu yapı, kodun üç ana katmana ayrılmasını ve sorumlulukların net bir şekilde dağıtılmasını içeriyor:

1. FORMATLAMA KATMANI (/utils/[module]/formatters.ts):
   - Veri formatlamaları (para birimi, tarih, telefon, vb.)
   - Doğrulama işlevleri
   - Veri normalizasyon işlevleri

2. SERVİS KATMANI (/services/[module]Service.ts):
   - API entegrasyonu ve MCP çağrıları
   - Tip tanımlamaları
   - Veri işleme ve doğrulama
   - Hata yönetimi

3. HOOK KATMANI (/hooks/use[Module]Management.ts):
   - UI state yönetimi
   - Form işleme mantığı
   - Kullanıcı etkileşimleri
   - Servis çağrıları

İşte mevcut modül kodumuz:
[MEVCUT KOD BURAYA]

Lütfen aşağıdaki adımları takip ederek bu modülü merkezi ve dengeli yapıya dönüştür:

1. Önce gerekli üç dosyayı oluştur:
   - /utils/[module]/formatters.ts
   - /services/[module]Service.ts  
   - /hooks/use[Module]Management.ts

2. Mevcut kodda bulunan formatlama işlemlerini formatters.ts'e taşı
3. API çağrılarını servis katmanına taşı
4. UI state ve etkileşim mantığını hook katmanına taşı
5. Önbelleğe alma mekanizması ekleyerek performans optimizasyonu yap
6. useCallback ve useMemo ile gereksiz yeniden-renderlamaları engelle
7. Eski kodların yerine yeni yapıyı kullanan örnek bileşen kodları göster

Önemli gereksinimler:
- Mevcut UI stillerini ve kullanıcı deneyimini koruyarak geliştirme yap
- Eski API'lere ihtiyaç kalmayacak, doğrudan yeni yapıyı kullanacağız
- Kod tekrarını azaltan modüler yapı oluştur
- Tip güvenliğini (TypeScript) sağla
- Tutarlı hata yönetimi uygula
- Bileşenlerin okunabilirliğini ve bakımını kolaylaştır

------
api katmanı için 


# Merkezi API Sistemi Geliştirme Promptu (Güncel)

## Amaç ve Genel Yapı

```
Projede API çağrıları için merkezi bir sistem kullanılmaktadır. Bu sistem, `src/services/api/apiService.ts` 
dosyasında tanımlanan bir servis aracılığıyla tüm HTTP/MCP API isteklerini yönetir. Bu yapı sayesinde:

1. İstemci/sunucu sınırları net şekilde korunur
2. Tüm API çağrıları tek bir formatta ve tutarlı şekilde yapılır
3. Kod tekrarı engellenir
4. Hata yönetimi merkezi olarak yapılır

API sistemi, üç temel katmandan oluşur:
- İstemci Tarafı API Servisi: Bileşenlerden gelen istekleri işler
- API Endpoint'leri: İstekleri alır ve uygun sunucu servislere yönlendirir
- Sunucu Tarafı Servisler: Veritabanı işlemlerini gerçekleştirir
```

## Mimari Yapı

```
API Çağrı Akışı:
1. Bileşen (Component) -> ApiService -> callMcpApi -> /api/mcapi endpoint'i -> /api/mcp endpoint'i
2. /api/mcp -> Sunucu Tarafı Servis -> Veritabanı İşlemi
3. Veritabanı Yanıtı -> Sunucu Tarafı Servis -> /api/mcp -> /api/mcapi -> callMcpApi -> ApiService -> Bileşen

Bu akışta istemci ve sunucu arasındaki sınır korunur, her katman kendi sorumluluğunu üstlenir.
```

## Yeni Bir API Fonksiyonu Ekleme

```
1. İstemci Tarafı API Servis Fonksiyonu Ekleme:
   `src/services/api/apiService.ts` dosyasındaki uygun kategori altına istemci fonksiyonunuzu ekleyin.

export const ApiService = {
  // ...mevcut kategoriler...
  
  /**
   * Ürün Kategori İşlemleri
   */
  productCategories: {
    /**
     * Tüm ürün kategorilerini getir
     */
    getList: async (includeDeleted: boolean = false) => {
      return await callMcpApi('get-product-categories', { 
        includeDeleted 
      }, {
        showToast: false,
        customErrorMsg: 'Ürün kategorileri alınırken bir hata oluştu'
      });
    },
    
    // Diğer fonksiyonlar...
  }
};

2. Sunucu Tarafı Servis Oluşturma:
   İlgili işlemin sunucu tarafı mantığını `/src/lib/[module]-service/index.js` içinde tanımlayın.

// lib/product-category-service/index.js
import { prisma } from '@/lib/prisma';

export async function getProductCategoriesFromDb(includeDeleted = false) {
  try {
    const categories = await prisma.productCategory.findMany({
      where: includeDeleted ? {} : { deleted: false }
    });
    
    return { success: true, data: categories };
  } catch (error) {
    console.error('Kategori listeleme hatası:', error);
    return { 
      success: false, 
      error: `Kategoriler alınırken hata oluştu: ${error.message}` 
    };
  }
}

3. API Endpoint'ini Güncelleme:
   `/src/app/api/mcp/route.ts` dosyasında ilgili tool işlemini ekleyin veya güncelleyin.

import { getProductCategoriesFromDb } from '@/lib/product-category-service';

// API route içinde
else if (toolName === 'get-product-categories') {
  const result = await getProductCategoriesFromDb(toolArgs.includeDeleted);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
```

## İstemci Tarafı API Servisini Kullanma

```
Herhangi bir bileşende API servisini kullanmak için:

// Import 
import { ApiService } from '@/services/api';

// Kullanım
const fetchData = async () => {
  try {
    // API çağrısı
    const result = await ApiService.appointments.getList({ startDate: '2023-01-01' });
    
    // Başarı kontrolü
    if (!result.success) {
      throw new Error(result.error || 'Veriler alınamadı');
    }
    
    // Verileri işleme
    const data = result.data;
    
    // ...işlemler devam eder...
  } catch (error) {
    console.error('Hata:', error);
    // Hata işleme
  }
};
```

## Sunucu Tarafı Servis Oluşturma

```
Sunucu tarafında çalışacak bir servis oluşturmak için:

1. Kütüphane modülünü oluşturun:
   `/src/lib/[module]-service/index.js`

2. Veritabanı işlemlerini yapan fonksiyonları tanımlayın:

import { prisma } from '@/lib/prisma';

/**
 * Veritabanından randevu kaydını siler
 * @param {string} id - Silinecek randevunun kimliği
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteAppointmentFromDb(id) {
  try {
    // Önce randevunun var olup olmadığını kontrol et
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return { 
        success: false, 
        error: `Randevu bulunamadı: ${id}` 
      };
    }
    
    // Randevuyu sil
    await prisma.appointment.delete({
      where: { id }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Randevu silme hatası:', error);
    return { 
      success: false, 
      error: `Randevu silinirken hata oluştu: ${error.message}` 
    };
  }
}

3. API endpoint'inde bu fonksiyonu kullanın:

import { deleteAppointmentFromDb } from '@/lib/appointment-service';

// API route içinde
else if (toolName === 'delete-appointment') {
  const result = await deleteAppointmentFromDb(toolArgs.id);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
```

## İstemci/Sunucu Sınırlarının Korunması

```
Next.js'in istemci/sunucu bölünmesini doğru şekilde yönetmek için:

1. İstemci kodunu 'use client' direktifi ile işaretleyin:
'use client';
import { ApiService } from '@/services/api';

2. Sunucu tarafı işlemleri ayrı servis modüllerinde tanımlayın:
// /src/lib/appointment-service/index.js (sunucu tarafı)
export async function deleteAppointmentFromDb(id) {
  // Veritabanı işlemleri
}

3. API endpoint'lerinde sunucu tarafı servisleri çağırın, asla istemci fonksiyonlarını çağırmayın:
// DOĞRU YAKLAŞIM
import { deleteAppointmentFromDb } from '@/lib/appointment-service';
// ...
const result = await deleteAppointmentFromDb(toolArgs.id);

// YANLIŞ YAKLAŞIM - HATA VERİR
const result = await mcpTools.deleteAppointment(toolArgs.id); // İstemci kodu sunucuda çağrılıyor!

4. Veri akışını şu şekilde düzenleyin:
   İstemci Bileşeni → ApiService → API Endpoint → Sunucu Servisi → Veritabanı

Bu yapı, "Attempted to call X from the server but X is on the client" hatalarını önler.
```

## Hata Yönetimi

```
Tüm API çağrılarında tutarlı bir hata yönetimi kullanın:

try {
  // API çağrısı
  const result = await ApiService.products.create(productData);
  
  // API yanıtı kontrolü
  if (!result.success) {
    throw new Error(result.error || 'Ürün oluşturulamadı');
  }
  
  // Başarılı sonuç
  toast({
    title: "Başarılı",
    description: "Ürün başarıyla oluşturuldu",
    variant: "success"
  });
  
  return result.data;
  
} catch (error) {
  console.error('Ürün oluşturma hatası:', error);
  
  // Kullanıcı bilgilendirme
  toast({
    title: "Hata",
    description: error instanceof Error ? error.message : "Bir hata oluştu",
    variant: "destructive"
  });
  
  // Hata, üst bileşene iletilir
  throw error;
}
```

## Örnekler

### Randevu Silme - Tam Akış Örneği

```typescript
// 1. İstemci Tarafı Bileşen
'use client';
import { ApiService } from '@/services/api';

const deleteAppointment = async (id: string) => {
  try {
    // API çağrısı
    const result = await ApiService.appointments.delete(id);
    
    if (!result.success) {
      throw new Error(result.error || "Randevu silinemedi");
    }
    
    // Başarılı işlem
    toast({
      title: "Başarılı",
      description: "Randevu silindi",
    });
    
    return true;
  } catch (error) {
    // Hata işleme
    console.error('Randevu silme hatası:', error);
    return false;
  }
};

// 2. ApiService Katmanı (istemci tarafı)
// src/services/api/apiService.ts
export const ApiService = {
  appointments: {
    delete: async (id: string) => {
      return await callMcpApi('delete-appointment', { id }, {
        showToast: false,
        customErrorMsg: 'Randevu silinirken bir hata oluştu'
      });
    },
  }
};

// 3. API Endpoint (sunucu tarafı)
// src/app/api/mcp/route.ts
import { deleteAppointmentFromDb } from '@/lib/appointment-service';

// İstek işleme bölümünde
else if (toolName === 'delete-appointment') {
  const result = await deleteAppointmentFromDb(toolArgs.id);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

// 4. Sunucu Tarafı Servis (sunucu tarafı)
// src/lib/appointment-service/index.js
export async function deleteAppointmentFromDb(id) {
  try {
    // Veritabanı işlemleri...
    await prisma.appointment.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Müşteri Listesi Getirme

```typescript
import { ApiService } from '@/services/api';

const fetchCustomers = async () => {
  try {
    const result = await ApiService.customers.getList();
    
    if (!result.success) {
      throw new Error(result.error || 'Müşteri listesi alınamadı');
    }
    
    return result.data;
  } catch (error) {
    console.error('Müşteri listesi hatası:', error);
    throw error;
  }
};
```

## Best Practices ve Geliştirmeler

1. **İstemci/Sunucu Ayrımı**: Tüm kodları istemci veya sunucu tarafı olarak net şekilde ayırın
2. **Sunucu Tarafı Servisler**: Veritabanı işlemleri için her zaman ayrı sunucu tarafı servisler oluşturun
3. **Tip Güvenliği**: Tüm API ve veritabanı servislerinde TypeScript tip tanımlarını kullanın
4. **Önbelleğe Alma**: Sık kullanılan API çağrıları için önbelleğe alma mekanizması ekleyin
5. **Hata İzleme**: Tüm API hatalarını konsola ve gerekirse hata izleme servisine kaydedin
6. **İstek Durumu**: API çağrıları için yükleniyor, başarılı, hata durumlarını izleyin
7. **Yeniden Deneme Mekanizması**: Önemli API çağrıları için yeniden deneme mekanizması ekleyin
8. **Parametrik Yanıtlar**: API yanıtlarını her zaman `{ success, data, error }` formatında standartlaştırın
9. **Veritabanı İşlem Güvenliği**: Kritik işlemleri transaction içinde yapın
10. **Belge ve Örnek Kod**: Yeni geliştirilen tüm API ve servisler için belge ve örnek kod ekleyin

Bu kurallara uyarak uygulamanın API entegrasyonunu tutarlı, güvenilir ve bakımı kolay bir şekilde geliştirebilirsiniz.




----------



## 'USE CLIENT' KULLANIMI - 12 MART 2025

- Next.js uygulamalarında **HER ZAMAN** `'use client'` direktifini dosyanın en başında kullan
- `'use client'` direktifi, **SADECE** dosyanın en üstünde konumlandırılmalıdır (herhangi bir kod, yorum veya boşluktan önce)
- Dosya içinde, fonksiyon içinde, değişken tanımından sonra, callback'ler içinde veya herhangi başka bir pozisyonda **KESİNLİKLE** kullanma
- React uygulamalarında `'use client'` direktifi her component dosyası için gereklidir

# Claude Çalışma Kuralları

**ÖNEMLİ:** Claude, bu dosyayı her oturumun başında okumaı ve aşağıdaki kurallara sıkı sıkıya uymalıdır.

## TEMEL KURAL: ASLA YEDEK DOSYA OLUŞTURMA!

- **ASLA** "yedek", "backup", "kopya" veya benzeri adlarla klasör veya dosya oluşturma
- **ASLA** mevcut dosyaların kopyalarını oluşturma
- **ASLA** `src 2`, `src 3` gibi numaralı veya ek açıklamalı klasörler oluşturma
- **HER ZAMAN** doğrudan orijinal dosyalarda çalış
- Değişiklik yapmadan önce **HER ZAMAN** hangi dosyada çalıştığını teyit et
- Kod değişikliklerini yaparken **HER ZAMAN** hangi dosyayı değiştirdiğini belirt

## ÖNEMLİ HATIRLATMA: HER TÜRLÜ YEDEK VE KOPYA YASAKTIR!

- Proje içinde `src` klasörü varsa, SADECE onu kullan, asla `src 2` veya `src-backup` gibi yedekler oluşturma
- Dosyaları .backup, .old, .temp, .copy gibi uzantılarla veya adlarla KAYDETME
- Bir klasör içinde varolan bir dosyanın yedek kopyasını KAYDETME (Mevcut bir `index.tsx` dosyası varsa, `index.tsx.backup` ya da `index_copy.tsx` benzeri dosyalar oluşturma)
- Tüm işlemler her zaman orijinal dosyalar üzerinde gerçekleştirilmelidir!

## ÖNEMLİ: ASLA GEÇİCİ ÇÖZÜMLER ÖNERME!

- **ASLA** geçici veya kısa vadeli çözümler önerme veya uygulama
- **HER ZAMAN** kalıcı ve tam çözümler geliştir
- Kod kalabalığına neden olan geçici çözümlerden kaçın
- Sorunları temelinden çözen yaklaşımlar sun

## Neden Bu Kurallar Önemli?

Geçmişte, Claude projemin içinde yedek klasörler oluşturdu ve değişiklikleri bu yedek dosyalarda yaptı. Bu durum, ben orijinal dosyalarda çalışırken fark edilmeyen değişikliklere ve karışıklığa yol açtı. Aynı şekilde, geçici çözümler kodun bakımını zorlaştırır ve uzun vadede daha büyük sorunlara neden olabilir.

## Doğru Çalışma Yöntemi

1. Bir dosyayı değiştirmeden önce tam yolunu (örn. `src/components/App.js`) belirt
2. Değişiklik yapmadan önce kullanıcıdan doğrulama iste
3. Değişiklikleri doğrudan orijinal dosyalarda yap
4. Yaptığın değişiklikleri açıkça rapor et
5. **ASLA** geçici çözümler önerme, her zaman kalıcı ve tam çözümler sun

## Hatırla

Bu README'yi her yeni oturumda oku ve buradaki kurallara uy. Yedek dosya oluşturma kuralı ve geçici çözüm önermeme kuralı herhangi bir istisna olmaksızın geçerlidir.

## ÇOK ÖNEMLİ EK NOT - 7 MART 2025

Bu projenin `/Users/serkan/Desktop/claude` dizininde `src 2` ve `src 3` gibi yedek klasörler bulundu. Bu durumun tekrarlanmaması için açıkça belirtmek gerekir ki, Claude hiçbir zaman ve hiçbir sebeple:

1. Orijinal klasör veya dosyaların numaralandırılmış kopyalarını (src 2, index.tsx.2, app 3, vb.) oluşturmayacak.
2. .backup, .copy, .temp, .old vb. uzantılarla kopya dosyalar oluşturmayacak.
3. Orjinal klasör adına ek bir isim (src-backup, src-copy, src-temp, vb.) ekleyerek kopya klasör oluşturmayacak.

Bütün kod değişiklikleri mutlaka ve sadece orijinal dosya ve klasörlerde yapılacaktır.

## TERMİNAL KOMUTLARI KULLANIMI - 9 MART 2025

- **ASLA** proje kökünde yeni script (.sh) dosyaları oluşturma
- **HER ZAMAN** gerekli işlemleri doğrudan terminal komutları olarak öner
- Script dosyası yazmak yerine, kullanıcının doğrudan terminaline kopyalayıp çalıştırabileceği komutları öner
- Özellikle bir kez kullanılacak işlemler için script dosyaları oluşturmak yerine terminal komutları öner

Örnek:

```bash
# pnpm referanslarını temizleme
find ./node_modules -name ".pnpm*" -type d -exec rm -rf {} +
rm -f pnpm-lock.yaml
rm -f .pnpmrc
```

Bu yaklaşım projeyi daha temiz tutar ve geçici kullanılan scriptler nedeniyle gereksiz dosyalar birikmesini önler.


her zaman türkçe yaz




------------