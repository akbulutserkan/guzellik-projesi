# Paket Satışları Yetki Düzeltmesi

Bu doküman, "Paket Satışları" modülü için yapılan yetki sistemi düzeltmelerini ve çözüm sürecini detaylı olarak açıklamaktadır.

## Tespit Edilen Sorunlar

1. Paket Satışları izinleri için Prisma şemasına ve PermissionsModal'a gerekli izinleri ekledik, ancak ilgili API rotalarında ve bağımlı API rotalarında gerekli güncellemeleri yapmadık.

2. Kullanıcılar "Paket Satışları" yetkisine sahip olsa bile `/api/staff` gibi bağımlı API'lere erişim yetkisine sahip değildi, bu nedenle `403 Forbidden` hataları alıyorlardı:
   ```
   GET /api/staff 403 in 556ms
   ```

3. Konsol hatası: `Error: Personel bilgileri alınamadı` - Bu hata, PackageSalesClient bileşeninde staff API çağrısının başarısız olmasından kaynaklanıyordu.

4. Permission update hatası: API'deki `params` kullanımından kaynaklanan bir hata vardı:
   ```
   Route "/api/staff/[id]/permissions" used `params.id`. `params` should be awaited before using its properties.
   ```

## Yapılan Düzeltmeler

### 1. Permissions API Düzeltmesi

Staff ID'sinin doğru şekilde alınması için:

```typescript
// Yanlış
const { id } = params;

// Doğru
const { id } = await params;
```

```typescript
async function updatePermissions(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { permissions } = await request.json();
    const { id } = await params; // await kullanımı burada önemli

    // ...
  }
}

export const PUT = withProtectedRoute(updatePermissions, {
  PUT: Permission.EDIT_STAFF
});
```

### 2. Staff API'sini Paket Satışları için Erişilebilir Hale Getirme

```typescript
// Önceki 
export const GET = withProtectedRoute(getStaff, {
  GET: Permission.VIEW_STAFF
});

// Yeni
export const GET = withMultiPermissionRoute(getStaff, {
  GET: [Permission.VIEW_STAFF, Permission.VIEW_PACKAGE_SALES]
});
```

### 3. Customers API'sini Paket Satışları için Erişilebilir Hale Getirme

```typescript
export const GET = withMultiPermissionRoute(getCustomers, {
  GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
});

export const POST = withMultiPermissionRoute(createCustomer, {
  POST: [Permission.ADD_CUSTOMERS, Permission.ADD_PACKAGE_SALES]
});
```

### 4. Packages API'sini Paket Satışları için Erişilebilir Hale Getirme

```typescript
export const GET = withMultiPermissionRoute(getPackages, {
  GET: [Permission.VIEW_PACKAGES, Permission.VIEW_PACKAGE_SALES]
});
```

### 5. Package Sales API'sini Koruma Altına Alma

```typescript
export const GET = withProtectedRoute(getPackageSales, {
  GET: Permission.VIEW_PACKAGE_SALES
});

export const POST = withProtectedRoute(createPackageSale, {
  POST: Permission.ADD_PACKAGE_SALES
});
```

## Edinilen Dersler

1. **Modül Bağımlılıklarının Önemi**: Bir modül yalnızca kendi API'lerine değil, kullandığı diğer modüllerin API'lerine de erişim izni gerektirir.

2. **withMultiPermissionRoute Kullanımı**: Birden fazla izinden herhangi birine sahip olmanın yeterli olduğu durumlarda `withMultiPermissionRoute` kullanılmalıdır.

3. **Dynamic Route Parametreleri**: Next.js'de dynamic route parametrelerini kullanırken `await params` kullanımına dikkat edilmelidir.

4. **Kapsamlı Güncelleme Gerekliliği**: Yeni izinler eklendiğinde, ilgili tüm sistemin (Prisma şeması, PermissionsModal, API rotaları, bağımlı API rotaları) güncellenmesi gerekir.

## Veritabanı Güncellemesi

Bu değişikliklerin tam olarak uygulanması için:

```bash
npx prisma migrate dev --name add_package_sales_permissions
npx prisma generate
```

## Sonuç

Bu düzeltmelerden sonra:

1. "Paket Satışları" izinlerine sahip kullanıcılar artık paket satış sayfasına tam olarak erişebilir.
2. Kullanıcılar personel, müşteri ve paket verilerine erişebilir.
3. İzin kontrolleri doğru şekilde uygulanır ve kullanıcılar yalnızca izin verilen işlemleri gerçekleştirebilir.

Bu düzeltme süreci, gelecekteki modül izin yapılandırmalarında tekrarlanabilecek sorunları önlemek için önemli dersler sağlamıştır. Yetki sistemi yapılandırması için daha kapsamlı rehberlik için `YETKI-SISTEMI-KILAVUZU.md` dosyasına bakınız.
