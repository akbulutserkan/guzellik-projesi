'use client';

/**
 * Client tarafı paket servisi.
 * Bu servis yalnızca API çağrıları yapar ve arabulucu (proxy) görevi görür.
 * Tüm iş mantığı ve veri işlemleri db/package servisinde gerçekleştirilir.
 * @see /src/services/db/package/packageDbService.ts Veritabanı tarafı paket servisi
 * @see /src/services/db/package/packageCategoryDbService.ts Veritabanı tarafı paket kategori servisi
 */

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm paket listesini getir
 * @param params Seçenekler
 * @param params.includeDeleted Silinmiş paketleri dahil et
 * @returns Paket listesi yanıtı
 */
export async function getPackages(params: { includeDeleted?: boolean } = {}) {
  console.log("[PACKAGE-SERVICE] getPackages çağrıldı, parametreler:", params);
  
  try {
    console.log("[PACKAGE-SERVICE] callMcpApi 'get-packages' çağrılıyor...");
    const response = await callMcpApi('get-packages', params, {
      showToast: false,
      customErrorMsg: 'Paket listesi alınırken bir hata oluştu'
    });
    
    console.log("[PACKAGE-SERVICE] MCP API yanıtı alındı, başarı durumu:", response.success);
    console.log("[PACKAGE-SERVICE] Dönen paket sayısı:", 
                response.data && Array.isArray(response.data) ? response.data.length : 'array değil');
    console.log("[PACKAGE-SERVICE] [DETAY] API Yanıtı Ham Veri:", JSON.stringify(response, null, 2));
    
    // API yanıt yapısını kontrol et
    if (response.success && response.data) {
      const firstItem = Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
      if (firstItem) {
        console.log("[PACKAGE-SERVICE] İlk öğe alan yapısı:", Object.keys(firstItem));
        console.log("[PACKAGE-SERVICE] İlk paket kategori bilgisi:", firstItem.category ? 'var' : 'yok');
        console.log("[PACKAGE-SERVICE] İlk paket hizmet bilgisi:", 
                    firstItem.packageServices ? `${firstItem.packageServices.length} hizmet` : 'yok');
        
        // Kategori alanını kontrol edelim
        if (firstItem.category) {
          console.log("[PACKAGE-SERVICE] [DETAY] İlk paketin kategori nesnesi:", JSON.stringify(firstItem.category, null, 2));
        }
        
        // packageServices alanını kontrol edelim
        if (firstItem.packageServices && firstItem.packageServices.length > 0) {
          console.log("[PACKAGE-SERVICE] [DETAY] İlk paketin ilk hizmeti:", JSON.stringify(firstItem.packageServices[0], null, 2));
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error("[PACKAGE-SERVICE] getPackages sırasında hata:", error);
    throw error;
  }
}

/**
 * Paket detayını getir
 * @param id Paket ID
 * @returns Paket detayı yanıtı
 */
export async function getPackageById(id: string) {
  return await callMcpApi('get-package-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Paket detayı alınırken bir hata oluştu'
  });
}

/**
 * Yeni paket oluştur
 * @param data Paket bilgileri
 * @returns Oluşturulan paket yanıtı
 */
export async function createPackage(data: any) {
  console.log("[PACKAGE-SERVICE] createPackage çağrıldı, gelen veriler:", data);
  
  try {
    console.log("[PACKAGE-SERVICE] callMcpApi 'add-package' çağrılıyor...");
    const response = await callMcpApi('add-package', data, {
      showToast: false,
      customErrorMsg: 'Paket oluşturulurken bir hata oluştu'
    });
    
    console.log("[PACKAGE-SERVICE] MCP API yanıtı:", response);
    console.log("[PACKAGE-SERVICE] Yanıt durumu:", {
      success: response.success,
      data: response.data ? `Veri mevcut (id: ${response.data.id})` : 'Veri yok',
      error: response.error || 'Hata yok'
    });
    
    return response;
  } catch (error) {
    console.error("[PACKAGE-SERVICE] createPackage sırasında hata:", error);
    throw error;
  }
}

/**
 * Paket güncelle
 * @param id Paket ID
 * @param data Güncellenecek paket bilgileri
 * @returns Güncellenen paket yanıtı
 */
export async function updatePackage(id: string, data: any) {
  console.log('[PAKET-GUNCELLEME] [3] packageService.updatePackage çağrıldı');
  console.log('[PAKET-GUNCELLEME] [3] Güncellenecek paket ID:', id);
  console.log('[PAKET-GUNCELLEME] [3] Güncelleme verileri:', JSON.stringify(data, null, 2));
  
  try {
    console.log('[PAKET-GUNCELLEME] [3] MCP API çağrısı yapılıyor...');
    
    // Veri tiplerini kontrol et
    if (data.sessionCount !== undefined) {
      console.log('[PAKET-GUNCELLEME] [3] sessionCount tipi:', typeof data.sessionCount, 'değeri:', data.sessionCount);
      // sessionCount'u number'a çevir
      data.sessionCount = Number(data.sessionCount);
    }
    
    if (data.price !== undefined) {
      console.log('[PAKET-GUNCELLEME] [3] price tipi:', typeof data.price, 'değeri:', data.price);
      // price'i number'a çevir
      data.price = Number(data.price);
    }
    
    // Temizlenmiş veriyi logla
    console.log('[PAKET-GUNCELLEME] [3] Tip dönüşümleri sonrası güncelleme verileri:', JSON.stringify(data, null, 2));
    
    const response = await callMcpApi('update-package', { 
      id, 
      ...data 
    }, {
      showToast: false,
      customErrorMsg: 'Paket güncellenirken bir hata oluştu'
    });
    
    console.log('[PAKET-GUNCELLEME] [3] MCP API yanıtı alındı', {
      success: response.success,
      data: response.data ? 'Veri mevcut' : 'Veri yok',
      error: response.error || 'Hata yok'
    });
    
    if (response.data) {
      console.log('[PAKET-GUNCELLEME] [3] Güncellenen paket verileri:', JSON.stringify(response.data, null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.error('[PAKET-GUNCELLEME] [3] API çağrısı hatası:', error);
    throw error;
  }
}

/**
 * Paket sil
 * @param id Paket ID
 * @returns İşlem sonucu
 */
export async function deletePackage(id: string) {
  return await callMcpApi('delete-package', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Paket silinirken bir hata oluştu'
  });
}

/**
 * Tüm paket kategorilerini getir
 * @returns Paket kategorileri listesi yanıtı
 */
export async function getPackageCategories() {
  return await callMcpApi('get-package-categories', {}, {
    showToast: false,
    customErrorMsg: 'Paket kategorileri alınırken bir hata oluştu'
  });
}

/**
 * Yeni paket kategorisi oluştur
 * @param name Kategori adı
 * @returns Oluşturulan kategori yanıtı
 */
export async function createPackageCategory(name: string) {
  return await callMcpApi('add-package-category', { name }, {
    showToast: false,
    customErrorMsg: 'Paket kategorisi oluşturulurken bir hata oluştu'
  });
}

/**
 * Paket kategorisi güncelle
 * @param id Kategori ID
 * @param name Yeni kategori adı
 * @returns Güncellenen kategori yanıtı
 */
export async function updatePackageCategory(id: string, name: string) {
  return await callMcpApi('update-package-category', { id, name }, {
    showToast: false,
    customErrorMsg: 'Paket kategorisi güncellenirken bir hata oluştu'
  });
}

/**
 * Paket kategorisi sil
 * @param id Kategori ID
 * @returns İşlem sonucu
 */
export async function deletePackageCategory(id: string) {
  return await callMcpApi('delete-package-category', { id }, {
    showToast: false,
    customErrorMsg: 'Paket kategorisi silinirken bir hata oluştu'
  });
}