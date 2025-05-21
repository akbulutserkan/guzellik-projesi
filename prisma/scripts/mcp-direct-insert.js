// MCP verilerini PostgreSQL'e direkt aktarmak için Node.js betiği
require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

// PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateData() {
  console.log('MCP verilerini JSON dosyasından PostgreSQL veritabanına aktarma işlemi başlıyor...');
  
  try {
    // JSON dosyasını kontrol et
    if (!fs.existsSync('./proje-verileri.json')) {
      console.log('proje-verileri.json dosyası bulunamadı. Aktarma işlemi atlanıyor.');
      return;
    }
    
    // JSON dosyasını oku
    const jsonData = fs.readFileSync('./proje-verileri.json', 'utf-8');
    const data = JSON.parse(jsonData);
    
    // SQL ile direkt veri ekle
    const query = `
      INSERT INTO project_data (id, key, data, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'default',
        $1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (key)
      DO UPDATE SET
        data = $1,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(query, [data]);
    
    console.log('Veri başarıyla PostgreSQL veritabanına aktarıldı!');
    console.log('Aktarılan veri:', JSON.stringify(data, null, 2));
    console.log('Veritabanı kaydı:', result.rows[0]);
    
  } catch (error) {
    console.error('Veri aktarma hatası:', error);
  } finally {
    // Havuzu kapat
    await pool.end();
  }
}

// Ana fonksiyonu çalıştır
migrateData()
  .then(() => console.log('İşlem tamamlandı.'))
  .catch(e => {
    console.error('Hata:', e);
    process.exit(1);
  });