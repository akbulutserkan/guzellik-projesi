import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Veritabanı bağlantısı
const prisma = new PrismaClient();

async function main() {
  console.log('MCP verilerini JSON dosyasından PostgreSQL veritabanına aktarma işlemi başlıyor...');
  
  try {
    // JSON dosyasını kontrol et
    const filePath = path.join(process.cwd(), 'proje-verileri.json');
    if (!fs.existsSync(filePath)) {
      console.log('proje-verileri.json dosyası bulunamadı. Aktarma işlemi atlanıyor.');
      return;
    }
    
    // JSON dosyasını oku
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    // SQL ile direkt veri ekleyelim (Prisma Client API kullanmadan)
    await prisma.$executeRaw`
      INSERT INTO project_data (id, key, data, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'default',
        ${JSON.stringify(data)}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (key)
      DO UPDATE SET
        data = ${JSON.stringify(data)}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
    `;
    
    console.log('Veri başarıyla PostgreSQL veritabanına aktarıldı! (key: "default")');
    console.log('Aktarılan veri:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Veri aktarma hatası:', error);
  } finally {
    // Veritabanı bağlantısını kapat
    await prisma.$disconnect();
  }
}

// Ana fonksiyonu çalıştır
main()
  .then(() => console.log('İşlem tamamlandı.'))
  .catch(e => {
    console.error('Hata:', e);
    process.exit(1);
  });