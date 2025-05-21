BEN AKSİNİ SÖYLEYENE KADAR HER ZAMAN KODLARI KENDIN PROJEDE DUZENLE İZİN VERİLEN DOSYALARA GİR VE KODLARI KENDIN DUZELT BANA DUZELTMEM ICIN ONERME .



# Hizmetler Sayfası Dokümantasyonu

Bu dokümantasyon, projedeki Hizmetler (Services) sayfasının yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Sayfa Yapısı](#sayfa-yapısı)
4. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
5. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
6. [Özellikler](#özellikler)
7. [Bileşenler](#bileşenler)
8. [Ekran Görüntüleri](#ekran-görüntüleri)

## Genel Bakış

Hizmetler sayfası, işletmelerin sunduğu hizmetleri ve bu hizmetlerin kategorilerini yönetmek için kullanılan bir arayüz sunar. Sayfa, kategori ve hizmet ekleme, düzenleme, silme gibi temel işlemlerin yanı sıra, toplu fiyat güncelleme ve fiyat geçmişi görüntüleme gibi gelişmiş özelliklere de sahiptir.

## Kullanılan Teknolojiler

- **Frontend**:
  - React (v19.0.0)
  - Next.js (App Router yapısı, v15.2.1)
  - TypeScript
  - TailwindCSS
  - React Icons (FiChevronDown, FiChevronRight, FiCheck, FiX, FiEdit2, FiTrash2)
  - Lucide React (Check, X)

- **UI Bileşenleri**:
  - Shadcn/UI (@shadcn/ui)
  - Radix UI (@radix-ui/react-*)
  - Custom Components (EditableItem, BulkUpdatePriceModal, PriceHistoryModal)

- **Backend Entegrasyonu**:
  - MCP API (Model Context Protocol)
  - NextAuth.js (v4.24.11)

- **Veritabanı**:
  - Prisma ORM (v6.4.1)

## Sayfa Yapısı

Hizmetler sayfası (`/src/app/(protected)/services/page.tsx`), Next.js'in App Router yapısı kullanılarak oluşturulmuştur. Sayfa, korumalı (protected) bir rota içinde yer alır ve yalnızca kimlik doğrulaması yapılmış kullanıcılar tarafından erişilebilir.

```
/src/app/
├── (protected)/
│   ├── services/
│   │   ├── bulk-update/
│   │   ├── page.tsx       # Ana hizmetler sayfası
├── components/
│   ├── EditableItem.tsx   # Düzenlenebilir öğe bileşeni
│   ├── Services/
│   │   ├── BulkUpdatePriceModal.tsx # Toplu fiyat güncelleme modalı
│   │   ├── PriceHistoryModal.tsx    # Fiyat geçmişi modalı
├── hooks/
│   ├── usePermissions.ts  # Yetkilendirme hook'u
├── lib/
│   ├── mcp/
│   │   ├── services.ts    # MCP API entegrasyonu
```

## Yetkilendirme Sistemi

Sayfa, yetkilendirme sistemi ile korunmaktadır. Kullanıcıların sayfa içerisindeki işlemleri gerçekleştirebilmesi için gerekli yetkilere sahip olması gerekmektedir. Yetkilendirme, `usePermissions` hook'u ile sağlanır.

### Kullanılan Yetkiler:

- `canAddServiceCategory`: Kategori ekleme
- `canEditServiceCategory`: Kategori düzenleme
- `canDeleteServiceCategory`: Kategori silme
- `canAddService`: Hizmet ekleme
- `canEditService`: Hizmet düzenleme
- `canDeleteService`: Hizmet silme
- `canBulkUpdatePrices`: Toplu fiyat güncelleme
- `canViewPriceHistory`: Fiyat geçmişi görüntüleme

## MCP API Entegrasyonu

Sayfa, verileri MCP (Model Context Protocol) API aracılığıyla alır ve gönderir. MCP API fonksiyonları `/src/lib/mcp/services.ts` içinde tanımlanmıştır.

### Kullanılan API Fonksiyonları:

- `fetchServiceCategoriesMcp`: Hizmet kategorilerini getirme
- `addServiceCategoryMcp`: Kategori ekleme
- `updateServiceCategoryMcp`: Kategori güncelleme
- `deleteServiceCategoryMcp`: Kategori silme
- `addServiceMcp`: Hizmet ekleme
- `updateServiceMcp`: Hizmet güncelleme
- `deleteServiceMcp`: Hizmet silme
- `bulkUpdateServicePricesMcp`: Toplu fiyat güncelleme
- `bulkUpdatePreviewServicePricesMcp`: Toplu fiyat güncelleme önizlemesi
- `getServicePriceHistoryMcp`: Fiyat geçmişini getirme
- `revertPriceHistoryMcp`: Fiyat geçmişi kaydını geri alma

## Özellikler

### 1. Kategori Yönetimi
- Kategori listeleme
- Yeni kategori ekleme
- Kategori düzenleme
- Kategori silme

### 2. Hizmet Yönetimi
- Hizmet listeleme (kategoriye göre)
- Yeni hizmet ekleme
- Hizmet düzenleme (ad, süre, fiyat)
- Hizmet silme

### 3. Gelişmiş Özellikler
- **Toplu Fiyat Güncelleme**:
  - Tüm hizmetlerde veya belirli bir kategorideki hizmetlerde fiyat değişikliği
  - Yüzde veya sabit miktar olarak artırma/azaltma
  - Değişiklik önizlemesi
  - Onay mekanizması

- **Fiyat Geçmişi**:
  - Yapılan fiyat değişikliklerinin kaydını tutma
  - Geçmiş değişiklikleri görüntüleme
  - Gerektiğinde eski fiyatlara geri dönme

### 4. Kullanıcı Deneyimi İyileştirmeleri
- Genişletilebilir kategori panelleri
- Yükleme animasyonları
- Başarılı/başarısız işlem bildirimleri (toast)
- Veri doğrulama ve hata yönetimi

## Bileşenler

### 1. EditableItem
Düzenlenebilir öğeleri göstermek için kullanılan genel bir bileşendir. Hizmetlerin listelenip düzenlenmesinde kullanılır.

```tsx
<EditableItem
  title={service.name}
  fields={[
    {
      key: "duration",
      label: "Süre (dk)",
      type: "number",
      value: service.duration,
      min: 5,
      step: 5,
    },
    {
      key: "price",
      label: "Fiyat",
      type: "number",
      value: service.price,
      min: 0,
      step: 0.01,
    },
  ]}
  onUpdate={
    canEditService
      ? async (data) => {
          const updatedService = {
            ...service,
            duration: parseInt(data.duration as string),
            price: parseFloat(data.price as string),
          };
          await handleSaveService(service, updatedService);
        }
      : undefined
  }
  onDelete={
    canDeleteService
      ? () => handleDelete(service.id)
      : undefined
  }
/>
```

### 2. BulkUpdatePriceModal
Toplu fiyat güncelleme işlemleri için kullanılan modal bileşenidir.

```tsx
<BulkUpdatePriceModal
  open={bulkUpdateModalOpen}
  onOpenChange={setBulkUpdateModalOpen}
  categories={categories}
  onUpdate={fetchCategories}
/>
```

### 3. PriceHistoryModal
Fiyat geçmişini görüntülemek için kullanılan modal bileşenidir.

```tsx
<PriceHistoryModal
  open={priceHistoryModalOpen}
  onOpenChange={setPriceHistoryModalOpen}
  onUpdate={fetchCategories}
/>
```

## Ekran Görüntüleri

(Bu bölüm, sayfa tamamlandığında ekran görüntüleri ile doldurulabilir.)

## Kullanım Örnekleri

### Kategori Ekleme

```jsx
// Kategori adı girişi ve ekleme butonu ile yeni kategori oluşturulabilir
<input
  type="text"
  value={newCategoryName}
  onChange={(e) => setNewCategoryName(e.target.value)}
  placeholder="Kategori Adı"
  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
  required
/>
<button
  onClick={handleAddCategory}
  disabled={isAddingCategory}
  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap"
>
  {isAddingCategory ? 'Ekleniyor...' : 'Ekle'}
</button>
```

### Hizmet Ekleme

```jsx
// Kategori içindeki form ile yeni hizmet eklenebilir
<div className="flex gap-4">
  <div className="flex-1">
    <input
      type="text"
      placeholder="Hizmet Adı"
      value={newService.name}
      onChange={(e) =>
        setNewService((prev) => ({
          ...prev,
          name: e.target.value,
        }))
      }
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
    />
  </div>
  <div className="w-32">
    <input
      type="number"
      placeholder="Süre (dk)"
      value={newService.duration}
      onChange={(e) =>
        setNewService((prev) => ({
          ...prev,
          duration: e.target.value,
        }))
      }
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      min="5"
      step="5"
    />
  </div>
  <div className="w-32">
    <input
      type="number"
      placeholder="Fiyat (TL)"
      value={newService.price}
      onChange={(e) =>
        setNewService((prev) => ({
          ...prev,
          price: e.target.value,
        }))
      }
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      min="0"
      step="0.01"
    />
  </div>
  <button
    type="button"
    onClick={() => handleAddService(category.id)}
    disabled={submitting}
    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
  >
    {submitting ? "Ekleniyor..." : "Hizmet Ekle"}
  </button>
</div>
```

## Hata Yönetimi

Sayfa, çeşitli hata durumlarını ele alır ve kullanıcıya bilgilendirici geri bildirimler sunar:

1. API Hataları: API çağrıları sırasında oluşan hatalar yakalanır ve bildirilir.
2. Form Doğrulama: Kullanıcı girişleri doğrulanır ve geçersiz veriler için uyarılar gösterilir.
3. Yetki Kontrolleri: Yetkilendirme eksikliği durumunda kullanıcıya bilgi verilir.

## Gelecek Geliştirmeler

1. Sürükle-bırak ile kategori ve hizmet sıralamasını değiştirme
2. Toplu hizmet silme/taşıma
3. Detaylı arama ve filtreleme özellikleri
4. Gelişmiş istatistikler ve raporlama
5. Fiyat önerisi algoritması entegrasyonu












# Paketler Sayfası Dokümantasyonu

Bu dokümantasyon, projenizdeki Paketler (Packages) sayfasının yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Sayfa Yapısı](#sayfa-yapısı)
4. [Veri Modelleri](#veri-modelleri)
5. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
6. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
7. [Özellikler](#özellikler)
8. [Bileşenler](#bileşenler)
9. [Kullanım Senaryoları](#kullanım-senaryoları)

## Genel Bakış

Paketler sayfası, işletmenizin sunduğu hizmetleri bir araya getirerek paketler oluşturmanızı ve yönetmenizi sağlar. Bu sayfada, seans sayısı ve fiyat belirlenerek hizmet paketleri oluşturulabilir, düzenlenebilir ve silinebilir. Paketler, kategorilere göre gruplandırılır ve müşterilere satılabilir.

## Kullanılan Teknolojiler

- **Frontend**:
  - React
  - Next.js (App Router yapısı)
  - TypeScript
  - TailwindCSS
  - Lucide React (Pencil, Trash2, Plus, Check, X ikonları)
  - Shadcn/UI bileşenler (Button, Card, Dialog, Input)

- **API Entegrasyonu**:
  - MCP API (Model Context Protocol)
  - NextAuth.js (Kimlik doğrulama ve yetkilendirme)

- **Form İşleme**:
  - Zod (Form doğrulama)

- **Veri Modelleri**:
  - Prisma ORM (Veritabanı etkileşimi)
  - Custom TypeScript tipleri ve arayüzler

## Sayfa Yapısı

Paketler modülü, Next.js App Router yapısı kullanılarak oluşturulmuştur ve aşağıdaki dosya yapısına sahiptir:

```
/src/app/
├── (protected)/
│   ├── packages/
│   │   ├── [id]/
│   │   │   ├── edit/
│   │   │   │   ├── page.tsx    # Paket düzenleme sayfası
│   │   ├── new/
│   │   │   ├── page.tsx        # Yeni paket oluşturma sayfası
│   │   ├── page.tsx            # Ana paketler listesi sayfası
├── components/
│   ├── packages/
│   │   ├── PackageListItem.tsx # Paket öğesi bileşeni
│   │   ├── PackageModal.tsx    # Paket ekleme/düzenleme modalı
├── hooks/
│   ├── usePermissions.ts       # Yetkilendirme hook'u
├── types/
│   ├── package.ts              # Paket veri tipleri ve şemaları
```

## Veri Modelleri

Paketler modülü, aşağıdaki temel veri modellerini kullanır:

### Package (Paket)
```typescript
interface Package {
  id: string;
  name: string;
  sessionCount: number;
  price: number;
  categoryId: string;
  packageServices: { service: Service }[];
  category: ServiceCategory;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### PackageFormData (Paket Form Verisi)
```typescript
type PackageFormData = {
  name: string;
  sessionCount: number;
  price: number;
  categoryId: string;
  serviceIds: string[];
}
```

### Service (Hizmet)
```typescript
type Service = {
  id: string;
  name: string;
  duration?: number;
  price?: number;
  category?: {
    id: string;
    name: string;
  }
}
```

## Yetkilendirme Sistemi

Paketler sayfası, yetkilendirme sistemi ile korunmaktadır. Kullanıcıların paketleri yönetebilmesi için gerekli yetkilere sahip olması gerekir.

### Kullanılan Yetkiler:

- `canViewPackages`: Paketleri görüntüleme
- `canAddPackages`: Paket ekleme
- `canEditPackages`: Paket düzenleme
- `canDeletePackages`: Paket silme

## MCP API Entegrasyonu

Paketler modülü, verileri Model Context Protocol (MCP) API aracılığıyla alır ve gönderir.

### Kullanılan API Fonksiyonları:

- `get-packages`: Tüm paketleri getirme
- `add-package`: Yeni paket ekleme
- `update-package`: Paket güncelleme
- `delete-package`: Paket silme
- `get-service-categories`: Hizmet kategorilerini getirme
- `get-services`: Hizmetleri getirme

## Özellikler

### 1. Paket Listeleme
- Paketlerin kategorilerine göre gruplandırılmış listesi
- Her paket için temel bilgilerin gösterimi (ad, fiyat, seans sayısı)
- Sayfa yükleme durumu animasyonları

### 2. Paket Ekleme
- Modal arayüzü ile hızlı paket oluşturma
- Kategoriye göre hizmet filtreleme
- Fiyat ve seans sayısı belirleme

### 3. Paket Düzenleme
- Hızlı düzenleme özelliği (fiyat ve seans sayısı)
- Detaylı düzenleme sayfası ile tüm özellikleri değiştirebilme

### 4. Paket Silme
- Onay mekanizması ile güvenli silme işlemi

## Bileşenler

### 1. PackageListItem
Bir paketi görüntülemek ve düzenlemek için kullanılan bileşen.

```tsx
<PackageListItem
  key={pkg.id}
  pkg={pkg}
  onDelete={canDeletePackages ? handleDelete : undefined}
  onUpdate={canEditPackages ? async (id, data) => {
    // Güncelleme işlemi
  } : undefined}
/>
```

### 2. PackageModal
Yeni paket oluşturmak veya paket düzenlemek için kullanılan modal bileşeni.

```tsx
<PackageModal
  isOpen={isNewPackageOpen}
  onClose={() => setIsNewPackageOpen(false)}
  onSubmit={async (formData: PackageFormData) => {
    // Gönderme işlemi
  }}
  packageData={null}
  fetchPackages={fetchPackages}
/>
```

## Kullanım Senaryoları

### Paket Oluşturma

1. **Temel Yöntem (Modal Üzerinden)**:
   - Ana paketler sayfasında "Yeni Paket" butonuna tıklanır
   - Modal içinde hizmet seçilir
   - Seans sayısı ve fiyat belirlenir
   - "Oluştur" butonuna tıklanarak paket kaydedilir

```tsx
// Ana paketler sayfasında:
<Button
  variant="default"
  className="bg-pink-300 text-white hover:bg-pink-300/90 transition-colors"
  onClick={() => setIsNewPackageOpen(true)}
>
  <Plus className="mr-2 h-4 w-4" />
  Yeni Paket
</Button>
```

2. **Detaylı Yöntem (Sayfa Üzerinden)**:
   - "/packages/new" sayfasına gidilir
   - Paket adı, açıklama, kategori, seans sayısı, fiyat girilir
   - Paket içerisine eklenecek hizmetler seçilir
   - Form gönderilerek paket oluşturulur

### Paket Düzenleme

1. **Hızlı Düzenleme**:
   - Paket listesinde ilgili paket için düzenleme ikonuna tıklanır
   - Seans sayısı ve fiyat değiştirilir
   - Onay ikonuna tıklanarak değişiklikler kaydedilir

```tsx
// PackageListItem bileşeni içinde:
<div className="flex items-center gap-4">
  <div className="flex items-center gap-2">
    <label className="text-sm">Seans:</label>
    <Input
      type="number"
      value={editedData.sessionCount}
      onChange={(e) => setEditedData(prev => ({ ...prev, sessionCount: parseInt(e.target.value) }))}
      className="w-20 h-8"
      min="1"
    />
  </div>
  <div className="flex items-center gap-2">
    <label className="text-sm">Fiyat:</label>
    <Input
      type="number"
      value={editedData.price}
      onChange={(e) => setEditedData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
      className="w-24 h-8"
      step="0.01"
      min="0"
    />
  </div>
  <div className="flex gap-2">
    <Button variant="ghost" size="icon" onClick={handleSave}>
      <Check className="h-4 w-4 text-green-600" />
    </Button>
    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
      <X className="h-4 w-4 text-red-600" />
    </Button>
  </div>
</div>
```

2. **Detaylı Düzenleme**:
   - "/packages/[id]/edit" sayfasına gidilir
   - Tüm paket detayları düzenlenir
   - Form gönderilerek değişiklikler kaydedilir

### Paket Silme

- Paket listesinde ilgili paket için silme ikonuna tıklanır
- Onay dialogu gösterilir
- Onay verildiğinde paket silinir

```tsx
// Silme işlemi:
const handleDelete = async (id: string) => {
  // Yetki kontrolü
  if (!canDeletePackages) {
    toast({
      variant: "destructive",
      title: "Hata",
      description: "Paket silme yetkiniz bulunmamaktadır"
    });
    return;
  }

  // Kullanıcıya silme işlemi için onay sor
  if (window.confirm("Paketi silmek istediğinize emin misiniz?")) {
    try {
      // MCP API kullanarak paketi sil
      const result = await callMcpApi('delete-package', { id });

      if (!result.success) {
        throw new Error(result.error || 'Paket silinirken bir hata oluştu');
      }

      toast({
        title: "Başarılı",
        description: result.message || "Paket başarıyla silindi",
      });

      fetchPackages();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Paket silinirken bir hata oluştu",
      });
    }
  }
};
```

## Hata Yönetimi

Paketler modülü, çeşitli hata durumlarını ele alır ve kullanıcıya bildirimler sunar:

1. **API Hataları**: API çağrıları sırasında oluşan hatalar yakalanır ve toast bildirimleri ile gösterilir.
2. **Form Doğrulama**: Eksik veya geçersiz form verileri için uyarılar gösterilir.
3. **Yetki Kontrolleri**: Yetkisiz işlemler için kullanıcı bilgilendirilir.
4. **Yükleme Durumları**: Veriler yüklenirken kullanıcıya geri bildirim sağlanır.

## İyi Uygulamalar ve Öneriler

1. **Yetki Kontrolleri**: Tüm işlemler için yetki kontrollerinin yapılması önemlidir. `usePermissions` hook'u kullanılarak yetkisiz erişimler engellenir.

2. **API İsteklerinin Merkezi Yönetimi**: `callMcpApi` fonksiyonu ile API istekleri merkezi olarak yönetilir, bu da kod tekrarını azaltır.

3. **Kategoriye Göre Gruplama**: Paketlerin kategorilerine göre gruplandırılması, kullanıcı deneyimini iyileştirir ve büyük veri setlerinde gezinmeyi kolaylaştırır.

4. **Hızlı Düzenleme**: Basit değişiklikler için modal veya inline düzenleme kullanılarak kullanıcı deneyimi iyileştirilir.

5. **Veri Doğrulama**: Zod şemaları kullanılarak form verileri kapsamlı bir şekilde doğrulanır.

## Gelecek Geliştirmeler

1. **Toplu İşlemler**: Birden fazla paketi aynı anda düzenleme veya silme özelliği eklenebilir.
2. **Paket İstatistikleri**: Paketlerin satış performansını gösteren grafikler ve istatistikler eklenebilir.
3. **Gelişmiş Filtreleme**: Paketleri fiyat, satış miktarı ve diğer kriterlere göre filtreleme özelliği eklenebilir.
4. **Arşivleme**: Kullanılmayan paketleri silmek yerine arşivleme seçeneği sunulabilir.
5. **Paket Kopyalama**: Mevcut bir paketi temel alarak yeni paket oluşturma özelliği eklenebilir.









# Paket Satışları Sayfası Dokümantasyonu

Bu dokümantasyon, projenizdeki Paket Satışları (Package Sales) sayfasının yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Sayfa Yapısı](#sayfa-yapısı)
4. [Veri Modelleri](#veri-modelleri)
5. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
6. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
7. [Bileşenler](#bileşenler)
8. [Özellikler](#özellikler)
9. [Tarih Filtreleme](#tarih-filtreleme)
10. [Ödeme İşlemleri](#ödeme-işlemleri)
11. [İyi Uygulamalar ve Geliştirme Notları](#iyi-uygulamalar-ve-geliştirme-notları)

## Genel Bakış

Paket Satışları sayfası, paketlerin müşterilere satışını yönetmek için kullanılan bir modüldür. Bu sayfa, paket satışlarını listeleme, yeni satış oluşturma, mevcut satışları düzenleme, ödeme alma ve satışları silme işlemlerini sağlar. Ayrıca, satışları tarih aralığına göre filtreleme ve sayfalama özellikleri de sunar.

## Kullanılan Teknolojiler

- **Frontend**:
  - React (Next.js App Router)
  - TypeScript
  - TailwindCSS
  - Radix UI (Dialog, Select bileşenleri)
  - Lucide React (ikonlar)
  - React-DatePicker (tarih seçici)
  - Date-fns (tarih formatlama)

- **State Yönetimi**:
  - React Hooks (useState, useEffect, useCallback, useMemo)
  - Context API (modal yönetimi)

- **API Entegrasyonu**:
  - MCP API (Model Context Protocol)
  - Özel yardımcı fonksiyonlar

- **Bileşen Kütüphaneleri**:
  - Shadcn/UI (@/components/ui/)
  - Özel dialog ve form bileşenleri

- **Tarih İşlemleri**:
  - date-fns (format, yerelleştirme)
  - react-datepicker (tarih aralığı seçimi)

## Sayfa Yapısı

Paket Satışları modülü, aşağıdaki dosya yapısına sahiptir:

```
/src/app/
├── (protected)/
│   ├── package-sales/
│   │   ├── PackageSalesClient.tsx     # Ana client bileşeni
│   │   ├── PackageSalesDateFilter.tsx # Tarih filtreleme bileşeni
│   │   ├── page.tsx                   # Sayfa giriş noktası
├── components/
│   ├── package-sales/
│   │   ├── NewPackageSaleModal.tsx    # Yeni satış modalı
│   │   ├── EditPackageSaleModal.tsx   # Düzenleme modalı
│   │   ├── PaymentsModal.tsx          # Ödemeler modalı
├── lib/
│   ├── mcp/
│   │   ├── package-sales.ts           # MCP API entegrasyonu
│   │   ├── helpers/
│   │   │   ├── index.ts               # MCP API yardımcı fonksiyonları
```

## Veri Modelleri

### PackageSale (Paket Satışı)

```typescript
interface PackageSale {
  id: string;
  expiryDate: string;
  status: string;
  customer: Customer;
  package: {
    id: string;
    name: string;
    sessionCount: number;
    packageServices: {
      service: Service;
    }[];
  };
  sessions: Session[];
  payments: Payment[];
  price: number;
  createdAt: string;
  saleDate: string;
  notes?: string;
  staff?: {
    id: string;
    name: string;
  };
}
```

### Payment (Ödeme)

```typescript
interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  customerId: string;
  packageSaleId: string;
  processedBy: string;
  status: string;
  paymentType: string;
  date: string;
}
```

### Customer (Müşteri)

```typescript
interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## MCP API Entegrasyonu

Paket Satışları modülü, verileri MCP API aracılığıyla alır ve gönderir. Bu API entegrasyonu için özel yardımcı fonksiyonlar kullanılır.

### Kullanılan API Fonksiyonları

- `getPackageSales`: Filtrelere göre paket satışlarını getirme
- `getPackageSaleById`: ID'ye göre paket satışı getirme
- `createPackageSale`: Yeni paket satışı oluşturma
- `updatePackageSale`: Paket satışını güncelleme
- `deletePackageSale`: Paket satışını silme
- `addPayment`: Paket satışına ödeme ekleme
- `deletePayment`: Ödeme silme

### API Çağrısı Örneği

```typescript
// MCP API ile paket satışlarını getirme
const result = await getPackageSales({
  page: currentPage,
  perPage: 10,
  startDate: dateFilter.startDate,
  endDate: dateFilter.endDate
});

if (!result.success) {
  throw new Error(result.error || "Satış verileri alınamadı");
}

setSales(result.data.map(validateSale));
setTotalPages(result.lastPage || 1);
```

## Yetkilendirme Sistemi

Paket Satışları sayfası, kullanıcının yetkilerine göre erişilebilir ve kullanılabilir. `usePermissions` hook'u ile yetki kontrolü sağlanır.

### Kullanılan Yetkiler

- `canViewPackageSales`: Paket satışlarını görüntüleme
- `canAddPackageSales`: Yeni paket satışı ekleyebilme
- `canEditPackageSales`: Paket satışlarını düzenleyebilme
- `canDeletePackageSales`: Paket satışlarını silebilme

```typescript
const {
  canViewPackageSales,
  canAddPackageSales,
  canEditPackageSales,
  canDeletePackageSales
} = usePermissions();
```

## Bileşenler

### 1. PackageSalesClient

Ana sayfa bileşeni. Paket satışlarını listeler, filtreleme, ekleme, düzenleme ve silme işlemlerini yönetir.

```tsx
<PackageSalesClient />
```

### 2. PackageSalesDateFilter

Tarih aralığı filtrelemesi için kullanılan bileşen. Önceden tanımlanmış filtreler ve özel tarih aralığı seçimi sunar.

```tsx
<PackageSalesDateFilter
  initialDates={{
    startDate: dateFilter.startDate ? new Date(dateFilter.startDate) : null,
    endDate: dateFilter.endDate ? new Date(dateFilter.endDate) : null,
  }}
  onDateFilterChange={handleDateFilterChange}
/>
```

### 3. NewPackageSaleModal

Yeni paket satışı oluşturmak için kullanılan modal bileşeni.

```tsx
<NewPackageSaleModal
  open={isNewSaleModalOpen}
  onOpenChange={setIsNewSaleModalOpen}
  onSuccess={handleNewSale}
  packages={packages}
  customers={customers}
  staffList={staffList}
  onNewCustomer={handleNewCustomer}
  fetchPackages={fetchInitialData}
  saleDate={saleDate}
  expiryDate={expiryDate}
  onSaleDateChange={setSaleDate}
  onExpiryDateChange={setExpiryDate}
  mcpApi={mcpApi}
/>
```

### 4. EditPackageSaleModal

Mevcut paket satışını düzenlemek için kullanılan modal bileşeni.

```tsx
<EditPackageSaleModal
  open={saleToEdit !== null}
  onOpenChange={(open) => !open && setSaleToEdit(null)}
  sale={saleToEdit}
  onSuccess={handleSaleUpdated}
  mcpApi={mcpApi}
/>
```

### 5. PaymentsModal

Paket satışının ödemelerini yönetmek için kullanılan modal bileşeni.

```tsx
<PaymentsModal
  open={true}
  onOpenChange={(open) => {
    if (!open) setSelectedPaymentsSale(null);
  }}
  sale={selectedPaymentsSale}
  onSuccess={() => {
    fetchSalesData(currentPage, dateFilter);
  }}
  key={selectedPaymentsSale.id}
  mcpApi={mcpApi}
/>
```

## Özellikler

### 1. Paket Satışı Listeleme

Paket satışları bir tablo içerisinde listelenir. Her satış için aşağıdaki bilgiler gösterilir:

- Paket adı
- Satış tutarı
- Tahsil edilen tutar
- Kalan tutar
- Seans kullanımı (Tamamlanan / Toplam)
- Müşteri adı
- Satış personeli
- Satış tarihi

Listelenen satışlar, belirlenen tarih aralığına göre filtrelenir ve sayfalanır.

### 2. Yeni Paket Satışı Oluşturma

"Yeni Paket Satışı" butonu ile modal açılır ve aşağıdaki bilgiler girilir:

- Müşteri bilgileri (arama ve seçim veya yeni müşteri ekleme)
- Paket bilgileri (arama ve seçim veya yeni paket ekleme)
- Satış personeli
- Satış tarihi ve son geçerlilik tarihi
- Satış fiyatı
- İlk ödeme bilgileri (opsiyonel)

### 3. Paket Satışı Düzenleme

Düzenleme ikonu ile açılan modal üzerinden aşağıdaki bilgiler güncellenebilir:

- Müşteri
- Paket
- Satış tarihi
- Son geçerlilik tarihi
- Fiyat
- Satış personeli
- Notlar

### 4. Ödeme Yönetimi

Ödeme ikonu ile açılan modal üzerinden paket satışının ödemeleri yönetilebilir:

- Mevcut ödemeleri görüntüleme
- Yeni ödeme ekleme (tutar, ödeme yöntemi, tarih)
- Ödemeleri silme
- Toplam tutar, tahsil edilen ve kalan tutar bilgilerini görüntüleme

### 5. Paket Satışı Silme

Silme ikonu ile onay aldıktan sonra paket satışı silinebilir. Silme işlemi gerçekleştiğinde, tüm ilişkili veriler (ödemeler, seanslar) de silinir.

## Tarih Filtreleme

Paket satışları, tarih aralığına göre filtrelenebilir. `PackageSalesDateFilter` bileşeni ile aşağıdaki hazır filtreler sunulur:

- Bugün
- Dün
- Bu Ay
- Geçen Ay
- Özel (kullanıcının belirlediği tarih aralığı)

```typescript
const handleDateFilterChange = useCallback((newFilter: { startDate: string; endDate: string }) => {
  if (newFilter.startDate === dateFilter.startDate && newFilter.endDate === dateFilter.endDate) return;
  setDateFilter(newFilter);
  setCurrentPage(1);
}, [dateFilter]);
```

## Ödeme İşlemleri

Paket satışları için ödeme işlemleri `PaymentsModal` bileşeni ile yönetilir. Bu bileşen:

1. **Ödeme Bilgilerini Görüntüleme**: Mevcut ödemelerin listesi, toplam tutar, tahsil edilen ve kalan tutar.
2. **Yeni Ödeme Ekleme**: Ödeme tutarı, ödeme yöntemi (Nakit, Kredi Kartı, Havale/EFT) ve tarih bilgileri girilir.
3. **Ödeme Silme**: Mevcut ödemeler silinebilir.

Ödeme ekleme örneği:

```typescript
const handleAddPayment = async () => {
  const parsedAmount = parseFloat(payment.amount || "0");
  
  // Form doğrulama
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    setError("Geçerli bir tutar giriniz");
    return;
  }
  
  // MCP API ile ödeme ekleme
  const result = await mcpApi.callMcpApi('add-payment', {
    packageSaleId: sale.id,
    customerId: sale.customer.id,
    amount: parsedAmount,
    paymentMethod: payment.paymentType,
    staffId: sale.staff?.id || ""
  });
  
  // Başarılı ise formu temizle ve güncellemeleri yap
  if (result.success) {
    toast({
      title: "Başarılı",
      description: "Ödeme başarıyla eklendi",
    });
    
    // Formları sıfırla ve yenile
    refreshParentAndModal();
  }
};
```

## İyi Uygulamalar ve Geliştirme Notları

### API Çağrıları ve Hata Yönetimi

API çağrıları, merkezi bir `callMcpApi` fonksiyonu üzerinden yapılır. Bu fonksiyon:

1. Hata durumlarını ele alır ve uygun hata mesajlarını döndürür
2. Başarılı yanıtları doğru formatta işler
3. İstenirse toast bildirimleri gösterir

```typescript
// Hata yönetimi ve doğrulama ile API çağrısı örneği
try {
  setLoading(true);
  const result = await mcpApi.callMcpApi('delete-package-sale', { id });
  
  if (!result.success) {
    throw new Error(result.error || "İşlem başarısız oldu");
  }
  
  toast({
    title: "Başarılı",
    description: "Paket satışı başarıyla silindi",
  });
  
  fetchSalesData(currentPage, dateFilter);
} catch (error) {
  toast({
    variant: "destructive",
    title: "Hata",
    description: error instanceof Error ? error.message : "Bir hata oluştu",
  });
} finally {
  setLoading(false);
}
```

### Performans Optimizasyonları

Performansı artırmak için kullanılan optimizasyonlar:

1. **Memo ve Callback kullanımı**: Gereksiz render'ları önlemek için React.memo, useMemo ve useCallback hook'ları kullanılmıştır
2. **Koşullu Render**: Bileşenler yalnızca gerektiğinde render edilir
3. **Lazy Loading**: Modallar yalnızca açıldığında içeriklerini yükler
4. **Periyodik Yenileme**: Özellikle ödeme modalında, verilerin güncel kalması için periyodik yenileme kullanılır

### Güvenlik ve Doğrulama

1. **Girdi Doğrulama**: Tüm kullanıcı girdileri doğrulanır (boşluk kontrolü, sayısal değer kontrolü, vb.)
2. **Yetki Kontrolleri**: Kullanıcının her işlem için gerekli yetkiye sahip olduğu kontrol edilir
3. **Onay Dialogları**: Silme gibi kritik işlemler için onay alınır
4. **Hata Mesajları**: Hatalar kullanıcıya anlaşılır şekilde gösterilir

### Kullanıcı Deneyimi İyileştirmeleri

1. **Yükleme Göstergeleri**: Tüm uzun süren işlemler için yükleme göstergeleri kullanılır
2. **Toast Bildirimleri**: İşlem sonuçları toast bildirimleri ile gösterilir
3. **Sezgisel Arayüz**: Kullanıcının kolayca anlayabileceği simgeler ve düzenler kullanılır
4. **Hızlı Aramalar**: Müşteri ve paket seçimlerinde arama özelliği bulunur
5. **Tarih Filtreleme Presetleri**: Sık kullanılan tarih aralıkları için hazır seçenekler sunulur

### Genişletme ve Geliştirme Önerileri

1. **Gelişmiş Filtreleme**: Müşteri, personel veya paket türüne göre ek filtreleme özellikleri eklenebilir
2. **Raporlama**: Satış ve ödeme verilerinin grafiksel raporları eklenebilir
3. **Toplu İşlemler**: Birden fazla satış için toplu işlemler (örn. toplu ödeme alma) eklenebilir
4. **Seans Yönetimi**: Pakete bağlı seansların yönetimi için ek özellikler eklenebilir
5. **Entegrasyonlar**: Muhasebe yazılımları veya ödeme sistemleri ile entegrasyonlar geliştirilebilir







# Ürünler ve Ürün Satışları Modülleri Dokümantasyonu

Bu dokümantasyon, projenizdeki Ürünler (Products) ve Ürün Satışları (Product Sales) modüllerinin yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Modül Yapısı](#modül-yapısı)
4. [Veri Modelleri](#veri-modelleri)
5. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
6. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
7. [Ürünler Modülü](#ürünler-modülü)
8. [Ürün Satışları Modülü](#ürün-satışları-modülü)
9. [Ödemeler ve Tahsilat](#ödemeler-ve-tahsilat)
10. [İyi Uygulamalar ve Geliştirme Notları](#i̇yi-uygulamalar-ve-geliştirme-notları)

## Genel Bakış

Ürünler ve Ürün Satışları modülleri, işletmenizin fiziksel veya dijital ürünlerinin yönetimini ve satışını sağlayan bir sistemdir. Ürünler modülü, ürün kataloğunuzu yönetmenize olanak tanırken, Ürün Satışları modülü bu ürünlerin müşterilere satışlarını kaydetmenizi ve takip etmenizi sağlar.

## Kullanılan Teknolojiler

- **Frontend**:
  - React (Next.js App Router yapısı)
  - TypeScript
  - TailwindCSS
  - Lucide React (ikonlar)
  - Shadcn/UI bileşenleri

- **State Yönetimi**:
  - React Hooks (useState, useEffect, useCallback, useRef)
  - React Context API

- **API Entegrasyonu**:
  - MCP API (Model Context Protocol) 
  - Özelleştirilmiş API çağrı fonksiyonları

- **Form İşleme**:
  - Kontrollü form bileşenleri
  - React Portal (modal için)

## Modül Yapısı

### Ürünler Modülü

```
/src/app/
├── (protected)/
│   ├── products/
│   │   ├── new/              # Yeni ürün ekleme sayfası
│   │   │   ├── page.tsx      
│   │   ├── page.tsx          # Ürün listeleme sayfası
├── components/
│   ├── products/
│   │   ├── NewProductModal.tsx    # Yeni ürün modalı
│   │   ├── EditProductModal.tsx   # Ürün düzenleme modalı
├── lib/
│   ├── mcp/
│   │   ├── products/         # Ürün API işlemleri
│   │   │   ├── index.ts      
```

### Ürün Satışları Modülü

```
/src/app/
├── (protected)/
│   ├── product-sales/
│   │   ├── page.tsx              # Ürün satışları listeleme sayfası
├── components/
│   ├── product-sales/
│   │   ├── NewProductSaleModal.tsx    # Yeni satış modalı
│   │   ├── EditProductSaleModal.tsx   # Satış düzenleme modalı
│   │   ├── PaymentsModal.tsx          # Ödemeler modalı
├── lib/
│   ├── mcp/
│   │   ├── product-sales/       # Ürün satışları API işlemleri
│   │   │   ├── index.ts
```

## Veri Modelleri

### Product (Ürün)

```typescript
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  isDeleted: boolean;
}
```

### ProductSale (Ürün Satışı)

```typescript
interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalPayments: number;
  remainingAmount: number;
  paymentStatus: string;
  date: string;
  payments: Payment[];
}
```

### Payment (Ödeme)

```typescript
interface Payment {
  id: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  customerId: string;
  productSaleId: string;
  processedBy: string;
  status: string;
  date: string;
}
```

## MCP API Entegrasyonu

Ürünler ve Ürün Satışları modülleri, verileri MCP API aracılığıyla alır ve gönderir. Bu API entegrasyonu, merkezi yardımcı fonksiyonlar kullanılarak yapılır.

### Ürünler API Fonksiyonları

- `getProducts`: Tüm ürünleri getirme
- `getProductById`: ID'ye göre ürün getirme
- `createProduct`: Yeni ürün oluşturma
- `updateProduct`: Ürün güncelleme
- `updateProductStock`: Ürün stok güncelleme
- `deleteProduct`: Ürün silme

### Ürün Satışları API Fonksiyonları

- `getProductSales`: Tüm ürün satışlarını getirme
- `getProductSaleById`: ID'ye göre ürün satışı getirme
- `createProductSale`: Yeni ürün satışı oluşturma
- `updateProductSale`: Ürün satışı güncelleme
- `deleteProductSale`: Ürün satışı silme
- `getPaymentsByProductSale`: Ürün satışına ait ödemeleri getirme
- `createPayment`: Yeni ödeme oluşturma
- `deletePayment`: Ödeme silme

## Yetkilendirme Sistemi

Her iki modül de, `usePermissions` hook'u aracılığıyla yetkilendirme kontrollerini kullanır.

### Ürünler Modülü Yetkileri

- `canViewProducts`: Ürünleri görüntüleme
- `canAddProducts`: Ürün ekleme
- `canEditProducts`: Ürün düzenleme
- `canDeleteProducts`: Ürün silme

### Ürün Satışları Modülü Yetkileri

- `canViewProductSales`: Ürün satışlarını görüntüleme
- `canAddProductSales`: Ürün satışı ekleme
- `canEditProductSales`: Ürün satışı düzenleme
- `canDeleteProductSales`: Ürün satışı silme

## Ürünler Modülü

### Ana Özellikler

1. **Ürün Listeleme**
   - Tüm ürünlerin bir tabloda görüntülenmesi
   - Pasif ürünlerin belirgin şekilde gösterilmesi
   - Stok seviyesi kontrolü (stok 0 olduğunda uyarı)

2. **Ürün Ekleme**
   - Modal arayüzü ile hızlı ürün ekleme
   - Ürün adı, fiyat ve stok bilgisi girişi
   - Yeni ürün formu sayfası seçeneği

3. **Ürün Düzenleme**
   - Modal arayüzü ile hızlı düzenleme
   - Ürün bilgilerini güncelleme
   - Validasyon kontrolleri

4. **Ürün Silme**
   - Onay mekanizması ile ürün silme
   - Silinen ürünlerin listelenebilmesi için soft delete

### Örnek Kullanım

```tsx
// Ürün Listesi
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full">
    <thead className="bg-gray-50">
      <tr>
        <th>Ürün Adı</th>
        <th>Fiyat</th>
        <th>Stok</th>
        <th>İşlemler</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {products.map((product) => (
        <tr key={product.id} className="hover:bg-gray-50">
          <td>{product.name}</td>
          <td>{product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
          <td>
            <span className={product.stock === 0 ? 'text-red-500' : ''}>
              {product.stock}
            </span>
          </td>
          <td>
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(product)}>
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Yeni Ürün Ekleme

Yeni ürün ekleme işlemi, bir modal aracılığıyla veya ayrı bir sayfa üzerinden yapılabilir. Modal, hızlı ürün ekleme için kullanılırken, sayfa daha detaylı bilgiler girmek için kullanılır.

```typescript
// Yeni ürün ekleme örneği
const handleSubmit = async () => {
  try {
    const result = await createProduct({
      name: form.name.trim(),
      price: Number(form.price),
      stock: parseInt(form.stock),
    });

    if (!result.success) {
      throw new Error(result.error || "Ürün eklenemedi");
    }

    toast({
      title: "Başarılı",
      description: "Ürün başarıyla eklendi",
    });
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Ürün eklenirken bir hata oluştu"
    );
  }
};
```

## Ürün Satışları Modülü

### Ana Özellikler

1. **Satış Listeleme**
   - Tüm satışların detaylı tablo görünümü
   - Ürün adı, miktar, toplam tutar, tahsilat durumu bilgileri
   - Müşteri ve personel bilgileri
   - Tarih filtreleme özelliği

2. **Satış Ekleme**
   - Çoklu ürün seçebilme
   - Arama ile ürün bulma
   - Müşteri seçimi
   - Satıcı personel atama
   - Ödeme yöntemi ve tahsilat durumu belirleme

3. **Satış Düzenleme**
   - Satış bilgilerini güncelleme
   - Ürün, miktar, fiyat değişiklikleri

4. **Satış Silme**
   - Onay mekanizması ile silme işlemi

5. **Ödemeler Yönetimi**
   - Her satış kaydı için ayrı ödeme kaydı oluşturma
   - Kısmi ödeme desteği
   - Ödeme geçmişi görüntüleme ve silme

### Örnek Kullanım

```tsx
// Ürün Satışı Listesi
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full">
    <thead className="bg-gray-50">
      <tr>
        <th>Ürün</th>
        <th>Adet</th>
        <th>Satış</th>
        <th>Tahsilat</th>
        <th>Kalan</th>
        <th>Personel</th>
        <th>Müşteri</th>
        <th>Satış Tarihi</th>
        <th>İşlemler</th>
      </tr>
    </thead>
    <tbody>
      {sales.map((sale) => (
        <tr key={sale.id} className="hover:bg-gray-50">
          <td>{sale.productName}</td>
          <td>{sale.quantity}</td>
          <td>{sale.totalPrice.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
          <td>{(sale.totalPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
          <td>{(sale.remainingAmount || sale.totalPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
          <td>{sale.staffName}</td>
          <td>{sale.customerName}</td>
          <td>{new Date(sale.date).toLocaleDateString("tr-TR")}</td>
          <td>
            <div className="flex space-x-2">
              <button onClick={() => handleViewPayments(sale)}>
                <CreditCard className="h-4 w-4" />
              </button>
              <button onClick={() => handleEditSale(sale)}>
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDeleteSale(sale.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Yeni Satış Ekleme

Ürün satışları, çoklu ürün desteği ile gerçekleştirilebilir. Kullanıcı birden fazla ürün ekleyebilir ve her biri için miktar ve birim fiyat belirleyebilir.

```typescript
// Yeni ürün satışı ekleme örneği
const handleSubmit = async () => {
  try {
    // Ürün kontrolü
    const invalidItems = saleItems.filter(item => 
      !item.productId || !item.quantity || Number(item.quantity) <= 0 || !item.unitPrice || Number(item.unitPrice) <= 0
    );
    
    if (invalidItems.length > 0 || saleItems.length === 0) {
      setError("Tüm ürün bilgilerini doğru şekilde girdiğinizden emin olun");
      return;
    }

    // Tüm ürünleri MCP API'ye gönder
    const salesPromises = saleItems.map(async (item) => {
      return createProductSale({
        productId: item.productId,
        customerId,
        staffId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        paymentType: isFullyPaid ? paymentMethod : undefined,
        date: saleDate,
        isFullyPaid
      });
    });
    
    const results = await Promise.all(salesPromises);
    
    toast({
      title: 'Başarılı',
      description: saleItems.length > 1 
        ? `${saleItems.length} ürün satışı başarıyla eklendi` 
        : 'Satış başarıyla eklendi',
    });
  } catch (error) {
    setError(error.message || "Satış eklenirken bir hata oluştu");
  }
};
```

## Ödemeler ve Tahsilat

Ürün satışları modülünde, her satış için ödeme takibi yapılabilir. Bu ödemeler, satış esnasında veya daha sonra eklenebilir.

### Ödemeler Modalı

PaymentsModal bileşeni, bir satışa ait ödemeleri görüntülemek ve yönetmek için kullanılır. Bu modal:

1. Toplam satış tutarını gösterir
2. Tahsil edilen toplam tutarı gösterir
3. Kalan tutarı gösterir
4. Mevcut ödemeleri listeler
5. Yeni ödeme ekleme imkanı sunar
6. Ödemeleri silme imkanı sunar

```typescript
// Ödeme ekleme örneği
const handleAddPayment = async () => {
  try {
    const result = await createPayment({
      customerId: sale.customerId,
      customerName: sale.customerName,
      amount: Number(paymentAmount),
      paymentType: "PAYMENT",
      paymentMethod: paymentMethod,
      productSaleId: sale.id,
      processedBy: processedBy,
      date: paymentDate
    });

    if (!result.success) {
      throw new Error(result.error || "Ödeme eklenemedi");
    }

    toast({
      title: "Başarılı",
      description: "Ödeme başarıyla eklendi",
    });
    onSuccess();
  } catch (error) {
    setError(error.message || "Ödeme eklenirken bir hata oluştu");
  }
};
```

## İyi Uygulamalar ve Geliştirme Notları

### Performans Optimizasyonları

1. **Veri Filtreleme ve Önbelleğe Alma**
   - Tarih filtreleri ile verilerin yüklenmesi optimize edildi
   - Gereksiz API çağrıları önleniyor

2. **Dinamik Bileşen Oluşturma**
   - Çoklu ürün eklemede minimum DOM değişikliği ile performans artırıldı

3. **Lazy Loading**
   - Modaller sadece açılınca yükleniyor

### API İletişimi ve Veri Yönetimi

1. **MCP API Yardımcı Fonksiyonları**
   - Tek bir yerde API çağrısı yapısı tanımlanarak kod tekrarı önlendi
   - Hata yakalama ve işleme merkezi olarak yönetiliyor

2. **Veri Doğrulama**
   - Müşteri tarafında (frontend) veri doğrulama
   - Sunucu yanıtlarının doğru yorumlanması

### Kullanıcı Deneyimi İyileştirmeleri

1. **Sezgisel Ürün Arama**
   - Yazarken anlık ürün önerisi görüntüleme
   - Öneri listesinde ürün detayları (fiyat ve stok)

2. **Otomatik Fiyat Hesaplama**
   - Ürün seçildiğinde ürün fiyatını otomatik getirme
   - Miktar değiştiğinde toplam tutarı güncelleme

3. **Bildirimler**
   - Toast bildirimleri ile işlem durumları hakkında kullanıcıyı bilgilendirme
   - Hata mesajlarını anlaşılır şekilde gösterme

4. **Erişilebilirlik**
   - Klavye ile gezinme desteği
   - Modallarda otomatik odaklanma

### Güvenlik Önlemleri

1. **Yetki Kontrolü**
   - Her işlem için yetki kontrolü
   - Yetkisiz erişim engelleme

2. **Güvenli Form İşlemleri**
   - Input validasyonu
   - Veri temizleme (trimming, parsing)

3. **API Hata Yönetimi**
   - Tüm API hatalarını yakalama ve kullanıcıya bildirme

### Gelecek Geliştirmeler İçin Öneriler

1. **Ürün Kategorileri**
   - Ürünleri kategorilere ayırma ve kategoriye göre filtreleme

2. **Ürün Görselleri**
   - Ürünlere görsel ekleyebilme

3. **Barkod Entegrasyonu**
   - Ürünleri barkod ile takip etme
   - Barkod okuyucu entegrasyonu

4. **İstatistikler ve Raporlama**
   - Satış istatistikleri
   - Stok durumu raporları

5. **Toplu İşlemler**
   - Toplu ürün ekleme/düzenleme
   - Toplu stok güncelleme

6. **Gelişmiş Filtreleme ve Arama**
   - Ürün ve satışlarda gelişmiş filtreleme seçenekleri
   - Tam metin araması

7. **Stok Takibi ve Uyarılar**
   - Kritik stok seviyesi uyarıları
   - Otomatik stok güncellemesi






   # Tahsilatlar (Ödemeler) Sayfası Dokümantasyonu

Bu dokümantasyon, projenizdeki Tahsilatlar (Ödemeler) modülünün yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Modül Yapısı](#modül-yapısı)
4. [Veri Modeli](#veri-modeli)
5. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
6. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
7. [Sayfalar](#sayfalar)
8. [Özellikler ve İşlevler](#özellikler-ve-işlevler)
9. [Ödeme Türleri ve Durumlar](#ödeme-türleri-ve-durumlar)
10. [Kullanıcı Deneyimi İyileştirmeleri](#kullanıcı-deneyimi-i̇yileştirmeleri)
11. [İyi Uygulamalar ve Geliştirme Notları](#i̇yi-uygulamalar-ve-geliştirme-notları)

## Genel Bakış

Tahsilatlar (Ödemeler) modülü, işletmenizin müşterilerden aldığı tüm ödemeleri yönetmek için kullanılan bir sistemdir. Bu modül, hizmet, paket ve ürün satışları için yapılan ödemeleri tek bir merkezi yerden izlemenize, yeni ödemeler eklemenize ve mevcut ödemeleri yönetmenize olanak tanır.

## Kullanılan Teknolojiler

- **Frontend**:
  - React
  - Next.js (App Router yapısı)
  - TypeScript
  - TailwindCSS
  - date-fns (tarih formatlama)

- **State Yönetimi**:
  - React Hooks (useState, useEffect, useCallback)

- **API Entegrasyonu**:
  - MCP API (Model Context Protocol)
  - Merkezi API çağrı fonksiyonu

- **Form İşleme**:
  - Kontrollü formlar
  - Form doğrulama

## Modül Yapısı

Tahsilatlar modülü, aşağıdaki dosya yapısına sahiptir:

```
/src/app/
├── (protected)/
│   ├── payments/
│   │   ├── [id]/
│   │   │   ├── page.tsx    # Tahsilat detay sayfası
│   │   ├── new/
│   │   │   ├── page.tsx    # Yeni tahsilat ekleme sayfası
│   │   ├── page.tsx        # Tahsilatlar listeleme sayfası
├── lib/
│   ├── mcp/
│   │   ├── index.ts        # MCP API merkezi işlevleri
│   │   ├── helpers/
│   │   │   ├── index.ts    # API yardımcı fonksiyonları
```

## Veri Modeli

### Payment (Ödeme) Modeli

```typescript
interface Payment {
  id: string;
  amount: number;
  paymentType: string;         // Ödeme tipi (Nakit, Kredi Kartı, Havale/EFT)
  paymentMethod: string;       // Ödeme yöntemi (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
  installment: number | null;  // Taksit sayısı
  receiptNumber: string | null; // Fiş/Fatura no
  status: string;              // Durum (Tamamlandı, İade Edildi, İptal Edildi)
  processedBy: string;         // İşlemi yapan kişi
  notes: string | null;        // Notlar
  createdAt: string;           // Oluşturulma tarihi
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  packageSale?: {              // Eğer paket ödemesi ise
    package: {
      name: string;
    };
    price: number;
  };
}
```

## MCP API Entegrasyonu

Tahsilatlar modülü, veri işlemleri için MCP API'yi kullanır. API çağrıları merkezi `callMcpApi` fonksiyonu aracılığıyla yapılır.

### Kullanılan API Fonksiyonları

- `get-payments`: Tüm tahsilatları getirme
- `get-payment-by-id`: ID'ye göre tahsilat detayı getirme
- `create-payment`: Yeni tahsilat ekleme
- `update-payment-status`: Tahsilat durumunu güncelleme
- `get-customers`: Müşterileri getirme
- `get-package-sales`: Paket satışlarını getirme

### API Çağrısı Örneği

```typescript
// Tahsilatları getirme örneği
const fetchPayments = async () => {
  try {
    const result = await mcp.callMcpApi('get-payments', {});
    
    if (!result.success) {
      console.error('Tahsilatlar yüklenirken API hatası:', result.error);
      setError(`Tahsilatlar yüklenirken bir hata oluştu: ${result.error || 'Bilinmeyen hata'}`);
      return;
    }

    const paymentData = result.data || [];
    setPayments(paymentData);

    // Toplam tahsilat tutarını hesapla
    const total = paymentData.reduce((sum, payment) => {
      if (payment.status === 'COMPLETED' || payment.status === 'Tamamlandı') {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
    setTotalAmount(total);
  } catch (err) {
    setError(`Tahsilatlar yüklenirken bir hata oluştu: ${err?.message || 'Beklenmeyen hata'}`);
  }
};
```

## Yetkilendirme Sistemi

Tahsilatlar modülü, `usePermissions` hook'u aracılığıyla yetkilendirme kontrollerini kullanır.

### Kullanılan Yetkiler

- `canViewPayments`: Tahsilatları görüntüleme yetkisi
- `canEditPayments`: Tahsilatları düzenleme yetkisi (yeni tahsilat ekleme, tahsilat durumunu değiştirme)

```typescript
const { canViewPayments, canEditPayments } = usePermissions();

// Sayfa erişim kontrolü
if (!canViewPayments) {
  return (
    <div className="container mx-auto p-8">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
      </div>
    </div>
  );
}
```

## Sayfalar

### 1. Tahsilatlar Listeleme Sayfası (payments/page.tsx)

Bu sayfa, tüm tahsilatların bir listesini gösterir. Ana özellikler:

- Tüm tahsilatların tabloda görüntülenmesi
- Toplam tahsilat tutarının gösterimi
- Tahsilat verilerini yenileme butonu
- Yeni tahsilat ekleme butonu (yetki kontrolü ile)
- Tahsilat detaylarına erişim bağlantıları

### 2. Yeni Tahsilat Ekleme Sayfası (payments/new/page.tsx)

Bu sayfa, yeni bir tahsilat kaydı oluşturmak için bir form sunar. Ana özellikler:

- Müşteri seçimi
- Ödeme tutarı girişi
- Ödeme türü seçimi (Nakit, Kredi Kartı, Havale/EFT)
- Ödeme şekli seçimi (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
- Taksit sayısı (Kredi Kartı seçildiğinde)
- Paket seçimi (Paket Ödemesi seçildiğinde)
- Fiş/Fatura numarası girişi
- İşlemi yapan kişi bilgisi
- Notlar

### 3. Tahsilat Detay Sayfası (payments/[id]/page.tsx)

Bu sayfa, belirli bir tahsilatın detaylı bilgilerini gösterir. Ana özellikler:

- Müşteri bilgileri (ad, telefon)
- Ödeme bilgileri (tarih, tutar, tür, şekil)
- İşlem yapan kişi bilgisi
- Tahsilat durumu (Tamamlandı, İade Edildi, İptal Edildi)
- Notlar
- Yazdırma özelliği
- İade etme özelliği (tahsilat tamamlandıysa ve kullanıcının yetkisi varsa)

## Özellikler ve İşlevler

### 1. Tahsilat Listeleme

Tüm tahsilatlar bir tablo içinde listelenir ve şu bilgileri içerir:

- Tarih ve saat
- Müşteri adı
- Tahsilat tutarı
- Ödeme türü (Nakit, Kredi Kartı, Havale/EFT)
- Ödeme şekli (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
- Durum (Tamamlandı, İade Edildi, İptal Edildi)

```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th scope="col">Tarih</th>
      <th scope="col">Müşteri</th>
      <th scope="col">Tutar</th>
      <th scope="col">Ödeme Türü</th>
      <th scope="col">Ödeme Şekli</th>
      <th scope="col">Durum</th>
      <th scope="col">İşlemler</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {payments.map((payment) => (
      <tr key={payment.id}>
        <td>{format(new Date(payment.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}</td>
        <td>{payment.customer.name}</td>
        <td>{payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
        <td>{getPaymentTypeText(payment.paymentType)}</td>
        <td>{getPaymentMethodText(payment.paymentMethod)}</td>
        <td>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
            {getStatusText(payment.status)}
          </span>
        </td>
        <td>
          {canEditPayments && (
            <Link href={`/payments/${payment.id}`} className="text-indigo-600 hover:text-indigo-900">
              Detay
            </Link>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 2. Tahsilat Ekleme

Yeni tahsilat ekleme sayfası, kapsamlı bir form sunar:

```tsx
<form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Müşteri seçimi */}
    <div className="mb-4">
      <label htmlFor="customerId" className="block text-gray-700 font-bold mb-2">
        Müşteri
      </label>
      <select
        id="customerId"
        name="customerId"
        value={formData.customerId}
        onChange={handleChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      >
        <option value="">Müşteri Seçin</option>
        {customers.map(customer => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>
    </div>

    {/* Tutar girişi */}
    <div className="mb-4">
      <label htmlFor="amount" className="block text-gray-700 font-bold mb-2">
        Tutar
      </label>
      <input
        type="number"
        id="amount"
        name="amount"
        step="0.01"
        value={formData.amount}
        onChange={handleChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>

    {/* Diğer form alanları */}
    {/* ... */}
  </div>

  <div className="flex items-center justify-between mt-6">
    <button
      type="submit"
      disabled={submitting}
      className={`${
        submitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'
      } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
    >
      {submitting ? 'Kaydediliyor...' : 'Kaydet'}
    </button>
    <button
      type="button"
      onClick={() => router.back()}
      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      disabled={submitting}
    >
      İptal
    </button>
  </div>
</form>
```

### 3. Tahsilat Durumu Güncelleme

Tahsilat detay sayfasında, tamamlanmış bir tahsilatı iade etme özelliği:

```typescript
const handleRefund = async () => {
  if (!confirm('Bu tahsilatı iade etmek istediğinize emin misiniz?')) return;

  try {
    // MCP API ile tahsilat durumunu güncelle
    const result = await mcp.callMcpApi('update-payment-status', { 
      id: params.id,
      status: 'İade Edildi'
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Tahsilat iade edilirken bir hata oluştu');
    }

    setPayment(result.data);
  } catch (err) {
    setError('Tahsilat iade edilirken bir hata oluştu');
    console.error(err);
  }
};
```

## Ödeme Türleri ve Durumlar

### Ödeme Türleri (paymentType)

Tahsilatlar için kullanılan ödeme türleri:

- `Nakit`: Nakit ödeme
- `Kredi Kartı`: Kredi kartı ile ödeme (taksit seçeneği ile)
- `Havale/EFT`: Banka havalesi veya EFT ile ödeme

### Ödeme Şekilleri (paymentMethod)

Tahsilatın hangi hizmet veya ürün için yapıldığını belirten şekiller:

- `Hizmet Ödemesi`: Randevu veya hizmet karşılığı yapılan ödeme
- `Paket Ödemesi`: Satın alınan paket için yapılan ödeme
- `Ürün Ödemesi`: Satın alınan ürün için yapılan ödeme

### Tahsilat Durumları (status)

Tahsilatın mevcut durumunu gösteren değerler:

- `Tamamlandı`: Başarıyla tamamlanmış tahsilat
- `İade Edildi`: Müşteriye iade edilmiş tahsilat
- `İptal Edildi`: İptal edilmiş tahsilat

## Kullanıcı Deneyimi İyileştirmeleri

### 1. Durum Renklendirme

Tahsilat durumları, anlaşılabilirliği artırmak için renklendirilmiştir:

```typescript
const getStatusColor = (status: string) => {
  const statusKey = status.toUpperCase();
  const colors: Record<string, string> = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'TAMAMLANDI': 'bg-green-100 text-green-800',
    'REFUNDED': 'bg-yellow-100 text-yellow-800',
    'İADE EDILDI': 'bg-yellow-100 text-yellow-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'İPTAL EDILDI': 'bg-red-100 text-red-800'
  };
  
  return colors[statusKey] || 'bg-gray-100 text-gray-800';
};
```

### 2. Tarih Formatlaması

Tüm tarihler, Türkçe yerelleştirme ile formatlanır:

```typescript
format(new Date(payment.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })
```

### 3. Para Birimi Formatlaması

Tüm para tutarları, Türk Lirası olarak formatlanır:

```typescript
payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
```

### 4. Yükleme Durumu Göstergesi

Veri yüklenirken kullanıcıya bilgi verilir:

```tsx
{loading && <div className="p-8">Yükleniyor...</div>}
```

### 5. Yenileme Butonu

Tahsilatlar listesini manuel olarak yenileme imkanı:

```tsx
<Button
  onClick={handleRefresh}
  disabled={refreshing}
  variant="outline"
  size="sm"
  className="flex items-center"
>
  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
  {refreshing ? 'Yenileniyor...' : 'Yenile'}
</Button>
```

## İyi Uygulamalar ve Geliştirme Notları

### 1. Veri Çevirme Fonksiyonları

API'den gelen verileri kullanıcı dostu metinlere çevirmek için yardımcı fonksiyonlar:

```typescript
// Ödeme türü çeviri fonksiyonu
const getPaymentTypeText = (type: string) => {
  const paymentTypeMap: Record<string, string> = {
    'CASH': 'Nakit',
    'Nakit': 'Nakit',
    'nakit': 'Nakit',
    'CREDIT_CARD': 'Kredi Kartı',
    'Kredi Kartı': 'Kredi Kartı',
    // ...
  };
  
  return paymentTypeMap[type] || type;
};
```

### 2. Toplam Hesaplama

Toplam tahsilat tutarı, tamamlanmış ödemeleri filtreleyerek hesaplanır:

```typescript
const total = paymentData.reduce((sum, payment) => {
  if (payment.status === 'COMPLETED' || payment.status === 'Tamamlandı') {
    return sum + payment.amount;
  }
  return sum;
}, 0);
```

### 3. Koşullu Form Alanları

Form alanları, seçilen değerlere bağlı olarak koşullu olarak gösterilir:

```tsx
{formData.paymentType === 'Kredi Kartı' && (
  <div className="mb-4">
    <label htmlFor="installment" className="block text-gray-700 font-bold mb-2">
      Taksit Sayısı
    </label>
    <input
      type="number"
      id="installment"
      name="installment"
      value={formData.installment}
      onChange={handleChange}
      min="1"
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    />
  </div>
)}
```

### 4. Onaylama Diyalogları

Önemli işlemler için kullanıcı onayı alınır:

```typescript
if (!confirm('Bu tahsilatı iade etmek istediğinize emin misiniz?')) return;
```

### 5. Yazdırma Özelliği

Tahsilat detaylarını yazdırmak için tarayıcının yazdırma işlevi kullanılır:

```typescript
const handlePrint = () => {
  window.print();
};
```

### 6. Hata Yönetimi

Tüm API çağrıları try-catch bloklarında yapılır ve hatalar hem loglara hem de kullanıcıya gösterilir:

```typescript
try {
  // API çağrısı
} catch (err) {
  setError(`Tahsilatlar yüklenirken bir hata oluştu: ${err?.message || 'Beklenmeyen hata'}`);
  console.error('Tahsilatlar yüklenirken beklenmeyen hata:', err);
}
```

### 7. Geliştirme Önerileri

1. **Tarih Filtreleme**: Belirli tarih aralığındaki tahsilatları göstermek için filtreleme eklenebilir
2. **Gelişmiş Arama**: Müşteri adı, ödeme türü veya tutara göre arama özelliği eklenebilir
3. **Sayfalama**: Büyük veri setleri için sayfalama özelliği eklenebilir
4. **Raporlama**: Tahsilat raporları ve istatistikler için özel bir sayfa oluşturulabilir
5. **Muhasebe Entegrasyonu**: Tahsilatları muhasebe sistemine aktarma özelliği eklenebilir
6. **Fatura/Makbuz Üretme**: Tahsilatlar için PDF fatura veya makbuz üretme özelliği eklenebilir






# Tahsilatlar (Ödemeler) Sayfası Dokümantasyonu

Bu dokümantasyon, projenizdeki Tahsilatlar (Ödemeler) modülünün yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Modül Yapısı](#modül-yapısı)
4. [Veri Modeli](#veri-modeli)
5. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
6. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
7. [Sayfalar](#sayfalar)
8. [Özellikler ve İşlevler](#özellikler-ve-işlevler)
9. [Ödeme Türleri ve Durumlar](#ödeme-türleri-ve-durumlar)
10. [Kullanıcı Deneyimi İyileştirmeleri](#kullanıcı-deneyimi-i̇yileştirmeleri)
11. [İyi Uygulamalar ve Geliştirme Notları](#i̇yi-uygulamalar-ve-geliştirme-notları)

## Genel Bakış

Tahsilatlar (Ödemeler) modülü, işletmenizin müşterilerden aldığı tüm ödemeleri yönetmek için kullanılan bir sistemdir. Bu modül, hizmet, paket ve ürün satışları için yapılan ödemeleri tek bir merkezi yerden izlemenize, yeni ödemeler eklemenize ve mevcut ödemeleri yönetmenize olanak tanır.

## Kullanılan Teknolojiler

- **Frontend**:
  - React
  - Next.js (App Router yapısı)
  - TypeScript
  - TailwindCSS
  - date-fns (tarih formatlama)

- **State Yönetimi**:
  - React Hooks (useState, useEffect, useCallback)

- **API Entegrasyonu**:
  - MCP API (Model Context Protocol)
  - Merkezi API çağrı fonksiyonu

- **Form İşleme**:
  - Kontrollü formlar
  - Form doğrulama

## Modül Yapısı

Tahsilatlar modülü, aşağıdaki dosya yapısına sahiptir:

```
/src/app/
├── (protected)/
│   ├── payments/
│   │   ├── [id]/
│   │   │   ├── page.tsx    # Tahsilat detay sayfası
│   │   ├── new/
│   │   │   ├── page.tsx    # Yeni tahsilat ekleme sayfası
│   │   ├── page.tsx        # Tahsilatlar listeleme sayfası
├── lib/
│   ├── mcp/
│   │   ├── index.ts        # MCP API merkezi işlevleri
│   │   ├── helpers/
│   │   │   ├── index.ts    # API yardımcı fonksiyonları
```

## Veri Modeli

### Payment (Ödeme) Modeli

```typescript
interface Payment {
  id: string;
  amount: number;
  paymentType: string;         // Ödeme tipi (Nakit, Kredi Kartı, Havale/EFT)
  paymentMethod: string;       // Ödeme yöntemi (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
  installment: number | null;  // Taksit sayısı
  receiptNumber: string | null; // Fiş/Fatura no
  status: string;              // Durum (Tamamlandı, İade Edildi, İptal Edildi)
  processedBy: string;         // İşlemi yapan kişi
  notes: string | null;        // Notlar
  createdAt: string;           // Oluşturulma tarihi
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  packageSale?: {              // Eğer paket ödemesi ise
    package: {
      name: string;
    };
    price: number;
  };
}
```

## MCP API Entegrasyonu

Tahsilatlar modülü, veri işlemleri için MCP API'yi kullanır. API çağrıları merkezi `callMcpApi` fonksiyonu aracılığıyla yapılır.

### Kullanılan API Fonksiyonları

- `get-payments`: Tüm tahsilatları getirme
- `get-payment-by-id`: ID'ye göre tahsilat detayı getirme
- `create-payment`: Yeni tahsilat ekleme
- `update-payment-status`: Tahsilat durumunu güncelleme
- `get-customers`: Müşterileri getirme
- `get-package-sales`: Paket satışlarını getirme

### API Çağrısı Örneği

```typescript
// Tahsilatları getirme örneği
const fetchPayments = async () => {
  try {
    const result = await mcp.callMcpApi('get-payments', {});
    
    if (!result.success) {
      console.error('Tahsilatlar yüklenirken API hatası:', result.error);
      setError(`Tahsilatlar yüklenirken bir hata oluştu: ${result.error || 'Bilinmeyen hata'}`);
      return;
    }

    const paymentData = result.data || [];
    setPayments(paymentData);

    // Toplam tahsilat tutarını hesapla
    const total = paymentData.reduce((sum, payment) => {
      if (payment.status === 'COMPLETED' || payment.status === 'Tamamlandı') {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
    setTotalAmount(total);
  } catch (err) {
    setError(`Tahsilatlar yüklenirken bir hata oluştu: ${err?.message || 'Beklenmeyen hata'}`);
  }
};
```

## Yetkilendirme Sistemi

Tahsilatlar modülü, `usePermissions` hook'u aracılığıyla yetkilendirme kontrollerini kullanır.

### Kullanılan Yetkiler

- `canViewPayments`: Tahsilatları görüntüleme yetkisi
- `canEditPayments`: Tahsilatları düzenleme yetkisi (yeni tahsilat ekleme, tahsilat durumunu değiştirme)

```typescript
const { canViewPayments, canEditPayments } = usePermissions();

// Sayfa erişim kontrolü
if (!canViewPayments) {
  return (
    <div className="container mx-auto p-8">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
      </div>
    </div>
  );
}
```

## Sayfalar

### 1. Tahsilatlar Listeleme Sayfası (payments/page.tsx)

Bu sayfa, tüm tahsilatların bir listesini gösterir. Ana özellikler:

- Tüm tahsilatların tabloda görüntülenmesi
- Toplam tahsilat tutarının gösterimi
- Tahsilat verilerini yenileme butonu
- Yeni tahsilat ekleme butonu (yetki kontrolü ile)
- Tahsilat detaylarına erişim bağlantıları

### 2. Yeni Tahsilat Ekleme Sayfası (payments/new/page.tsx)

Bu sayfa, yeni bir tahsilat kaydı oluşturmak için bir form sunar. Ana özellikler:

- Müşteri seçimi
- Ödeme tutarı girişi
- Ödeme türü seçimi (Nakit, Kredi Kartı, Havale/EFT)
- Ödeme şekli seçimi (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
- Taksit sayısı (Kredi Kartı seçildiğinde)
- Paket seçimi (Paket Ödemesi seçildiğinde)
- Fiş/Fatura numarası girişi
- İşlemi yapan kişi bilgisi
- Notlar

### 3. Tahsilat Detay Sayfası (payments/[id]/page.tsx)

Bu sayfa, belirli bir tahsilatın detaylı bilgilerini gösterir. Ana özellikler:

- Müşteri bilgileri (ad, telefon)
- Ödeme bilgileri (tarih, tutar, tür, şekil)
- İşlem yapan kişi bilgisi
- Tahsilat durumu (Tamamlandı, İade Edildi, İptal Edildi)
- Notlar
- Yazdırma özelliği
- İade etme özelliği (tahsilat tamamlandıysa ve kullanıcının yetkisi varsa)

## Özellikler ve İşlevler

### 1. Tahsilat Listeleme

Tüm tahsilatlar bir tablo içinde listelenir ve şu bilgileri içerir:

- Tarih ve saat
- Müşteri adı
- Tahsilat tutarı
- Ödeme türü (Nakit, Kredi Kartı, Havale/EFT)
- Ödeme şekli (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
- Durum (Tamamlandı, İade Edildi, İptal Edildi)

```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th scope="col">Tarih</th>
      <th scope="col">Müşteri</th>
      <th scope="col">Tutar</th>
      <th scope="col">Ödeme Türü</th>
      <th scope="col">Ödeme Şekli</th>
      <th scope="col">Durum</th>
      <th scope="col">İşlemler</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {payments.map((payment) => (
      <tr key={payment.id}>
        <td>{format(new Date(payment.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}</td>
        <td>{payment.customer.name}</td>
        <td>{payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
        <td>{getPaymentTypeText(payment.paymentType)}</td>
        <td>{getPaymentMethodText(payment.paymentMethod)}</td>
        <td>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
            {getStatusText(payment.status)}
          </span>
        </td>
        <td>
          {canEditPayments && (
            <Link href={`/payments/${payment.id}`} className="text-indigo-600 hover:text-indigo-900">
              Detay
            </Link>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 2. Tahsilat Ekleme

Yeni tahsilat ekleme sayfası, kapsamlı bir form sunar:

```tsx
<form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Müşteri seçimi */}
    <div className="mb-4">
      <label htmlFor="customerId" className="block text-gray-700 font-bold mb-2">
        Müşteri
      </label>
      <select
        id="customerId"
        name="customerId"
        value={formData.customerId}
        onChange={handleChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      >
        <option value="">Müşteri Seçin</option>
        {customers.map(customer => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>
    </div>

    {/* Tutar girişi */}
    <div className="mb-4">
      <label htmlFor="amount" className="block text-gray-700 font-bold mb-2">
        Tutar
      </label>
      <input
        type="number"
        id="amount"
        name="amount"
        step="0.01"
        value={formData.amount}
        onChange={handleChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>

    {/* Diğer form alanları */}
    {/* ... */}
  </div>

  <div className="flex items-center justify-between mt-6">
    <button
      type="submit"
      disabled={submitting}
      className={`${
        submitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'
      } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
    >
      {submitting ? 'Kaydediliyor...' : 'Kaydet'}
    </button>
    <button
      type="button"
      onClick={() => router.back()}
      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      disabled={submitting}
    >
      İptal
    </button>
  </div>
</form>
```

### 3. Tahsilat Durumu Güncelleme

Tahsilat detay sayfasında, tamamlanmış bir tahsilatı iade etme özelliği:

```typescript
const handleRefund = async () => {
  if (!confirm('Bu tahsilatı iade etmek istediğinize emin misiniz?')) return;

  try {
    // MCP API ile tahsilat durumunu güncelle
    const result = await mcp.callMcpApi('update-payment-status', { 
      id: params.id,
      status: 'İade Edildi'
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Tahsilat iade edilirken bir hata oluştu');
    }

    setPayment(result.data);
  } catch (err) {
    setError('Tahsilat iade edilirken bir hata oluştu');
    console.error(err);
  }
};
```

## Ödeme Türleri ve Durumlar

### Ödeme Türleri (paymentType)

Tahsilatlar için kullanılan ödeme türleri:

- `Nakit`: Nakit ödeme
- `Kredi Kartı`: Kredi kartı ile ödeme (taksit seçeneği ile)
- `Havale/EFT`: Banka havalesi veya EFT ile ödeme

### Ödeme Şekilleri (paymentMethod)

Tahsilatın hangi hizmet veya ürün için yapıldığını belirten şekiller:

- `Hizmet Ödemesi`: Randevu veya hizmet karşılığı yapılan ödeme
- `Paket Ödemesi`: Satın alınan paket için yapılan ödeme
- `Ürün Ödemesi`: Satın alınan ürün için yapılan ödeme

### Tahsilat Durumları (status)

Tahsilatın mevcut durumunu gösteren değerler:

- `Tamamlandı`: Başarıyla tamamlanmış tahsilat
- `İade Edildi`: Müşteriye iade edilmiş tahsilat
- `İptal Edildi`: İptal edilmiş tahsilat

## Kullanıcı Deneyimi İyileştirmeleri

### 1. Durum Renklendirme

Tahsilat durumları, anlaşılabilirliği artırmak için renklendirilmiştir:

```typescript
const getStatusColor = (status: string) => {
  const statusKey = status.toUpperCase();
  const colors: Record<string, string> = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'TAMAMLANDI': 'bg-green-100 text-green-800',
    'REFUNDED': 'bg-yellow-100 text-yellow-800',
    'İADE EDILDI': 'bg-yellow-100 text-yellow-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'İPTAL EDILDI': 'bg-red-100 text-red-800'
  };
  
  return colors[statusKey] || 'bg-gray-100 text-gray-800';
};
```

### 2. Tarih Formatlaması

Tüm tarihler, Türkçe yerelleştirme ile formatlanır:

```typescript
format(new Date(payment.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })
```

### 3. Para Birimi Formatlaması

Tüm para tutarları, Türk Lirası olarak formatlanır:

```typescript
payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
```

### 4. Yükleme Durumu Göstergesi

Veri yüklenirken kullanıcıya bilgi verilir:

```tsx
{loading && <div className="p-8">Yükleniyor...</div>}
```

### 5. Yenileme Butonu

Tahsilatlar listesini manuel olarak yenileme imkanı:

```tsx
<Button
  onClick={handleRefresh}
  disabled={refreshing}
  variant="outline"
  size="sm"
  className="flex items-center"
>
  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
  {refreshing ? 'Yenileniyor...' : 'Yenile'}
</Button>
```

## İyi Uygulamalar ve Geliştirme Notları

### 1. Veri Çevirme Fonksiyonları

API'den gelen verileri kullanıcı dostu metinlere çevirmek için yardımcı fonksiyonlar:

```typescript
// Ödeme türü çeviri fonksiyonu
const getPaymentTypeText = (type: string) => {
  const paymentTypeMap: Record<string, string> = {
    'CASH': 'Nakit',
    'Nakit': 'Nakit',
    'nakit': 'Nakit',
    'CREDIT_CARD': 'Kredi Kartı',
    'Kredi Kartı': 'Kredi Kartı',
    // ...
  };
  
  return paymentTypeMap[type] || type;
};
```

### 2. Toplam Hesaplama

Toplam tahsilat tutarı, tamamlanmış ödemeleri filtreleyerek hesaplanır:

```typescript
const total = paymentData.reduce((sum, payment) => {
  if (payment.status === 'COMPLETED' || payment.status === 'Tamamlandı') {
    return sum + payment.amount;
  }
  return sum;
}, 0);
```

### 3. Koşullu Form Alanları

Form alanları, seçilen değerlere bağlı olarak koşullu olarak gösterilir:

```tsx
{formData.paymentType === 'Kredi Kartı' && (
  <div className="mb-4">
    <label htmlFor="installment" className="block text-gray-700 font-bold mb-2">
      Taksit Sayısı
    </label>
    <input
      type="number"
      id="installment"
      name="installment"
      value={formData.installment}
      onChange={handleChange}
      min="1"
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    />
  </div>
)}
```

### 4. Onaylama Diyalogları

Önemli işlemler için kullanıcı onayı alınır:

```typescript
if (!confirm('Bu tahsilatı iade etmek istediğinize emin misiniz?')) return;
```

### 5. Yazdırma Özelliği

Tahsilat detaylarını yazdırmak için tarayıcının yazdırma işlevi kullanılır:

```typescript
const handlePrint = () => {
  window.print();
};
```

### 6. Hata Yönetimi

Tüm API çağrıları try-catch bloklarında yapılır ve hatalar hem loglara hem de kullanıcıya gösterilir:

```typescript
try {
  // API çağrısı
} catch (err) {
  setError(`Tahsilatlar yüklenirken bir hata oluştu: ${err?.message || 'Beklenmeyen hata'}`);
  console.error('Tahsilatlar yüklenirken beklenmeyen hata:', err);
}
```

### 7. Geliştirme Önerileri

1. **Tarih Filtreleme**: Belirli tarih aralığındaki tahsilatları göstermek için filtreleme eklenebilir
2. **Gelişmiş Arama**: Müşteri adı, ödeme türü veya tutara göre arama özelliği eklenebilir
3. **Sayfalama**: Büyük veri setleri için sayfalama özelliği eklenebilir
4. **Raporlama**: Tahsilat raporları ve istatistikler için özel bir sayfa oluşturulabilir
5. **Muhasebe Entegrasyonu**: Tahsilatları muhasebe sistemine aktarma özelliği eklenebilir
6. **Fatura/Makbuz Üretme**: Tahsilatlar için PDF fatura veya makbuz üretme özelliği eklenebilir







# Müşteriler Sayfası Dokümantasyonu

Bu dokümantasyon, projenizdeki Müşteriler (Customers) modülünün yapısını, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Modül Yapısı](#modül-yapısı)
4. [Veri Modeli](#veri-modeli)
5. [MCP API Entegrasyonu](#mcp-api-entegrasyonu)
6. [Yetkilendirme Sistemi](#yetkilendirme-sistemi)
7. [Sayfalar ve Bileşenler](#sayfalar-ve-bileşenler)
8. [Özellikler](#özellikler)
9. [Formlar ve Veri Doğrulama](#formlar-ve-veri-doğrulama)
10. [İyi Uygulamalar](#iyi-uygulamalar)
11. [Geliştirme Önerileri](#geliştirme-önerileri)

## Genel Bakış

Müşteriler modülü, işletmenizin müşteri veritabanını yönetmenizi sağlayan bir sistemdir. Bu modül, müşteri bilgilerini kaydetme, görüntüleme, düzenleme ve silme işlemlerini gerçekleştirmenize olanak tanır. Ayrıca, müşteri ile ilgili randevular ve tahsilatlar gibi ilişkili verileri de görüntüleyebilirsiniz.

## Kullanılan Teknolojiler

- **Frontend**:
  - React
  - Next.js (App Router yapısı)
  - TypeScript
  - TailwindCSS
  - Lucide React (ikonlar)
  - Shadcn/UI bileşenler (Dialog, Input, Button)

- **State Yönetimi**:
  - React Hooks (useState, useEffect)

- **API Entegrasyonu**:
  - MCP API (Model Context Protocol)
  - Merkezi API çağrı fonksiyonu

- **Form Bileşenleri**:
  - Özel PhoneInput bileşeni (telefon formatı ve doğrulama)
  - Kontrollü formlar

## Modül Yapısı

Müşteriler modülü, aşağıdaki dosya yapısına sahiptir:

```
/src/app/
├── (protected)/
│   ├── customers/
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Müşteri detay sayfası
│   │   ├── new/
│   │   │   ├── page.tsx        # Yeni müşteri ekleme sayfası
│   │   ├── page.tsx            # Müşteriler listesi sayfası
├── components/
│   ├── customers/
│   │   ├── NewCustomerModal.tsx           # Yeni müşteri ekleme modalı
│   │   ├── EditCustomerModal.tsx          # Müşteri düzenleme modalı
│   │   ├── modals/
│   │   │   ├── CustomerDetailModal.tsx    # Müşteri detayları modalı
│   ├── PhoneInput.tsx                     # Özel telefon girişi bileşeni
├── lib/
│   ├── mcp/
│   │   ├── customers/
│   │   │   ├── index.ts                   # Müşteri API işlevleri
```

## Veri Modeli

### Customer (Müşteri) Modeli

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  appointments?: Appointment[];
  packageSales?: PackageSale[];
  payments?: Payment[];
  productSales?: ProductSale[];
}
```

### Müşteri İşlemleri İçin Parametreler

```typescript
// Müşteri oluşturma parametreleri
type CreateCustomerParams = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
};

// Müşteri güncelleme parametreleri
type UpdateCustomerParams = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
};
```

## MCP API Entegrasyonu

Müşteriler modülü, verileri MCP API aracılığıyla yönetir. Bu entegrasyon, `/lib/mcp/customers/index.ts` dosyasında tanımlanan fonksiyonlarla sağlanır.

### API Fonksiyonları

- **getCustomers**: Tüm müşterileri getirme
- **getCustomerById**: ID'ye göre müşteri detaylarını getirme
- **createCustomer**: Yeni müşteri oluşturma
- **updateCustomer**: Müşteri bilgilerini güncelleme
- **deleteCustomer**: Müşteri silme

### API Çağrısı Örneği

```typescript
// Müşterileri getirme
const fetchCustomers = async () => {
  try {
    // MCP API ile müşterileri getir
    const data = await getCustomers();
    setCustomers(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Müşteriler yüklenirken hata oluştu:', error);
    setError('Müşteriler yüklenirken bir hata oluştu');
  } finally {
    setLoading(false);
  }
};
```

## Yetkilendirme Sistemi

Müşteriler modülü, `usePermissions` hook'u aracılığıyla yetkilendirme kontrollerini kullanır.

### Kullanılan Yetkiler

- `canViewCustomers`: Müşterileri görüntüleme yetkisi
- `canAddCustomers`: Müşteri ekleme yetkisi
- `canEditCustomers`: Müşteri düzenleme yetkisi
- `canDeleteCustomers`: Müşteri silme yetkisi

```typescript
const {
  canViewCustomers,
  canAddCustomers,
  canEditCustomers,
  canDeleteCustomers
} = usePermissions();

// Yetki kontrolü
if (!canViewCustomers) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
        <p className="mt-2">Müşteriler sayfasını görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    </div>
  );
}
```

## Sayfalar ve Bileşenler

### 1. Müşteriler Listesi Sayfası (customers/page.tsx)

Tüm müşterilerin listelendiği ana sayfa. Bu sayfa şunları içerir:

- Müşteri listesi tablosu
- Yeni müşteri ekleme butonu
- Müşteri arama ve filtreleme (henüz uygulanmamış)
- Müşteri silme ve düzenleme işlemleri

### 2. Yeni Müşteri Ekleme Sayfası (customers/new/page.tsx)

Sayfadan yeni müşteri ekleme formunu sunar. Bu sayfa şunları içerir:

- Ad Soyad giriş alanı
- Telefon giriş alanı
- İptal ve Kaydet butonları

### 3. Müşteri Detay Sayfası (customers/[id]/page.tsx)

Belirli bir müşterinin detaylarını gösteren sayfa. Bu sayfa şunları içerir:

- Müşteri bilgileri (ad, telefon, e-posta, notlar)
- Düzenleme ve silme butonları
- Randevular ve ödemeler (henüz uygulanmamış)

### 4. Yeni Müşteri Ekleme Modalı (NewCustomerModal.tsx)

Popup pencere olarak yeni müşteri ekleme formunu sunar. Bu bileşen şunları içerir:

- İsim, telefon, e-posta ve notlar alanları
- Özel PhoneInput bileşeni
- Form doğrulama
- MCP API entegrasyonu

### 5. Müşteri Düzenleme Modalı (EditCustomerModal.tsx)

Popup pencere olarak müşteri düzenleme formunu sunar. Bu bileşen şunları içerir:

- Mevcut müşteri bilgilerini yükleme
- Bilgileri güncelleme formu
- Veri doğrulama
- MCP API entegrasyonu

### 6. Müşteri Detay Modalı (CustomerDetailModal.tsx)

Popup pencere olarak müşteri detaylarını ve ilişkili verileri gösterir. Bu bileşen şunları içerir:

- Sekmeli arayüz (Randevular ve Tahsilatlar)
- Randevu geçmişi
- Ödeme geçmişi ve toplam tutarlar
- Tarih formatlaması ve durum görselleştirme

## Özellikler

### 1. Müşteri Listesi

Tüm müşterilerin tabloda listelenmesi:

```tsx
<table className="min-w-full">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Müşteri
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Telefon
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        İşlemler
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {customers.map((customer) => (
      <tr key={customer.id}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <button
              onClick={() => handleViewCustomerDetail(customer.id)}
              className="text-blue-500 hover:text-blue-700 mr-3 inline-flex items-center"
              title="Detay"
            >
              <Eye className="h-5 w-5" />
            </button>
            <span>{customer.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {customer.phone}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex space-x-2">
            {canEditCustomers && (
              <button onClick={() => handleEditCustomer(customer.id)}>
                <Pencil className="h-5 w-5" />
              </button>
            )}
            {canDeleteCustomers && (
              <button onClick={() => handleDeleteCustomer(customer.id)}>
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 2. Müşteri Ekleme

Modal tabanlı müşteri ekleme formu:

```typescript
const handleSubmit = async () => {
  if (!formData.name || !isPhoneValid) {
    setError("Lütfen isim ve telefon alanlarını doğru şekilde doldurun.");
    return;
  }

  try {
    setSaving(true);
    
    // MCP API kullanarak müşteri oluştur
    const data = await createCustomer({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      notes: formData.notes || undefined
    });
    
    toast({
      title: "Başarılı",
      description: "Müşteri başarıyla eklendi"
    });
    
    onSuccess(data);
    onOpenChange(false);
  } catch (error) {
    if (error instanceof Error && (error as any).existingCustomer) {
      const existingCustomer = (error as any).existingCustomer;
      setError(`Bu telefon numarası ile kayıtlı müşteri bulunmaktadır: ${existingCustomer.name}`);
      return;
    }
    
    setError(error instanceof Error ? error.message : "Müşteri eklenirken bir hata oluştu");
  } finally {
    setSaving(false);
  }
};
```

### 3. Telefon Numarası Doğrulama

Özel PhoneInput bileşeni ile telefon numarası girişi ve doğrulama:

```typescript
const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length > 10) return value;
  
  let formatted = '';
  if (cleaned.length > 0) formatted += `(${cleaned.slice(0, 3)}`;
  if (cleaned.length > 3) formatted += `) ${cleaned.slice(3, 6)}`;
  if (cleaned.length > 6) formatted += ` ${cleaned.slice(6, 8)}`;
  if (cleaned.length > 8) formatted += ` ${cleaned.slice(8, 10)}`;
  
  return formatted;
};

const validatePhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Eğer en az bir rakam girildiyse ve ilk rakam 5 değilse uyarı ver
  if (cleaned.length > 0 && !cleaned.startsWith('5')) {
    setError('Telefon numarası 5 ile başlamalıdır');
    setIsValid(false);
    return false;
  }
  
  // 10 rakam girildiyse doğru kabul et
  if (cleaned.length === 10) {
    setError('');
    setIsValid(true);
    return true;
  }
  
  // Girilen rakam sayısı 10 değilse, eğer kullanıcı veri girmeye başladıysa uzunluk uyarısı ver
  if (cleaned.length > 0) {
    setError('Telefon numarası 10 rakam olmalıdır');
  } else {
    setError('');
  }
  
  setIsValid(false);
  return false;
};
```

### 4. Müşteri Silme

Onay diyaloğu ile müşteri silme:

```typescript
const handleDeleteCustomer = async (id: string) => {
  if (!canDeleteCustomers) {
    toast({
      variant: "destructive",
      title: "Yetkisiz İşlem",
      description: "Müşteri silme yetkiniz bulunmamaktadır"
    });
    return;
  }

  if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    // MCP API ile müşteri silme
    await deleteCustomer(id);

    toast({
      title: "Başarılı",
      description: "Müşteri başarıyla silindi"
    });
    
    fetchCustomers();
  } catch (error) {
    console.error('Müşteri silinirken hata:', error);
    
    // Daha açıklayıcı hata mesajı göster
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Müşteri silinirken bir hata oluştu";
      
    toast({
      variant: "destructive",
      title: "Hata",
      description: errorMessage
    });
  }
};
```

### 5. Müşteri Detayları Görüntüleme

Detay modalında sekmeli görünümle müşteri bilgileri, randevular ve ödemeler:

```tsx
{/* Tab Navigation */}
<div className="border-b border-gray-200">
  <div className="flex">
    <Button 
      variant={activeTab === 'appointments' ? 'default' : 'ghost'}
      className={`py-3 px-6 rounded-none font-medium ${activeTab === 'appointments' ? 'border-b-2 border-blue-500' : ''}`}
      onClick={() => setActiveTab('appointments')}
    >
      Randevular
    </Button>
    <Button 
      variant={activeTab === 'payments' ? 'default' : 'ghost'}
      className={`py-3 px-6 rounded-none font-medium ${activeTab === 'payments' ? 'border-b-2 border-blue-500' : ''}`}
      onClick={() => setActiveTab('payments')}
    >
      Tahsilatlar
    </Button>
  </div>
</div>

{/* Appointments Tab Content */}
{activeTab === 'appointments' && (
  <div className="flex-1 overflow-y-auto p-0 m-0">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th>Tarih</th>
          <th>Durum</th>
          <th>Hizmetler</th>
        </tr>
      </thead>
      <tbody>
        {groupAppointmentsByDate().map((group, index) => (
          <tr key={index}>
            <td>{group.date} {getFirstAppointmentTime(group.appointments)}</td>
            <td>{getAppointmentStatus(getGroupStatus(group.statuses))}</td>
            <td>{group.services.join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{/* Payments Tab Content */}
{activeTab === 'payments' && (
  <div className="flex-1 overflow-y-auto p-0 m-0">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th>Tarih</th>
          <th>Ödeme Türü</th>
          <th>Tutar</th>
          <th>Ürün/Hizmet</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td>{formatDate(payment.createdAt)}</td>
            <td>{getPaymentMethod(payment.paymentType)}</td>
            <td>{payment.amount.toLocaleString('tr-TR')} ₺</td>
            <td>{getServiceProductName(payment)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2} className="text-right font-medium">Toplam Tutar:</td>
          <td className="font-medium">{calculateTotalAmount().toLocaleString('tr-TR')} ₺</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
)}
```

## Formlar ve Veri Doğrulama

### 1. Müşteri Formu Doğrulama

Müşteri formlarında şu doğrulamalar yapılır:

- **İsim**: Boş olmamalıdır
- **Telefon**: 10 karakter uzunluğunda olmalı ve 5 ile başlamalıdır
- **E-posta**: Opsiyonel, geçerli bir e-posta formatında olmalıdır

### 2. Telefon Formatlaması

PhoneInput bileşeni, telefon numaralarını otomatik olarak formatlar:

- Girilen karakter sayısına göre parantez ve boşluklar eklenir
- Sadece rakamlar kabul edilir
- Girilen telefon numarası 5 ile başlamalıdır
- Tam 10 rakam olmalıdır

### 3. Telefon Benzersizliği Kontrolü

Aynı telefon numarası ile birden fazla müşteri oluşturulamaz:

```typescript
try {
  // MCP API ile müşteri oluştur
  data = await createCustomer({
    name: formData.name,
    phone: formData.phone,
    email: formData.email || undefined,
    notes: formData.notes || undefined
  });
} catch (error) {
  // MCP API'den gelen hatalar
  if (error instanceof Error && (error as any).existingCustomer) {
    const existingCustomer = (error as any).existingCustomer;
    setError(`Bu telefon numarası ile kayıtlı müşteri bulunmaktadır: ${existingCustomer.name}`);
    return;
  }
  throw error;
}
```

## İyi Uygulamalar

### 1. Arayüz Tasarımı ve Kullanıcı Deneyimi

- **İkon Kullanımı**: Lucide React ikonları ile sezgisel kullanıcı arayüzü
- **Yükleme Durumları**: Verilerin yüklenme durumu göstergeleri
- **Hata Yönetimi**: Kullanıcı dostu hata mesajları ve toast bildirimleri
- **Form Validasyonu**: Anlık form doğrulama ve uyarılar
- **Yetkiye Dayalı Görünüm**: Kullanıcı yetkilerine göre bileşenlerin görünürlüğü

### 2. Kod Organizasyonu

- **Bileşen Ayırma**: Karmaşık işlevler ayrı bileşenlere bölünmüştür
- **Hook Kullanımı**: useEffect, useState gibi React hook'larının etkin kullanımı
- **API Ayırma**: API çağrıları ayrı bir katmanda (MCP API) yönetilir
- **Tip Tanımlamaları**: TypeScript tip tanımlamaları ile güvenli veri işleme

### 3. Hata Yönetimi

- **API Hataları**: API çağrılarından gelen hatalar yakalanır ve kullanıcıya bildirilir
- **İş Mantığı Hataları**: Aynı telefon numarası ile müşteri oluşturmaya çalışma gibi iş mantığı hataları yönetilir
- **Form Doğrulama Hataları**: Form doğrulama sırasında ortaya çıkan hatalar kullanıcıya bildirilir

### 4. Performans İyileştirmeleri

- **Koşullu Render**: Bileşenler koşullu olarak render edilir
- **Veri Önbelleğe Alma**: Gereksiz API çağrılarını önlemek için veriler önbelleğe alınır
- **Yükleme Durumları**: Veri yüklenirken kullanıcı arayüzü bloke edilmez

## Geliştirme Önerileri

1. **Arama ve Filtreleme**: Müşteri listesine arama ve filtreleme özellikleri eklenebilir
2. **Sayfalama**: Büyük müşteri listeleri için sayfalama eklenebilir
3. **İleri Veri Analizi**: Müşteri ziyaret sıklığı, gelir analizi gibi özellikler eklenebilir
4. **Toplu İşlemler**: Birden fazla müşteriye toplu işlem yapma özelliği eklenebilir
5. **Etiketleme**: Müşteri etiketleme ve kategorilere ayırma özellikleri eklenebilir
6. **İçe/Dışa Aktarma**: Excel veya CSV formatında müşteri verilerini içe/dışa aktarma özellikleri eklenebilir
7. **İletişim Özellikleri**: SMS veya e-posta gönderme özellikleri eklenebilir
8. **Gelişmiş Raporlama**: Müşteri davranış analizleri ve raporlama özellikleri eklenebilir





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


her zamab türkçe yaz




















[BU YAZDILARIM GEÇMİŞTEKİ KARŞILAŞTIĞIM HATALAR VE ÇÖZÜM YOLLARI , AYNI HATALARI YAPMAMAN DAHA İYİ KOD ÖNERİLERİ SUNMAN VE BUNDAN SONRA AYNI HATALARLA KARŞILAŞIRSAN YOL HARİTAN OLMASIN İÇİn


"Tahsilatlar yüklenirken bir hata oluştu" - Kullanıcı arayüzündeki ana hata mesajı.
MCP API Metod Hatası:
CopyMCP API çağrısı başarısız (get-payments): Error: Bilinmeyen metod veya tool
Frontend'in get-payments adlı bir MCP API metodunu çağırdığını, ancak backend'de böyle bir metodun tanımlı olmadığını gösteriyor.
400 Bad Request Hatası:
CopyFailed to load resource: the server responded with a status of 400 (Bad Request)


Çözüm Yöntemlerim:

Problem Analizi: İlk olarak, frontend kodundaki API çağrılarını MCP API'ye geçirmiştik, ancak backend'de karşılık gelen metodlar henüz oluşturulmamıştı.
Karşılık Gelen Backend Metodu Kontrolü: Yaptığımız değişikliklerde get-payments, get-payment-by-id, create-payment ve update-payment-status metodlarını kullanmıştık, ancak backendde bunlar tanımlı değildi.
Uygulanan Çözüm: İki yoldan birini seçebilirdik:
a) Backend Uyarlama Yöntemi: Backend'de bu metodları tanımlamak. Bunun için /app/mcp-tools dizinine yeni bir payments.ts modülü eklemek ve ilgili metodları tanımlamak gerekecekti.
b) Frontend Uyarlama Yöntemi: Frontend kodunu backend'de halihazırda tanımlı olan metodlara uyumlu hale getirmek. Örneğin, eğer backend'de get-all-payments metodu varsa, frontend'de get-payments yerine onu kullanmak.

Kullanıcıya önerdiğim çözüm, backend'de gerekli MCP API metodlarını tanımlamak ve frontend kodumuzun buna uygun şekilde çalışmasını sağlamaktı. Bu tür API geçişlerinde, isim tutarlılığı ve API sözleşmesi önemlidir.
Eğer bir backend düzenlemesi yapmadıysak, hatayı çözmek için frontend kodunu mevcut backend metodlarıyla uyumlu hale getirmemiz daha pratik olacaktır. API çağrı isimlerini doğru metodlarla değiştirmek, bu sorunu çözecektir.



******


Tahsilatlar Sayfasında Karşılaşılan Hatalar ve Çözümleri
Bu sayfada iki ana hatayla karşılaştım ve sistemli bir yaklaşımla çözdüm. İşte karşılaştığım hatalar ve çözüm yolları:
1. MCP API Metodu Bulunamama Hatası
Hata: "MCP API çağrısı başarısız (get-payments): Error: Bilinmeyen metod veya tool"
Nedeni: Frontend'de get-payments metodu çağrılıyordu, ancak backend'de bu metot henüz tanımlanmamıştı. API entegrasyon süreci tamamlanmamıştı.
Çözüm:

/src/app/mcp-tools/payments klasörünü oluşturdum
Bu klasörde index.ts dosyası oluşturarak gerekli metotları (getPayments, getPaymentById, createPayment, updatePaymentStatus, deletePayment) tanımladım
Ana MCP modülüne (index.ts) bu yeni metotları ekledim
API route handler'ını (route.ts) bu metotları tanıyacak şekilde güncelledim

Öğrenilen Ders: Frontend ve backend arasındaki API çağrılarının senkronize olması gerekir. Yeni bir frontend özelliği geliştirirken, backend'de gerekli API metodlarının da oluşturulması veya güncellenmesi gerekebilir.
2. JSON Ayrıştırma ve Export Hatası
Hatalar:

"Export default doesn't exist in target module"
"SyntaxError: Failed to execute 'json' on 'Response': Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

Nedeni:

prisma import'u yanlış yapılmıştı (yanlış import syntax'ı)
Backend hata verdiğinde HTML yanıtı dönüyordu, ama frontend bu yanıtı JSON olarak işlemeye çalışıyordu

Çözümler:

Import hatasını düzelttim: import prisma from '@/lib/prisma'; → import { prisma } from '@/lib/prisma';
API yanıt işleme mekanizmasını kapsamlı şekilde yeniden tasarladım:

HTML yanıtlarını tespit edip doğru şekilde işleyen bir sistem
JSON ayrıştırma hatalarını yakalayan ve yapılandırılmış hatalar döndüren bir yapı
Frontend'de daha ayrıntılı hata işleme ve kullanıcı bildirimleri



Öğrenilen Dersler:

Modül import/export sisteminin doğru kullanımına dikkat edin
API çağrılarında tüm olası yanıt tiplerini (JSON, HTML, boş yanıt) ele alan sağlam bir hata işleme mekanizması oluşturun
Hatalara karşı kullanıcıya bilgilendirici mesajlar sunun

İyi Kod Pratikleri
Bu deneyimden hareketle, gelecekte benzer API entegrasyonlarında şu pratikleri öneririm:

API Planlaması: Frontend ve backend geliştirmeleri eş zamanlı yapılmalı, API sözleşmesi önceden tanımlanmalı
Savunmacı Programlama: API çağrılarında her türlü hata durumunu ele alın:
typescriptCopy// Yanıt formata göre başarılı/hatalı durumları doğru işleyin
const responseText = await response.text();
if (!response.ok) {
  // HTML yanıt kontrolü
  if (responseText.trim().startsWith('<!DOCTYPE')) {
    return { success: false, error: 'Sunucu hatası' };
  }
  // JSON yanıt denemesi
  try {
    const errorData = JSON.parse(responseText);
    return { success: false, error: errorData.error };
  } catch (e) {
    return { success: false, error: 'API yanıtı işlenemedi' };
  }
}

Ayrıntılı Günlükleme: Her API çağrısında giriş/çıkış bilgilerini ve olası hataları kapsamlı şekilde kaydedin
Kullanıcı Deneyimi: Hata durumlarında kullanıcılara anlaşılır mesajlar gösterin ve mümkünse alternatif eylemler sunun

Bu deneyimler, gelecekteki benzer API sorunlarında size hızlı tanı ve çözüm imkanı sağlayacaktır.


******

Tahsilatlar Modülü: Tespit Edilen Sorunlar ve Çözüm Yol Haritası
🔍 Tespit Edilen Temel Sorunlar
1. Veri Formatı Karışıklığı:

Hata: Ödeme türü (paymentType) ve ödeme şekli (paymentMethod) değerlerinin karıştırılması
javascriptCopy// YANLIŞ
paymentType: "SERVICE_PAYMENT" // Aslında bu ödeme şekli olmalı
paymentMethod: "CASH"          // Aslında bu ödeme türü olmalı

Etkisi: Tahsilatlar sayfası ile müşteri detayları arasında format tutarsızlığı

2. Veri Dönüşüm Eksikliği:

Hata: Farklı modüllerde farklı veri dönüşüm yöntemleri kullanılması
Etkisi: Veritabanında tutulan bazı değerler standartsız (SERVICE_PAYMENT/Hizmet Ödemesi, CASH/Nakit)

3. Zaman Kısıtlaması Sorunu:

Hata: Tahsilatlar sayfası son 1 aylık verileri gösteriyordu
javascriptCopystartDate: new Date(new Date().setMonth(new Date().getMonth() - 1))...

Etkisi: Eski tahsilatlar görüntülenemiyordu

4. API ve Veritabanı Tutarsızlığı:

Hata: MCP API ile direkt veritabanı erişimi karışımı
Etkisi: Bazı yerlerde standardize edilmiş, bazı yerlerde ham veri kullanımı

🛠️ Uygulanan Çözümler
1. Veritabanı Düzeltme Script'i (fix-payment-format.js):

Amaç: Mevcut verilerdeki yanlış formatları düzeltme
Çözüm:
javascriptCopyif (payment.paymentType === 'SERVICE_PAYMENT' && ['CASH', 'BANK_TRANSFER'].includes(payment.paymentMethod)) {
  // Değerleri doğru yerlere taşı
  newPaymentType = paymentTypeMap[payment.paymentMethod] || 'Nakit';
  newPaymentMethod = 'Hizmet Ödemesi';
}

Kazanım: Veritabanındaki eski kayıtları düzeltmek için tek seferlik çözüm

2. MCP API Standartlaştırma:

Amaç: Veri çekme işlemlerinde tutarlı format
Çözüm:
javascriptCopyfunction standardizePaymentRecord(payment) {
  // Eski formatı otomatik tespit et
  if (payment.paymentType === 'SERVICE_PAYMENT' && ['CASH', 'BANK_TRANSFER'].includes(payment.paymentMethod)) {
    // Değerleri tersine çevir
    const tempType = payment.paymentMethod;
    payment.paymentMethod = payment.paymentType;
    payment.paymentType = tempType;
  }
  
  // Standardize et
  return {
    ...payment,
    paymentType: standardizePaymentType(payment.paymentType),
    paymentMethod: standardizePaymentMethod(payment.paymentMethod),
    status: standardizeStatus(payment.status)
  };
}

Kazanım: Hem eski hem yeni format veriler için tutarlı görünüm

3. Tahsilatlar Sayfası Zaman Kısıtlamasını Kaldırma:

Amaç: Tüm tahsilatların görüntülenebilmesi
Çözüm:
javascriptCopy// Tarih filtresiz çağrı
const result = await mcp.callMcpApi('get-payments', {
  // Filtre kaldırıldı - tüm zamanlar
});

Kazanım: Veritabanındaki tüm tahsilatları görüntüleme imkanı

4. Randevu Tahsilat API'sini İyileştirme:

Amaç: Randevu üzerinden yapılan ödemelerin doğru kaydedilmesi
Çözüm:
javascriptCopy// MCP API üzerinden kaydet
const paymentResult = await mcp.callMcpApi('create-payment', {
  customerId: appointment.customerId,
  amount: amount,
  paymentType: standardPaymentMethod, // Doğru değer: Nakit, Kredi Kartı vb.
  paymentMethod: 'Hizmet Ödemesi',    // Doğru değer: Hizmet ödemesi (sabit)
  // Diğer değerler...
});

Kazanım: Yeni kayıtların baştan itibaren doğru formatta oluşturulması

🧠 En Yaygın Hata Türleri ve Temel Sebepleri

Terminoloji Karışıklığı:

paymentType (ödeme türü) aslında ödemenin nasıl yapıldığını (Nakit, Kredi Kartı) ifade eder
paymentMethod (ödeme şekli) aslında ne için ödeme yapıldığını (Hizmet, Paket, Ürün) ifade eder


Dil Standardizasyonu Eksikliği:

Veritabanında bazen İngilizce değerler (CASH, SERVICE_PAYMENT)
Kullanıcı arayüzünde Türkçe değerler (Nakit, Hizmet Ödemesi)
Dönüşüm olmadan karışıklık oluşması


Veri Erişim Katmanlarında Tutarsızlık:

Bazı yerlerde direkt Prisma ORM kullanımı
Bazı yerlerde MCP API kullanımı
Standardizasyon eksikliği



🚀 Önerilen En İyi Kod Pratikleri

Veritabanında Standart Anahtar Kullanımı:
javascriptCopy// Daha iyi: Veritabanında standardize edilmiş İngilizce değerler
paymentType: "CASH" // veya "CREDIT_CARD", "BANK_TRANSFER"
paymentMethod: "SERVICE_PAYMENT" // veya "PACKAGE_PAYMENT", "PRODUCT_PAYMENT"

Merkezi Dönüşüm Katmanı:
javascriptCopy// src/utils/translations.ts gibi merkezi bir modül
export const translatePaymentType = (type) => {...}
export const translatePaymentMethod = (method) => {...}

Tek Kaynak Prensibi:

Tüm tahsilat verilerine erişim için sadece MCP API kullanımı
Doğrudan veritabanı manipülasyonundan kaçınma


Veri Doğrulama ve Standartlaştırma:
javascriptCopy// Veriyi API'ye veya veritabanına kaydetmeden önce standartlaştır
const standardizedData = standardizePaymentData(rawData);
await saveToDatabase(standardizedData);

Hata Ayıklama Kolaylığı İçin Zengin Loglar:
javascriptCopyconsole.log(`[TAHSILAT] İşlem: ${operation}, Veri:`, JSON.stringify(data, null, 2));


🔮 Gelecekteki Geliştirmeler İçin Yol Haritası

Format Kontrolü Mekanizması:

Yeni eklenen verilerin doğruluğunu otomatik kontrol eden bir sistem


Veri Tutarlılık Denetleyicisi:

Tüm modüllerde (müşteriler, tahsilatlar, randevular) aynı format kullanımını sağlayan mekanizma


Kapsamlı Kullanıcı Arayüzü Testleri:

Farklı formattaki verilerle arayüzün doğru çalıştığını doğrulama


Veritabanı Performans İyileştirmeleri:

Büyük veri setleri için sayfalama ve optimizasyon




Bu analiz, benzer sorunlarla karşılaşıldığında problem tespiti ve çözümü için sistematik bir yaklaşım sunmaktadır. Veri formatı tutarlılığı, API standartlaştırması ve kod organizasyonu, güvenilir bir yazılım sistemi için temel taşlardır.



******



Şimdi karşılaştığımız hataları ve çözüm yollarını özet olarak hazırlayacağım. Bu özeti ilk gönderdiğiniz dosyadaki ilgili bölüme ekleyebilirsiniz.
markdownCopy## Takvim Randevu Düzenleme Modalı Hata Analizi ve Çözümü

### Tespit Edilen Sorunlar

1. **API Yolu Uyumsuzluğu**:
   - Randevu düzenleme modalı eski API endpointleri (`/api/services`, `/api/staff` vb.) kullanıyordu
   - Takvim sayfası MCP API'sini kullanırken, modal eski API'yi kullanmaya devam ediyordu
   - Bu durum 404 hatalarına ve hizmetlerin/personelin gösterilememesine neden oluyordu

2. **Veri Tutarsızlığı**:
   - Randevu oluşturma modalı doğru şekilde çalışırken, düzenleme modalı çalışmıyordu
   - Aynı fonksiyonlar farklı veri kaynaklarından besleniyordu
   - Randevu düzenleme modalında hizmetler listelenmiyor, ancak randevu oluşturma modalında listenebiliyordu

3. **Hizmet Filtreleme Sorunu**:
   - Düzenleme modalında, seçili personelin sunduğu hizmetler yerine tüm hizmetler görüntüleniyordu
   - Bu durum, personelin sunmadığı hizmetlerin seçilebilmesine neden olabilirdi

### Uygulanan Çözümler

1. **API Mimarisi Standardizasyonu**:
   - Tüm doğrudan API çağrıları MCP API kullanacak şekilde güncellendi:
   
   ```javascript
   // ESKİ KOD (hata veren)
   const response = await fetch("/api/services");
   
   // YENİ KOD (MCP API kullanan)
   const response = await fetch('/api/mcp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       method: 'call_tool',
       params: {
         name: 'get-services',
         arguments: { includeDeleted: false }
       }
     })
   });

Personele Özgü Hizmet Filtrelemesi:

Personele özel hizmetleri getiren kapsamlı bir algoritma eklendi:

javascriptCopy// Önce personelin ID'sini al
const staffId = appointment?.staffId || appointment?.staff?.id;

// Personelin hizmetlerini API'den al
const staffResponse = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    method: 'call_tool',
    params: {
      name: 'get-staff-by-id',
      arguments: { id: staffId }
    }
  })
});

// Sonuçları işle ve filtrelemeyi uygula
const staffData = /* API yanıtından çıkar */;
const staffServices = staffData.services || [];

// Personel hizmetlerini zenginleştir
const enrichedServices = staffServices.map((service) => {
  // Tam hizmet bilgilerini bul
  const fullService = allServices.find(s => s.id === service.id);
  return fullService || service;
});

Gürbüz Hata Yönetimi ve Önbellek Kullanımı:

Çoklu hata durumlarına karşı koruma eklendi
Personele özel önbellek kullanıldı:

javascriptCopy// Önbelleğe alma
localStorage.setItem(`staff_services_${staffId}`, JSON.stringify(enrichedServices));

// Önbellekten yükleme
const cachedStaffServices = localStorage.getItem(`staff_services_${staffId}`);
if (cachedStaffServices) {
  // Kullan
}


Öğrenilen Dersler

API Geçişlerinde Tutarlılık:

Projenin bir bölümünde API mimarisi değiştirildiğinde, tüm ilgili bileşenlerin de güncellenmesi gerekir
Farklı veri kaynakları kullanılması karmaşık hatalara yol açabilir


Personel-Hizmet İlişkisi:

Takvim modülünde, personelin sunduğu hizmetlerin doğru filtrelenmesi kritik önemdedir
Personelin sunmadığı hizmetlerin seçilebilmesi, kullanıcı hatasına ve operasyonel sorunlara yol açabilir


Verimli Hata Yönetimi ve Önbellek Stratejisi:

API çağrıları başarısız olduğunda, önbellek kullanarak uygulamanın çalışmaya devam etmesi sağlanmalıdır
Hiyerarşik önbellek yaklaşımı (önce personele özel, sonra genel) kullanıcı deneyimini iyileştirir



Benzer Hataları Önleme İçin İpuçları

API Değişikliklerinde Kapsamlı Tarama:

Bir API mimarisi değiştiğinde, projeyi grep veya benzeri araçlarla tarayarak tüm API çağrılarını tespit edin
Değişiklikler için kapsamlı bir kontrol listesi oluşturun


Test-Önce Yaklaşımı:

Değişiklikler yapmadan önce, mevcut işlevselliği test edin
Değişikliklerden sonra aynı testleri tekrarlayarak işlevselliğin korunduğundan emin olun


Aşamalı Geçiş Stratejisi:

Geniş çaplı API değişikliklerini aşamalı olarak yapın
Her aşamada bir bileşen grubunu güncelleyin ve test edin


*******

 . callMcpApi Fonksiyonunu Merkezileştirme

/src/lib/mcp/helpers/index.ts içindeki mevcut callMcpApi fonksiyonunu projenin merkezi API erişim noktası olarak belirledik
Ana mcp/index.ts dosyasında eski callMcpApi fonksiyonunu callMcpApi_DEPRECATED olarak işaretledik
Projenin farklı yerlerinden bu merkezi fonksiyona erişim için gerekli export işlemlerini ekledik
Geriye dönük uyumluluk için eski fonksiyonu koruduk ancak yeni geliştirmelerde kullanılmaması için işaretledik

2. Hata İzleme Sistemi Entegrasyonu

logApiError fonksiyonunu kapsamlı bir hata izleme mekanizmasına dönüştürdük
Hata bilgilerini daha detaylı formatta kaydedecek şekilde geliştirdik
Harici hata izleme servislerine (Sentry, LogRocket vb.) entegrasyon için altyapı hazırladık
Tarayıcı bilgileri ve kullanıcı bağlamı da dahil olmak üzere zengin hata bilgilerini toplama mekanizması ekledik
İhtiyaç duyulduğunda kolayca aktifleştirilebilecek şekilde tasarladık

3. MCP API Geliştirmeleri
3.1. Müşteriye Özel Ürün Satışları API'si
Müşteri ID'sine göre ürün satışlarını almak için get-product-sales-by-customer adında özel bir MCP API metodu ekledik:

Gerekli parametreler:

customerId (zorunlu): Müşteri ID'si
includeStaff (opsiyonel): Personel bilgilerini de getirme seçeneği


Dönüş değeri:

Müşteriye ait tüm ürün satışları
Her satış için ödeme bilgileri
Her satış için toplam ödemeler ve kalan miktar



3.2. Randevu İşlemleri İçin Yardımcı Fonksiyonlar
Randevu işlemleri için kolay kullanılabilir yardımcı fonksiyonlar ekledik:

createAppointment: Yeni randevu oluşturma
updateAppointment: Mevcut bir randevuyu güncelleme
deleteAppointment: Randevu silme
getAppointmentsByDate: Belirli bir tarihteki randevuları getirme

Her fonksiyon hata yönetimi ve bildirim özelliklerine sahiptir.
4. Diğer İyileştirmeler

getProductSales fonksiyonunu müşteriye göre filtreleme yapabilecek şekilde geliştirdik
Mevcut ürün satışları metodunu (getProductSales) müşteri ID'sine göre filtreleme yapacak şekilde güncelledik
Tüm yeni metodlar için kapsamlı hata yakalama ve raporlama mekanizmaları ekledik

Kullanım Örnekleri
javascriptCopy// Merkezileştirilmiş callMcpApi kullanımı
import { callMcpApi } from '@/lib/mcp';

const result = await callMcpApi('get-services', { includeDeleted: false }, {
  showToast: true,
  customErrorMsg: 'Hizmetler yüklenemedi'
});

// Müşteri ürün satışlarını getirme
import { getCustomerProductSales } from '@/lib/mcp';

const sales = await getCustomerProductSales('customer123', { 
  includeStaff: true,
  showToast: true 
});

// Randevu işlemleri
import { appointmentHelpers } from '@/lib/mcp';

// Yeni randevu oluşturma
const newAppointment = await appointmentHelpers.createAppointment({
  customerId: 'customer123',
  staffId: 'staff456',
  date: '2025-03-20T14:00:00Z',
  serviceId: 'service789'
}, { showToast: true });

// Randevu güncelleme
await appointmentHelpers.updateAppointment('appointment123', {
  date: '2025-03-21T15:00:00Z',
  notes: 'Randevu saati değiştirildi'
});
Bu geliştirmeler sayesinde, API çağrıları daha tutarlı ve yönetilebilir hale getirilmiş, hata izleme mekanizması geliştirilmiş ve özel kullanım senaryoları için yeni metodlar eklenmiştir.

 *****





]


# MCP (Model Context Protocol) API Dokümantasyonu

## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Mimari Yapı](#mimari-yapı)
- [MCP API Kullanımı](#mcp-api-kullanımı)
- [Mevcut API Araçları (Tools)](#mevcut-api-araçları-tools)
- [API Yanıt Formatları](#api-yanıt-formatları)
- [REST API'den MCP API'ye Geçiş](#rest-apiden-mcp-apiye-geçiş)
- [PostgreSQL Entegrasyonu](#postgresql-entegrasyonu)
- [Hata Yakalama ve Çözümleri](#hata-yakalama-ve-çözümleri)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

## Genel Bakış

MCP (Model Context Protocol), uygulamanızdaki modüller ve bileşenler arasında standardize edilmiş veri alışverişi sağlayan bir API protokolüdür. Klasik REST API'ler yerine tool-based bir yaklaşım kullanır ve daha esnek, modüler bir yapı sunar.

### Temel Avantajlar

- **Modülerlik**: Her bir işlevselliği bağımsız "araçlar" (tools) olarak tanımlama
- **Tutarlı API Desenı**: Tüm API çağrıları aynı endpoint üzerinden yapılır
- **Merkezi Yetkilendirme**: Tek bir noktadan güvenlik kontrolü
- **Kolay Genişletilebilirlik**: Yeni araçlar modüler olarak eklenebilir
- **Backend-Frontend Ayrımı**: Frontend yalnızca araç adları ve parametrelerle ilgilenir

## Mimari Yapı

MCP sistemi aşağıdaki bileşenlerden oluşur:

### 1. MCP Sunucusu (`src/app/api/mcp/route.ts`)

Ana API endpoint'i olarak görev yapan Next.js API route'u. Tüm araç çağrılarını işler ve yönlendirir.

### 2. MCP Araçları (`src/app/mcp-tools/`)

Her bir modül için özel araçları tanımlayan TypeScript dosyaları:
- `index.ts`: Tüm araçları birleştiren ana modül
- `services.ts`: Hizmetlerle ilgili araçlar
- `customers.ts`: Müşterilerle ilgili araçlar
- `staff.ts`: Personel ile ilgili araçlar
- `appointments.ts`: Randevularla ilgili araçlar
- `packages.ts`: Paketlerle ilgili araçlar
- `products.ts`: Ürünlerle ilgili araçlar
- `payments.ts`: Tahsilat ve ödemelerle ilgili araçlar
- ...ve diğerleri

### 3. Frontend Yardımcı Fonksiyonları (`src/lib/mcp/`)

MCP API'yi frontend'den çağırmak için kullanılan yardımcı fonksiyonlar.

## MCP API Kullanımı

### Temel API İstek Formatı

MCP API, tek bir endpoint (`/api/mcp`) üzerinden, farklı "araçları" çağırarak çalışır:

```javascript
// Örnek API isteği
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'call_tool',
    params: {
      name: 'get-services',  // Çağrılacak aracın adı
      arguments: {           // Araca gönderilecek parametreler
        includeDeleted: false
      }
    }
  })
});

const result = await response.json();
```

### Yardımcı Fonksiyon Kullanımı

Kolaylık için, doğrudan aracı çağıran bir yardımcı fonksiyon kullanabilirsiniz:

```javascript
// /src/lib/mcp/utils/index.ts içinde tanımlanan callMcpApi fonksiyonu
import { callMcpApi } from '@/lib/mcp/utils';

// Örnek kullanım
const services = await callMcpApi('get-services', { includeDeleted: false });
```

### Modül-Spesifik Yardımcı Fonksiyonlar

Her modül için özel yardımcı fonksiyonlar da mevcuttur:

```javascript
// Örnek: Hizmetler API'si
import { getServices, getServiceById } from '@/lib/mcp/services';

// Kullanım
const services = await getServices();
const service = await getServiceById('service-id');
```

## Mevcut API Araçları (Tools)

MCP sistemi, aşağıdaki kategorilerde çeşitli araçlar sunar:

### Hizmetler (Services)

- `get-services`: Tüm hizmetleri listeler
- `get-service-categories`: Tüm hizmet kategorilerini listeler
- `get-service-by-id`: ID'ye göre hizmet getirir
- `add-service`: Yeni hizmet ekler
- `update-service`: Hizmet günceller
- `delete-service`: Hizmet siler
- `bulk-update-service-prices`: Toplu fiyat güncellemesi yapar
- `get-service-price-history`: Fiyat değişikliği geçmişini getirir

### Müşteriler (Customers)

- `get-customers`: Tüm müşterileri listeler
- `get-customer-by-id`: ID'ye göre müşteri getirir
- `create-customer`: Yeni müşteri oluşturur
- `update-customer`: Müşteri bilgilerini günceller
- `delete-customer`: Müşteri siler

### Personel (Staff)

- `get-staff`: Tüm personeli listeler
- `get-staff-by-id`: ID'ye göre personel getirir
- `create-staff`: Yeni personel oluşturur
- `update-staff`: Personel bilgilerini günceller
- `delete-staff`: Personel siler
- `update-staff-permissions`: Personel yetkilerini günceller

### Randevular (Appointments)

- `get-appointments`: Randevuları filtreleme seçenekleriyle listeler
- `get-appointment-by-id`: ID'ye göre randevu getirir

### Paketler (Packages)

- `get-packages`: Tüm paketleri listeler
- `get-package-by-id`: ID'ye göre paket getirir
- `add-package`: Yeni paket ekler
- `update-package`: Paket günceller
- `delete-package`: Paket siler
- `get-package-categories`: Paket kategorilerini listeler

### Paket Satışları (Package Sales)

- `get-package-sales`: Paket satışlarını listeler
- `get-package-sale-by-id`: ID'ye göre paket satışı getirir
- `create-package-sale`: Yeni paket satışı oluşturur
- `update-package-sale`: Paket satışı günceller
- `delete-package-sale`: Paket satışı siler

### Ürünler (Products)

- `get-products`: Tüm ürünleri listeler
- `get-product-by-id`: ID'ye göre ürün getirir
- `create-product`: Yeni ürün oluşturur
- `update-product`: Ürün bilgilerini günceller
- `update-product-stock`: Ürün stok miktarını günceller
- `delete-product`: Ürün siler

### Ürün Satışları (Product Sales)

- `get-product-sales`: Ürün satışlarını listeler
- `get-product-sale-by-id`: ID'ye göre ürün satışı getirir
- `create-product-sale`: Yeni ürün satışı oluşturur
- `update-product-sale`: Ürün satışı günceller
- `delete-product-sale`: Ürün satışı siler

### Tahsilatlar ve Ödemeler (Payments)

- `get-payments`: Ödemeleri listeler
- `get-payment-by-id`: ID'ye göre ödeme getirir
- `create-payment`: Yeni ödeme oluşturur
- `update-payment-status`: Ödeme durumunu günceller
- `delete-payment`: Ödeme siler

### Veri Depolama (Project Data)

- `save-data`: Veriyi veritabanına kaydeder
- `load-data`: Veritabanından veri yükler
- `list-data`: Tüm verileri listeler

## API Yanıt Formatları

MCP API iki farklı formatta yanıt döndürebilir:

### 1. Standart Başarı Yanıtı

```json
{
  "success": true,
  "data": {
    // Yanıt verileri burada
  }
}
```

### 2. İçerik Tabanlı Yanıt (Claude Context için)

```json
{
  "success": true,
  "content": [
    {
      "type": "text",
      "text": "JSON formatında veri burada"
    }
  ]
}
```

### 3. Hata Yanıtı

```json
{
  "success": false,
  "error": "Hata mesajı burada"
}
```

## REST API'den MCP API'ye Geçiş

REST API'den MCP API'ye geçiş aşamalı olarak yapılmaktadır. İşte geçiş stratejisi:

### Geçiş Adımları

1. Her bir REST API için eşdeğer MCP aracı oluşturulur
2. Frontend bileşenlerinde `fetch('/api/...)` çağrıları `callMcpApi('...')` ile değiştirilir
3. Geçiş tamamlandıktan sonra eski REST API endpoint'leri kaldırılır

### Hybrid Çalışma Modu

Geçiş sırasında, pek çok bileşen hem eski REST API hem de yeni MCP API ile çalışabilir durumdadır:

```javascript
// Örnek: Hybrid çalışma modu
function CustomerList({ mcpApi = false }) {
  const loadCustomers = async () => {
    if (mcpApi) {
      // MCP API kullanımı
      return await callMcpApi('get-customers');
    } else {
      // Eski REST API kullanımı
      const response = await fetch('/api/customers');
      return await response.json();
    }
  };
}
```

### Tamamlanan Geçişler

- ✅ Hizmetler (Services) Modülü
- ✅ Paketler (Packages) Modülü
- ✅ Müşteriler (Customers) Modülü

### Yapılması Planlanan Geçişler

- Personel Modülü
- Randevular Modülü
- Çalışma Saatleri Modülü

## PostgreSQL Entegrasyonu

MCP API şimdi JSON dosyaları yerine PostgreSQL veritabanını kullanmaktadır.

### Veri Yapısı

- `project_data` tablosu: Genel proje verilerini saklar
- Diğer tablolar (services, customers, appointments, vb.) Prisma şeması ile tanımlanır

### MCP Veri Araçları

- `save-data`: Veriyi PostgreSQL veritabanına kaydeder
- `load-data`: PostgreSQL veritabanından veri yükler
- `list-data`: Tüm verileri listeler

```javascript
// Veri kaydetme örneği
const result = await mcp.call("save-data", { 
  data: { proje: "Test", adim: 1 },
  key: "proje-v1"
});
```

## Hata Yakalama ve Çözümleri

### Yaygın Hatalar ve Çözümleri

#### 1. "Bilinmeyen metod veya tool" Hatası

**Sorun:** Frontend'de çağrılan aracın (tool) backend'de tanımlanmamış olması.

**Çözüm:**
- MCP API tanımlamalarını kontrol edin (`/src/app/mcp-tools/`)
- Doğru araç ismini kullandığınızdan emin olun
- Eksik aracı backend'de tanımlayın

```javascript
// Örnek araç tanımı
server.tool(
  'get-payments',
  {
    startDate: z.string().optional(),
    endDate: z.string().optional()
  },
  async ({ startDate, endDate }) => {
    // İşlem mantığı
    return { success: true, data: ... };
  }
);
```

#### 2. API Yanıt Formatı Sorunları

**Sorun:** REST API ve MCP API farklı veri formatlarında yanıt döndürüyor.

**Çözüm:**
```javascript
// MCP API yanıtını işleme
let servicesData = [];
if (result.data && Array.isArray(result.data)) {
  servicesData = result.data;
} else if (result.content && result.content[0] && result.content[0].text) {
  try {
    servicesData = JSON.parse(result.content[0].text);
  } catch (e) {
    console.error('MCP API veri ayrıştırma hatası:', e);
  }
}
```

#### 3. Null/Undefined Veri Kontrolü

**Sorun:** Backend'deki veri yapısı değiştiğinde frontend'de null değer hataları.

**Çözüm:**
```javascript
// Null/undefined kontrolleri ekleme
const groupedServices = services && services.length > 0 ? services.reduce((acc, service) => {
  // Kategori bilgisini kontrol et
  if (!service.category) {
    console.warn('Hizmet için kategori bulunamadı:', service);
    return acc;
  }
  
  // İşlem yap
  return acc;
}, {}) : {};
```

### Hata Ayıklama Yöntemleri

1. **Tarayıcı Konsolunu Kontrol Edin**
   - API çağrılarını ve yanıtlarını inceleyin
   - Hata mesajlarını ve istisnaları kontrol edin

2. **Backend Loglarını İzleyin**
   - MCP API sunucusuna eklenmiş log mesajlarını takip edin
   - Sorunun frontend'de mi yoksa backend'de mi olduğunu belirleyin

3. **Araç İsimlerini Doğrulayın**
   - API çağrısındaki araç isimlerinin backend'de tanımlı olduğundan emin olun
   - `mcpTools` nesnesinde ilgili fonksiyonun bulunduğunu kontrol edin

4. **API Yanıt Yapısını İnceleyin**
   - API'nin döndürdüğü yanıt yapısını `console.log` ile inceleyin
   - Veri yapısındaki değişiklikleri kontrol edin

## En İyi Uygulamalar

### 1. MCP API Çağrıları için Yardımcı Fonksiyonlar Kullanın

```javascript
// Her yerde tekrar tekrar API çağrısı yazmak yerine:
import { callMcpApi } from '@/lib/mcp/utils';
import { getServices, getServiceById } from '@/lib/mcp/services';

// Kullanım
const services = await getServices();
```

### 2. Tür Güvenliği için TypeScript Tanımlamaları Kullanın

```typescript
// MCP API yanıtları için tip tanımları
interface McpApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Özel tip tanımları
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  categoryId: string;
  category?: ServiceCategory;
}

// Fonksiyon tanımları
async function getServices(): Promise<Service[]> {
  const result = await callMcpApi<McpApiResponse<Service[]>>('get-services');
  return result.success && result.data ? result.data : [];
}
```

### 3. Hata Kontrollerini Unutmayın

```javascript
// API çağrısında hata kontrolü
try {
  const result = await callMcpApi('get-services');
  if (!result.success) {
    console.error('API hatası:', result.error);
    // Kullanıcıya hata mesajı göster
    return;
  }
  
  // Veri null/undefined kontrolü
  if (!result.data || !Array.isArray(result.data)) {
    console.error('Geçersiz veri formatı');
    return;
  }
  
  // Veriyi işle
  setServices(result.data);
} catch (error) {
  console.error('İstek hatası:', error);
}
```

### 4. Yeni Araç Eklerken Standartlara Uyun

Yeni bir MCP aracı eklerken:

1. İlgili modül dosyasında (örn. `services.ts`) araç fonksiyonunu tanımlayın
2. `registerXXXTools` fonksiyonuna aracı ekleyin
3. `mcpTools` nesnesine aracı ekleyin
4. `mcpToolDescriptions` dizisine araç tanımını ekleyin
5. `/app/api/mcp/route.ts` dosyasında aracı işleyin

```typescript
// 1. Araç fonksiyonunu tanımla (services.ts)
export async function bulkUpdateServicePrices(data: any): Promise<ApiResponse> {
  // İşlem mantığı...
}

// 2. Araçları kaydet fonksiyonuna ekle
export function registerServiceTools(server: any) {
  // Diğer araçlar...
  
  server.tool(
    'bulk-update-service-prices',
    {
      services: z.array(z.object({
        id: z.string(),
        price: z.number()
      }))
    },
    async ({ services }) => {
      return await serviceTools.bulkUpdateServicePrices({ services });
    }
  );
}

// 3. mcpTools nesnesine ekle
export const serviceTools = {
  getServices,
  getServiceById,
  // ... diğer fonksiyonlar
  bulkUpdateServicePrices
};
```

Bu kapsamlı rehber, MCP (Model Context Protocol) API'nin yapısını, kullanımını, mevcut araçları ve yaygın sorunları çözmek için gerekli bilgileri içermektedir. API'de herhangi bir sorunla karşılaşıldığında bu belge referans alınabilir.


# MCP API Yardımcı Fonksiyonları ve Bileşen Entegrasyonu

Bu dokümantasyon, MCP API'yi kullanmak için gereken yardımcı fonksiyonları ve frontend bileşenlerinin MCP ile entegrasyonunu açıklar.

## İçindekiler

- [MCP API Yardımcı Fonksiyonları](#mcp-api-yardımcı-fonksiyonları)
  - [Ana API Çağrı Fonksiyonu](#ana-api-çağrı-fonksiyonu)
  - [Gelişmiş API Çağrı Fonksiyonu](#gelişmiş-api-çağrı-fonksiyonu)
  - [Modül Bazlı Yardımcı Fonksiyonlar](#modül-bazlı-yardımcı-fonksiyonlar)
- [Bileşen Entegrasyonu](#bileşen-entegrasyonu)
  - [Randevu Bileşeni Entegrasyonu](#randevu-bileşeni-entegrasyonu)
- [Hata İşleme Stratejileri](#hata-i̇şleme-stratejileri)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

## MCP API Yardımcı Fonksiyonları

MCP API'yi frontend bileşenlerinden kullanmak için bir dizi yardımcı fonksiyon bulunmaktadır.

### Ana API Çağrı Fonksiyonu

`callMcpApi`, MCP API'ye çağrı yapmak için kullanılan temel fonksiyondur ve `src/lib/mcp/utils/index.ts` içinde tanımlanmıştır:

```javascript
export async function callMcpApi(name: string, args: any = {}) {
  try {
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name,
          arguments: args
        }
      })
    });

    // API yanıtını JSON olarak alıyoruz
    const data = await response.json();
    
    // API hata durumlarını işleyelim
    if (!response.ok) {
      console.error(`MCP API hatası (${response.status}):`, data.error || 'Bilinmeyen hata');
      return {
        success: false,
        error: data.error || `HTTP Hata: ${response.status}`,
        ...data
      };
    }
    
    return data;
  } catch (error) {
    console.error(`MCP API çağrısı başarısız (${name}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
}
```

### Gelişmiş API Çağrı Fonksiyonu

`src/lib/mcp/helpers/index.ts` içindeki gelişmiş `callMcpApi` fonksiyonu, daha fazla özellik sunar:

```javascript
export const callMcpApi = async (
  methodName: string, 
  args: any, 
  options: { 
    showToast?: boolean; 
    customErrorMsg?: string;
    logErrors?: boolean;
  } = {}
) => {
  // Varsayılan opsiyonlar
  const { 
    showToast = false, 
    customErrorMsg = '', 
    logErrors = true 
  } = options;

  try {
    // API çağrısı...
    
    // Hata ve başarı durumlarını işleme
    // Toast bildirimleri gösterme
    // Loglama
    
    return responseData;
  } catch (error) {
    // Hata işleme...
    throw error;
  }
};
```

Bu gelişmiş sürüm şunları sağlar:
- Toast bildirimleri gösterme seçeneği
- Özelleştirilmiş hata mesajları
- Detaylı hata günlüğü
- HTML yanıtlarını işleme
- İki farklı yanıt formatını işleme (JSON data ve content[0].text)

### Modül Bazlı Yardımcı Fonksiyonlar

Proje modüler yapıda olduğundan, her modül kendi MCP yardımcı fonksiyonlarını tanımlar:

#### 1. Hizmetler (Services) Modülü

`src/lib/mcp/services.ts` içinde hizmetlerle ilgili yardımcı fonksiyonlar:

```javascript
// Hizmet kategorilerini getir
export async function fetchServiceCategoriesMcp(): Promise<any> {
  return callMcpApi('get-service-categories');
}

// Hizmetleri getir
export async function fetchServicesMcp(includeDeleted: boolean = false): Promise<any> {
  return callMcpApi('get-services', { includeDeleted });
}

// Hizmet ekle
export async function addServiceMcp(serviceData: ServiceData): Promise<any> {
  return callMcpApi('add-service', serviceData);
}

// Toplu fiyat güncelleme
export async function bulkUpdateServicePricesMcp(data: BulkPriceUpdate): Promise<any> {
  return callMcpApi('bulk-update-service-prices', data);
}

// ... diğer hizmet fonksiyonları
```

#### 2. Müşteriler (Customers) Modülü

`src/lib/mcp/customers/index.ts` içinde müşterilerle ilgili yardımcı fonksiyonlar:

```javascript
// Tüm müşterileri getir
export async function getCustomers(includeDeleted: boolean = false): Promise<Customer[]> {
  try {
    const response = await callMcpApi('get-customers', { includeDeleted });
    
    if (!response.success) {
      throw new Error(response.error || 'Müşteri listesi alınamadı');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('MCP müşteri listesi alınırken hata:', error);
    throw error;
  }
}

// ID'ye göre müşteri getir
export async function getCustomerById(id: string): Promise<Customer> {
  // Implementasyon...
}

// Yeni müşteri oluştur
export async function createCustomer(data: CreateCustomerParams): Promise<Customer> {
  // Implementasyon...
}

// ... diğer müşteri fonksiyonları
```

#### 3. Personel (Staff) Modülü

`src/lib/mcp/staff/index.ts` içinde personelle ilgili yardımcı fonksiyonlar:

```javascript
// Tüm personeli getir
export async function getStaff(includeInactive = false) {
  const result = await callMcpApi('get-staff', { includeInactive });
  
  if (result.success && result.data) {
    return result.data;
  } else {
    throw new Error(result.error || 'Personel listesi alınamadı');
  }
}

// ID'ye göre personel getir
export async function getStaffById(id: string) {
  // Implementasyon...
}

// Personel izinlerini güncelle
export async function updateStaffPermissions(id: string, permissions: string[]) {
  // Implementasyon...
}

// ... diğer personel fonksiyonları
```

## Bileşen Entegrasyonu

### Randevu Bileşeni Entegrasyonu

`/src/components/appointments/NewAppointmentModal/services/mcp-api.ts` dosyası, randevu bileşeninin MCP API entegrasyonunu göstermektedir:

```javascript
// MCP API wrapper fonksiyonları
export const fetchServicesMcpWrapper = async () => {
  try {
    return await fetchServicesMcp(false);
  } catch (err) {
    console.error("MCP hizmet veri getirme hatası:", err);
    throw new Error("Hizmet listesi alınamadı");
  }
};

export const fetchCustomersMcpWrapper = async () => {
  try {
    return await fetchCustomersMcp();
  } catch (err) {
    console.error("MCP müşteri veri getirme hatası:", err);
    throw new Error("Müşteri listesi alınamadı");
  }
};

// ... diğer MCP wrapper fonksiyonları

// Basitleştirilmiş dışa aktarımlar
export const getServices = fetchServicesMcpWrapper;
export const getCustomers = fetchCustomersMcpWrapper;
export const getCustomerDetails = fetchCustomerDetailsMcpWrapper;
export const getStaff = fetchStaffMcpWrapper;
export const getStaffDetails = fetchStaffDetailsMcpWrapper;
```

Bu dosya, aşağıdaki özellikleri sağlar:
- MCP API çağrıları için wrapper fonksiyonları
- Tüm API yanıt formatlarını işleme (başarı, hata, farklı formatlar)
- Hata ayıklama için detaylı konsol logları
- Fallback mekanizmaları (bir yöntem başarısız olduğunda diğerini deneme)

## Hata İşleme Stratejileri

MCP API entegrasyonunda kapsamlı hata işleme stratejileri uygulanmıştır:

### 1. Try-Catch Blokları

Tüm API çağrıları try-catch blokları içinde yapılır:

```javascript
try {
  const response = await callMcpApi('get-services');
  if (!response.success) {
    throw new Error(response.error || 'Hizmetler alınamadı');
  }
  return response.data;
} catch (error) {
  console.error('Hizmetler alınırken hata:', error);
  throw error;
}
```

### 2. API Yanıt Başarı Kontrolü

MCP API yanıtları her zaman `success` alanı kontrol edilerek işlenir:

```javascript
// MCP API başarı kontrolü
if (!responseData.success) {
  const errorMessage = `API başarısız (${methodName}): ${responseData.error || 'Bilinmeyen hata'}`;
  
  if (logErrors) {
    console.error(errorMessage, responseData.error);
  }
  
  if (showToast) {
    toast({
      variant: "destructive",
      title: "İşlem Başarısız",
      description: customErrorMsg || errorMessage
    });
  }
  
  throw new Error(errorMessage);
}
```

### 3. Özel Hata Türleri

Bazı durumlarda, özel hata türleri oluşturulur ve ek bilgi eklenir:

```javascript
// Eğer aynı telefon numarasıyla ilgili bir hata varsa ve existingCustomer bilgisi içeriyorsa
if (response.existingCustomer) {
  const customError = new Error(response.error || 'Bu telefon numarası ile kayıtlı müşteri bulunmaktadır');
  (customError as any).existingCustomer = response.existingCustomer;
  throw customError;
}
```

### 4. Hata Günlüğü

Hatalar detaylı bir şekilde loglanır:

```javascript
function logApiError(methodName: string, args: any, error: any) {
  // Detaylı hata bilgilerini oluştur
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
  const errorStack = error instanceof Error ? error.stack : 'Stack bilgisi yok';
  const serializedArgs = typeof args === 'object' ? JSON.stringify(args, null, 2) : String(args);
  
  // Konsola detaylı log yaz
  console.error(
    `[API HATA GÜNLÜĞÜ] ${timestamp}\n`,
    `Metod: ${methodName}\n`,
    `Argümanlar: ${serializedArgs}\n`,
    `Hata: ${errorMessage}\n`,
    `Stack: ${errorStack}\n`
  );
  
  // Hata izleme için veri yapısı
  // ...
}
```

## En İyi Uygulamalar

### 1. Tip Güvenliği ve TypeScript

MCP API çağrıları için tip tanımlamaları:

```typescript
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  appointments?: any[];
  packageSales?: any[];
  payments?: any[];
  productSales?: any[];
};

export async function getCustomers(includeDeleted: boolean = false): Promise<Customer[]> {
  // Implementasyon...
}
```

### 2. Farklı API Yanıt Formatlarını İşleme

MCP API iki farklı yanıt formatı döndürebilir, ikisini de işlemelisiniz:

```javascript
// Yanıt içinde data var mı?
if (result.success && result.data) {
  services = result.data;
} 
// Ya da content içinde JSON olabilir
else if (result.content && result.content[0]?.text) {
  try {
    services = JSON.parse(result.content[0].text);
  } catch (e) {
    console.error('JSON parse hatası:', e);
  }
}
```

### 3. Null ve Undefined Kontrolleri

API yanıtlarında null ve undefined değerleri her zaman kontrol edin:

```javascript
// Yanıt formatını kontrol et ve doğru veri yapısını çıkar
let staffList = [];

if (Array.isArray(response)) {
  staffList = response;
} else if (response && response.data && Array.isArray(response.data)) {
  staffList = response.data;
} else if (response && response.success) {
  // MCP API success format
  if (response.data && Array.isArray(response.data)) {
    staffList = response.data;
  } else if (response.content && Array.isArray(response.content)) {
    // MCP API content formatı
    try {
      const contentText = response.content[0]?.text;
      if (contentText) {
        const parsedData = JSON.parse(contentText);
        if (Array.isArray(parsedData)) {
          staffList = parsedData;
        } else if (parsedData.data && Array.isArray(parsedData.data)) {
          staffList = parsedData.data;
        }
      }
    } catch (e) {
      console.error("JSON parse hatası:", e);
    }
  }
}
```

### 4. Toast Bildirimler

Kullanıcıya işlem sonuçlarını bildirmek için toast bildirimlerini kullanın:

```javascript
if (showToast) {
  toast({
    variant: "destructive",
    title: "API Hatası",
    description: customErrorMsg || errorMessage
  });
}
```

### 5. Merkezi API Çağrı Fonksiyonu Kullanımı

Tüm API çağrıları için merkezi `callMcpApi` fonksiyonunu kullanın:

```javascript
import { callMcpApi } from '@/lib/mcp/helpers';

// Doğrudan MCP aracını çağır
const result = await callMcpApi('get-services', { includeDeleted: false });

// Ya da modül-spesifik yardımcı fonksiyonu kullan
import { fetchServicesMcp } from '@/lib/mcp/services';
const services = await fetchServicesMcp(false);
```

Bu dokümantasyon, MCP API'nin frontend ile entegrasyonu için gerekli tüm yardımcı fonksiyonları ve entegrasyon tekniklerini açıklamaktadır. Bu bilgiler, MCP API'yi kullanırken karşılaşılabilecek sorunları çözmede ve yeni bileşenleri MCP API'ye entegre etmede yardımcı olacaktır.




hibrit sistem asla kullanma sadece mcp apılerını kullan 


Backend-Frontend Veri Yapısı Uyumsuzluğu: Personel Sayfası Sorunu Çözümü
🔍 Tespit Edilen Sorun
Personel eklendiğinde veritabanına başarıyla kaydediliyor, ancak eklenen personel sayfada görünmüyordu. Bu, yeni eklenen personel bilgilerinin arayüzde görüntülenememesine neden oluyordu.
🔎 Sorunun Kaynağı
Backend ve frontend arasındaki veri yapısı uyumsuzluğu. Personel verileri için:

Backend şu şekilde veri döndürüyordu:
javascriptCopy{
  success: true,
  data: {
    activeStaff: [...personel dizisi...],
    allStaff: [...tüm personel dizisi...]
  }
}

Frontend ise veriyi şu şekilde işlemeye çalışıyordu:
javascriptCopyconst staffData = Array.isArray(result.data) ? result.data : [];
setStaff(staffData);


Frontend, result.data'nın doğrudan bir dizi olmasını bekliyordu, ancak result.data bir nesne olduğu için Array.isArray(result.data) her zaman false dönüyordu ve boş bir dizi ([]) kullanılıyordu.
💡 Çözüm Yaklaşımı
Backend ve frontend veri yapılarını inceleyerek, API yanıtının doğru bir şekilde işlenmesini sağladım.

Backend'den dönen verileri console.log ile inceledim
Veri yapısının nested (iç içe) olduğunu tespit ettim
Frontend kodunu, backend'in döndürdüğü yapıya uygun olarak güncelledim

javascriptCopy// ESKİ KOD
const staffData = Array.isArray(result.data) ? result.data : [];

// YENİ KOD
const staffData = result.data?.activeStaff || result.data?.allStaff || [];
🔧 Uygulanan Çözüm
src/app/(protected)/staff/page.tsx dosyasında fetchStaff fonksiyonunu güncelledim:
javascriptCopy// Backend yanıtı activeStaff ve allStaff içeren bir nesne şeklinde
// Eğer activeStaff mevcutsa onu, yoksa allStaff'ı kullan, o da yoksa boş dizi kullan
const staffData = result.data?.activeStaff || result.data?.allStaff || [];
setStaff(staffData);
Bu değişiklik ile:

Öncelikle result.data.activeStaff değerini kullanmaya çalışıyor
Bu değer yoksa result.data.allStaff değerine bakıyor
Hiçbiri yoksa, boş bir diziye geri dönüyor

🛡️ Gelecekte Benzer Sorunları Önlemek İçin Öneriler

API Sözleşmesi (Contract) Oluşturun: Backend ve frontend arasında API yanıt yapılarını önceden belirleyin ve dokümante edin.
TypeScript Tip Tanımlarını Kullanın: Backend ve frontend arasında paylaşılan tip tanımları, veri yapısı uyumsuzluklarını erken aşamada tespit etmenize yardımcı olur.
Hata Ayıklama Logları Ekleyin: API yanıtlarını console.log ile loglayın, böylece sorunları daha kolay tespit edebilirsiniz.
API Yanıtlarını Kontrol Edin: API'den dönen verileri işlemeden önce yapısını kontrol edin ve gerekirse dönüştürün.
Esnek Veri İşleme: Frontend kodunuzda, farklı API yanıt yapılarını işleyebilecek kadar esnek olun.

🧪 Benzer Sorunlarla Karşılaşıldığında İzlenecek Adımlar

API Yanıtını Logla: console.log() ile API'den dönen yanıtın tam yapısını kontrol edin.
Backend Kodunu İncele: API'nin ne döndürmesi gerektiğini anlamak için backend kodunu kontrol edin.
Frontend Beklentisini İncele: Frontend'in ne beklediğini ve gelen veriyi nasıl işlediğini kontrol edin.
En Az Değişiklikle Çözüm: Eğer mümkünse, sadece bir tarafta değişiklik yaparak sorunu çözmeye çalışın.
Hata İşleme Mekanizması Ekleyin: Gelecekte benzer hataları yakalamak için daha iyi hata işleme mekanizmaları ekleyin.

📚 Öğrenilen Dersler

API entegrasyonlarında veri yapısı tutarlılığı kritik öneme sahiptir
Basit bir veri yapısı uyumsuzluğu, veri akışını tamamen kesintiye uğratabilir
İyi bir hata ayıklama süreci ve loglama, bu tür sorunları çözmenin anahtarıdır
Backend ve frontend arasında açık bir iletişim ve dokümantasyon, entegrasyon sorunlarını önlemeye yardımcı olur

Bu deneyim, MCP (Model Context Protocol) API'si ve frontend React bileşenleri arasındaki entegrasyonların dikkatli bir şekilde yönetilmesi gerektiğini bir kez daha göstermiştir.



Backend-Frontend Veri Yapısı Uyumsuzluğu: Paket Satışları Sayfası Çözümü
🚨 Tespit Edilen Hata
Hata Mesajı: "Error: staffList.map is not a function"
Dosya: /src/components/package-sales/NewPackageSaleModal.tsx (Satır 423)
Konsol Hatası: staffList bir dizi olmadığı için üzerinde map() fonksiyonu çağrılamıyor
🔍 Sorunun Detaylı Analizi
Veri Yapısı Uyumsuzluğu
Backend API (get-staff) veriyi şu şekilde döndürüyor:
javascriptCopy{
  success: true,
  data: {
    activeStaff: [...personel dizisi...],  // Aktif personel
    allStaff: [...personel dizisi...]      // Tüm personel
  }
}
Ancak frontend kodu staffList'in doğrudan bir dizi olmasını bekliyor ve şu şekilde kullanıyor:
javascriptCopy{staffList.map((staff) => (
  <SelectItem key={staff.id} value={staff.id}>
    {staff.name} {staff.position && `(${staff.position})`}
  </SelectItem>
))}
Neden Bu Sorunla Karşılaşıldı?

Backend yanıtında veri bir nesne içinde döndürülüyor, ancak frontend doğrudan bir dizi bekliyor
Nesne üzerinde map() çağrısı yapılamadığı için JavaScript hatası oluşuyor
Personel sayfasında daha önce benzer bir sorun çözülmüştü, ancak paket satışları sayfasında bu düzeltme yapılmamıştı

💡 Çözüm Yaklaşımı
Çözüm üç adımda uygulandı:

Veri Dönüşümü: Backend'den gelen yanıttaki veri yapısını frontend'in beklediği yapıya dönüştürmek
Savunmacı Programlama: Veri işleme sırasında güvenli tip kontrolleri yapmak ve farklı durumları ele almak
Tutarlı Kod: Personel verisinin kullanıldığı tüm yerlerde aynı yaklaşımı uygulamak

🛠️ Uygulanan Düzeltmeler
1. PackageSalesClient.tsx - Veri Alımı Düzeltmesi
javascriptCopy// Personel listesini doğru formata dönüştür
if (staffResult.data) {
  // MCP API yanıtı { activeStaff, allStaff } şeklinde bir nesne döndürüyor olabilir
  if (staffResult.data.activeStaff) {
    setStaffList(staffResult.data.activeStaff);
  } else if (staffResult.data.allStaff) {
    setStaffList(staffResult.data.allStaff);
  } else if (Array.isArray(staffResult.data)) {
    // Doğrudan dizi olabilir
    setStaffList(staffResult.data);
  } else {
    console.error("Personel verisi beklenmeyen formatta:", staffResult.data);
    setStaffList([]);
  }
} else {
  console.error("Personel verisi bulunamadı");
  setStaffList([]);
}
2. NewPackageSaleModal.tsx - Personel Listesi İşleme Düzeltmesi
jsxCopy<SelectContent className="bg-white">
  {Array.isArray(staffList) 
    ? staffList.map((staff) => (
        <SelectItem key={staff.id} value={staff.id}>
          {staff.name} {staff.position && `(${staff.position})`}
        </SelectItem>
      ))
    : staffList?.activeStaff?.map((staff) => (
        <SelectItem key={staff.id} value={staff.id}>
          {staff.name} {staff.position && `(${staff.position})`}
        </SelectItem>
      ))
  }
</SelectContent>
3. NewPackageSaleModal.tsx - useEffect Düzeltmesi
javascriptCopyuseEffect(() => {
  // Personel listesini doğru şekilde işle
  let staffArray = [];
  
  if (Array.isArray(staffList)) {
    staffArray = staffList;
  } else if (staffList?.activeStaff) {
    staffArray = staffList.activeStaff;
  } else if (staffList?.allStaff) {
    staffArray = staffList.allStaff;
  }
  
  if (staffArray.length === 1 && !selectedStaffId) {
    setSelectedStaffId(staffArray[0].id);
  }
}, [staffList, selectedStaffId]);
4. NewPackageSaleModal.tsx - resetForm Fonksiyonu Düzeltmesi
javascriptCopyconst resetForm = () => {
  // Personel listesini doğru şekilde işle
  let staffArray = [];
  if (Array.isArray(staffList)) {
    staffArray = staffList;
  } else if (staffList?.activeStaff) {
    staffArray = staffList.activeStaff;
  } else if (staffList?.allStaff) {
    staffArray = staffList.allStaff;
  }
  
  setSelectedStaffId(staffArray.length === 1 ? staffArray[0].id : "");
  // diğer form sıfırlama işlemleri...
};
📚 Öğrenilen Dersler

Veri Yapıları Tutarlılığı: Backend ve frontend arasındaki veri yapıları tutarlı olmalı veya dönüşüm fonksiyonları kullanılmalı
Savunmacı Programlama: Her zaman gelen veri yapısını kontrol et ve olası farklı durumları ele al; özellikle:

Tip kontrolü (Array.isArray(), typeof)
Null/undefined kontrolü (?. optional chaining)
Alternatif veri kaynaklarını kullanma


Taşınabilir Kod: Bir yerde yapılan düzeltmeler, benzer verileri kullanan diğer bileşenlere de uygulanmalı
Hata Mesajı Analizi: "X is not a function" tarzı hatalar genellikle tip uyumsuzluklarını gösterir - bu tür bir hata gördüğünüzde veri yapısını kontrol edin

🛡️ Gelecekte Benzer Hataları Önleme Stratejileri

API Yanıt Paketleyiciler Kullanın: API yanıtlarını işleyen ve istenen formata dönüştüren merkezi fonksiyonlar oluşturun
TypeScript Tip Tanımlamaları: Hem backend hem de frontend'de paylaşılan tip tanımlamaları kullanarak tip güvenliği sağlayın
API Dokümantasyonu: Backend API'lerin döndürdüğü veri yapılarını ve beklenen parametreleri belgeleyin
Hata Yakalama Katmanı: Uygulamanın çeşitli kısımlarında hataları yakalayan ve anlamlı mesajlar döndüren bir hata yakalama katmanı ekleyin
Kod İncelemeleri: Backend değişiklikleri yapıldığında, frontend ekibiyle koordineli çalışın ve API sözleşmesindeki değişiklikleri bildirin

🔄 API Entegrasyonu İçin Veri İşleme Şablonu
Gelecekteki API entegrasyonları için kullanılabilecek güvenli bir şablon:
javascriptCopy// API yanıtını güvenli şekilde işleme
const processApiResponse = (response) => {
  // 1. Yanıt kontrolü
  if (!response || !response.success) {
    console.error("API yanıtı başarısız:", response?.error || "Bilinmeyen hata");
    return [];
  }
  
  // 2. Veri varlığı kontrolü
  const data = response.data;
  if (!data) {
    console.warn("API yanıtında veri yok");
    return [];
  }
  
  // 3. Farklı veri yapılarını ele alma
  if (Array.isArray(data)) {
    return data;
  } else if (data.items && Array.isArray(data.items)) {
    return data.items;
  } else if (typeof data === 'object') {
    // Nesne içindeki ilk dizi özelliğini bul
    const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
    if (arrayProps.length > 0) {
      return data[arrayProps[0]];
    }
  }
  
  // 4. Hiçbir şey bulunamazsa, boş dizi döndür
  console.warn("API yanıtında uygun veri yapısı bulunamadı:", data);
  return [];
};
Bu çözüm ve öğrenilen dersler, backend ve frontend arasındaki veri alışverişinden kaynaklanan sorunlarla başa çıkmak için sistemli bir yaklaşım sağlar.





# API Veri Formatı Uyumsuzluğu Sorunu: Tanı ve Çözüm Rehberi

## 1. Sorunun Tespiti

**Soruna İlişkin Önemli Gözlemler:**
- "Yeni randevu oluştur modalı personel verilerini hatalı çekiyor" şeklinde bir bildirim aldım
- Bu tür sorunlar genellikle API yanıtlarının beklenen formatta olmamasından kaynaklanır
- Veri akışını ve hata nedenini anlamak için kaynak kodunun analiz edilmesi gerekiyordu

### Tanı Metodolojisi:

1. **Kaynak Dosyaları Tarama:** İlk adımda randevu oluşturma modalını ve bileşenlerini içeren dosyaları inceledim:
   - `NewAppointmentModal.tsx`
   - `StaffSelector.tsx` 
   - `mcp-api.ts`
   - `useAppointmentForm.ts`

2. **Veri Akışı Analizi:** Kodun farklı bölümleri arasındaki veri akışını takip ettim ve sorunun nerede oluşabileceğini belirledim.
   - Personel verileri `fetchStaffMcpWrapper` fonksiyonu ile çekiliyordu
   - Bu veriler `StaffSelector` bileşenine iletiliyordu
   - Bileşen verileri render etmek için `staff.map()` metodunu kullanıyordu

3. **Benzer Sorunları İnceleme:** Proje dokümantasyonunda benzer sorunların daha önce yaşanıp yaşanmadığını kontrol ettim ve benzer bir veri formatı uyumsuzluğu sorununun daha önce yaşandığını gördüm.

## 2. Kök Nedenin Tanımlanması

**Temel Sorun: Backend ve Frontend Veri Yapısı Uyumsuzluğu**

Backend ve frontend arasında veri yapısı uyumsuzluğu tespit ettim. Sorun, personel verilerinin API'den dönen formatı ile frontend bileşenlerinin beklediği format arasındaki farklılıktan kaynaklanıyordu:

1. **Backend API Yanıt Yapısı:**
   ```javascript
   {
     success: true,
     data: {
       activeStaff: [...personel dizisi...],  // Aktif personel
       allStaff: [...personel dizisi...]      // Tüm personel
     }
   }
   ```

2. **Frontend Beklentisi:**
   ```javascript
   // StaffSelector.tsx bileşeni staff'ın doğrudan bir dizi olmasını bekliyordu
   staffList.map(staff => ...)
   ```

Bu durumda, `staffList`'in beklenen bir dizi olmadığı ve bunun yerine içinde diziler bulunan bir nesne olduğu için `map()` metodu çağrılamıyordu. Bu da büyük olasılıkla konsol hatasına neden oluyordu: `TypeError: staffList.map is not a function`

## 3. Çözüm Süreci

Sorunu çözmek için sistematik bir yaklaşım izledim:

### 1. Adım: MCP API Yanıt Dönüştürücüsünü Düzeltme

İlk olarak, `mcp-api.ts` dosyasındaki `fetchStaffMcpWrapper` fonksiyonunu güncelledim. Bu fonksiyon API yanıtını alıyor ve yapısını dönüştürüyordu. Yaptığım değişiklikler:

- Artık fonksiyon, API yanıtının formatına bakılmaksızın her zaman bir dizi döndürüyor
- Başta nesne içinde dizi döndürüyordu: `{ activeStaff: [], allStaff: [] }`
- Şimdi farklı formatlardaki API yanıtlarını işleyebiliyor:
  - `result.data.activeStaff` bir dizi ise bu diziyi döndürüyor
  - `result.data.allStaff` bir dizi ise bu diziyi döndürüyor
  - `result.data` direkt bir dizi ise bu diziyi döndürüyor

### 2. Adım: Form Hook'undaki Veri İşleme Mantığını Güncelleme

`useAppointmentForm.ts` içindeki personel verisi işleme mantığını basitleştirdim:

- Karmaşık koşullu kontroller yerine, doğrudan dizi kontrolü eklendi
- Artık API yanıtı bir dizi olacak şekilde beklendiğinden, dönüşüm süreci basitleştirildi

### 3. Adım: Bileşenlere Güvenlik Kontrolleri Ekleme

`StaffSelector.tsx` bileşenine çeşitli güvenlik kontrolleri ekledim:

- Gelen personel verisinin bir dizi olup olmadığı kontrolü
- Dizi değilse veya boşsa ne yapılacağına dair alternatif davranış
- Personel listesi yüklenemediğinde kullanıcıya bilgi veren bir hata mesajı

## 4. Benzer Sorunlar İçin Sistematik Yaklaşım

Gelecekte benzer bir sorunla karşılaşılırsa aşağıdaki adımlar izlenmelidir:

### Adım 1: Sorunu İzole Etme
- Hata mesajını dikkatlice analiz edin
- Hatanın nereden geldiğini bulmak için konsol loglarını kontrol edin
- Hatanın oluştuğu bileşeni ve fonksiyonu belirleyin

### Adım 2: Veri Akış Analizi
- Veriyi API'den alan fonksiyonu bulun
- Veriyi işleyen ve dönüştüren ara katmanları kontrol edin
- Veriyi kullanan bileşenlerde beklenen format ile gerçek format arasındaki uyumsuzlukları tespit edin

### Adım 3: API Yanıt Formatını Anlama
- API'nin döndürdüğü yanıt formatını incelemek için konsol log ekleyin
- Mümkünse Network sekmesinden API yanıtlarını kontrol edin
- API değişikliklerinden kaynaklanan bir format değişikliği olup olmadığını araştırın

### Adım 4: Savunmacı Kodlama
- API yanıtının farklı formatlarını ele alan dönüştürücüler ekleyin
- Veri türü kontrolü ve doğrulama mekanizmaları uygulayın (null, undefined, dizi, nesne kontrolü)
- Hata durumlarında kullanıcı deneyimini koruyacak alternatif davranışlar tanımlayın

### Adım 5: Çözümü Uygulama ve Test
- API veri işleme katmanını düzeltin
- Bileşenlere güvenlik kontrolleri ekleyin
- Farklı senaryo ve veri formatlarıyla çözümü test edin

## 5. Önleyici Tedbirler

Benzer sorunların tekrarlanmasını önlemek için aşağıdaki uygulamaları öneririm:

### 1. Merkezi API Yanıt İşleme
Tüm API yanıtlarını tek bir yerde standartlaştıran bir ara katman oluşturun:

```javascript
function processApiResponse(response, expectedType = 'array') {
  // Başarı kontrolü
  if (!response.success) {
    console.error("API yanıtı başarısız:", response.error);
    return expectedType === 'array' ? [] : {};
  }

  // Veri varlığı kontrolü
  if (!response.data) {
    console.warn("API yanıtında veri yok");
    return expectedType === 'array' ? [] : {};
  }

  // Veri tipi dönüşümü
  if (expectedType === 'array') {
    // Farklı formatlardaki dizileri ele al
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.activeStaff && Array.isArray(response.data.activeStaff)) {
      return response.data.activeStaff;
    } else if (response.data.allStaff && Array.isArray(response.data.allStaff)) {
      return response.data.allStaff;
    }
    // Diğer tüm durumlar için boş dizi
    return [];
  }

  return response.data;
}
```

### 2. Tip Tanımlamaları Kullanın
TypeScript tip tanımlamalarını API yanıtları ve bileşen prop'ları için kullanın:

```typescript
// API yanıt tipi
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Personel verisi tip tanımı
interface Staff {
  id: string;
  name: string;
  isActive: boolean;
}

// API veri çekme fonksiyonu
async function fetchStaff(): Promise<Staff[]> {
  // ... API çağrısı ...
  return processApiResponse(response, 'array') as Staff[];
}
```

### 3. Bileşenlerde Savunmacı Render Yaklaşımı
Tüm bileşenlerde veri kontrolü yapmak için React'ın koşullu render özelliğini kullanın:

```jsx
// Savunmacı render yaklaşımı
{Array.isArray(data) ? (
  data.map(item => <Item key={item.id} {...item} />)
) : (
  <EmptyState message="Veri yüklenemedi" />
)}
```

### 4. API Değişikliklerini İzleme
API'de yapılan değişikliklerin frontend bileşenlerinde ne tür uyumsuzluklara neden olabileceğini önceden değerlendirin ve gerekli uyumlaştırma önlemlerini alın.

### 5. Hata Yönetimi Katmanı
Merkezi bir hata yönetimi sistemi oluşturun. Bu sistem hem kullanıcılara anlamlı geri bildirimler sağlamalı hem de geliştiriciler için hataları loglayıp raporlamalıdır.

## Sonuç

Bu tür veri formatı uyumsuzlukları, özellikle backend ve frontend ekipleri farklı zamanlarda veya ayrı ayrı çalıştığında yaygın olarak karşılaşılan sorunlardır. Savunmacı kodlama pratikleri, kapsamlı hata yönetimi ve tip kontrolü, bu tür sorunların sistem kesintilerine neden olmadan çözülmesine yardımcı olur.




****

# Randevu Düzenleme Modalında Ürün Listesinin Görüntülenmeme Sorunu: Çözüm Raporu

## 1. Sorunun Tanımı ve Belirtileri

### Sorun:
Randevu düzenleme modalında, ürün satışları listelenmiyordu. Kullanıcı "+Ürün" düğmesine tıkladığında ürünler doğru şekilde listeleniyor, fakat modalın kendisinde ürün satışları görüntülenmiyordu.

### Hata Mesajları:
Konsolda şu hata mesajları görünüyordu:
```
GET http://localhost:3000/api/products?context=sales 404 (Not Found)
Ürünleri getirme hatası: Error: Ürünler getirilemedi
```

### Sorunun Oluşma Şekli:
- Randevu düzenleme modalı açıldığında
- Ürün satışlarının gösterilmesi gereken bölümde hiçbir veri görünmüyordu
- "+Ürün" düğmesine tıklandığında ise ürünler düzgün şekilde listeleniyordu

## 2. Sorunun Kök Nedeni

### Temel Neden:
Projenin API mimarisinde bir değişiklik yapılmıştı. Eski REST API endpointleri yerine MCP (Model Context Protocol) API sistemi kullanılmaya başlanmıştı. Ancak, randevu düzenleme modalındaki bazı bileşenler hala eski REST API yollarını kullanmaya çalışıyordu.

### Teknik Detaylar:
1. `ProductSaleEditor` bileşeni `/api/products?context=sales` gibi eski REST API yollarını kullanıyordu
2. `AppointmentList` bileşeni bazı API çağrılarında MCP API kullanırken, bazılarında eski yolları kullanıyordu
3. MCP API'den dönen yanıt formatları ve veri yapıları farklıydı, ancak bileşenler eski formata göre yazılmıştı

## 3. Çözüm Yaklaşımı

### 1. API Çağrı Yönteminin Değiştirilmesi:

#### Eski REST API Çağrısı:
```javascript
const response = await fetch("/api/products?context=sales");
if (!response.ok) {
  throw new Error("Ürünler getirilemedi");
}
const data = await response.json();
setProducts(data);
```

#### Yeni MCP API Çağrısı:
```javascript
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'call_tool',
    params: {
      name: 'get-products',
      arguments: { context: 'sales' }
    }
  })
});
```

### 2. Veri Yapısı Dönüşümü:

MCP API'nin veri yapısı farklı olduğu için, API yanıtlarından veriyi çıkarmak için özel işleme kodu ekledik:

```javascript
let productsData = [];
if (result.data && Array.isArray(result.data)) {
  productsData = result.data;
} else if (result.content && result.content[0] && result.content[0].text) {
  try {
    productsData = JSON.parse(result.content[0].text);
    if (productsData.data && Array.isArray(productsData.data)) {
      productsData = productsData.data;
    }
  } catch (e) {
    console.error('JSON parse hatası:', e);
  }
}
```

### 3. Çok Katmanlı Yanıt İşleme:

MCP API'den dönen verinin iki farklı formatta olabileceğini tespit ettik:
1. `data` alanında doğrudan veri dizisi
2. `content[0].text` alanında JSON formatında veri

Bu iki formatı da işleyebilen kod ekledik.

### 4. Personel Verileri Özel İşleme:

Personel verilerinin bazen iç içe veri yapıları içinde döndüğünü gördük:

```javascript
let staffData = [];
if (result.data && Array.isArray(result.data)) {
  staffData = result.data;
} else if (result.data && result.data.activeStaff && Array.isArray(result.data.activeStaff)) {
  staffData = result.data.activeStaff;
} else if (result.content && result.content[0] && result.content[0].text) {
  // JSON parse işlemleri...
}
```

### 5. Önbellek Mekanizması:

API çağrıları başarısız olduğunda kullanılmak üzere önbellek mekanizması korundu:

```javascript
try {
  localStorage.setItem('all_products', JSON.stringify(productsData));
} catch (e) {
  console.error('Ürünleri önbelleğe alma hatası:', e);
}

// Hata durumunda önbellekten yükleme
const cachedProducts = localStorage.getItem('all_products');
if (cachedProducts) {
  try {
    const parsedProducts = JSON.parse(cachedProducts);
    if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
      setProducts(parsedProducts);
    }
  } catch (e) {
    console.error('Önbellekten ürün yükleme hatası:', e);
  }
}
```

## 4. Yapılan Değişiklikler

### 1. `ProductSaleEditor/index.tsx`:
- `fetchProducts` fonksiyonu MCP API kullanacak şekilde tamamen yeniden yazıldı
- `fetchStaffList` fonksiyonu MCP API kullanacak şekilde güncellendi
- API yanıtı işleme ve veri çıkarma kodları eklendi

### 2. `AppointmentList.tsx`:
- `fetchCustomerProductSales` fonksiyonu MCP API yanıt yapısıyla uyumlu hale getirildi
- Ürün ve personel verilerini yükleyen kod, farklı veri yapılarını işleyebilecek şekilde güncellendi
- Veri boş dönerse veya farklı formatta dönerse işleyebilecek savunmacı kodlama yapıldı

## 5. Öğrenilen Dersler

1. **API Mimarisi Değişikliklerinde Dikkat Edilmesi Gerekenler:**
   - API mimarisi değiştiğinde, tüm uygulama bileşenlerinin bu değişikliğe uyum sağlaması gerekir
   - Hibrit kullanım (bazı yerlerde eski, bazı yerlerde yeni API) sorunlara yol açar

2. **Veri Yapılarında Esneklik:**
   - Backend yapısı değişebileceği için, veri yapısı değişikliklerine karşı esnek kod yazılmalı
   - Frontend'de güvenli veri işleme ve doğrulama mekanizmaları olmalı

3. **Savunmacı Programlama:**
   - API yanıtlarında birden fazla format olabileceği göz önünde bulundurulmalı
   - Nesnelerin varlığı her zaman kontrol edilmeli (null/undefined kontrolleri)
   - Hata durumlarında alternatif yöntemler (önbellek gibi) kullanılmalı

4. **API Entegrasyon Testleri:**
   - API değişikliklerinden sonra tüm bileşenlerin test edilmesi gerekir
   - Farklı senaryolar (başarılı/başarısız API çağrıları) test edilmeli

## 6. Gelecekte Benzer Sorunları Önlemek İçin Öneriler

1. **Merkezi API İstemcisi:**
   - Tüm API çağrıları merkezi bir yerden yapılmalı (örn. `callMcpApi` gibi)
   - Eski API çağrıları kullanımdan kaldırılmalı

2. **API Yanıt Dönüştürücüler:**
   - API yanıtlarını bileşenlerin beklediği formata dönüştüren ara katman kullanılmalı
   - Bu katman, farklı API formatlarını tek bir tutarlı formata dönüştürmeli

3. **API Kontrat Dokümanları:**
   - Backend ve frontend takımları arasında API kontratları oluşturulmalı
   - API değişiklikleri önceden duyurulmalı ve dokümante edilmeli

4. **Geçiş Stratejileri:**
   - API mimarisi değişiklikleri için aşamalı geçiş stratejileri oluşturulmalı
   - Geriye dönük uyumluluk sağlanmalı veya tüm uygulama aynı anda güncellenebilmeli

Bu çözüm, projedeki veri akışı sorunlarını çözerek, randevu düzenleme modalında ürün satışlarının doğru şekilde görüntülenmesini sağladı.



*****