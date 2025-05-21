# Paket Satışları Yetkileri Güncelleme Talimatları

Bu dokümanda, "Paket Satışları" modülü için eklenen yeni izin sistemi açıklanmaktadır.

## Yapılan Değişiklikler

1. Personel sayfasındaki yetki yönetimi modalında "Paketler" ve "Paket Satışları" bölümleri "Paketler ve Paket Satışları" başlığı altında birleştirildi:
   - "Paket satışlarını görebilir"
   - "Yeni paket satışı ekleyebilir"
   - "Paket satışlarını düzenleyebilir"
   - "Paket satışlarını silebilir"

2. Prisma şemasına yeni izinler eklendi:
   - VIEW_PACKAGE_SALES
   - ADD_PACKAGE_SALES
   - EDIT_PACKAGE_SALES
   - DELETE_PACKAGE_SALES

3. usePermissions hook'u güncellendi:
   - canViewPackageSales
   - canAddPackageSales
   - canEditPackageSales
   - canDeletePackageSales

4. Paket Satışları sayfasındaki izin kontrolleri güncellendi.

## Veritabanı Güncellemesi (Kalıcı Çözüm)

Bu değişikliklerin tam olarak uygulanması için veritabanı şemasının güncellenmesi gerekiyor:

1. Terminal açın ve kök dizine gidin
2. Aşağıdaki komutları çalıştırın:

```bash
npx prisma migrate dev --name add_package_sales_permissions
npx prisma generate
```

3. Uygulamayı yeniden başlatın:

```bash
npm run dev
```

## İzin Mantığı

- "Paket satışlarını görebilir" (VIEW_PACKAGE_SALES): Paket satışları sayfasını görüntüleme izni
- "Yeni paket satışı ekleyebilir" (ADD_PACKAGE_SALES): Yeni paket satışı ekleme izni
- "Paket satışlarını düzenleyebilir" (EDIT_PACKAGE_SALES): Var olan paket satışlarını düzenleme izni
- "Paket satışlarını silebilir" (DELETE_PACKAGE_SALES): Paket satışlarını silme izni

## Otomatik Yetki Ekleme

- Düzenleme, ekleme veya silme yetkisi verildiğinde, görüntüleme yetkisi otomatik olarak eklenir.
- Örneğin, "Yeni paket satışı ekleyebilir" yetkisi verildiğinde, "Paket satışlarını görebilir" yetkisi de otomatik olarak verilir.

Bu değişiklikler ile personel artık paket satışları için ayrı yetkilere sahip olabilecek, bu da daha ince ayarlı erişim kontrolü sağlayacak.
