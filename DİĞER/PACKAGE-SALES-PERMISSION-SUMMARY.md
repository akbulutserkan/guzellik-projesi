# Paket Satışları İzin Sistemi - Özet Değişiklikler

Bu belgede, Paket Satışları modülü için yapılan yetki düzeltmelerinin özeti ve tüm değiştirilen dosyalar listelenmektedir.

## Değiştirilen Dosyalar

1. **Prisma Şeması**
   - `/Frontend/prisma/schema.prisma`: Paket Satışları izinleri eklendi

2. **Yetki Sistemi UI**
   - `/Frontend/src/components/staff/components/PermissionsModal.tsx`: Paket Satışları izin grubu ve etiketleri eklendi

3. **API Korumaları**
   - `/Frontend/src/app/api/staff/route.ts`: Staff API, Paket Satışları izinleri için erişilebilir hale getirildi
   - `/Frontend/src/app/api/staff/[id]/permissions/route.ts`: Dynamic route parametresi hatası düzeltildi
   - `/Frontend/src/app/api/customers/route.ts`: Customers API, Paket Satışları izinleri için erişilebilir hale getirildi
   - `/Frontend/src/app/api/packages/route.ts`: Packages API, Paket Satışları izinleri için erişilebilir hale getirildi
   - `/Frontend/src/app/api/package-sales/route.ts`: Package Sales API için izin koruması eklendi

4. **Hooks**
   - `/Frontend/src/hooks/usePermissions.ts`: Paket Satışları izinleri için hook güncellendi

5. **Client Bileşeni**
   - `/Frontend/src/app/(protected)/package-sales/PackageSalesClient.tsx`: Doğru izin kullanımı için güncellendi

## Yapılan Değişiklikler

### 1. Prisma Şeması

```prisma
enum Permission {
  // ... mevcut izinler
  
  // Paket Satışları Yetkileri
  VIEW_PACKAGE_SALES
  ADD_PACKAGE_SALES
  EDIT_PACKAGE_SALES
  DELETE_PACKAGE_SALES
}
```

### 2. PermissionsModal Bileşeni

```typescript
const PERMISSION_GROUPS = {
  // ... mevcut gruplar
  'Paket Satışları': [
    'VIEW_PACKAGE_SALES',
    'ADD_PACKAGE_SALES',
    'EDIT_PACKAGE_SALES',
    'DELETE_PACKAGE_SALES'
  ],
}

const PERMISSION_LABELS = {
  // ... mevcut etiketler
  'VIEW_PACKAGE_SALES': 'Paket satışlarını görebilir',
  'ADD_PACKAGE_SALES': 'Yeni paket satışı ekleyebilir',
  'EDIT_PACKAGE_SALES': 'Paket satışlarını düzenleyebilir',
  'DELETE_PACKAGE_SALES': 'Paket satışlarını silebilir',
}
```

### 3. handleTogglePermission Fonksiyonu

```typescript
const handleTogglePermission = (permission: Permission) => {
  setSelectedPermissions((prev) => {
    const next = new Set(prev);

    const viewPermissionMap = {
      // ... mevcut eşleştirmeler
      'ADD_PACKAGE_SALES': 'VIEW_PACKAGE_SALES',
      'EDIT_PACKAGE_SALES': 'VIEW_PACKAGE_SALES',
      'DELETE_PACKAGE_SALES': 'VIEW_PACKAGE_SALES'
    } as const;

    // ... diğer kodlar
  });
};
```

### 4. usePermissions Hook'u

```typescript
interface PermissionResult {
  // ... mevcut özellikler
  
  // Paket Satışları Yetkileri
  canViewPackageSales: boolean;
  canAddPackageSales: boolean;
  canEditPackageSales: boolean;
  canDeletePackageSales: boolean;
}

export const usePermissions = (): PermissionResult => {
  // ... mevcut işlevler
  
  return {
    // ... mevcut dönüşler
    
    // Paket Satışları Yetkileri
    canViewPackageSales: hasPermission(Permission.VIEW_PACKAGE_SALES),
    canAddPackageSales: hasPermission(Permission.ADD_PACKAGE_SALES),
    canEditPackageSales: hasPermission(Permission.EDIT_PACKAGE_SALES),
    canDeletePackageSales: hasPermission(Permission.DELETE_PACKAGE_SALES),
  };
};
```

### 5. API Korumaları

**Staff API**
```typescript
export const GET = withMultiPermissionRoute(getStaff, {
  GET: [Permission.VIEW_STAFF, Permission.VIEW_PACKAGE_SALES]
});
```

**Customers API**
```typescript
export const GET = withMultiPermissionRoute(getCustomers, {
  GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
});

export const POST = withMultiPermissionRoute(createCustomer, {
  POST: [Permission.ADD_CUSTOMERS, Permission.ADD_PACKAGE_SALES]
});
```

**Packages API**
```typescript
export const GET = withMultiPermissionRoute(getPackages, {
  GET: [Permission.VIEW_PACKAGES, Permission.VIEW_PACKAGE_SALES]
});
```

**Package Sales API**
```typescript
export const GET = withProtectedRoute(getPackageSales, {
  GET: Permission.VIEW_PACKAGE_SALES
});

export const POST = withProtectedRoute(createPackageSale, {
  POST: Permission.ADD_PACKAGE_SALES
});
```

### 6. Dynamic Route Parametresi Düzeltmesi

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
```

## Kontrolü Yapılan Hatalar

1. 403 Forbidden hatası - Personel, müşteri ve paket verilerine Paket Satışları yetkisiyle erişim sağlandı
2. Dynamic route parametresi hatası - `await params` kullanımı ile düzeltildi
3. Paket Satışları API'sinin koruma eksikliği - Uygun izin kontrolleri eklendi

## Veritabanı Güncellemesi

```bash
npx prisma migrate dev --name add_package_sales_permissions
npx prisma generate
```

## Önemli Notlar

- Paket Satışları modülü, personel (staff), müşteri ve paket verilerine erişim gerektirir.
- İzin sisteminin tam olarak çalışması için tüm bağımlı API'lerin güncellenmesi kritik önem taşır.
- Hata ayıklama için konsol hatalarını incelemek önemli bir adımdır (özellikle 403 Forbidden hataları).
