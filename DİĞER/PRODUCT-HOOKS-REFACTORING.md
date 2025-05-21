# Product Hooks Refactoring

## Overview

Bu dokümanda, büyük ve karmaşık olan `useProductSaleManagement.ts` hook'unu, "Tek Sorumluluk Prensibi" (Single Responsibility Principle) takip edilerek daha küçük ve özelleşmiş alt hook'lara ayırma süreci açıklanmaktadır. Bu refaktörleme, Appointment hook'ları için uygulanan yaklaşımın aynısını Product Sales hook'larına da uygulamayı amaçlar.

## Yapılan Değişiklikler

### 1. Oluşturulan Yeni Hook'lar

#### Product Sales Hook'ları

Product Sales hook'ları, tek bir büyük hook olan `useProductSaleManagement.ts`'den aşağıdaki daha küçük, odaklanmış hook'lara bölünmüştür:

1. **useProductSaleData.ts**
   - Sorumluluğu: Satış verilerinin alınması, oluşturulması, güncellenmesi ve silinmesi
   - Ana işlevler: fetchSales, handleCreateSale, handleUpdateSale, handleDeleteSale

2. **useProductSaleUI.ts**
   - Sorumluluğu: Form durumları ve UI etkileşimleri
   - Ana işlevler: validateSaleForm, validatePaymentForm, resetSaleForm, resetPaymentForm

3. **useProductSalePermissions.ts**
   - Sorumluluğu: Yetki kontrolleri
   - Ana işlevler: checkPermission

4. **useProductSaleEntities.ts**
   - Sorumluluğu: İlişkili varlıkların (ürünler, müşteriler, personel) yönetimi
   - Ana işlevler: fetchProducts, fetchCustomers, fetchStaffs

5. **useProductSaleDateRange.ts**
   - Sorumluluğu: Tarih aralığı filtresi ve ilgili yardımcı fonksiyonlar
   - Ana işlevler: setThisMonth, setLastMonth, setLastThreeMonths, setThisYear

#### Eksik ProductService Adaptörü

Product hook'larının kullandığı fakat mevcut olmayan `productService.ts` adaptörü oluşturuldu. Bu adaptör, `ApiService.products` servisini kullanarak Product hook'larının servis isteklerini yönetir.

### 2. Ana Hook'ların Güncellenmesi

Mevcut ana hook'lar yeniden yapılandırıldı:

1. **useProductManagement.ts**
   - Product alt hook'larını kullanarak (zaten ayrılmıştı)
   - Tek bir birleşik API sağlıyor

2. **useProductSaleManagement.ts**
   - ProductSale alt hook'larını kullanacak şekilde yeniden yazıldı
   - Ayrıştırılan hook'lardan gelen fonksiyonaliteyi birleştiriyor
   - Alt hook'lar arasındaki etkileşimleri yönetiyor
   - Dışa dönük temiz bir API sağlıyor

### 3. Oluşturulan İndeks Dosyaları

Hook'ların organize export edilmesi için indeks dosyaları eklendi:

1. **hooks/product/index.ts**
   - Product hook'ları için tekil export noktası

2. **hooks/productSale/index.ts**
   - ProductSale hook'ları için tekil export noktası

## Sağlanan Avantajlar

1. **Modülerlik**: Her hook'un tek ve net bir sorumluluğu var
2. **Bakım Kolaylığı**: Küçük parçalar halinde olduğu için sorun tespiti ve bakımı daha kolay
3. **Yeniden Kullanılabilirlik**: Hook'lar farklı bileşenlerde tekrar kullanılabilir
4. **Test Edilebilirlik**: Her hook izole bir şekilde test edilebilir
5. **Kod Kalitesi**: Tekrar eden kodlar azaldı ve sorumluluklar net bir şekilde ayrıldı
6. **Okunabilirlik**: Daha küçük dosyalarla kod anlaşılması kolaylaştı

## Örnek Kullanım

Her iki hook da aynı şekilde kullanılabilir, ancak arka planda daha modüler bir yapı kullanmaktadır:

```tsx
import { useProductManagement } from '@/hooks/useProductManagement';
import { useProductSaleManagement } from '@/hooks/useProductSaleManagement';

const ProductManagementComponent = () => {
  const { 
    products, 
    loading, 
    handleCreateProduct 
  } = useProductManagement();
  
  // ...
};

const ProductSalesComponent = () => {
  const {
    sales,
    loading,
    handleCreateSale
  } = useProductSaleManagement();
  
  // ...
};
```
