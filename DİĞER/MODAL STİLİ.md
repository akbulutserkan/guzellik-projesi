# Yeşil Modal Tasarım Sistemi

Bu doküman, projede kullanılan yeşil tonlu modal tasarım sisteminin detaylarını ve nasıl uygulanacağını açıklar.

## Genel Özellikler

- Başlıksız, minimalist modal tasarımı
- Tek butonlu arayüz (iptal butonu yok)
- Koyu yeşil (#204937) tema rengi
- Gölgeli, kenarlıksız form elemanları
- Yuvarlatılmış köşeli tasarım
- Tüm modallarda tutarlı görünüm

## Modal Bileşeni

Modal tasarımı için `DialogWithoutPrevent` bileşeni kullanılır:

```tsx
<DialogWithoutPrevent open={isModalOpen} onOpenChange={(open) => {
  if (!open) setIsModalOpen(false);
}}>
  <DialogWithoutPreventContent className="sm:max-w-[500px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto">
    {/* Form elemanları */}
    
    {/* Buton */}
    <Button 
      onClick={handleSubmit}
      className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
    >
      Ekle/Kaydet
    </Button>
  </DialogWithoutPreventContent>
</DialogWithoutPrevent>
```

## Form Elemanları

### Input

```tsx
<Input
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="Placeholder metni"
  className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
/>
```

### Select

```tsx
<Select
  value={selectValue}
  onValueChange={(value) => setSelectValue(value)}
>
  <SelectTrigger className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
    <SelectValue placeholder="Seçiniz" />
  </SelectTrigger>
  <SelectContent>
    {options.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## Buton

```tsx
<Button 
  onClick={handleAction}
  className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
>
  Ekle/Kaydet
</Button>
```

## Örnek Kullanım

Aşağıda tam bir modal örneği verilmiştir:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogWithoutPrevent, DialogWithoutPreventContent } from '@/components/ui/dialog-without-prevent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function YesilModalOrnek() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '' });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    // İşlem kodları
    setIsOpen(false);
  };
  
  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-[#204937] hover:bg-[#183b2d] text-white"
      >
        Modal Aç
      </Button>
      
      <DialogWithoutPrevent open={isOpen} onOpenChange={(open) => {
        if (!open) setIsOpen(false);
      }}>
        <DialogWithoutPreventContent className="sm:max-w-[500px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="İsim"
                className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              />
            </div>
            
            <div className="grid gap-2">
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kategori1">Kategori 1</SelectItem>
                  <SelectItem value="kategori2">Kategori 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleSubmit}
            className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
          >
            Kaydet
          </Button>
        </DialogWithoutPreventContent>
      </DialogWithoutPrevent>
    </>
  );
}
```

## Renk Kodları

- Ana Yeşil: `#204937`
- Hover Yeşil: `#183b2d`
- Beyaz Metin: `#ffffff`

## CSS Sınıfları

### Modal

- `sm:max-w-[500px]` - Maksimum genişlik
- `px-8 py-6` - İç dolgu
- `bg-white` - Beyaz arka plan
- `rounded-lg` - Yuvarlatılmış köşeler
- `shadow-2xl` - Belirgin gölge
- `border-0` - Kenarlık yok
- `mx-auto` - Yatayda ortalama

### Form Elemanları

- `w-full` - Tam genişlik
- `bg-white` - Beyaz arka plan
- `border-0` - Kenarlık yok
- `rounded-[8px]` - Yuvarlatılmış köşeler
- `px-3 py-2` - İç dolgu
- `text-left` - Sol hizalı metin
- `focus:ring-2 focus:ring-blue-500` - Odaklandığında mavi halka
- `focus:border-blue-500` - Odaklandığında mavi kenarlık
- `focus:outline-none` - Odaklandığında dış çizgi yok
- `shadow-md` - Orta gölge
- `hover:shadow-lg` - Hover durumunda güçlü gölge
- `transition-all` - Tüm değişiklikler için geçiş efekti

### Buton

- `w-full` - Tam genişlik
- `mx-auto` - Yatayda ortalama
- `mt-6` - Üst kenar boşluğu
- `shadow-md` - Orta gölge
- `hover:shadow-lg` - Hover durumunda güçlü gölge
- `bg-[#204937]` - Yeşil arka plan
- `hover:bg-[#183b2d]` - Hover durumunda koyu yeşil
- `text-white` - Beyaz metin




----- DROPDOWN STİLİ  -----

# Hizmetler Sayfası - Dropdown ve Hizmet Alanı Stil Kılavuzu

Bu dokümanda, hizmetler sayfasında kullanılan kategori dropdown'larının ve içlerindeki hizmet alanlarının stil detayları açıklanmıştır. Bu kılavuz, tutarlı bir görünüm için tasarım referansı olarak kullanılabilir.

## Kategori Dropdown (Accordion) Stili

Hizmetler sayfasında, kategoriler genişletilebilir/daraltılabilir bir accordion stili ile gösterilmektedir.

### Kategori Başlığı (Kapalı Durum)

```html
<div 
  class="px-4 py-2 flex justify-between items-center cursor-pointer bg-gray-200 rounded-lg"
  onClick={() => toggleCategory(category.id)}
>
  <!-- Sol Taraf - Kategori Adı ve İkon -->
  <div class="flex-1 flex items-center">
    <ChevronDown 
      class="h-4 w-4 mr-2 transition-transform" 
    />
    <h3 class="text-sm font-medium">{category.name}</h3>
  </div>
  
  <!-- Sağ Taraf - Hizmet Sayısı ve Düzenleme Butonları -->
  <div class="flex items-center space-x-2">
    <div class="text-xs text-gray-500 mr-3">
      {hizmetSayısı} hizmet
    </div>

    <!-- Düzenleme Butonu -->
    <button 
      class="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
      aria-label="Kategori Düzenle"
    >
      <Pencil class="h-4 w-4" />
    </button>

    <!-- Silme Butonu -->
    <button 
      class="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
      aria-label="Kategori Sil"
    >
      <Trash2 class="h-4 w-4" />
    </button>
  </div>
</div>
```

### CSS Özellikleri (Kategori Başlığı)

| Element | Özellik | Değer |
|---------|---------|-------|
| Kategori Container | Arka plan | `bg-gray-200` |
| Kategori Container | Padding | `px-4 py-2` |
| Kategori Container | Köşe yuvarlama | `rounded-lg` |
| Kategori Container | İmleç | `cursor-pointer` |
| Kategori Adı | Font | `text-sm font-medium` |
| Hizmet Sayısı | Font | `text-xs text-gray-500` |
| Chevron İkonu | Boyut | `h-4 w-4` |
| Chevron İkonu | Sağ Margin | `mr-2` |
| Chevron İkonu | Geçiş Efekti | `transition-transform` |
| Düzenleme/Silme Butonu | Boyut | `w-6 h-6` |
| Düzenleme/Silme Butonu | Arka plan | `bg-white hover:bg-gray-50` |
| Düzenleme/Silme Butonu | Gölge | `shadow-sm` |
| Düzenleme/Silme Butonu | Köşe yuvarlama | `rounded-full` |
| Düzenleme Butonu | Renk | `text-yellow-500 hover:text-yellow-700` |
| Silme Butonu | Renk | `text-red-500 hover:text-red-700` |

### Kategori İçeriği (Açık Durum)

```html
<div class="p-4 space-y-4">
  <!-- Hizmet Listesi -->
  <div class="space-y-3">
    <!-- Buraya hizmet alanları gelir -->
  </div>
</div>
```

### CSS Özellikleri (Kategori İçeriği)

| Element | Özellik | Değer |
|---------|---------|-------|
| İçerik Container | Padding | `p-4` |
| İçerik Container | Dikey Boşluk | `space-y-4` |
| Hizmet Listesi | Dikey Boşluk | `space-y-3` |

## Hizmet Alanı Stili

Kategori içinde listelenen her bir hizmet için kullanılan kart stili.

```html
<div class="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-lg transition-all hover:shadow-xl hover:bg-white">
  <!-- Sol Taraf - Hizmet Adı -->
  <div class="text-sm font-medium">{service.name}</div>
  
  <!-- Sağ Taraf - Süre, Fiyat ve Aksiyonlar -->
  <div class="flex items-center space-x-4">
    <!-- Süre -->
    <div class="text-sm text-gray-600">{service.duration} dk</div>
    
    <!-- Fiyat -->
    <div class="text-sm font-medium">{service.price} TL</div>
    
    <!-- Düzenleme Butonu -->
    <button 
      class="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
      aria-label="Hizmet Düzenle"
    >
      <Pencil class="h-4 w-4" />
    </button>
    
    <!-- Silme Butonu -->
    <button 
      class="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
      aria-label="Hizmet Sil"
    >
      <Trash2 class="h-4 w-4" />
    </button>
  </div>
</div>
```

### CSS Özellikleri (Hizmet Alanı)

| Element | Özellik | Değer |
|---------|---------|-------|
| Hizmet Container | Arka plan | `bg-gray-50 hover:bg-white` |
| Hizmet Container | Kenar çizgisi | `border border-gray-200` |
| Hizmet Container | Padding | `p-3` |
| Hizmet Container | Köşe yuvarlama | `rounded-lg` |
| Hizmet Container | Gölge | `shadow-lg hover:shadow-xl` |
| Hizmet Container | Geçiş Efekti | `transition-all` |
| Hizmet Adı | Font | `text-sm font-medium` |
| Süre Bilgisi | Font | `text-sm text-gray-600` |
| Fiyat Bilgisi | Font | `text-sm font-medium` |
| Düzenleme/Silme Butonu | Boyut | `w-6 h-6` |
| Düzenleme/Silme Butonu | Arka plan | `bg-white hover:bg-gray-50` |
| Düzenleme/Silme Butonu | Kenar çizgisi | `border-0` |
| Düzenleme/Silme Butonu | Padding | `p-0` |
| Düzenleme/Silme Butonu | Gölge | `shadow-sm` |
| Düzenleme/Silme Butonu | Köşe yuvarlama | `rounded-full` |
| Düzenleme Butonu | Renk | `text-yellow-500 hover:text-yellow-700` |
| Silme Butonu | Renk | `text-red-500 hover:text-red-700` |

## Önemli Etkileşim Durumları

### 1. Kategori Genişletildiğinde

- Chevron ikonu döner: `transform rotate-180`

```jsx
<ChevronDown className={`h-4 w-4 mr-2 transition-transform ${expandedCategories.includes(category.id) ? 'transform rotate-180' : ''}`} />
```

### 2. Hizmet Hover Durumu

- Gölge büyür: `shadow-lg` → `shadow-xl`
- Arka plan rengi değişir: `bg-gray-50` → `bg-white`

### 3. Buton Hover Durumu

- Arka plan rengi değişir: `bg-white` → `bg-gray-50`
- Metin rengi koyulaşır: 
  - Düzenleme: `text-yellow-500` → `text-yellow-700`
  - Silme: `text-red-500` → `text-red-700`

## Animasyon ve Geçiş Efektleri

1. **Kategori Açılma/Kapanma**: Chevron ikonu için `transition-transform` 
2. **Hizmet Kartı Hover**: `transition-all` ile tüm değişimlerin yumuşak olması sağlanır
3. **Buton Hover**: `transition-all` ile tüm buton değişimlerinin yumuşak olması sağlanır

## Boş Durum Gösterimi

Kategoride hizmet yoksa gösterilecek boş durum:

```html
<div class="text-center py-4">
  <p class="text-gray-500">Bu kategoride henüz hizmet bulunmuyor.</p>
</div>
```

Bu stil kılavuzu, hizmetler sayfasındaki tüm kategori ve hizmet alanlarının tutarlı görünmesini sağlamak için referans olarak kullanılabilir.


----- sil ve düzenle ikon stili ------


# Hizmetler Sayfası - Silme ve Düzenleme İkonları Stil Kılavuzu

Bu dokümanda, hizmetler sayfasında kategori ve hizmet alanlarında kullanılan silme ve düzenleme ikonlarının tam stil detayları açıklanmıştır.

## Düzenleme İkonu (Edit/Pencil)

Düzenleme işlemlerini başlatmak için kullandığımız kalem ikonu.

### Kategori Başlığında Düzenleme İkonu

```html
<button 
  onClick={(e) => {
    e.stopPropagation(); // Ana div'in tıklama olayını engeller
    setEditCategoryModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name
    });
  }}
  className="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
  aria-label="Kategori Düzenle"
>
  <Pencil className="h-4 w-4" />
</button>
```

### Hizmet Satırında Düzenleme İkonu

```html
<button 
  onClick={() => setEditServiceModal({
    isOpen: true,
    serviceId: service.id
  })}
  className="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
  aria-label="Hizmet Düzenle"
>
  <Pencil className="h-4 w-4" />
</button>
```

### Düzenleme İkonu CSS Özellikleri (Detaylı)

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Temel Renk | `text-yellow-500` | Sarı/turuncu kalem ikonu |
| Hover Renk | `hover:text-yellow-700` | Hover durumunda daha koyu sarı/turuncu |
| Arka Plan | `bg-white` | Beyaz arka plan |
| Hover Arka Plan | `hover:bg-gray-50` | Hover durumunda çok açık gri |
| Dizilim | `flex items-center justify-center` | İçeriği ortalayan flex konteyner |
| Genişlik | `w-6` | 1.5rem (24px) genişlik |
| Yükseklik | `h-6` | 1.5rem (24px) yükseklik |
| Köşe Yuvarlama | `rounded-full` | Tam daire şeklinde buton |
| Gölge | `shadow-sm` | Hafif gölge efekti |
| Kenar Çizgisi | `border-0` | Kenar çizgisi yok (sadece hizmet satırında) |
| Geçiş Efekti | `transition-all` | Tüm stil değişimlerinde yumuşak geçiş (sadece hizmet satırında) |
| İç Boşluk | `p-0` | İç boşluk yok (sadece hizmet satırında) |
| İkon Boyutu | `h-4 w-4` | 1rem (16px) genişlik ve yükseklik |

## Silme İkonu (Delete/Trash)

Silme işlemlerini başlatmak için kullandığımız çöp kutusu ikonu.

### Kategori Başlığında Silme İkonu

```html
<button 
  onClick={(e) => {
    e.stopPropagation(); // Ana div'in tıklama olayını engeller
    setDeleteCategoryModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      serviceCount: services.filter(s => s.categoryId === category.id).length
    });
  }}
  className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
  aria-label="Kategori Sil"
>
  <Trash2 className="h-4 w-4" />
</button>
```

### Hizmet Satırında Silme İkonu

```html
<button 
  onClick={() => setDeleteServiceModal({
    isOpen: true,
    serviceId: service.id,
    serviceName: service.name
  })}
  className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
  aria-label="Hizmet Sil"
>
  <Trash2 className="h-4 w-4" />
</button>
```

### Silme İkonu CSS Özellikleri (Detaylı)

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Temel Renk | `text-red-500` | Kırmızı çöp kutusu ikonu |
| Hover Renk | `hover:text-red-700` | Hover durumunda daha koyu kırmızı |
| Arka Plan | `bg-white` | Beyaz arka plan |
| Hover Arka Plan | `hover:bg-gray-50` | Hover durumunda çok açık gri |
| Dizilim | `flex items-center justify-center` | İçeriği ortalayan flex konteyner |
| Genişlik | `w-6` | 1.5rem (24px) genişlik |
| Yükseklik | `h-6` | 1.5rem (24px) yükseklik |
| Köşe Yuvarlama | `rounded-full` | Tam daire şeklinde buton |
| Gölge | `shadow-sm` | Hafif gölge efekti |
| Kenar Çizgisi | `border-0` | Kenar çizgisi yok (sadece hizmet satırında) |
| Geçiş Efekti | `transition-all` | Tüm stil değişimlerinde yumuşak geçiş (sadece hizmet satırında) |
| İç Boşluk | `p-0` | İç boşluk yok (sadece hizmet satırında) |
| İkon Boyutu | `h-4 w-4` | 1rem (16px) genişlik ve yükseklik |

## İkon Tıklama Etki Alanı

İkonların tıklama olaylarının daha geniş alanlarda çalışmasını sağlamak için bazı önemli detaylar:

1. **e.stopPropagation()**: Özellikle kategori başlığındaki butonlarda, butonları tıklarken kategori genişletme/daraltma işleminin etkilenmemesi için olay yayılımını durduruyoruz.

2. **Erişilebilirlik (Accessibility)**: Her buton için `aria-label` özelliği kullanılarak ekran okuyucu kullanıcılar için açıklayıcı etiketler eklenmiştir.

## İkon Etkileşim Davranışları

1. **Hover Durumu**:
   - İkon rengi koyulaşır (sarıdan koyu sarıya, kırmızıdan koyu kırmızıya)
   - Buton arka planı beyazdan çok açık griye değişir

2. **Tıklama Durumu**:
   - İlgili düzenleme veya silme modalını açar
   - Kategori butonları için `e.stopPropagation()` ile ana kategori tıklama olayını engeller

## Buton Bağımsız Konumlandırma

İkonlar birbirinden ve diğer içerikten ayrı, belirgin şekilde konumlandırılmıştır:

1. **Kategori Başlığında**:
   - Sağ tarafta hizmet sayısı etiketinden sonra 
   - `space-x-2` ile butonlar arasında yatay boşluk
   - `mr-3` ile hizmet sayısı ve butonlar arasında boşluk

2. **Hizmet Satırında**:
   - Sağ tarafta süre ve fiyat bilgisinden sonra
   - `space-x-4` ile öğeler arasında daha fazla yatay boşluk (süre, fiyat ve butonlar)

Bu stil kılavuzu, silme ve düzenleme ikonlarının tutarlı şekilde uygulanması için referans olarak kullanılabilir. İkonların dikkat çekici, kullanımı kolay ve anlaşılır olması, kullanıcı deneyimini önemli ölçüde iyileştirir.



------- BUTON STİLİ ------



# Hizmetler Sayfası - Buton Stilleri Kılavuzu

Bu dokümanda, hizmetler sayfasında kullanılan butonların stil detayları açıklanmıştır. Sayfada görülen ana butonlar, modal butonları ve işlem butonlarının tüm stil özelliklerini içerir.

## Ana Aksiyon Butonları

Sayfanın üst kısmında yer alan "Yeni Kategori" ve "Yeni Hizmet Ekle" butonları.

```html
<Button 
  onClick={() => setNewCategoryModal({ isOpen: true })}
  className="bg-[#204937] hover:bg-[#183b2d] text-white whitespace-nowrap"
>
  <Plus className="h-4 w-4 mr-2" /> Yeni Kategori
</Button>

<Button 
  onClick={() => setNewServiceModal({ isOpen: true })}
  className="bg-[#204937] hover:bg-[#183b2d] text-white whitespace-nowrap"
>
  <Plus className="h-4 w-4 mr-2" /> Yeni Hizmet Ekle
</Button>
```

### Ana Buton CSS Özellikleri

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Arka Plan | `bg-[#204937]` | Koyu yeşil arka plan (ana tema rengi) |
| Hover Arka Plan | `hover:bg-[#183b2d]` | Hover durumunda daha koyu yeşil |
| Metin Rengi | `text-white` | Beyaz metin |
| Metin Dizilimi | `whitespace-nowrap` | Metnin aynı satırda kalması |
| İkon Boyutu | `h-4 w-4` | 1rem (16px) genişlik ve yükseklik |
| İkon Sağ Boşluğu | `mr-2` | İkon ile metin arasındaki boşluk |

## Modal Kaydet Butonları

Modal içindeki onay veya kaydetme işlemini gerçekleştiren butonlar.

```html
<Button 
  onClick={handleSubmit}
  disabled={loading}
  className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
>
  {loading ? 'Kaydediliyor...' : 'Kaydet'}
</Button>
```

### Modal Kaydet Butonu CSS Özellikleri

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Genişlik | `w-full` | Modal genişliğinde tam genişlik |
| Yatay Hizalama | `mx-auto` | Ortalama |
| Üst Boşluk | `mt-6` | Üst kısımda 1.5rem (24px) boşluk |
| Gölge | `shadow-md` | Orta düzeyde gölge |
| Hover Gölge | `hover:shadow-lg` | Hover durumunda daha belirgin gölge |
| Arka Plan | `bg-[#204937]` | Koyu yeşil arka plan (ana tema rengi) |
| Hover Arka Plan | `hover:bg-[#183b2d]` | Hover durumunda daha koyu yeşil |
| Metin Rengi | `text-white` | Beyaz metin |
| Devre Dışı Durum | `disabled={loading}` | Yükleme sırasında devre dışı |

## Modal Ekle Butonları

Modal içinde yeni öğe eklemek için kullanılan butonlar (örn. yeni kategori ekle).

```html
<Button 
  onClick={async () => {
    await handleAddCategory();
    setNewCategoryModal({ isOpen: false });
  }}
  className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
>
  Ekle
</Button>
```

### Modal Ekle Butonu CSS Özellikleri

Kaydet butonuyla aynı stil özelliklerine sahiptir:

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Genişlik | `w-full` | Modal genişliğinde tam genişlik |
| Yatay Hizalama | `mx-auto` | Ortalama |
| Üst Boşluk | `mt-6` | Üst kısımda 1.5rem (24px) boşluk |
| Gölge | `shadow-md` | Orta düzeyde gölge |
| Hover Gölge | `hover:shadow-lg` | Hover durumunda daha belirgin gölge |
| Arka Plan | `bg-[#204937]` | Koyu yeşil arka plan (ana tema rengi) |
| Hover Arka Plan | `hover:bg-[#183b2d]` | Hover durumunda daha koyu yeşil |
| Metin Rengi | `text-white` | Beyaz metin |

## Temel Button Bileşeni Özellikleri

`<Button>` bileşeni için varsayılan stiller (shadcn/ui'dan alınan component):

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem; /* rounded-md */
  font-weight: 500; /* font-medium */
  font-size: 0.875rem; /* text-sm */
  height: 2.5rem; /* h-10 */
  padding-left: 1rem; /* px-4 */
  padding-right: 1rem; /* px-4 */
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

Bu temel özellikler, sayfadaki tüm butonlara uygulanır.

## Buton Durum Göstergeleri

### Yükleme Durumu

```jsx
{loading ? 'Kaydediliyor...' : 'Kaydet'}
```

Yükleme durumunda buton metni değişir ve buton devre dışı bırakılır (`disabled={loading}`).

### Devre Dışı Durumu

```css
.btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

Devre dışı butonlar, %50 opaklıkta görünür ve etkileşime girmez.

## Buton Grupları

Sayfanın üst kısmında bulunan buton grubu:

```html
<div className="flex items-center gap-2">
  <Button>Yeni Kategori</Button>
  <Button>Yeni Hizmet Ekle</Button>
</div>
```

### Buton Grubu CSS Özellikleri

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Dizilim | `flex items-center` | Yatay hizalama ve dikey ortalama |
| Buton Arası Boşluk | `gap-2` | Butonlar arasında 0.5rem (8px) boşluk |

## Buton İkon Kullanımı

Butonlarda ikonların doğru kullanımı:

```jsx
<Button>
  <Plus className="h-4 w-4 mr-2" /> Buton Metni
</Button>
```

### İkon CSS Özellikleri

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Boyut | `h-4 w-4` | 1rem (16px) boyutunda ikon |
| Sağ Boşluk | `mr-2` | İkon ile metin arasında 0.5rem (8px) boşluk |

## Modal İptal Butonları (Kullanılıyorsa)

Modal içinde iptal işlemi için kullanılan butonlar (bazı modallarda bulunabilir).

```html
<Button 
  onClick={() => onClose()}
  className="w-full mx-auto mt-2 shadow-md hover:shadow-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
>
  İptal
</Button>
```

### İptal Butonu CSS Özellikleri

| Özellik | Değer | Açıklama |
|---------|-------|----------|
| Genişlik | `w-full` | Modal genişliğinde tam genişlik |
| Yatay Hizalama | `mx-auto` | Ortalama |
| Üst Boşluk | `mt-2` | Üst kısımda 0.5rem (8px) boşluk |
| Gölge | `shadow-md` | Orta düzeyde gölge |
| Hover Gölge | `hover:shadow-lg` | Hover durumunda daha belirgin gölge |
| Arka Plan | `bg-gray-200` | Açık gri arka plan |
| Hover Arka Plan | `hover:bg-gray-300` | Hover durumunda daha koyu gri |
| Metin Rengi | `text-gray-700` | Koyu gri metin |

## Buton Boyutları

Farklı boyutlarda butonlar için CSS sınıfları:

### Standart Boyut (Varsayılan)
```css
/* Özel bir sınıf eklenmez */
/* Yükseklik: 2.5rem (40px) */
/* Font boyutu: 0.875rem (14px) */
```

### Küçük Boyut
```css
.btn-sm {
  height: 2rem; /* h-8 */
  padding-left: 0.75rem; /* px-3 */
  padding-right: 0.75rem; /* px-3 */
  font-size: 0.875rem; /* text-sm */
}
```

### Büyük Boyut
```css
.btn-lg {
  height: 2.75rem; /* h-11 */
  padding-left: 1.5rem; /* px-6 */
  padding-right: 1.5rem; /* px-6 */
  font-size: 0.875rem; /* text-sm */
}
```

Bu stil kılavuzu, hizmetler sayfasındaki tüm butonların tutarlı şekilde stillendirilmesi için kapsamlı bir referans sunmaktadır. Yeni butonlar eklerken veya mevcut butonları değiştirirken, buradaki stil özelliklerini takip ederek tutarlı bir kullanıcı arayüzü sağlayabilirsiniz.



--------------------------------