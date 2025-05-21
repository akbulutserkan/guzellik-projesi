#!/bin/bash
# JSON verisini PostgreSQL veritabanına aktarmak için script

echo "MCP verilerini JSON'dan PostgreSQL'e aktarma işlemi başlatılıyor..."

# Önce Prisma istemcisini yeniden oluşturalım
echo "Prisma istemcisi yeniden oluşturuluyor..."
npx prisma generate

# Ardından migrasyon betiğini çalıştıralım
echo "Veri aktarım betiği çalıştırılıyor..."
npx ts-node prisma/scripts/migrate-mcp-data.ts

# Script başarıyla çalıştıysa
if [ $? -eq 0 ]; then
  echo "Aktarım başarıyla tamamlandı!"
  echo "MCP sunucusu artık PostgreSQL veritabanını kullanıyor."
else
  echo "Aktarım sırasında bir hata oluştu!"
  echo "Lütfen hata mesajlarını kontrol edin."
fi