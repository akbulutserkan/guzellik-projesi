#!/bin/bash
echo "Temizleme başlatılıyor..."

# .next dizinini temizle
echo "Next.js önbelleği temizleniyor..."
rm -rf .next

# node_modules/.cache dizinini temizle
echo "Node modülleri önbelleği temizleniyor..."
rm -rf node_modules/.cache

# package-lock.json sil ve yeniden yükle
echo "Paket kilitleri sıfırlanıyor..."
rm -f package-lock.json

# Yeni bağımlılıkları yükle
echo "Bağımlılıklar yükleniyor..."
npm install

echo "Temizleme tamamlandı!"
