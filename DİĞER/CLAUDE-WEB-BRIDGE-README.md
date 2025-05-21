# Claude Web Arayüzü Köprüsü

Bu modül, Claude web arayüzü kullanırken kod düzeltmelerini ve çözümlerini veritabanında saklamanızı ve daha sonraki oturumlarda bunları hatırlamanızı sağlar.

## Nasıl Çalışır

Claude web arayüzü API erişimi olmadığından, bu çözüm "köprü" yaklaşımı kullanır:

1. Claude ile kod düzeltmeleri üzerinde çalıştığınızda, çözümleri manuel olarak kaydedersiniz
2. Daha sonraki Claude oturumlarınızda, bu kayıtları alıp Claude'a kopyalayarak hatırlatırsınız
3. Bu sayede, Claude ile aynı sorunları tekrar tekrar çözmenize gerek kalmaz

## Özellikleri

- Kod düzeltmelerini dosya yolu, hata türü ve açıklamalarıyla birlikte kaydetme
- Kaydedilmiş düzeltmeleri listeleme ve görüntüleme
- Claude'a kopyalayıp yapıştırmak için düzeltmeleri formatlanmış olarak alma
- Tüm düzeltmelerin bir özetini Claude'a gönderme imkanı

## Nasıl Kullanılır

### 1. Kod Düzeltmelerini Kaydetme

1. Web uygulamanızda `/claude-bridge` sayfasına gidin
2. "Yeni Düzeltme Ekle" sekmesine tıklayın
3. Aşağıdaki bilgileri doldurun:
   - Düzeltilen dosya yolu (opsiyonel)
   - Hata açıklaması
   - Hata türü (opsiyonel)
   - Orijinal (hatalı) kod
   - Düzeltilmiş kod
4. "Düzeltmeyi Kaydet" butonuna tıklayın

### 2. Kaydedilmiş Düzeltmeleri Claude'a Hatırlatma

Claude ile yeni bir oturum başlattığınızda:

1. Web uygulamanızda `/claude-bridge` sayfasına gidin
2. "Claude için Özet Kopyala" butonuna tıklayın
3. Kopyalanan özeti Claude ile konuşmanızın başında yapıştırın
4. Claude artık önceki çözümlerinizi hatırlayacak ve benzer hataları daha hızlı çözecektir

Alternatif olarak, belirli bir düzeltmeyi Claude'a hatırlatmak için:

1. Düzeltme listesinden ilgili düzeltmeyi bulun
2. "Claude'a Kopyala" butonuna tıklayın
3. Kopyalanan düzeltmeyi Claude'a yapıştırın

## Uygulama Mimarisi

- `ClaudeCodeBridge.tsx`: Ana bileşen
- `CodeCorrectionForm.tsx`: Yeni düzeltme ekleme formu
- `CodeCorrectionsList.tsx`: Kaydedilmiş düzeltmeleri listeleyen bileşen
- `/api/claude-bridge/route.ts`: API rotası
- `useClaudeContext` hook'u: Bağlam verilerini yönetmek için

## Veritabanı Yapısı

Düzeltmeler, `projectData` tablosunda, `claude-code-corrections` anahtarıyla JSON formatında saklanır. Her düzeltme şu bilgileri içerir:

- `originalCode`: Orijinal (hatalı) kod
- `fixedCode`: Düzeltilmiş kod
- `filePath`: Düzeltilen dosyanın yolu (opsiyonel)
- `description`: Hatanın açıklaması
- `errorType`: Hatanın türü (opsiyonel)
- `timestamp`: Düzeltmenin kaydedildiği zaman

## Öneriler

- Claude ile çalışmaya başlamadan önce, düzeltme özetini kopyalayıp yapıştırın
- Düzeltmeleri kaydetme alışkanlığı edinin, özellikle karmaşık hata çözümlerini
- Hata türleri ve açıklamalarını tutarlı bir şekilde kullanın

Bu köprü, Claude web arayüzünün sınırlamalarını aşarak uzun süreli projelerde tekrarlanan hataları daha verimli çözmenizi sağlar.
