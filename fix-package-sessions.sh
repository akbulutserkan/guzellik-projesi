#!/bin/bash
cd /Users/serkan/Desktop/claude
chmod +x run-generate.sh

echo "Next.js geliştirme sunucusunu durduralım..."
pkill -f "next dev"

echo "Prisma Client yeniden üretiliyor..."
npx prisma generate

echo "Düzeltmeleri kontrol ediyoruz..."
echo "packageSessions aranıyor (varsa yanlış bir yerde kullanılıyor demektir):"
grep -r "packageSessions" src/

echo "İyileştirme tamamlandı!"
echo "Artık Next.js uygulamanızı yeniden başlatabilirsiniz: npm run dev"
