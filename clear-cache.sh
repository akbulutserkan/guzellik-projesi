#!/bin/bash
# Next.js önbelleğini temizleme script'i

# Uygulamayı durdur (gerekirse)
echo "Uygulama durduruluyor (çalışıyorsa)..."
pkill -f "next dev" || true

# .next klasörünü temizle
echo "Next.js önbelleği temizleniyor..."
rm -rf /Users/serkan/Desktop/claude/.next
mkdir -p /Users/serkan/Desktop/claude/.next

echo "Önbellek temizlendi!"
echo "Şimdi uygulamayı 'npm run dev' komutuyla yeniden başlatın"
