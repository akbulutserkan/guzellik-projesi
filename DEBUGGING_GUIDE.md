# Veri Tutarsızlığı Hatalarını Ayıklama Rehberi

Bu rehber, uygulama genelinde karşılaşılan "bir ekranda doğru görünen verinin, başka bir ekranda yanlış görünmesi" gibi veri tutarsızlığı sorunlarının nasıl teşhis ve tedavi edileceğini, yaşadığımız "Paket Satış Ödemeleri" sorunu üzerinden adım adım açıklamaktadır.

## Sorunun Tanımı

*   **Belirti:** "Paket Satışları" ana sayfasında bir pakete ait ödenen ve kalan tutar doğru görünüyordu. Ancak aynı paketin "Ödeme Al" modalı açıldığında, geçmiş ödemeler listesi boş geliyor ve kalan tutar yanlış hesaplanıyordu.

*   **Temel Sorun:** İki farklı ekran, aynı teorik bilgiyi (toplam ödenen tutar) göstermek için farklı yöntemler kullanıyordu ve bu yöntemlerden biri hatalıydı.

---

## Hata Ayıklama Süreci: Adım Adım Analiz

Bu tür bir sorunu çözmek için izlediğimiz mantıksal adımlar şunlardır:

### Adım 1: Veri Akışını Takip Et ("Veri Nereden Geliyor?")

İlk adım, her bir bileşenin veriyi nereden ve nasıl aldığını anlamaktır.

*   **Ana Sayfa (Doğru Çalışan):**
    *   **Yöntem:** `packageSales` koleksiyonundaki belgeyi doğrudan okuyordu.
    *   **Veri:** `price`, `paidAmount`, `remainingAmount` gibi **zaten hesaplanmış, özetlenmiş** alanları kullanıyordu.
    *   **Sonuç:** Hızlı ve veritabanındaki ana kayıtla tutarlıydı.

*   **Ödeme Modalı (Hatalı Çalışan):**
    *   **Yöntem:** Geçmiş ödemeleri göstermek için `paymentTransactions` koleksiyonundan ilgili belgeleri tek tek çekmeye çalışıyordu.
    *   **Veri:** `getPaymentsForPackageAction` fonksiyonunu kullanarak **detay kayıtlarını** sorguluyordu.
    *   **Sonuç:** Sorgu başarısız olduğu için geçmiş ödemeleri alamıyor ve kalan tutarı yanlış hesaplıyordu.

**Çıkarım:** Sorun, özet veriyi okuyan ana sayfada değil, detay verileri çekmeye çalışan modalın kendisinde veya onu besleyen fonksiyondaydı.

### Adım 2: Sorguyu İncele ("Veri Hangi Kurallarla Çekiliyor?")

Sorunun modalın veri çekme yönteminde olduğunu anladıktan sonra, bu yöntemin kurallarını inceledik.

*   `kasa/actions.ts` içindeki `getPaymentsForPackageAction` fonksiyonu çok spesifik bir sorgu yapıyordu:
    *   `appointmentGroupId` alanı, aranan paket satış ID'sine eşit olmalı.
    *   **VE**
    *   `paymentType` alanı, tam olarak `"package"` kelimesine eşit olmalı.

Loglarımız bize bu sorgunun sürekli olarak boş bir liste (`Array(0)`) döndürdüğünü gösterdi. Bu, veritabanında bu iki kurala aynı anda uyan hiçbir kaydın bulunmadığı anlamına geliyordu.

### Adım 3: Veri Yazma İşlemini Kontrol Et ("Veri Nasıl Kaydediliyor?")

Sorgu doğruysa ama sonuç boşsa, o zaman sorun verinin en başta veritabanına **eksik veya yanlış yazılmasıdır.**

*   İncelediğimizde, `paket-satislar/actions.ts` dosyasındaki `performRecordPackageSaleAction` fonksiyonunun, bir paket satışı için ilk ödemeyi `paymentTransactions`'a kaydederken `paymentType: 'package'` alanını **eklemeyi unuttuğunu** fark ettik.

*   Yani, veri okuma fonksiyonumuz (`getPaymentsForPackageAction`) "Bana 'package' tipi ödemeleri getir" derken, veri yazma fonksiyonumuz bu etiketi kayıtlara hiç eklemiyordu. Bu tutarsızlık, sorunun kök nedeniydi.

---

## Çözüm Yöntemi: Okuma ve Yazmayı Senkronize Etmek

Sorunu kalıcı olarak çözmek için iki yönlü bir strateji uyguladık:

1.  **Geleceği Güvence Altına Almak (Yazmayı Düzeltmek):**
    *   `paket-satislar/actions.ts` içindeki ilgili tüm fonksiyonları güncelleyerek, bundan sonra oluşturulacak **tüm yeni** paket ödemelerinin veritabanına `paymentType: 'package'` alanı ile doğru bir şekilde yazılmasını garanti altına aldık.

2.  **Geçmişi Kurtarmak (Okumayı Esnetmek):**
    *   `kasa/actions.ts` içindeki `getPaymentsForPackageAction` fonksiyonunun sorgusunu daha esnek hale getirdik. Fonksiyon artık `paymentType` alanı ya `'package'` olan ya da **hiç olmayan** kayıtları da kabul ediyor. Bu, hem bizim düzelttiğimiz yeni ve doğru kayıtları hem de geçmişte eksik yazılmış olan eski kayıtları bulup modalda göstermesini sağladı.

Bu birleşik yaklaşım, hem geçmişteki veri tutarsızlığını telafi etti hem de gelecekteki veri bütünlüğünü sağladı.
