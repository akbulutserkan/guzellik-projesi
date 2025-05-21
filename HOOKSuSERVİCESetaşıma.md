Hook/Servis Ayrımı için Prompt

Projemde [SERVIS_ADI] servisini ve ilgili hook'ları inceleyerek Hook/Servis ayrımını uygula:

1. Servisteki temel işlemleri tanımla ve grupla
2. Hook'lardaki iş mantığını (business logic) tespit et
3. Bu mantığı servise taşıyacak değişiklikler öner
4. Hook kodunda yapılacak sadeleştirmeleri göster
5. Değişikliklerin faydalarını açıkla

Özellikle aşağıdaki alanlara odaklan:
- Veri işleme/dönüştürme kodları
- Doğrulama mantığı
- Formatlama fonksiyonları 
- Tekrarlanan iş mantığı

Kod güncellemelerinde önce mevcut örneği göster, sonra iyileştirilmiş versiyonu göster.



-------

Servis Standartlaştırma için Prompt
Projemde [SERVIS_ADI] servisi için standardizasyon uygulamak istiyorum:

1. Mevcut servis dosyalarını analiz et
2. Duplicated servis fonksiyonlarını belirle
3. Merkezi bir servis oluştur ve kopya işlevselliği buraya entegre et
4. Kullanım dışı kalan servisleri işaretle veya kaldır
5. İsimlendirme tutarsızlıklarını düzelt

Değişikliklerin uygulanması için adım adım bir rehber hazırla ve her adımın faydalarını açıkla.


----

Önbellekleme Standardizasyonu için Prompt

Projemde önbellekleme (caching) yaklaşımını standartlaştırmak istiyorum:

1. [SERVIS_ADI] için mevcut önbellekleme kodlarını analiz et
2. Duplicated veya dağıtılmış önbellekleme mantığını tespit et
3. Merkezi bir önbellek modülü oluştur (/src/utils/cache/[SERVIS_ADI]Cache.ts)
4. Tüm hook'ları bu modülü kullanacak şekilde güncelle
5. Kullanım dışı kalan önbellek kodlarını temizle

Önbellekleme standardizasyonu sürecinde dikkat edilmesi gereken:
- Aynı önbellek anahtarı üretme mantığı
- Tutarlı önbellek süresi yönetimi
- Önbellek geçersiz kılma stratejisi