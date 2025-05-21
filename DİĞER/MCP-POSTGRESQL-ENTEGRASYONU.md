# MCP PostgreSQL Entegrasyonu

Bu belge, MCP (Model Context Protocol) sunucusunun PostgreSQL veritabanı ile entegrasyonunu açıklar.

## Yapılan Değişiklikler

MCP sunucusu şimdi JSON dosyası yerine PostgreSQL veritabanını kullanıyor:

1. `ProjectData` modeli Prisma şemasına eklendi
2. MCP sunucusu (`/src/app/api/mcp/route.ts`) PostgreSQL veritabanına bağlanacak şekilde güncellendi
3. Veri kaydetme ve yükleme işlemleri veritabanı işlemlerine dönüştürüldü
4. Yeni bir `list-data` aracı eklendi (tüm veritabanı kayıtlarını listelemek için)

## MCP API Kullanımı

MCP sunucusu artık aşağıdaki araçları sunmaktadır:

### 1. save-data

Veriyi PostgreSQL veritabanına kaydetmek için kullanılır.

```javascript
// Örnek kullanım:
// key parametresi opsiyoneldir (varsayılan: "default")
const result = await mcp.call("save-data", { 
  data: { proje: "Test", adim: 1 },
  key: "proje-v1"  // Özel bir anahtar belirtmek isterseniz
});
```

### 2. load-data

PostgreSQL veritabanından veri yüklemek için kullanılır.

```javascript
// Örnek kullanım:
// key parametresi opsiyoneldir (varsayılan: "default")
const result = await mcp.call("load-data", { 
  key: "proje-v1"  // Yüklenecek verinin anahtarı
});
```

### 3. list-data

Veritabanında kayıtlı tüm verilerin listesini almak için kullanılır.

```javascript
// Örnek kullanım:
const result = await mcp.call("list-data", {});
```

## JSON'dan PostgreSQL'e Veri Aktarımı

Eski JSON dosyasından veritabanına veri aktarmak için bir script oluşturuldu. Aşağıdaki komutu çalıştırarak veri aktarımını gerçekleştirebilirsiniz:

```bash
npm run migrate-mcp-data
```

Bu komut:
1. `proje-verileri.json` dosyasını okur
2. İçeriği PostgreSQL veritabanına `default` anahtarıyla kaydeder

## Yeni Veri Yapısı

Veritabanındaki `project_data` tablosu şu sütunlara sahiptir:

- `id`: Benzersiz tanımlayıcı (UUID)
- `key`: Veri için benzersiz anahtar (örn. "default", "proje-v1", vb.)
- `data`: JSON formatında kaydedilen veri
- `createdAt`: Kaydın oluşturulma zamanı
- `updatedAt`: Kaydın son güncellenme zamanı

## Test Etme

MCP sunucusunu test etmek için:

1. Bir veriyi kaydedin:
   ```
   MCP sunucum "nextjs15-ts-proje-mcp" üzerinden bir test verisi kaydet: { "proje": "Test", "adim": 2 }
   ```

2. Veriyi yükleyin:
   ```
   MCP sunucum "nextjs15-ts-proje-mcp" üzerinden verileri yükle.
   ```

3. Tüm verileri listeleyin:
   ```
   MCP sunucum "nextjs15-ts-proje-mcp" üzerinden tüm verileri listele.
   ```

## Sorun Giderme

- **Veritabanı Bağlantı Hatası**: .env dosyasındaki DATABASE_URL yapılandırmasını kontrol edin
- **Tablo Bulunamadı Hatası**: Prisma migrasyonlarının çalıştırıldığından emin olun: `npx prisma migrate deploy`
- **Veri Kaydetme/Yükleme Hatası**: Prisma yapılandırmasını ve veritabanı erişim izinlerini kontrol edin