# GitHub Aktarım Rehberi

Bu belge, projenizi GitHub'daki `appointment-system` reposuna aktarmak için gereken adımları içerir.

## 1. Git İnisiyalizasyonu

Eğer mevcut projenizde Git henüz oluşturulmadıysa:

```bash
# Proje klasörüne gidin
cd /Users/serkan/Desktop/claude

# Git repo'su başlatın
git init

# Tüm dosyaları ekleyin
git add .

# İlk commit'i yapın
git commit -m "İlk commit: Randevu Sistemi"
```

## 2. GitHub Repo ile Bağlantı Kurma

```bash
# GitHub reposunu uzak sunucu olarak ekleyin
git remote add origin https://github.com/akbulutserkan/appointment-system.git

# GitHub'ın main branch'ini çekin ve yerel değişikliklerle birleştirin
git pull origin main --allow-unrelated-histories

# Değişiklikleri GitHub'a gönderin
git push -u origin main
```

## 3. Birleştirme Çakışmalarını Çözme

Eğer `git pull` aşamasında çakışmalar olursa, bu dosyaları manuel olarak düzenleyin ve sonra:

```bash
git add .
git commit -m "Çakışmaları çözüldü"
git push -u origin main
```

## 4. .gitignore Dosyası Oluşturma

GitHub'a gereksiz dosyaların gönderilmemesi için bir `.gitignore` dosyası oluşturun:

```bash
# Proje klasöründe .gitignore dosyası oluşturun
cat > .gitignore << EOL
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOL

git add .gitignore
git commit -m ".gitignore dosyası eklendi"
git push
```

## 5. Örnek .env Dosyası Oluşturma

Başkaları projeyi kullanabilsin diye bir örnek .env dosyası ekleyin:

```bash
# .env.example dosyası oluşturun
cat > .env.example << EOL
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/appointment_system?schema=public"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Application
APP_NAME="Appointment System"
APP_URL=http://localhost:3000
EOL

git add .env.example
git commit -m ".env.example dosyası eklendi"
git push
```

## 6. Dikkat Edilmesi Gerekenler

- **Hassas Bilgiler**: `.env` dosyasında şifreler, API anahtarları gibi hassas bilgiler olabilir. Bu dosyanın GitHub'a gönderilmediğinden emin olun.
- **Node Modules**: `node_modules` klasörü çok büyük olduğu için GitHub'a göndermek yerine `.gitignore` ile hariç tutulmalıdır.
- **Build Dosyaları**: `.next` gibi build klasörleri de GitHub'a gönderilmemelidir.

## 7. Sorun Giderme

GitHub'a yüklerken sorun yaşarsanız:

1. Dosya boyutu limiti: Bazı dosyalar 100MB'dan büyükse GitHub'a gönderilemez
2. Yetki sorunları: GitHub hesabınızın bu repoya erişim yetkisi olduğundan emin olun
3. Network sorunları: Bağlantınızı kontrol edin

## 8. Lisans Dosyası Ekleme

MIT lisansı eklemek için:

```bash
cat > LICENSE << EOL
MIT License

Copyright (c) $(date +%Y) Serkan Akbulut

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOL

git add LICENSE
git commit -m "Lisans dosyası eklendi"
git push
```
