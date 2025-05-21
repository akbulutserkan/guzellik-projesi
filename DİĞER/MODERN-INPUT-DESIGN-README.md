# Modern Input Kutuları Tasarım Kılavuzu

Bu belge, uygulama genelinde kullanılacak modern input kutularının tasarım özelliklerini tanımlar. Bu standart tasarımı uygulama içindeki tüm seçici kutular, input alanları ve benzer bileşenler için tutarlı şekilde kullanmalısınız.

## Tasarım Özellikleri

### Temel Özellikler
- **Köşe Ovalliği**: Hafif oval köşeler
- **Kenar Çizgileri**: Yok
- **Gölge**: Belirgin, havada duruyormuş gibi
- **Renk**: Beyaz arka plan
- **Hover Efekti**: Gölge büyümesi

### CSS Özellikleri

```jsx
<button
  className="text-sm px-3 py-2 rounded-[8px] cursor-pointer w-full text-center bg-white border-0 shadow-md hover:shadow-lg transition-all"
  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
  onClick={onClick}
  type="button"
>
  {buttonText}
</button>
```

### Stil Detayları
- **rounded-[8px]**: Hafif oval köşeler
- **border-0**: Kenar çizgisi yok
- **shadow-md**: Normal durumdaki gölge
- **hover:shadow-lg**: Hover durumunda artan gölge
- **transition-all**: Hover efekti için yumuşak geçiş
- **bg-white**: Beyaz arka plan
- **px-3 py-2**: Uygun iç kenar boşluğu
- **text-sm**: Küçük boyutlu yazı tipi

## DatePicker ile Kullanım

React DatePicker ile özel input bileşeni kullanımı:

```jsx
const CustomInput = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void; label: string }
>(({ value, onClick, label }, ref) => (
  <button
    className="text-sm px-3 py-2 rounded-[8px] cursor-pointer w-full text-center bg-white border-0 shadow-md hover:shadow-lg transition-all"
    style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
    onClick={onClick}
    ref={ref}
    type="button"
  >
    {label || value}
  </button>
));

CustomInput.displayName = 'CustomInput';

// Kullanım
<DatePicker
  selected={selectedDate}
  customInput={<CustomInput label={formattedDate} />}
  onChange={(date) => handleDateChange(date)}
  dateFormat="yyyy-MM-dd"
/>
```

## Normal Input Alanları için Kullanım

Text input, number input, vb. alanlarda kullanım:

```jsx
<input
  type="text"
  className="text-sm px-3 py-2 rounded-[8px] w-full bg-white border-0 shadow-md hover:shadow-lg transition-all outline-none focus:ring-2 focus:ring-blue-500"
  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
  placeholder="Bir değer girin"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
/>
```

## Select Kutuları için Kullanım

Açılır menüler için kullanım:

```jsx
<select
  className="text-sm px-3 py-2 rounded-[8px] w-full bg-white border-0 shadow-md hover:shadow-lg transition-all outline-none focus:ring-2 focus:ring-blue-500"
  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
>
  <option value="">Seçiniz</option>
  <option value="option1">Seçenek 1</option>
  <option value="option2">Seçenek 2</option>
</select>
```

## Örnek Görünüm

Butonlar ve input alanları, kenar çizgileri olmayan hafif gölgeli, hafif oval köşeli ve havada duruyormuş gibi görünür:

```
   ╭──────────────────╮
  │                    │
 │      Input Text      │
  │                    │
   ╰──────────────────╯
         ⠀⠀⠀⠀⠀
```

## Kullanım Örnekleri

Bu tasarım, aşağıdaki bileşenlerde kullanılabilir:
- Form girdi alanları
- Tarih ve saat seçicileri
- Arama kutuları
- Açılır menüler
- Butonlar
- Filtreleme kontrolleri
- Sayfa numaralandırma kontrolleri

## Erişilebilirlik Önerileri

- Kontrastı yüksek tutun
- Odaklanıldığında görsel bir gösterge sağlayın
- Uygun etiketler kullanın
- Yeterli boyut ve dolgu (padding) sağlayın

Bu tasarım talimatları, uygulama genelinde tutarlı ve modern bir arayüz için takip edilmelidir.
