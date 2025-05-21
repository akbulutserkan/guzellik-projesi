# PostgreSQL MCP Entegrasyonu

Bu belge, MCP (Model Context Protocol) sunucusunun PostgreSQL veritabanına bağlanması ve verilerin dosya tabanlı sistemden veritabanına nasıl aktarılacağı hakkında bilgi verir.

## Yapılan Değişiklikler

1. Prisma şemasına yeni bir `ProjectData` modeli eklendi
2. MCP API endpoint'i veritabanı kullanacak şekilde güncellendi
3. Dosya tabanlı veri saklama yerine PostgreSQL veritabanı kullanılmaya başlandı

## Veri Modeli

Prisma şemasına aşağıdaki model eklendi:

```prisma
model ProjectData {
  id        String    @id @default(cuid())
  key       String    @unique
  data      Json
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("project_data")
}
```

Bu model, MCP aracılığıyla gönderilen verileri saklamak için kullanılacaktır.

## Veritabanı Migrasyonu

Veritabanı şemasını güncellemek için aşağıdaki adımları izleyin:

1. Prisma migrasyonunu uygulayın:

```bash
npx prisma migrate dev --name add_project_data
```

2. Mevcut JSON verisini veritabanına aktarın:

```bash
npx ts-node prisma/scripts/migrate-mcp-data.ts
```

## MCP Sunucu Kullanımı

MCP sunucusu artık verileri PostgreSQL veritabanında saklıyor. Önceki API ile tam uyumludur, ancak şimdi daha fazla özellik sunmaktadır.

### Save Data

```json
{
  "method": "call_tool",
  "params": {
    "name": "save-data",
    "arguments": {
      "data": { "örnek": "veri" },
      "key": "my-project-key"  // Opsiyonel, varsayılan: "default"
    }
  }
}
```

### Load Data

```json
{
  "method": "call_tool",
  "params": {
    "name": "load-data",
    "arguments": {
      "key": "my-project-key"  // Opsiyonel, varsayılan: "default"
    }
  }
}
```

## Yeni Özellikler

1. **Benzersiz Anahtarlar**: Verileri farklı anahtarlarla saklayabilirsiniz, böylece birden fazla proje veya veri seti yönetebilirsiniz.
2. **Otomatik Zaman Damgaları**: Her veri kaydı, oluşturulma ve güncellenme zamanını otomatik olarak kaydeder.
3. **Veri Tutarlılığı**: Veritabanı sisteminin sağladığı ACID özellikleri sayesinde daha güvenilir veri saklama.

## Veri Migrasyonu Scripti Örneği

`prisma/scripts/migrate-mcp-data.ts` dosyası oluşturup aşağıdaki kodu ekleyebilirsiniz:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateData() {
  try {
    const filePath = path.join(process.cwd(), 'proje-verileri.json');
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Veritabanına kaydet
      await prisma.projectData.upsert({
        where: { key: 'default' },
        update: { 
          data,
          updatedAt: new Date() 
        },
        create: {
          key: 'default',
          data
        }
      });
      
      console.log('Veri başarıyla veritabanına aktarıldı.');
    } else {
      console.log('Aktarılacak veri dosyası bulunamadı.');
    }
  } catch (error) {
    console.error('Migrasyon hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
```

## Dikkat Edilmesi Gerekenler

1. MCP sunucusu yeniden başlatıldığında veritabanı bağlantısının çalıştığından emin olun.
2. Önceki JSON dosyasını güvenli bir yerde yedekleyin.
3. Yeni sistemde hata ayıklaması yapmak için Prisma'nın log özelliğini kullanın.
