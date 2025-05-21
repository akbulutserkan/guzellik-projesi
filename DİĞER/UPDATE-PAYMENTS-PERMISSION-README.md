# Ödemeler API Yetkilendirme Sistemi Güncellemesi

Bu doküman, ödeme API'lerinin yetkilendirme sistemindeki değişiklikleri açıklamaktadır.

## Yapılan Değişiklikler

### 1. `/api/payments-by-package` API Endpoint'i

**Önceki durum:** Yalnızca `VIEW_PAYMENTS` iznine sahip kullanıcılar erişebiliyordu.

**Şimdiki durum:** `VIEW_PAYMENTS` veya `VIEW_PACKAGE_SALES` iznine sahip kullanıcılar erişebilir.

```typescript
export const GET = withMultiPermissionRoute(getPaymentsByPackage, {
  GET: [Permission.VIEW_PAYMENTS, Permission.VIEW_PACKAGE_SALES]
});
```

### 2. `/api/payments-by-product` API Endpoint'i

**Önceki durum:** Yalnızca `VIEW_PAYMENTS` iznine sahip kullanıcılar erişebiliyordu.

**Şimdiki durum:** `VIEW_PAYMENTS` veya `VIEW_PRODUCT_SALES` iznine sahip kullanıcılar erişebilir.

```typescript
export const GET = withMultiPermissionRoute(getPaymentsByProduct, {
  GET: [Permission.VIEW_PAYMENTS, Permission.VIEW_PRODUCT_SALES]
});
```

### 3. `/api/payments` API Endpoint'i (GET)

**Önceki durum:** Yalnızca `VIEW_PAYMENTS` iznine sahip kullanıcılar erişebiliyordu.

**Şimdiki durum:** `VIEW_PAYMENTS`, `VIEW_PACKAGE_SALES` veya `VIEW_PRODUCT_SALES` iznine sahip kullanıcılar erişebilir.

```typescript
export const GET = withMultiPermissionRoute(getPayments, {
  GET: [Permission.VIEW_PAYMENTS, Permission.VIEW_PACKAGE_SALES, Permission.VIEW_PRODUCT_SALES]
});
```

**Not:** POST endpoint'i zaten çoklu izin kontrolü kullanıyordu, bu nedenle değiştirilmedi.

```typescript
export const POST = withMultiPermissionRoute(createPayment, {
  POST: [Permission.EDIT_PAYMENTS, Permission.EDIT_PACKAGE_SALES]
});
```

### 4. `/api/payments/[id]` API Endpoint'i

**Önceki durum:** Yalnızca `VIEW_PAYMENTS`, `EDIT_PAYMENTS` ve `DELETE_PAYMENTS` iznine sahip kullanıcılar erişebiliyordu.

**Şimdiki durum:** 
- GET: `VIEW_PAYMENTS`, `VIEW_PACKAGE_SALES` veya `VIEW_PRODUCT_SALES` iznine sahip kullanıcılar erişebilir.
- PUT: `EDIT_PAYMENTS`, `EDIT_PACKAGE_SALES` veya `EDIT_PRODUCT_SALES` iznine sahip kullanıcılar erişebilir.
- DELETE: `DELETE_PAYMENTS`, `DELETE_PACKAGE_SALES` veya `DELETE_PRODUCT_SALES` iznine sahip kullanıcılar erişebilir.

```typescript
export const GET = withMultiPermissionRoute(getPayment, {
  GET: [Permission.VIEW_PAYMENTS, Permission.VIEW_PACKAGE_SALES, Permission.VIEW_PRODUCT_SALES]
});

export const PUT = withMultiPermissionRoute(updatePayment, {
  PUT: [Permission.EDIT_PAYMENTS, Permission.EDIT_PACKAGE_SALES, Permission.EDIT_PRODUCT_SALES]
});

export const DELETE = withMultiPermissionRoute(deletePayment, {
  DELETE: [Permission.DELETE_PAYMENTS, Permission.DELETE_PACKAGE_SALES, Permission.DELETE_PRODUCT_SALES]
});
```

## Değişikliğin Nedeni

Paket satışlarını yönetme yetkisi olan personel, ödemeleri görüntüleme, düzenleme veya silme iznine sahip olmayabilir. Bu durum, paket satışları sayfasında ödeme bilgilerini görüntülerken, yeni ödeme eklerken veya ödeme silerken 403 Forbidden hatalarına neden oluyordu.

Değişikliklerle, paket satışı yetkisine sahip personel:
1. İlgili paket satışına ait ödemeleri görüntüleyebilir
2. Gerekirse yeni ödemeler ekleyebilir
3. Gerekirse ödemeleri düzenleyebilir
4. Gerekirse ödemeleri silebilir

## Çapraz Kontrol Listesi

- ✅ Paket satışı modülü (package-sales) - yetkilendirme güncellendi
- ✅ Ürün satışı modülü (product-sales) - yetkilendirme güncellendi
- ✅ Ödemeler modülü (payments) - yetkilendirme güncellendi
- ✅ Ödeme detay işlemleri (görüntüleme, düzenleme, silme) - yetkilendirme güncellendi

## Tüm Yetkiler İçin Bağımlılık Tablosu

| Modül | İlgili Yetkiler |
|-------|-----------------|
| Paket Satışları | VIEW_PACKAGE_SALES, ADD_PACKAGE_SALES, EDIT_PACKAGE_SALES, DELETE_PACKAGE_SALES, VIEW_PAYMENTS, EDIT_PAYMENTS, DELETE_PAYMENTS |
| Ürün Satışları | VIEW_PRODUCT_SALES, ADD_PRODUCT_SALES, EDIT_PRODUCT_SALES, DELETE_PRODUCT_SALES, VIEW_PAYMENTS, EDIT_PAYMENTS, DELETE_PAYMENTS |
| Ödemeler | VIEW_PAYMENTS, EDIT_PAYMENTS, DELETE_PAYMENTS |

Bu değişiklikler, personelin yetkilerini sıkı bir şekilde korurken aynı zamanda görevlerini etkin bir şekilde yerine getirmelerine olanak tanır.
