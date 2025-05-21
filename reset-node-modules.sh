#!/bin/bash
echo "Node modüllerini sıfırlama işlemi başlatılıyor..."

# .next dizinini temizle
echo "Next.js önbelleğini temizleniyor..."
rm -rf .next

# node_modules/.cache dizinini temizle
echo "Node modülleri önbelleğini temizleniyor..."
rm -rf node_modules/.cache

# Önemli: node-gyp önbelleğini de temizle
echo "node-gyp önbelleğini temizleniyor..."
rm -rf ~/.node-gyp
rm -rf ~/.cache/node-gyp

# bcrypt ve ilgili modülleri yeniden yükle
echo "bcrypt modülünü yeniden yükleniyor..."
npm uninstall bcrypt
npm install bcrypt

echo "Temizleme tamamlandı! Şimdi uygulamayı yeniden başlatın."
