# Silme (Çöp Kutusu) İkonu Tasarım Kılavuzu

Bu belge, uygulama genelinde kullanılacak silme ikonunun tasarım özelliklerini tanımlar. Bu standart tasarımı uygulama içindeki tüm silme ikonları için tutarlı şekilde kullanılmalıdır.

## Tasarım Özellikleri

### Temel Özellikler
- **Şekil**: Tam yuvarlak
- **Kenar Çizgileri**: Yok
- **Gölge**: Hafif belirgin, havada duruyormuş gibi
- **Renk**: Kırmızı simge, beyaz arka plan

### CSS Özellikleri

```jsx
<Button 
  variant="secondary" 
  className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-8 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg p-0"
  onClick={() => handleDelete(itemId)}
  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
>
  <div className="flex items-center justify-center">
    <TrashIcon className="h-4 w-4" />
  </div>
</Button>
```

### Stil Detayları
- **rounded-full**: Tam yuvarlak köşeler
- **border-0**: Kenar çizgisi yok
- **shadow-md**: Normal durumdaki gölge
- **hover:shadow-lg**: Hover durumunda artan gölge
- **transition-all**: Hover efekti için yumuşak geçiş
- **text-red-500**: Kırmızı simge rengi
- **hover:text-red-700**: Hover durumunda koyu kırmızı
- **bg-white**: Beyaz arka plan
- **hover:bg-gray-50**: Hover durumunda hafif gri arka plan

## Kullanım Örnekleri

Bu tasarım, aşağıdaki bileşenlerde kullanılacaktır:
- Randevu silme butonları
- Ürün satışı silme butonları
- Liste öğeleri silme butonları
- Modal içindeki silme butonları
- Tablo satırlarındaki silme butonları

## Erişilebilirlik

Butonlara uygun `aria-label` özelliği eklenmelidir:
```jsx
aria-label="Sil"
```

## Örnek Görünüm

İkon, kenar çizgileri olmayan yuvarlak bir buton içinde hafif gölgeli ve havada duruyormuş gibi görünür:

```
   ╭─────╮
  │       │
 │    🗑️    │
  │       │
   ╰─────╯
   ⠀⠀⠀⠀⠀
```

Not: Bu tasarım talimatları, uygulama genelinde tutarlı bir arayüz için takip edilmelidir.
