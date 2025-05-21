# MCP Geçiş Yol Haritası

Bu belge, REST API'den Model Context Protocol (MCP) API'sine geçiş için bir yol haritası sunar.

## Aşama 1: Hizmetler Modülü (Tamamlandı)

✅ Hizmetler için MCP yardımcı fonksiyonları oluşturuldu
✅ Hizmetler sayfası MCP'ye dönüştürüldü
✅ Randevu sistemi hizmet API çağrıları MCP'ye entegre edildi

## Aşama 2: Yazılması Gereken MCP Araçları

### Hizmetler

- [ ] **add-service-category**: Yeni kategori eklemek için
  ```typescript
  server.tool(
    'add-service-category',
    { name: z.string(), description: z.string().optional() },
    async ({ name, description }) => {
      // Kategori oluştur
    }
  );
  ```

- [ ] **update-service-category**: Kategori güncellemek için
  ```typescript
  server.tool(
    'update-service-category',
    { id: z.string(), name: z.string(), description: z.string().optional() },
    async ({ id, name, description }) => {
      // Kategori güncelle
    }
  );
  ```

- [ ] **delete-service-category**: Kategori silmek için
  ```typescript
  server.tool(
    'delete-service-category',
    { id: z.string() },
    async ({ id }) => {
      // Kategori sil
    }
  );
  ```

- [ ] **add-service**: Yeni hizmet eklemek için
  ```typescript
  server.tool(
    'add-service',
    { 
      name: z.string(), 
      duration: z.number(), 
      price: z.number(), 
      categoryId: z.string() 
    },
    async ({ name, duration, price, categoryId }) => {
      // Hizmet oluştur
    }
  );
  ```

- [ ] **update-service**: Hizmet güncellemek için
  ```typescript
  server.tool(
    'update-service',
    { 
      id: z.string(),
      name: z.string().optional(), 
      duration: z.number().optional(), 
      price: z.number().optional(), 
      categoryId: z.string().optional() 
    },
    async ({ id, name, duration, price, categoryId }) => {
      // Hizmet güncelle
    }
  );
  ```

- [ ] **delete-service**: Hizmet silmek için
  ```typescript
  server.tool(
    'delete-service',
    { id: z.string() },
    async ({ id }) => {
      // Hizmet sil
    }
  );
  ```

### Personel Hizmetleri

- [ ] **get-staff-services**: Personel hizmetlerini getirmek için
  ```typescript
  server.tool(
    'get-staff-services',
    { staffId: z.string() },
    async ({ staffId }) => {
      // Personel hizmetlerini getir
    }
  );
  ```

## Aşama 3: Diğer Bileşenlerin Dönüşümü

- [ ] Personel modülü MCP dönüşümü
- [ ] Müşteri modülü MCP dönüşümü
- [ ] Randevu modülü MCP dönüşümü
- [ ] Çalışma saatleri modülü MCP dönüşümü

## Aşama 4: Sistem Genelinde MCP Entegrasyonu

- [ ] MCP kullanım kontrolü için merkezi bir mekanizma
- [ ] REST API'den tam geçiş için plan
- [ ] MCP API kullanımı için dokümantasyon
- [ ] Performans iyileştirmeleri ve optimizasyonlar

## Kazanımlar

1. **Daha Tutarlı API Kullanımı**: Tüm modüller aynı protokolü kullanacak
2. **Merkezi Yetkilendirme**: MCP ile daha kolay yetkilendirme kontrolü
3. **Modülerlik**: MCP araçları ile daha modüler yapı
4. **Geliştirme Kolaylığı**: Yeni özelliklerin eklenmesi daha kolay olacak
5. **Genişletilebilirlik**: Yeni araçların eklenmesi basit olacak
