# MCP PostgreSQL Migrasyon Kılavuzu

Bu belge, MCP (Model Context Protocol) verilerini JSON dosyasından PostgreSQL veritabanına aktarma sürecini açıklar.

## Karşılaşılan Sorunlar ve Çözümleri

### 1. TypeScript Hatası: `Property 'projectData' does not exist on type 'PrismaClient'`

Bu hata, Prisma istemcisinin `projectData` modelini tanımamasından kaynaklanıyor. Çözüm adımları:

#### a) Prisma İstemcisini Yeniden Oluşturma

```bash
npx prisma generate
```

Bu komut, `ProjectData` modelini içeren güncel TypeScript tanımlamalarını oluşturur.

#### b) Raw SQL Kullanımı

Alternatif olarak, direkt SQL sorgusu kullanarak veritabanına erişim sağlayabilirsiniz:

```typescript
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
```

### 2. Shell Betik İzin Sorunu: `permission denied`

Shell betiğini çalıştırmak için izin gerekiyor. Çözüm adımları:

```bash
chmod +x migrate-mcp-data.sh
```

## Migrasyon Yöntemleri

### 1. Prisma TypeScript Betiği (Önerilen)

Aşağıdaki adımları takip edin:

1. Önce Prisma istemcisini yeniden oluşturun:
   ```bash
   npx prisma generate
   ```

2. Sonra migrasyon betiğini çalıştırın:
   ```bash
   npm run migrate-mcp-data
   ```

### 2. Doğrudan SQL Betiği

SQL betiği kullanarak da veri aktarımı yapabilirsiniz:

1. PostgreSQL veritabanına bağlanın:
   ```bash
   psql $DATABASE_URL
   ```

2. SQL betiğini çalıştırın:
   ```sql
   \i prisma/scripts/migrate-data.sql
   ```

### 3. Basit CLI Yaklaşımı

1. Shell betiğine çalıştırma izni verin:
   ```bash
   chmod +x migrate-mcp-data.sh
   ```

2. Betiği çalıştırın:
   ```bash
   ./migrate-mcp-data.sh
   ```

## Doğrulama

Migrasyon işlemini doğrulamak için:

1. Veritabanına bağlanın:
   ```bash
   psql $DATABASE_URL
   ```

2. Veriyi sorgulayın:
   ```sql
   SELECT * FROM project_data WHERE key = 'default';
   ```

3. MCP API'sini test edin:
   ```
   MCP sunucum "nextjs15-ts-proje-mcp" üzerinden verileri yükle.
   ```

## Sorun Giderme

- **Veritabanı Erişim Hatası**: DATABASE_URL'in doğru olduğundan emin olun
- **Tablo Oluşturma Hatası**: Prisma migrasyonlarının uygulandığını kontrol edin
- **TypeScript Tanımlama Hatası**: `npx prisma generate` komutunu çalıştırın
- **Veri Aktarım Hatası**: Direkt SQL betiğini kullanmayı deneyin