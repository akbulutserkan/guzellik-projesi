#!/bin/bash
echo "Next.js önbelleğini temizleme..."

# .next dizinini temizle
rm -rf .next

# node_modules/.cache dizinini temizle
rm -rf node_modules/.cache

echo "Temizleme tamamlandı!"
