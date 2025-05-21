#!/bin/bash
# Critters paketini yükle (CSS optimizasyonu için gerekli)
npm install critters

# Uygulama cache'ini temizle
npm run clean:cache

# Temiz bir şekilde tekrar başlat
npm run dev
