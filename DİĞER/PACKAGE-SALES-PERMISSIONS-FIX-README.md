# Paket Satışları İzin Sistemi Düzeltme Belgeleri

Bu doküman, Paket Satışları (Package Sales) için eklediğimiz yeni izin sisteminde karşılaşılan sorunları ve yapılan düzeltmeleri kapsamlı bir şekilde açıklamaktadır.

## Önemli Sorunlar ve Çözümleri

### 1. 403 Forbidden Hataları

```
GET /api/staff 403 in 556ms
Error: Personel bilgileri alınamadı
```

**Sorun**: Paket Satışları sayfası personel (staff) verilerine erişmeye çalışıyor, ancak bu API rotası sadece `VIEW_STAFF` izni olan kullanıcılara açık.

**Çözüm**: Staff API'sini, `VIEW_PACKAGE_SALES` iznine sahip kullanıcılar için de erişilebilir hale getirdik:

```typescript
export const GET = withMultiPermissionRoute(getStaff, {
  GET: [Permission.VIEW_STAFF, Permission.VIEW_PACKAGE_SALES]
});
```

### 2. Permission Update Hatası

```
Route "/api/staff/[id]/permissions" used `params.id`. `params` should be awaited before using its properties.
TypeError: The "payload" argument must be of type object. Received null
```

**Sorun**: Next.js'de dynamic route parametreleri kullanılırken `params` objesinin `await` ile kullanılması gerekiyor.

**Çözüm**: Permissions API'sini düzelttik:

```typescript
async function updatePermissions(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ...
    const { id } = await params;  // await eklendi
    // ...
  }
}
```

### 3. Koruma Eksikliği

**Sorun**: Paket Satışları API'si için izin kontrolleri uygulanmamıştı.

**Çözüm**: API rotalarını koruma altına aldık:

```typescript
export const GET = withProtectedRoute(getPackageSales, {
  GET: Permission.VIEW_PACKAGE_SALES
});

export const POST = withProtectedRoute(createPackageSale, {
  POST: Permission.ADD_PACKAGE_SALES
});
```

## Bağımlı API'ler için Yapılan Düzeltmeler

Paket Satışları modülü, aşağıdaki API'lere erişim gerektirir:

### 1. Staff API (Personel Bilgileri)

```typescript
export const GET = withMultiPermissionRoute(getStaff, {
  GET: [Permission.VIEW_STAFF, Permission.VIEW_PACKAGE_SALES]
});
```

### 2. Customers API (Müşteri Bilgileri)

```typescript
export const GET = withMultiPermissionRoute(getCustomers, {
  GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
});

export const POST = withMultiPermissionRoute(createCustomer, {
  POST: [Permission.ADD_CUSTOMERS, Permission.ADD_PACKAGE_SALES]
});
```

### 3. Packages API (Paket Bilgileri)

```typescript
export const GET = withMultiPermissionRoute(getPackages, {
  GET: [Permission.VIEW_PACKAGES, Permission.VIEW_PACKAGE_SALES]
});
```

## Önemli Dersler ve İyi Pratikler

1. **Modül Bağımlılıklarını Belirleyin**: Yeni bir modül eklerken, o modülün hangi diğer API'lere erişim gerektirdiğini belirleyin ve bunların izin kontrollerini güncelleyin.

2. **withMultiPermissionRoute vs withProtectedRoute**: 
   - Tek bir izin gerekliyse: `withProtectedRoute`
   - Birden fazla izinden herhangi biri yeterliyse: `withMultiPermissionRoute`

3. **API Params Kullanımı**: Next.js'de dynamic route parametrelerini kullanırken `await params` kullanın:
   ```typescript
   const { id } = await params;
   ```

4. **Kapsamlı API Koruması**: Tüm API rotalarınızı uygun izin kontrolleri ile koruyun.

5. **Bağımlı API'leri Belirleme**: Bir modülün çalışması için gereken tüm API'leri belirleyin ve bunları çoklu izin kontrolleriyle güncelleyin.

## Veritabanı Güncellemesi

Bu değişikliklerin tam olarak uygulanması için veritabanı şemasının güncellenmesi gerekir:

```bash
npx prisma migrate dev --name add_package_sales_permissions
npx prisma generate
```

## Kontrol Listesi: Yeni Yetki Eklerken

1. ✅ Prisma şemasına yeni izinleri ekleyin
2. ✅ Veritabanı migration oluşturun
3. ✅ PermissionsModal'da izin grupları ve etiketleri güncelleyin
4. ✅ handleTogglePermission fonksiyonunu güncelleyin
5. ✅ usePermissions hook'unu güncelleyin
6. ✅ İlgili modülün API rotalarını koruyun
7. ✅ Bağımlı API'leri çoklu izin kontrolü ile güncelleyin
8. ✅ Dynamic route parametrelerini `await` ile kullanın
9. ✅ Değişiklikleri test edin

## Sorun Giderme

Hala izin sorunları yaşıyorsanız:

1. Konsol hatalarını kontrol edin (403 Forbidden hangi API'den geliyor?)
2. İlgili API koruma mekanizmasını kontrol edin
3. API'nin doğru izinleri kontrol ettiğinden emin olun
4. Dynamic route parametrelerinin doğru kullanıldığından emin olun
5. usePermissions hook'unda yeni izinlerin tanımlandığından emin olun
6. Gerekirse sunucuyu yeniden başlatın

Daha kapsamlı yetki sistemi rehberliği için `YETKI-SISTEMI-KILAVUZU.md` dosyasını inceleyin.
