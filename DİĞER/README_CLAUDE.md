## 'USE CLIENT' KULLANIMI - 12 MART 2025

- Next.js uygulamalarında **HER ZAMAN** `'use client'` direktifini dosyanın en başında kullan
- `'use client'` direktifi, **SADECE** dosyanın en üstünde konumlandırılmalıdır (herhangi bir kod, yorum veya boşluktan önce)
- Dosya içinde, fonksiyon içinde, değişken tanımından sonra, callback'ler içinde veya herhangi başka bir pozisyonda **KESİNLİKLE** kullanma
- React uygulamalarında `'use client'` direktifi her component dosyası için gereklidir

# Claude Çalışma Kuralları

**ÖNEMLİ:** Claude, bu dosyayı her oturumun başında okumaı ve aşağıdaki kurallara sıkı sıkıya uymalıdır.

## TEMEL KURAL: ASLA YEDEK DOSYA OLUŞTURMA!

- **ASLA** "yedek", "backup", "kopya" veya benzeri adlarla klasör veya dosya oluşturma
- **ASLA** mevcut dosyaların kopyalarını oluşturma
- **ASLA** `src 2`, `src 3` gibi numaralı veya ek açıklamalı klasörler oluşturma
- **HER ZAMAN** doğrudan orijinal dosyalarda çalış
- Değişiklik yapmadan önce **HER ZAMAN** hangi dosyada çalıştığını teyit et
- Kod değişikliklerini yaparken **HER ZAMAN** hangi dosyayı değiştirdiğini belirt

## ÖNEMLİ HATIRLATMA: HER TÜRLÜ YEDEK VE KOPYA YASAKTIR!

- Proje içinde `src` klasörü varsa, SADECE onu kullan, asla `src 2` veya `src-backup` gibi yedekler oluşturma
- Dosyaları .backup, .old, .temp, .copy gibi uzantılarla veya adlarla KAYDETME
- Bir klasör içinde varolan bir dosyanın yedek kopyasını KAYDETME (Mevcut bir `index.tsx` dosyası varsa, `index.tsx.backup` ya da `index_copy.tsx` benzeri dosyalar oluşturma)
- Tüm işlemler her zaman orijinal dosyalar üzerinde gerçekleştirilmelidir!

## ÖNEMLİ: ASLA GEÇİCİ ÇÖZÜMLER ÖNERME!

- **ASLA** geçici veya kısa vadeli çözümler önerme veya uygulama
- **HER ZAMAN** kalıcı ve tam çözümler geliştir
- Kod kalabalığına neden olan geçici çözümlerden kaçın
- Sorunları temelinden çözen yaklaşımlar sun

## Neden Bu Kurallar Önemli?

Geçmişte, Claude projemin içinde yedek klasörler oluşturdu ve değişiklikleri bu yedek dosyalarda yaptı. Bu durum, ben orijinal dosyalarda çalışırken fark edilmeyen değişikliklere ve karışıklığa yol açtı. Aynı şekilde, geçici çözümler kodun bakımını zorlaştırır ve uzun vadede daha büyük sorunlara neden olabilir.

## Doğru Çalışma Yöntemi

1. Bir dosyayı değiştirmeden önce tam yolunu (örn. `src/components/App.js`) belirt
2. Değişiklik yapmadan önce kullanıcıdan doğrulama iste
3. Değişiklikleri doğrudan orijinal dosyalarda yap
4. Yaptığın değişiklikleri açıkça rapor et
5. **ASLA** geçici çözümler önerme, her zaman kalıcı ve tam çözümler sun

## Hatırla

Bu README'yi her yeni oturumda oku ve buradaki kurallara uy. Yedek dosya oluşturma kuralı ve geçici çözüm önermeme kuralı herhangi bir istisna olmaksızın geçerlidir.

## ÇOK ÖNEMLİ EK NOT - 7 MART 2025

Bu projenin `/Users/serkan/Desktop/claude` dizininde `src 2` ve `src 3` gibi yedek klasörler bulundu. Bu durumun tekrarlanmaması için açıkça belirtmek gerekir ki, Claude hiçbir zaman ve hiçbir sebeple:

1. Orijinal klasör veya dosyaların numaralandırılmış kopyalarını (src 2, index.tsx.2, app 3, vb.) oluşturmayacak.
2. .backup, .copy, .temp, .old vb. uzantılarla kopya dosyalar oluşturmayacak.
3. Orjinal klasör adına ek bir isim (src-backup, src-copy, src-temp, vb.) ekleyerek kopya klasör oluşturmayacak.

Bütün kod değişiklikleri mutlaka ve sadece orijinal dosya ve klasörlerde yapılacaktır.

## TERMİNAL KOMUTLARI KULLANIMI - 9 MART 2025

- **ASLA** proje kökünde yeni script (.sh) dosyaları oluşturma
- **HER ZAMAN** gerekli işlemleri doğrudan terminal komutları olarak öner
- Script dosyası yazmak yerine, kullanıcının doğrudan terminaline kopyalayıp çalıştırabileceği komutları öner
- Özellikle bir kez kullanılacak işlemler için script dosyaları oluşturmak yerine terminal komutları öner

Örnek:

```bash
# pnpm referanslarını temizleme
find ./node_modules -name ".pnpm*" -type d -exec rm -rf {} +
rm -f pnpm-lock.yaml
rm -f .pnpmrc
```

Bu yaklaşım projeyi daha temiz tutar ve geçici kullanılan scriptler nedeniyle gereksiz dosyalar birikmesini önler.


her zamab türkçe yaz