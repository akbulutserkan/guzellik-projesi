# İzin Sistemi Güncelleme Kılavuzu

Bu dokümanda, "Müşteriler" ve "Paketler" modülleri için yapılan izin sistemi güncellemeleri ve kalıcı çözümleri bulabilirsiniz.

## Yapılan Değişiklikler

### 1. Müşteriler Modülü
- "Müşteri Yönetimi" başlığı "Müşteriler" olarak değiştirildi
- İzin etiketleri güncellendi:
  - "Müşterileri Görebilir"
  - "Müşteri ekleyebilir" (YENİ)
  - "Müşterileri düzenleyebilir"
  - "Müşterileri Silebilir"
- Müşteriler sayfasına erişim için geçici izin kaldırıldı, izinler doğru şekilde uygulanıyor

### 2. Paketler Modülü
- "Paket Yönetimi" başlığı "Paketler" olarak değiştirildi
- İzin etiketleri güncellendi:
  - "Paketleri Görebilir"
  - "Yeni Paket Ekleyebilir" (YENİ)
  - "Paketleri Düzenleyebilir"
  - "Paketleri Silebilir"
- Paketler sayfası yetki kontrolleri doğru şekilde uygulanıyor

## Veritabanı Güncellemesi (Kalıcı Çözüm)

Bu değişikliklerin tam olarak uygulanması için veritabanı şemasının güncellenmesi gerekiyor:

1. Terminal açın ve kök dizine gidin
2. Aşağıdaki komutu çalıştırın:

```bash
bash update-all-permissions.sh
```

Bu komut:
- Prisma şemasına göre veritabanını güncelleyecek
- Yeni izin türlerini ekleyecek (ADD_CUSTOMERS ve ADD_PACKAGES)
- İşlem tamamlandığında uygulamayı yeniden başlatmanız gerekecek

## Uygulama Yeniden Başlatma

Veritabanı güncellemesinden sonra, uygulamayı yeniden başlatmak için:

```bash
npm run dev
```

## Personel İzinlerini Güncelleme

Güncelleme tamamlandıktan sonra, ilgili personele yeni izinleri atamanız gerekecek. Personel yönetimi sayfasında artık şu seçenekler görünecek:

- Müşteriler bölümünde: "Müşterileri Görebilir", "Müşteri ekleyebilir", vb.
- Paketler bölümünde: "Paketleri Görebilir", "Yeni Paket Ekleyebilir", vb.

İlgili personele gereken izinleri atayarak, sayfaların hem header'da görünmesini hem de sayfa içinde gerekli işlemlerin yapılabilmesini sağlayabilirsiniz.