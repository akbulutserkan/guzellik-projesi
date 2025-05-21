#!/bin/bash
# Node.js kullanarak JSON verilerini PostgreSQL'e aktarmak için betik

echo "MCP verilerini JSON'dan PostgreSQL veritabanına aktarma işlemi başlatılıyor..."

# Gerekli paketleri kontrol et ve yükle
if ! npm list pg | grep -q "pg@" || ! npm list dotenv | grep -q "dotenv@"; then
  echo "Gerekli paketler yükleniyor (pg, dotenv)..."
  npm install --no-save pg dotenv
fi

# Node.js betiğini çalıştır
echo "Veri aktarım betiği çalıştırılıyor..."
node prisma/scripts/mcp-direct-insert.js

# Script başarıyla çalıştıysa
if [ $? -eq 0 ]; then
  echo "Aktarım başarıyla tamamlandı!"
  echo "MCP sunucusu artık PostgreSQL veritabanını kullanıyor."
else
  echo "Aktarım sırasında bir hata oluştu!"
  echo "Lütfen hata mesajlarını kontrol edin."
fi