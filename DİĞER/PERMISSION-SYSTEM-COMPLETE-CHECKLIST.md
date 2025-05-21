# İzin Sistemi Eksiksiz Kontrol Listesi

Bu belge, yeni bir modül için izin sistemi eklerken veya mevcut bir modülün izin sistemini güncellerken takip edilmesi gereken adımların eksiksiz bir listesini içerir. Paket Satışları modülü örneğinden öğrenilen dersler doğrultusunda hazırlanmıştır.

## 1. Prisma Şeması Güncellemesi

- [ ] `prisma/schema.prisma` dosyasında Permission enum'ına yeni izinleri ekleyin:
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
- [ ] Database migration yapın:
  ```bash
  npx prisma migrate dev --name add_new_module_permissions
  npx prisma generate
  ```

## 2. UI Bileşenleri Güncellemesi

- [ ] `PermissionsModal.tsx` dosyasında yeni izin grubunu ekleyin:
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
  ```
- [ ] İzin etiketlerini ekleyin:
  ```typescript
  const PERMISSION_LABELS = {
    // Mevcut etiketler...
    'VIEW_NEW_MODULE': 'Yeni modülü görebilir',
    'ADD_NEW_MODULE': 'Yeni öğe ekleyebilir',
    'EDIT_NEW_MODULE': 'Düzenleyebilir',
    'DELETE_NEW_MODULE': 'Silebilir'
  }
  ```
- [ ] `handleTogglePermission` fonksiyonunu güncelleyin (görüntüleme gerektirenler için otomatik izin):
  ```typescript
  const viewPermissionMap = {
    // Mevcut eşleştirmeler...
    'ADD_NEW_MODULE': 'VIEW_NEW_MODULE',
    'EDIT_NEW_MODULE': 'VIEW_NEW_MODULE',
    'DELETE_NEW_MODULE': 'VIEW_NEW_MODULE'
  } as const;
  ```

## 3. Hook Güncellemesi

- [ ] `usePermissions.ts` hook'unu güncelleyin:
  ```typescript
  interface PermissionResult {
    // Mevcut özellikler...
    
    // Yeni özellikler
    canViewNewModule: boolean;
    canAddNewModule: boolean;
    canEditNewModule: boolean;
    canDeleteNewModule: boolean;
  }
  
  export const usePermissions = (): PermissionResult => {
    // ...
    
    return {
      // Mevcut özellikler...
      
      // Yeni özellikler
      canViewNewModule: hasPermission(Permission.VIEW_NEW_MODULE),
      canAddNewModule: hasPermission(Permission.ADD_NEW_MODULE),
      canEditNewModule: hasPermission(Permission.EDIT_NEW_MODULE),
      canDeleteNewModule: hasPermission(Permission.DELETE_NEW_MODULE),
    };
  };
  ```

## 4. Ana API Rotaları Koruması

- [ ] Ana modül API rotalarını koruma altına alın:
  ```typescript
  // Önce fonksiyonları ayırın:
  async function getModuleData(request: NextRequest) {
    // ...
  }
  
  async function createModuleItem(request: NextRequest) {
    // ...
  }
  
  // Sonra izinlerle koruyun:
  export const GET = withProtectedRoute(getModuleData, {
    GET: Permission.VIEW_NEW_MODULE
  });
  
  export const POST = withProtectedRoute(createModuleItem, {
    POST: Permission.ADD_NEW_MODULE
  });
  ```

## 5. Dinamik API Rotaları Koruması

- [ ] Dinamik API rotalarını (örn. `[id]`) koruma altına alın:
  ```typescript
  async function getModuleItem(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    const { id } = await params; // await kullanımı önemli!
    // ...
  }
  
  export const GET = withProtectedRoute(getModuleItem, {
    GET: Permission.VIEW_NEW_MODULE
  });
  
  export const PUT = withProtectedRoute(updateModuleItem, {
    PUT: Permission.EDIT_NEW_MODULE
  });
  
  export const DELETE = withProtectedRoute(deleteModuleItem, {
    DELETE: Permission.DELETE_NEW_MODULE
  });
  ```

## 6. Bağımlı API Rotaları Güncellenmesi

- [ ] Modülün bağımlı olduğu tüm API rotalarını belirleyin (örn. staff, customers, services)
- [ ] Bu API rotalarını çoklu izin kontrolü ile güncelleyin:
  ```typescript
  export const GET = withMultiPermissionRoute(getExistingData, {
    GET: [Permission.VIEW_EXISTING_MODULE, Permission.VIEW_NEW_MODULE]
  });
  ```

## 7. UI Bileşenlerinde İzin Kontrolleri

- [ ] UI bileşenlerinde izin kontrollerini kullanın:
  ```tsx
  const { canViewNewModule, canAddNewModule } = usePermissions();
  
  // Sadece gerekli izne sahipse butonu göster
  {canAddNewModule && (
    <Button onClick={...}>Yeni Ekle</Button>
  )}
  ```

## 8. Hata Ayıklama ve Test

- [ ] Yeni izinleri bir test kullanıcısına verin ve tüm işlevleri test edin
- [ ] İzinlerin kaldırılması durumunda erişimin engellendiğini doğrulayın
- [ ] Özellikle dinamik API rotalarında hata olup olmadığını kontrol edin
- [ ] Konsolu izleyerek 403 Forbidden hataları olup olmadığını kontrol edin

## 9. Ek Kontroller

- [ ] API rotalarında NextRequest tipleri kullanılıyor mu?
- [ ] params objesi await ile kullanılıyor mu?
- [ ] Tüm bağımlı API rotaları belirlenmiş mi?
- [ ] Client bileşenlerinde uygun hata mesajları ve yükleme durumları var mı?
- [ ] API endpoint dökümanı güncel mi?

Bu kontrol listesi, uygulama genelinde tutarlı bir izin sistemi uygulamanıza yardımcı olacaktır. Her yeni modülde veya mevcut modül güncellemesinde bu listeyi kullanarak, potansiyel sorunları önceden tespit etmek ve çözmek mümkün olacaktır.
