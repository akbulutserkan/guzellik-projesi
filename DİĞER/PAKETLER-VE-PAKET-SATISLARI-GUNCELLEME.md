# Paketler ve Paket Satışları Yetkilerinin Birleştirilmesi

Bu dokümanda, izin sisteminde "Paketler" ve "Paket Satışları" modüllerinin tek bir başlık altında birleştirilmesinin detayları açıklanmaktadır.

## Yapılan Değişiklikler

1. Personel sayfasındaki yetki yönetimi modalında bulunan ayrı ayrı "Paketler" ve "Paket Satışları" bölümleri, "Paketler ve Paket Satışları" başlığı altında birleştirildi.

2. Görüntüleme izinleri "Paketler ve paket satışlarını görebilir" şeklinde birleştirilerek tek bir izin etiketi haline getirildi.

3. Birleştirilen izinler artık birlikte çalışıyor: Biri seçildiğinde diğeri de otomatik olarak seçiliyor, biri kaldırıldığında diğeri de otomatik olarak kaldırılıyor.

4. Tekrarlanan görüntüleme izni UI'dan kaldırıldı: `VIEW_PACKAGE_SALES` izni arayüzdeki listeden gizlendi, böylece "Paketler ve paket satışlarını görebilir" seçeneği yalnızca bir kez görünüyor.

## Değişikliğin Nedeni

Bu değişiklik aşağıdaki nedenlerle yapılmıştır:

- Paketler ve Paket Satışları modülleri birbirleriyle yakından ilişkili fonksiyonlardır.
- Çoğu durumda, bir personelin her iki modüle de erişimi olması gerekmektedir.
- Tek bir başlık altında birleştirmek, yetkilendirme işlemini daha kolay ve anlaşılır hale getirmektedir.

## Etkileri

Bu değişiklik sayesinde:

- Yetki verme işlemi sadeleştirilmiştir.
- Personel her iki sayfaya birden erişebilmektedir.
- İzin yönetimi daha kullanıcı dostu hale gelmiştir.
- "Paketler" ve "Paket Satışları" görüntüleme izinleri otomatik olarak senkronize edilmektedir.

## Teknik Detaylar

1. `PermissionsModal.tsx` dosyasındaki `PERMISSION_GROUPS` nesnesinde grup birleştirmesi yapılmıştır:

```typescript
'Paketler ve Paket Satışları': [
  'VIEW_PACKAGES',
  'ADD_PACKAGES', 
  'EDIT_PACKAGES', 
  'DELETE_PACKAGES',
  'VIEW_PACKAGE_SALES',
  'ADD_PACKAGE_SALES',
  'EDIT_PACKAGE_SALES',
  'DELETE_PACKAGE_SALES'
]
```

2. `PERMISSION_LABELS` nesnesi güncellenerek görüntüleme izinleri için aynı etiket kullanılmıştır:

```typescript
'VIEW_PACKAGES': 'Paketler ve paket satışlarını görebilir',
'VIEW_PACKAGE_SALES': 'Paketler ve paket satışlarını görebilir',
```

3. `handleTogglePermission` fonksiyonu güncellenerek izin senkronizasyonu geliştirildi:

```typescript
// Paket satışları yetkileri için özel işlem
if (['ADD_PACKAGE_SALES', 'EDIT_PACKAGE_SALES', 'DELETE_PACKAGE_SALES'].includes(permission)) {
  next.add('VIEW_PACKAGES'); // Görünen görüntüleme iznini de ekle
}
// Paketler yetkileri için de paket satışları görüntüleme iznini ekle
if (['ADD_PACKAGES', 'EDIT_PACKAGES', 'DELETE_PACKAGES'].includes(permission)) {
  next.add('VIEW_PACKAGE_SALES');
}

// Görüntüleme izinleri arasındaki senkronizasyon
if (permission === 'VIEW_PACKAGES') {
  next.add('VIEW_PACKAGE_SALES');
} else if (permission === 'VIEW_PACKAGE_SALES') {
  next.add('VIEW_PACKAGES');
}

// Görüntüleme iznileri senkronize kaldırma
if (permission === 'VIEW_PACKAGES') {
  next.delete('VIEW_PACKAGE_SALES');
} else if (permission === 'VIEW_PACKAGE_SALES') {
  next.delete('VIEW_PACKAGES');
}
```

4. Tekrarlayan görüntüleme iznini UI'dan gizlemek için rendering mantığı güncellendi:

```typescript
// Arayüzdeki izin listesinde VIEW_PACKAGE_SALES'i gizle
.filter(permission => group === 'Paketler ve Paket Satışları' ? 
  permission !== 'VIEW_PACKAGE_SALES' : true)
```

Bu değişiklikle ilgili herhangi bir Prisma şema değişikliği veya veritabanı migrasyonu gerekmemektedir, sadece kullanıcı arayüzündeki gruplandırma ve izin yönetim mantığı değiştirilmiştir. Mevcut izinler ve yetkilendirmeler olduğu gibi korunmaktadır.