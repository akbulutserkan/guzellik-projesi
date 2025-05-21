# Hook/Servis Ayrımı Uygulama Prompt'u

Aşağıdaki adımları ve prensipleri izleyerek projedeki diğer modüller için Hook/Servis ayrımını uygulayabilirsiniz. Bu prompt'u her bir modül için ayrı ayrı kullanabilirsiniz.

## 1. Analiz Aşaması

```
[MODÜL_ADI] modülündeki hook ve servisleri inceleyerek Hook/Servis ayrımını uygulamak istiyorum. Aşağıdaki adımlarla analiz yapabilir misin?

1. Mevcut hook dosyalarını ve servis dosyalarını tanımla
2. Hook'lardaki iş mantığını (business logic) tespit et
3. Hangi kodun servis katmanına, hangi kodun utils'e taşınması gerektiğini belirle
4. Yeni dosya yapısı ve organizasyon şeması öner
5. Temel kodlarda yapılacak değişiklikleri göster (örnek kod)
```

## 2. Uygulama Aşaması

```
[MODÜL_ADI] modülü için Hook/Servis ayrımını uygula. Aşağıdaki adımları izleyerek mevcut dosyaları düzenle ve yeni dosyalar oluştur:

1. Servis katmanına taşınacak API çağrıları ve veri işlemleri için yeni servis dosyaları oluştur
2. Utils katmanına taşınacak formatlama, hesaplama ve doğrulama işlemleri için utils dosyaları oluştur
3. Hook'ları sadeleştir, iş mantığını servislere ve utils'lere taşı
4. İmport ifadelerini ve fonksiyon çağrılarını güncelle
5. Dönüşüm sonrasında kullanılmayan eski dosyaları tespit et
```

## 3. Kod Dönüşüm Modeli

```
[MODÜL_ADI] modülündeki [HOOK_ADI] dosyasının aşağıdaki kurallar çerçevesinde dönüşümünü yapabilir misin?

### Taşınacak Kod Türleri:
1. API çağrıları → services/[modül]/[modülService].ts
2. Veri dönüştürme/formatlama → utils/[modül]/formatters.ts
3. Yardımcı hesaplama fonksiyonları → utils/[modül]/helpers.ts
4. Doğrulama mantığı → utils/[modül]/validators.ts
5. Sabitler → utils/[modül]/constants.ts

### Hook'ta Kalacak Kod Türleri:
1. React state yönetimi (useState)
2. Efekt yönetimi (useEffect)
3. Callback tanımları (useCallback)
4. Context kullanımı
5. Prop geçişleri
6. UI-spesifik işlemler (toast gösterme, dialog açma vb.)

Lütfen hookları sadeleştir ve iş mantığını ilgili servis ve utils dosyalarına taşı. Tüm dosyaların içeriğini ve yapılacak değişiklikleri göster.
```

## 4. Organizasyon Şeması

Hook/Servis ayrımı için şu klasör yapısını kullanın:

```
/src
  /hooks
    /[modül]
      use[Özellik1].ts   # Sadece UI mantığı kalacak
      use[Özellik2].ts   # Sadece UI mantığı kalacak
  
  /services
    /[modül]
      index.ts           # Tüm servisleri dışa aktaran dosya
      [modül]Service.ts  # API çağrıları ve veri işlemleri
  
  /utils
    /[modül]
      constants.ts       # Sabitler ve enum'lar
      formatters.ts      # Veri formatlama fonksiyonları
      helpers.ts         # Yardımcı fonksiyonlar
      validators.ts      # Doğrulama fonksiyonları
```

## 5. İş Mantığı (Business Logic) Tanımlama Kriterleri

Hangi kodun iş mantığı olduğunu belirlemek için şu kriterleri kullanın:

1. **API Çağrıları**: Doğrudan sunucuya istek yapan kod
2. **Veri Dönüştürme**: Bir veri formatından başka bir formata dönüştüren kod
3. **Hesaplama**: Matematiksel işlemler, tarih hesaplamaları
4. **Formatlama**: Görüntüleme formatına çeviren kod
5. **Doğrulama**: Veri geçerliliğini kontrol eden kod
6. **Filtreleme/Sıralama**: Veri koleksiyonlarını işleyen kod
7. **İş Kuralları**: Belirli domain kurallarını uygulayan kod

## 6. Örnek Dönüşüm

```
// ÖNCEKİ KOD - HOOK İÇİNDE
const formatUserData = useCallback((userData: any) => {
  return {
    id: userData.id,
    fullName: `${userData.firstName} ${userData.lastName}`,
    email: userData.email.toLowerCase(),
    role: userData.userRole || 'user',
    isActive: !!userData.isActive,
    lastLogin: userData.lastLoginDate ? new Date(userData.lastLoginDate) : null
  };
}, []);

// SONRA - UTILS/FORMATTERS.TS DOSYASINDA
export function formatUserData(userData: any) {
  return {
    id: userData.id,
    fullName: `${userData.firstName} ${userData.lastName}`,
    email: userData.email.toLowerCase(),
    role: userData.userRole || 'user',
    isActive: !!userData.isActive,
    lastLogin: userData.lastLoginDate ? new Date(userData.lastLoginDate) : null
  };
}

// SONRA - HOOK İÇİNDE (SADELEŞTİRİLMİŞ)
// import { formatUserData } from '@/utils/user/formatters';
// ...formatUserData fonksiyonu doğrudan kullanılır
```

## 7. İlkeler ve Dikkat Edilecek Noktalar

1. **Tek Sorumluluk İlkesi**: Her fonksiyon ve her dosya tek bir işi yapmalı
2. **Saf Fonksiyonlar**: Utils fonksiyonları mümkün olduğunca saf olmalı (yan etki içermemeli)
3. **İsimlendirme Tutarlılığı**: Tutarlı isim formatları kullanın (camelCase, PascalCase)
4. **Tip Güvenliği**: TypeScript tiplerini doğru şekilde kullanın
5. **Bağımlılık Yönetimi**: Gereksiz bağımlılıkları azaltın
6. **Döngüsel Bağımlılıktan Kaçınma**: A→B→C→A gibi bağımlılık döngüleri oluşturmayın
7. **Test Edilebilirlik**: Kod parçalarının birim testi kolayca yazılabilmeli

## 8. Kademeli Geçiş Stratejisi

1. Önce servis fonksiyonlarını oluşturun
2. Sonra utils fonksiyonlarını oluşturun
3. En son hook'ları güncelleyin
4. Her adımda kodun çalıştığından emin olun
5. Gerekirse, eski fonksiyonları geçiş dönemi için tutun, ancak yeni fonksiyonları kullanın

## 9. Örnek Prompt Kullanımı

```
Customer modülündeki useCustomerData hook'unu inceleyerek Hook/Servis ayrımını uygulamak istiyorum. Hook içindeki API çağrılarını services/customer/customerService.ts dosyasına, veri formatlama işlemlerini utils/customer/formatters.ts dosyasına, hesaplama ve yardımcı fonksiyonları utils/customer/helpers.ts dosyasına taşımak istiyorum. Hook'u sadeleştirerek sadece UI mantığını koru. Gerekli tüm dosyaları oluştur ve düzenle.
```

Bu prompt yapısını kullanarak, projedeki herhangi bir modül için Hook/Servis ayrımını kolayca uygulayabilirsiniz.