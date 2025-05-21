# Modüler MCP Sunucusu

Bu belge, MCP (Model Context Protocol) sunucusunun modüler yapısını açıklar.

## Dizin Yapısı

```
src/
  ├── app/
  │   ├── api/
  │   │   └── mcp/
  │   │       └── route.ts       # Ana MCP API endpoint'i
  │   └── mcp-tools/             # Modüler MCP araçları
  │       ├── index.ts           # Tüm araçları birleştiren modül
  │       ├── project-data.ts    # Proje verileri araçları (save-data, load-data, list-data)
  │       ├── services.ts        # Hizmet araçları (get-services, get-service-categories)
  │       └── appointments.ts    # Randevu araçları (get-appointments)
```

## Modüler Yapının Avantajları

1. **Daha İyi Organizasyon**: Farklı işlevler için ayrı dosyalar
2. **Kod Tekrarını Azaltma**: Ortak kod parçaları paylaşılıyor
3. **Bakım Kolaylığı**: Belirli bir aracı güncellemek için sadece ilgili modülü düzenleyin
4. **Genişletilebilirlik**: Yeni araçlar eklemek için yeni modüller oluşturabilirsiniz

## Kullanılabilir MCP Araçları

### Proje Verileri

- **save-data**: Veriyi PostgreSQL veritabanına kaydet
- **load-data**: PostgreSQL veritabanından veri yükle
- **list-data**: Veritabanında kayıtlı tüm verileri listele

### Hizmetler

- **get-services**: Tüm hizmetleri listele
- **get-service-categories**: Tüm hizmet kategorilerini listele
- **get-service-by-id**: ID'ye göre belirli bir hizmeti getir
- **get-service-category-by-id**: ID'ye göre belirli bir kategoriyi getir

### Randevular

- **get-appointments**: Randevuları listele (filtreleme seçenekleriyle)
- **get-appointment-by-id**: ID'ye göre belirli bir randevuyu getir

## Örnek Kullanım

```javascript
// Örnek 1: Tüm hizmetleri getir
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'call_tool',
    params: {
      name: 'get-services',
      arguments: { includeDeleted: false }
    }
  })
});

// Örnek 2: Randevuları filtreleyerek getir
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'call_tool',
    params: {
      name: 'get-appointments',
      arguments: {
        startDate: '2025-03-01',
        endDate: '2025-03-31',
        staffId: 'staff_123'
      }
    }
  })
});
```

## Genişletme Kılavuzu

Yeni bir araç eklemek için:

1. İlgili dosyada (veya yeni bir dosyada) araç fonksiyonunu tanımlayın
2. `registerXXXTools` fonksiyonuna aracı ekleyin
3. `mcpTools` ve `mcpToolDescriptions` objelerini güncelleyin
4. `/app/api/mcp/route.ts` dosyasında yeni aracı işleyin

Örnek:

```typescript
// 1. /app/mcp-tools/customers.ts dosyasında tanımlayın
export function registerCustomerTools(server: any) {
  server.tool(
    'get-customers',
    { searchTerm: z.string().optional() },
    async ({ searchTerm }) => {
      // Müşterileri getir...
    }
  );
}

// 2. /app/mcp-tools/index.ts dosyasında import edin
import { registerCustomerTools } from './customers';

// 3. createMcpServer fonksiyonuna ekleyin
export function createMcpServer() {
  // ...
  registerCustomerTools(server);
  // ...
}

// 4. mcpToolDescriptions'a ekleyin
export const mcpToolDescriptions = [
  // ...
  {
    name: 'get-customers',
    description: 'Müşterileri listele',
    parameters: {
      searchTerm: {
        type: 'string',
        description: 'Arama terimi',
        required: false
      }
    }
  }
];

// 5. /app/api/mcp/route.ts dosyasında POST handler'ına ekleyin
else if (toolName === 'get-customers') {
  const result = await mcpTools.getCustomers(toolArgs.searchTerm);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
```