# Yetki Sistemi Kılavuzu ve İyi Pratikler

Bu kılavuz, uygulamamızda kullanılan yetki sisteminin doğru bir şekilde yapılandırılması için gerekli bilgileri ve çözümleri içerir. Paket Satışları modülünde karşılaşılan sorunların çözümünden edinilen deneyimler doğrultusunda hazırlanmıştır.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Yetki Sistemi Mimarisi](#yetki-sistemi-mimarisi)
3. [Yeni Yetkilerin Eklenmesi](#yeni-yetkilerin-eklenmesi)
4. [API Koruma Mekanizmaları](#api-koruma-mekanizmaları)
5. [Çoklu Yetki Kontrolü](#çoklu-yetki-kontrolü)
6. [Paket Satışları Örneği](#paket-satışları-örneği)
7. [Olası Hatalar ve Çözümleri](#olası-hatalar-ve-çözümleri)
8. [İyi Pratikler Listesi](#iyi-pratikler-listesi)

## Genel Bakış

Uygulamamız, kullanıcılara rol ve izin bazlı yetkilendirme sağlar. Her kullanıcı, belirli işlemleri gerçekleştirmek için gerekli izinlere sahip olmalıdır. Bu izinler şu şekilde yönetilir:

- **Prisma Şeması**: İzin türleri enum olarak tanımlanır
- **PermissionsModal**: Kullanıcı arayüzünde izinlerin yönetilmesini sağlar
- **API Middleware**: API rotalarının yetkisiz erişime karşı korunmasını sağlar

## Yetki Sistemi Mimarisi

### 1. Prisma Şeması (Permission Enum)

İzin türleri, `prisma/schema.prisma` dosyasında enum olarak tanımlanır:

```prisma
enum Permission {
  // Hizmetler yetkileri
  VIEW_SERVICES
  ADD_SERVICE_CATEGORY
  // ... diğer izinler
  
  // Paket Satışları Yetkileri
  VIEW_PACKAGE_SALES
  ADD_PACKAGE_SALES
  EDIT_PACKAGE_SALES
  DELETE_PACKAGE_SALES
}
```

### 2. PermissionsModal Bileşeni

Kullanıcı arayüzünde izinlerin gruplandırılması ve etiketlenmesi:

```typescript
const PERMISSION_GROUPS = {
  'Paket Satışları': [
    'VIEW_PACKAGE_SALES',
    'ADD_PACKAGE_SALES',
    'EDIT_PACKAGE_SALES',
    'DELETE_PACKAGE_SALES'
  ],
  // ... diğer gruplar
}

const PERMISSION_LABELS = {
  // Paket Satışları Yetkileri
  'VIEW_PACKAGE_SALES': 'Paket satışlarını görebilir',
  'ADD_PACKAGE_SALES': 'Yeni paket satışı ekleyebilir',
  'EDIT_PACKAGE_SALES': 'Paket satışlarını düzenleyebilir',
  'DELETE_PACKAGE_SALES': 'Paket satışlarını silebilir',
  // ... diğer etiketler
}
```

### 3. API Middleware

API rotaları, `withProtectedRoute` ve `withMultiPermissionRoute` fonksiyonları kullanılarak korunur:

```typescript
export const GET = withProtectedRoute(getHandler, {
  GET: Permission.VIEW_SOMETHING
});

// veya

export const GET = withMultiPermissionRoute(getHandler, {
  GET: [Permission.VIEW_SOMETHING, Permission.VIEW_OTHER_THING]
});
```

## Yeni Yetkilerin Eklenmesi

Yeni bir yetki veya modül eklerken aşağıdaki adımları takip edin:

1. **Prisma Şemasına Ekleyin**:
   ```prisma
   enum Permission {
     // Mevcut izinler...
     
     // Yeni izinler
     VIEW_NEW_MODULE
     ADD_NEW_MODULE
     EDIT_NEW_MODULE
     DELETE_NEW_MODULE
   }
   ```

2. **Migration Oluşturun**:
   ```bash
   npx prisma migrate dev --name add_new_module_permissions
   npx prisma generate
   ```

3. **PermissionsModal Bileşenini Güncelleyin**:
   ```typescript
   const PERMISSION_GROUPS = {
     // Mevcut gruplar...
     'Yeni Modül': [
       'VIEW_NEW_MODULE',
       'ADD_NEW_MODULE',
       'EDIT_NEW_MODULE',
       'DELETE_NEW_MODULE'
     ]
   }

   const PERMISSION_LABELS = {
     // Mevcut etiketler...
     'VIEW_NEW_MODULE': 'Yeni modülü görebilir',
     'ADD_NEW_MODULE': 'Yeni modüle ekleyebilir',
     'EDIT_NEW_MODULE': 'Yeni modülü düzenleyebilir',
     'DELETE_NEW_MODULE': 'Yeni modülü silebilir'
   }
   ```

4. **handleTogglePermission Fonksiyonunu Güncelleyin**:
   ```typescript
   const handleTogglePermission = (permission: Permission) => {
     setSelectedPermissions((prev) => {
       const next = new Set(prev);

       const viewPermissionMap = {
         // Mevcut eşleştirmeler...
         'ADD_NEW_MODULE': 'VIEW_NEW_MODULE',
         'EDIT_NEW_MODULE': 'VIEW_NEW_MODULE',
         'DELETE_NEW_MODULE': 'VIEW_NEW_MODULE'
       } as const;

       // Eğer seçilen izin bir görüntüleme gerektiren izinse
       if (permission in viewPermissionMap) {
         next.add(viewPermissionMap[permission as keyof typeof viewPermissionMap] as Permission);
       }

       // Toggle işlemi
       if (next.has(permission)) {
         next.delete(permission);
       } else {
         next.add(permission);
       }

       return next;
     });
   };
   ```

5. **usePermissions Hook'unu Güncelleyin**:
   ```typescript
   interface PermissionResult {
     // Mevcut özellikler...
     
     // Yeni modül yetkileri
     canViewNewModule: boolean;
     canAddNewModule: boolean;
     canEditNewModule: boolean;
     canDeleteNewModule: boolean;
   }
   
   export const usePermissions = (): PermissionResult => {
     // Mevcut işlevler...
     
     return {
       // Mevcut dönüşler...
       
       // Yeni modül yetkileri
       canViewNewModule: hasPermission(Permission.VIEW_NEW_MODULE),
       canAddNewModule: hasPermission(Permission.ADD_NEW_MODULE),
       canEditNewModule: hasPermission(Permission.EDIT_NEW_MODULE),
       canDeleteNewModule: hasPermission(Permission.DELETE_NEW_MODULE),
     };
   };
   ```

6. **API Rotalarını Koruma Altına Alın**:
   ```typescript
   export const GET = withProtectedRoute(getHandler, {
     GET: Permission.VIEW_NEW_MODULE
   });
   
   export const POST = withProtectedRoute(createHandler, {
     POST: Permission.ADD_NEW_MODULE
   });
   ```

## API Koruma Mekanizmaları

Uygulamamızda API rotalarını korumak için iki temel yaklaşım kullanılır:

### 1. withProtectedRoute

Tek bir izin gerektiren rotalar için:

```typescript
export const GET = withProtectedRoute(getHandler, {
  GET: Permission.VIEW_SOMETHING
});
```

### 2. withMultiPermissionRoute

Birden fazla izinden herhangi birine sahip olmanın yeterli olduğu durumlar için:

```typescript
export const GET = withMultiPermissionRoute(getHandler, {
  GET: [Permission.VIEW_SOMETHING, Permission.VIEW_OTHER_THING]
});
```

## Çoklu Yetki Kontrolü

Bazı API rotaları birden fazla modül için gereklidir. Örneğin, hem Müşteriler modülü hem de Paket Satışları modülü müşteri verilerine erişim gerektirir. Bu durumda:

```typescript
export const GET = withMultiPermissionRoute(getCustomers, {
  GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
});
```

Bu kod, `VIEW_CUSTOMERS` veya `VIEW_PACKAGE_SALES` izinlerinden herhangi birine sahip kullanıcıların müşteri verilerine erişmesini sağlar.

## Paket Satışları Örneği

Paket Satışları modülü için yapılan yetkilendirme işlemi iyi bir örnek teşkil eder:

1. **Prisma Şemasına Eklendi**:
   ```prisma
   enum Permission {
     // ... diğer izinler
     
     // Paket Satışları Yetkileri
     VIEW_PACKAGE_SALES
     ADD_PACKAGE_SALES
     EDIT_PACKAGE_SALES
     DELETE_PACKAGE_SALES
   }
   ```

2. **PermissionsModal Bileşeni Güncellendi**:
   ```typescript
   const PERMISSION_GROUPS = {
     // ... diğer gruplar
     'Paket Satışları': [
       'VIEW_PACKAGE_SALES',
       'ADD_PACKAGE_SALES',
       'EDIT_PACKAGE_SALES',
       'DELETE_PACKAGE_SALES'
     ],
   }
   ```

3. **Staff API'si Güncellendi** (Paket Satışları için personel verilerine erişim):
   ```typescript
   export const GET = withMultiPermissionRoute(getStaff, {
     GET: [Permission.VIEW_STAFF, Permission.VIEW_PACKAGE_SALES]
   });
   ```

4. **Customers API'si Güncellendi** (Paket Satışları için müşteri verilerine erişim):
   ```typescript
   export const GET = withMultiPermissionRoute(getCustomers, {
     GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
   });
   ```

5. **Packages API'si Güncellendi** (Paket Satışları için paket verilerine erişim):
   ```typescript
   export const GET = withMultiPermissionRoute(getPackages, {
     GET: [Permission.VIEW_PACKAGES, Permission.VIEW_PACKAGE_SALES]
   });
   ```

6. **Paket Satışları API'si Koruma Altına Alındı**:
   ```typescript
   export const GET = withProtectedRoute(getPackageSales, {
     GET: Permission.VIEW_PACKAGE_SALES
   });
   
   export const POST = withProtectedRoute(createPackageSale, {
     POST: Permission.ADD_PACKAGE_SALES
   });
   ```

## Olası Hatalar ve Çözümleri

### 1. Parametrelerden ID Hatası

```
Route "/api/staff/[id]/permissions" used `params.id`. `params` should be awaited before using its properties.
```

**Çözüm**: `params` objesini `await` ile kullanın:

```typescript
// Yanlış
const { id } = params;

// Doğru
const { id } = await params;
```

### 2. 403 Forbidden Hatası

Kullanıcının gerekli izinlere sahip olmasına rağmen 403 hatası alıyorsanız:

1. API rotasının doğru koruma altına alındığından emin olun
2. İlgili modülün kullandığı diğer API rotalarının da çoklu yetki kontrolüne sahip olup olmadığını kontrol edin (örn. Staff API, Customers API gibi)

### 3. Konsol Hataları

```
Error: Personel bilgileri alınamadı
```

Bu tür hatalar genellikle bağımlı API çağrılarının (Staff, Customers, vb.) izin sorunları nedeniyle başarısız olmasından kaynaklanır.

## İyi Pratikler Listesi

1. **Kapsamlı Güncelleme**: Yeni bir modül eklerken Prisma şemasını, PermissionsModal'ı, API rotalarını ve diğer bağımlı API'leri kapsamlı şekilde güncelleyin.

2. **Bağımlılıkları Unutmayın**: Bir modülün hangi diğer API'lere erişim gerektirdiğini belirleyin ve bunları `withMultiPermissionRoute` ile koruma altına alın.

3. **Params ile Çalışırken**: Dynamic route parametrelerini kullanırken `await params` kullanmayı unutmayın.

4. **Yetki Hiyerarşisi**: Düzenleme, silme gibi yetkiler için genellikle görüntüleme yetkisi otomatik olarak verilmelidir. `handleTogglePermission` fonksiyonunda bu mantığı uygulayın.

5. **Test Edin**: Yeni yetkiler ekledikten sonra farklı yetkilere sahip kullanıcılarla test edin.

6. **Hata Mesajlarını İnceleyin**: 403 Forbidden hataları, hangi API çağrısının başarısız olduğunu gösterir ve sorunu belirlemenize yardımcı olur.

7. **Veritabanı Migrations**: Yeni yetkileri ekledikten sonra database migration'ı çalıştırmayı unutmayın.

Bu kılavuzu takip ederek yetki sisteminizi doğru ve kapsamlı bir şekilde yapılandırabilirsiniz.
