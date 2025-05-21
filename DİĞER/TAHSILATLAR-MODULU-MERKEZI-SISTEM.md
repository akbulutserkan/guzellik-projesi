# Tahsilatlar Modülü Merkezi Sisteme Geçiş

Bu belge, Tahsilatlar (Payments) modülünün dengeli yaklaşımla merkezi sisteme geçişi hakkında bilgi içerir.

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Yapılan Değişiklikler](#yapılan-değişiklikler)
3. [Dengeli Yaklaşım Katmanları](#dengeli-yaklaşım-katmanları)
4. [Kullanım Örnekleri](#kullanım-örnekleri)
5. [Faydalar](#faydalar)
6. [Dikkat Edilmesi Gereken Noktalar](#dikkat-edilmesi-gereken-noktalar)

## Genel Bakış

Tahsilatlar modülü, aşağıdaki 3 katmanlı dengeli yaklaşıma göre yeniden yapılandırılmıştır:

1. **Formatlama Katmanı** (`/utils/payment/formatters.ts`):
   - Veri formatlaması ve doğrulaması
   - Formatleyici ve yardımcı fonksiyonlar

2. **Servis Katmanı** (`/services/paymentService.ts`):
   - Backend API entegrasyonu
   - Veri işleme ve tip tanımları

3. **Hook Katmanı** (`/hooks/usePaymentManagement.ts`):
   - React state yönetimi
   - Kullanıcı etkileşimleri
   - Form işlemleri

## Yapılan Değişiklikler

### 1. Yeni Dosyalar
- `/utils/payment/formatters.ts` - Formatlama ve doğrulama işlevleri
- `/services/paymentService.ts` - API entegrasyonu, tip tanımları ve iş mantığı
- `/hooks/usePaymentManagement.ts` - UI state ve kullanıcı etkileşim yönetimi

### 2. Güncellenen Sayfalar
- `/app/(protected)/payments/page.tsx` - Ana tahsilatlar listesi
- `/app/(protected)/payments/new/page.tsx` - Yeni tahsilat oluşturma
- `/app/(protected)/payments/[id]/page.tsx` - Tahsilat detay sayfası

## Dengeli Yaklaşım Katmanları

### 1. Formatlama Katmanı (`/utils/payment/formatters.ts`)
Bu katman şunları içerir:
- Para birimi formatlaması (`formatPrice`)
- Tarih formatlaması (`formatDate`, `formatDateTime`)
- Ödeme türü, şekli ve durum çevirileri (`getPaymentTypeText`, `getPaymentMethodText`, `getStatusText`)
- Durum renkleri (`getStatusColor`) 
- Form doğrulama (`validatePaymentData`)
- Toplam tahsilat hesaplama (`calculateTotalAmount`)

Örnekler:
```typescript
// Para formatlaması
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

// Ödeme türü standardizasyonu
export const getPaymentTypeText = (type: string): string => {
  const paymentTypeMap: Record<string, string> = {
    'CASH': 'Nakit',
    'Nakit': 'Nakit',
    // ... diğer eşleştirmeler
  };
  
  return paymentTypeMap[type] || type;
};
```

### 2. Servis Katmanı (`/services/paymentService.ts`)
Bu katman şunları içerir:
- Tip tanımlamaları (`Payment`, `CreatePaymentParams`, vs.)
- Backend API entegrasyonu
- Tahsilat işlemleri (`getPayments`, `getPaymentById`, `createPayment`, vs.)
- Yardımcı fonksiyonlar

Örnekler:
```typescript
// Tahsilatları getirme
export const getPayments = async (
  filters: PaymentFilterOptions = {}, 
  showToast: boolean = false
): Promise<Payment[]> => {
  try {
    const response = await callMcpApi('get-payments', filters, {
      showToast,
      customErrorMsg: 'Tahsilat listesi alınamadı'
    });
    
    // ... hata kontrolü ve veri işleme
    
    return response.data || [];
  } catch (error) {
    // ... hata işleme
  }
};
```

### 3. Hook Katmanı (`/hooks/usePaymentManagement.ts`)
Bu katman şunları içerir:
- State yönetimi
- API çağrıları için wrapper fonksiyonlar
- Form işlemleri
- Kullanıcı etkileşimleri
- Yetkilendirme kontrolleri

Örnekler:
```typescript
// Hook kullanımı
const {
  payments,
  loading,
  error,
  handleCreatePayment,
  fetchPayments,
  // ... diğer değerler ve işlevler
} = usePaymentManagement({ autoFetch: true });
```

## Kullanım Örnekleri

### 1. Tahsilatlar Sayfası
```tsx
function PaymentsPage() {
  // usePaymentManagement hook'unu kullan
  const {
    payments,
    loading,
    error,
    totalAmount,
    refreshing,
    handleRefresh,
    permissions
  } = usePaymentManagement({
    autoFetch: true,
    showToasts: true
  });
  
  // ... sayfa içeriği
}
```

### 2. Yeni Tahsilat Oluşturma
```tsx
function NewPaymentPage() {
  const {
    formData,
    formErrors,
    handleFormChange,
    handleCreatePayment,
    // ... diğer değerler
  } = usePaymentManagement();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleCreatePayment();
    // ... sonuç işleme
  };
  
  // ... form içeriği
}
```

### 3. Formatleyici Kullanımı
```tsx
import { formatDateTime, getStatusColor } from '@/utils/payment/formatters';

// Kullanım
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {formatDateTime(payment.createdAt)}
</td>

<span className={`rounded-full ${getStatusColor(payment.status)}`}>
  {payment.status}
</span>
```

## Faydalar

1. **Kod Tekrarının Azaltılması**: Ortak formatlama, doğrulama ve veri işleme fonksiyonları merkezi bir yerde toplanmıştır.

2. **Daha İyi Veri Yönetimi**: Servis katmanı sayesinde veri işlemleri standardize edilmiş ve doğrulamaları geliştirilmiştir.

3. **Gelişmiş Kullanıcı Deneyimi**: Optimistik UI güncellemeleri ile daha hızlı ve duyarlı bir arayüz sağlanmıştır.

4. **Bakımı Kolay Yapı**: Değişiklikler ilgili katmanlarda yapılabilir, tüm bileşenleri tek tek güncellemek gerekmez.

5. **Test Edilebilirlik**: Her katman ayrı ayrı test edilebilir.

6. **Yeniden Kullanılabilirlik**: Oluşturulan katmanlar farklı projelerde veya modüllerde yeniden kullanılabilir.

## Dikkat Edilmesi Gereken Noktalar

1. **Bağımlılık Yönetimi**: Hook içerisindeki useEffect ve useCallback fonksiyonlarında bağımlılık dizileri dikkatli şekilde düzenlenmelidir.

2. **Hata Yönetimi**: Servis katmanında gerçekleşen hataların UI'a düzgün şekilde yansıtılması önemlidir.

3. **Yerel State Güncellemesi**: API sonrası yerel state güncellemelerinin doğru yapılması, gereksiz API çağrılarını önler.

4. **Form Doğrulama**: Form doğrulamaları hem frontend (kullanıcı deneyimi için) hem de backend (güvenlik için) tarafında yapılmalıdır.

5. **Yetkilendirme Kontrolleri**: Hook içerisindeki yetkilendirme kontrolleri doğru şekilde kullanılmalıdır.

Bu yapı, diğer modüllerin benzer şekilde merkezi ve dengeli bir yaklaşıma geçişi için örnek model olarak kullanılabilir.
