# Modal ve Dialog Z-Index Sorunu Çözümü

## Sorun Tanımı

Uygulamamızda, modal içinde bir işlem yapılırken çıkan AlertDialog bileşenleri, modalın arkasında kalarak kullanıcıya görünmüyordu. Özellikle:

- Randevu oluşturma/düzenleme modalının içinde, randevular çakıştığında gösterilen uyarı dialog'u modalın arkasında kalıyordu
- Bu durum kullanıcının çakışma uyarısını görmesini ve gerekli aksiyonu almasını engelliyordu
- Sorun, React bileşenlerinin z-index değerlerinin doğru hiyerarşide olmamasından kaynaklanıyordu

## Sorunun Kök Nedeni

Radix UI'nin Dialog ve AlertDialog bileşenleri, varsayılan olarak sabit z-index değerleri kullanırlar:

- Dialog bileşeni: `z-50` (veya proje özelinde daha yüksek bir değer)
- AlertDialog bileşeni: Yine tipik olarak `z-50`

Bu durumda, eğer Dialog daha yüksek bir z-index değerine sahipse veya DOM hiyerarşisinde daha sonra render ediliyorsa, AlertDialog görünmez hale gelir.

## Çözüm

Sorunu çözmek için, özel bir yüksek öncelikli AlertDialog bileşeni oluşturduk:

1. Dialog ve Modal bileşenlerinden çok daha yüksek z-index değerlerine sahip özel bir AlertDialog türevi
2. Bu bileşen, diğer tüm UI elemanlarının üzerinde görünmesini sağlayacak şekilde tasarlandı

### 1. Özel HighPriorityAlertDialog Bileşeni

```tsx
// src/components/appointments/NewAppointmentModal/components/HighPriorityAlertDialog.tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const HighPriorityAlertDialog = AlertDialogPrimitive.Root

// ...diğer bileşenler...

const HighPriorityAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))

const HighPriorityAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <HighPriorityAlertDialogPortal>
    <HighPriorityAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[210] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
        className
      )}
      {...props}
    />
  </HighPriorityAlertDialogPortal>
))

// ...diğer bileşenler...

export {
  HighPriorityAlertDialog,
  HighPriorityAlertDialogTrigger,
  HighPriorityAlertDialogContent,
  // ...diğer export edilen bileşenler...
}
```

### 2. Dialogs Bileşeninin Güncellenmesi

```tsx
// src/components/appointments/NewAppointmentModal/Dialogs.tsx
'use client';

// Import our custom high-priority alert dialog components 
import {
  HighPriorityAlertDialog,
  HighPriorityAlertDialogAction,
  HighPriorityAlertDialogCancel,
  HighPriorityAlertDialogContent,
  HighPriorityAlertDialogDescription,
  HighPriorityAlertDialogFooter,
  HighPriorityAlertDialogHeader,
  HighPriorityAlertDialogTitle,
} from "./components/HighPriorityAlertDialog";

interface DialogsProps {
  // ...props...
}

export default function Dialogs({
  showWorkingHoursWarning,
  setShowWorkingHoursWarning,
  setIsWorkingHoursValid,
  handleSubmit,
  showConflictConfirmation = false,
  setShowConflictConfirmation = () => {},
  handleForceSubmitWithConflict = async () => {},
  conflictMessage = ''
}: DialogsProps) {
  return (
    <>
      {/* Çalışma Saatleri Uyarısı */}
      <HighPriorityAlertDialog open={showWorkingHoursWarning} onOpenChange={setShowWorkingHoursWarning}>
        <HighPriorityAlertDialogContent>
          {/* ...içerik... */}
        </HighPriorityAlertDialogContent>
      </HighPriorityAlertDialog>

      {/* Çakışma Onay Dialogu */}
      <HighPriorityAlertDialog open={showConflictConfirmation} onOpenChange={setShowConflictConfirmation}>
        <HighPriorityAlertDialogContent>
          {/* ...içerik... */}
        </HighPriorityAlertDialogContent>
      </HighPriorityAlertDialog>
    </>
  );
}
```

### 3. Çakışma Tespiti ve Dialog Gösterimi

`NewAppointmentModal/index.tsx` dosyasında, bir çakışma tespit edildiğinde dialog'un otomatik olarak gösterilmesi için bir `useEffect` ekledik:

```tsx
// Çakışma tespit edildiğinde direkt dialog aç
useEffect(() => {
  if (hasConflict && !showConflictConfirmation && !creationSuccess) {
    setConflictMessage(error || 'Seçtiğiniz saatte bir çakışma bulunmaktadır. Seçilen personel için bu saatte başka bir randevu var veya mesai bitiş saatine denk geliyor.');
    setShowConflictConfirmation(true);
  }
}, [hasConflict, showConflictConfirmation, creationSuccess, error]);
```

## Çözüm Özeti

Uygulanan çözümün ana noktaları:

1. Standart AlertDialog yerine çok daha yüksek z-index değerlerine sahip özel bir bileşen oluşturduk
   - Overlay için `z-[200]`
   - Content için `z-[210]`

2. Dialogs bileşenini bu yeni özel bileşeni kullanacak şekilde güncelledik

3. Herhangi bir çakışma durumunda, modalın içindeki bir uyarı yerine üst seviye bir dialog gösterilmesini sağladık

4. Modal açılırken ve kapanırken dialog state'lerinin doğru şekilde sıfırlanmasını sağladık

## Z-Index Hiyerarşisi Önerisi

Benzer sorunlarla karşılaşmamak için, uygulamanızdaki z-index değerlerini şu şekilde düzenleyin:

- Normal içerik: `z-0` - `z-10`
- Dropdown, Popover: `z-20` - `z-30`
- Tooltip: `z-40`
- Standart Modal/Dialog: `z-50` - `z-60`
- Toast bildirimleri: `z-70` - `z-80`
- Kritik uyarılar ve onay dialogları: `z-100+`

## Benzer Sorunları Teşhis Etme ve Çözme

Gelecekte benzer sorunlarla karşılaşırsanız:

1. **Teşhis**:
   - DevTools ile elemanların DOM'daki konumunu ve z-index değerlerini kontrol edin
   - Görünmeyen elemanların DOM'da olup olmadığını doğrulayın

2. **Çözüm yaklaşımları**:
   - İlgili bileşenin z-index değerini arttırın
   - Özel durumlara özgü yüksek öncelikli bileşenler oluşturun
   - Portal kullanımını doğru şekilde yapılandırın
   - React'in render sırasını dikkate alın

## Notlar

- Z-index değerleri göreli olduğu için, yeni bir stacking context oluşturan (örn. `position: relative` veya `transform` kullanan) elemanlar, kendi altındaki elemanların z-index hiyerarşisini sıfırlar
- Dialog ve Modal gibi portal kullanan bileşenler genellikle DOM'un farklı yerlerinde render edilirler ve bu da z-index hiyerarşisini etkileyebilir
