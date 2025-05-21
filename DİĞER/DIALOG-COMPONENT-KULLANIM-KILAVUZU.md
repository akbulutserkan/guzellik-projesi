# Dialog Bileşeni Kullanım Kılavuzu

Bu kılavuz, Dialog bileşeninin doğru kullanımını ve sık karşılaşılan hataları önlemeyi amaçlamaktadır.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Temel Kullanım](#temel-kullanım)
3. [Sık Karşılaşılan Hatalar](#sık-karşılaşılan-hatalar)
4. [İyi Uygulama Örnekleri](#iyi-uygulama-örnekleri)

## Genel Bakış

`Dialog` bileşeni, kullanıcı arayüzünde modal pencereler oluşturmak için kullanılır. Bu bileşen şu özellikleri sağlar:

- ESC tuşuna basıldığında otomatik kapanma
- Modal dışına tıklandığında otomatik kapanma
- İçerik odaklanması (focus trap)
- Erişilebilirlik özellikleri
- Otomatik X (kapatma) düğmesi

## Temel Kullanım

```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function SampleModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white">
          <DialogTitle>Modal Başlığı</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4 overflow-y-auto">
          Modal içeriği burada yer alır...
        </div>
        
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
          <Button onClick={() => onOpenChange(false)}>İptal</Button>
          <Button>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Sık Karşılaşılan Hatalar

### 1. Çift Kapatma Düğmesi (X)

🚫 **Yapılmaması Gereken:**

```jsx
<DialogHeader>
  <div className="flex justify-between items-center">
    <DialogTitle>Modal Başlığı</DialogTitle>
    {/* Ekstra kapatma düğmesi eklemeyin - hata! */}
    <button onClick={() => onOpenChange(false)}>
      <X size={20} />
    </button>
  </div>
</DialogHeader>
```

✅ **Doğru Kullanım:**

```jsx
<DialogHeader>
  <DialogTitle>Modal Başlığı</DialogTitle>
  {/* DialogContent zaten otomatik olarak X düğmesini ekler */}
</DialogHeader>
```

**Açıklama:** `DialogContent` bileşeni, otomatik olarak sağ üst köşeye bir kapatma düğmesi (X) ekler. Elle başka bir kapatma düğmesi eklememek gerekir, aksi takdirde iki adet kapatma düğmesi görünür.

### 2. Özel Stil İçin doğru yaklaşım

Eğer var olan X düğmesinin stilini değiştirmek istiyorsanız, tüm Dialog bileşenini değil, sadece closeButton className'ini özelleştirin:

```jsx
<Dialog>
  <DialogContent className="..." closeButtonClassName="hover:bg-red-100 text-red-500">
    {/* ... */}
  </DialogContent>
</Dialog>
```

## İyi Uygulama Örnekleri

### Modal İçeriği İçin Kaydırma Çubuğu

Uzun içerikler için, modal içeriğinin kaydırılabilir olmasını sağlamak için:

```jsx
<DialogContent className="p-0 max-h-[90vh]">
  <DialogHeader className="sticky top-0 bg-white">
    {/* ... */}
  </DialogHeader>
  
  <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
    {/* Uzun içerik */}
  </div>
  
  <DialogFooter className="sticky bottom-0 bg-white">
    {/* ... */}
  </DialogFooter>
</DialogContent>
```

### Genel İyi Uygulamalar

1. Her zaman `open` ve `onOpenChange` prop'larını kullanın
2. `DialogHeader` bileşenini başlık için kullanın
3. `DialogFooter` bileşenini butonlar için kullanın
4. Modal içeriğini özel bir div içine yerleştirin

Bu kılavuzu takip ederek, Dialog bileşenini doğru bir şekilde kullanabilir ve çift kapatma düğmesi gibi yaygın hataları önleyebilirsiniz.
