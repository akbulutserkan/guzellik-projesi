# Kod Düzeltme ve Test Etme Rehberi

## Kod Düzeltme İş Akışı

1. Claude ile kod düzeltmesi yapıldığında, düzeltilen kod **manuel olarak** kod test sistemine kaydedilmelidir.
2. Claude'un kendi belleğine kayıt yapması, bizim projemizdeki kod belleği için yeterli değildir.
3. Düzeltilen kodlar MCP sistemi tarafından veritabanına kaydedilir ve gelecekte benzer hatalarda referans olarak kullanılır.

## Kod Test Etme Adımları

1. Düzeltilen kodu, test sayfasındaki JavaScript/TypeScript metin kutusuna kopyalayın
2. İlgili alanları doldurun:
   - Programlama Dili: Genellikle "TypeScript"
   - Bağlam: Düzeltme ile ilgili açıklayıcı bir metin (örn. "BulkPriceUpdate typescript interface düzeltmesi")
   - Etiketler: İlgili anahtar kelimeler (örn. "typescript,interface,bulkupdate,mcp")
3. "Kodu Test Et" butonuna basın
4. Test başarılıysa, kod veritabanındaki `code_examples` tablosuna kaydedilir

## Önemli Notlar

- Kod parçası kendi başına çalışabilir olmalıdır
- Interface tanımları ve kullanılan yardımcı fonksiyonlar dahil edilmelidir
- Test sisteminin TypeScript kodunu doğrudan çalıştırdığı unutulmamalıdır

Bu iş akışı, proje genelinde kod kalitesini artırmak ve aynı hataların tekrarlanmasını önlemek için önemlidir.
