/**
 * Paket Önbellek Sistemi
 * 
 * Bu modül paket verilerinin önbelleklenmesini sağlayarak gereksiz API çağrılarını azaltır.
 * Belirli süre sonra verilerin yenilenmesini ve veri değişikliklerinde önbelleğin temizlenmesini sağlar.
 */

// Önbellek veri tipi
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Önbellek durumunu tutan nesne
class PackageCache {
  private static instance: PackageCache;
  private cache: Map<string, CacheItem<any>>;
  private cacheDuration: number; // Milisaniye cinsinden önbellek süresi (varsayılan: 5 dakika)
  
  private constructor(cacheDuration: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.cacheDuration = cacheDuration;
  }
  
  // Singleton pattern ile tek bir önbellek örneği oluşturur
  public static getInstance(): PackageCache {
    if (!PackageCache.instance) {
      PackageCache.instance = new PackageCache();
    }
    return PackageCache.instance;
  }
  
  // Önbelleğe veri ekler
  public set<T>(key: string, data: T): void {
    console.log(`[CACHE] Veri önbelleğe ekleniyor: ${key}`);
    
    // API yanıt formatını kontrol et ve iç veriyi çıkar
    let cacheData = data;
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const apiResponse = data as any;
      if (apiResponse.success === true && apiResponse.data !== undefined) {
        console.log(`[CACHE] API yanıt formatı tespit edildi, iç veri kullanılıyor`);
        cacheData = apiResponse.data;
      }
    }
    
    // Veri sayısal alanlarının tipini kontrol et ve düzelt
    if (Array.isArray(cacheData)) {
      try {
        cacheData = cacheData.map(item => {
          if (item && typeof item === 'object') {
            // sessionCount ve price alanlarını number'a çevir
            if (item.sessionCount !== undefined) {
              const numericValue = Number(item.sessionCount);
              if (!isNaN(numericValue)) {
                item.sessionCount = numericValue; 
              }
            }
            if (item.price !== undefined) {
              const numericValue = Number(item.price);
              if (!isNaN(numericValue)) {
                item.price = numericValue;
              }
            }
          }
          return item;
        });
        console.log(`[CACHE] Veri içindeki sayısal alanlar normalize edildi`);
      } catch (parseError) {
        console.error(`[CACHE] Veri normalizasyon hatası:`, parseError);
      }
    }
    
    this.cache.set(key, {
      data: cacheData,
      timestamp: Date.now()
    });
    console.log(`[CACHE] Veri önbelleğe eklendi: ${key}`);
  }
  
  // Önbellekten veri alır, süre aşımı varsa null döner
  public get<T>(key: string): T | null {
    console.log(`[CACHE] Önbellekten veri sorgulanıyor: ${key}`);
    const item = this.cache.get(key);
    
    if (!item) {
      console.log(`[CACHE] Önbellekte veri bulunamadı: ${key}`);
      return null;
    }
    
    // Süre aşımı kontrolü
    const now = Date.now();
    const elapsed = now - item.timestamp;
    if (elapsed > this.cacheDuration) {
      console.log(`[CACHE] Önbellek süresi dolmuş: ${key}, geçen süre: ${elapsed}ms, limit: ${this.cacheDuration}ms`);
      this.remove(key);
      return null;
    }
    
    console.log(`[CACHE] Önbellekte veri bulundu: ${key}, kalan süre: ${this.cacheDuration - elapsed}ms`);
    return item.data as T;
  }
  
  // Belirli bir anahtarı önbellekten kaldırır
  public remove(key: string): void {
    console.log(`[CACHE] Önbellekten veri kaldırılıyor: ${key}`);
    const existed = this.cache.has(key);
    this.cache.delete(key);
    console.log(`[CACHE] Önbellekten veri kaldırıldı: ${key}, var mıydı: ${existed}`);
  }
  
  // Belirli bir anahtar desenine uyan tüm öğeleri önbellekten temizler
  public invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    [...this.cache.keys()].forEach(key => {
      if (regex.test(key)) {
        this.remove(key);
      }
    });
  }
  
  // Tüm önbelleği temizler
  public clear(): void {
    this.cache.clear();
  }
  
  // Önbelleğin kalan geçerlilik süresini döndürür (milisaniye)
  public getRemainingTime(key: string): number {
    const item = this.cache.get(key);
    
    if (!item) {
      return 0;
    }
    
    const now = Date.now();
    const elapsed = now - item.timestamp;
    const remaining = Math.max(0, this.cacheDuration - elapsed);
    
    return remaining;
  }
  
  // Önbellek süresini günceller
  public setCacheDuration(durationMs: number): void {
    this.cacheDuration = durationMs;
  }
}

// Yaygın kullanılan önbellek anahtarları için sabitler
export const CacheKeys = {
  ALL_PACKAGES: 'packages:all',
  ACTIVE_PACKAGES: 'packages:active',
  PACKAGE_BY_ID: (id: string) => `package:${id}`,
  CATEGORIES: 'package:categories',
  SERVICES: 'services:all',
  SERVICES_BY_CATEGORY: (categoryId: string) => `services:category:${categoryId}`
};

// Önbellek örneğini dışa aktar
export const packageCache = PackageCache.getInstance();

// Yardımcı önbellek fonksiyonları
export const cacheUtils = {
  /**
   * Önbellekten veri almayı veya yoksa verilen fonksiyonu çağırıp önbelleğe kaydetmeyi sağlar
   * @param key - Önbellek anahtarı
   * @param fetchFn - Veriyi getiren asenkron fonksiyon
   * @returns - Önbellekteki veya API'den getirilen veri
   */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // Önbellekte var mı kontrol et
    console.log(`[CACHE-UTILS] getOrFetch çağrıldı, anahtar: ${key}, zaman: ${new Date().toISOString()}`);
    let cachedData;
    
    try {
      cachedData = packageCache.get<T>(key);
      console.log(`[CACHE-UTILS] Önbellek kontrol sonucu, veri var mı?: ${cachedData !== null ? 'EVET' : 'HAYIR'}`);
      
      if (cachedData !== null) {
        console.log(`[CACHE-UTILS] Önbellek veri tipi: ${typeof cachedData}`);
        console.log(`[CACHE-UTILS] Önbellek veri dizi mi?: ${Array.isArray(cachedData)}`);
        
        if (Array.isArray(cachedData)) {
          console.log(`[CACHE-UTILS] Önbellek veri uzunluğu: ${cachedData.length}`);
        }
      }
    } catch (cacheError) {
      console.error(`[CACHE-UTILS] Önbellek kontrolü sırasında hata: ${cacheError.message}`);
      console.error(`[CACHE-UTILS] Önbellek hata stack: ${cacheError.stack}`);
      cachedData = null;
    }
    
    if (cachedData !== null) {
      console.log(`[CACHE-UTILS] Veri önbellekten alındı: ${key}`);
      return cachedData;
    }
    
    // Yoksa API'den getir
    console.log(`[CACHE-UTILS] Veri önbellekte yok, API'den getiriliyor: ${key}`);
    try {
      // API çağrısı öncesi kontrol log
      console.log(`[CACHE-UTILS] fetchFn çağrılıyor...`);
      
      const data = await fetchFn();
      console.log(`[CACHE-UTILS] API'den veri alındı, yanıt tipi: ${typeof data}`);
      console.log(`[CACHE-UTILS] API yanıtı dizi mi?: ${Array.isArray(data)}`);
      
      // API'den gelen veriyi analiz et
      if (data === null || data === undefined) {
        console.warn(`[CACHE-UTILS] API boş veri döndü (null/undefined). Önbelleğe kaydedilmiyor.`);
        return data; // Boş veriyi doğrudan döndür, önbelleğe kaydetme
      }
      
      if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
          console.log(`[CACHE-UTILS] API yanıtı uzunluğu: ${data.length}`);
          
          // Boş dizi kontrolü - bu da normal bir durum olabilir
          if (data.length === 0) {
            console.log(`[CACHE-UTILS] API boş dizi döndü. Bu normal karşılanıyor.`);
            packageCache.set<T>(key, data); // Boş dizi de olsa önbelleğe kaydet
            return data;
          }
        } else {
          // Yanıtın başarı/veri/hata alanlarını kontrol et
          const apiResponse = data as any;
          console.log(`[CACHE-UTILS] API yanıtı alanları:`, Object.keys(apiResponse));
          console.log(`[CACHE-UTILS] API başarı durumu: ${apiResponse.success !== undefined ? apiResponse.success : 'belirtilmemiş'}`);
          console.log(`[CACHE-UTILS] API hata var mı?: ${apiResponse.error ? 'EVET' : 'HAYIR'}`);
          
          // API yanıt formattı veri kontrolü
          if (apiResponse.success === true) {
            // Başarılı API yanıtı - data alanı olup olmadığını kontrol et
            if (apiResponse.data !== undefined) {
              // "data" alanı var - bunu önbelleğe kaydedelim
              console.log(`[CACHE-UTILS] API veri alanı var, tipi: ${typeof apiResponse.data}`);
              console.log(`[CACHE-UTILS] API veri dizi mi?: ${Array.isArray(apiResponse.data)}`);
              if (Array.isArray(apiResponse.data)) {
                console.log(`[CACHE-UTILS] API veri uzunluğu: ${apiResponse.data.length}`);
              }
              
              console.log(`[CACHE-UTILS] Başarılı API yanıtı, veri önbelleğe kaydediliyor`);              
            } else {
              console.warn(`[CACHE-UTILS] API başarılı döndü ama data alanı yok. Önbelleğe kaydedilmiyor.`);
            }
          } else if (apiResponse.error) {
            // Hata durumu - önbelleğe kaydetme
            console.warn(`[CACHE-UTILS] API hata döndü: ${apiResponse.error}. Önbelleğe kaydedilmiyor.`);
            return data;
          }
        }
      }
      
      console.log(`[CACHE-UTILS] API'den veri alındı, önbelleğe kaydediliyor: ${key}`);
      
      // Önbelleğe kaydet
      try {
        packageCache.set<T>(key, data);
        console.log(`[CACHE-UTILS] Veri başarıyla önbelleğe kaydedildi: ${key}`);
      } catch (cacheSetError) {
        console.error(`[CACHE-UTILS] Önbelleğe kaydetme sırasında hata: ${cacheSetError.message}`);
        console.error(`[CACHE-UTILS] Önbelleğe kaydetme hata stack: ${cacheSetError.stack}`);
        // Hatayı yutup devam ediyoruz, önbellek kaydedilemese bile veriyi döndür
      }
      
      return data;
    } catch (error) {
      console.error(`[CACHE-UTILS] API'den veri getirme hatası (${key}):`, error);
      console.error(`[CACHE-UTILS] API hata detayları:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  },
  
  /**
   * Verilen kelime grubuna uyan tüm önbellek verilerini temizler
   * @param pattern - Temizlenecek anahtar deseni
   */
  invalidateByPattern(pattern: string): void {
    packageCache.invalidatePattern(pattern);
    console.log(`Önbellek temizlendi: ${pattern}`);
  },
  
  /**
   * Paketlerle ilgili tüm önbelleği temizler
   */
  invalidateAllPackageCache(): void {
    console.log('[CACHE-DEBUG] Paket önbelleği temizleniyor...');
    packageCache.invalidatePattern('package');
    packageCache.invalidatePattern('packages');
    
    // Özellikle aktif paketler önbelleğini doğrudan temizle
    packageCache.remove(CacheKeys.ACTIVE_PACKAGES);
    packageCache.remove(CacheKeys.ALL_PACKAGES);
    
    console.log('[CACHE-DEBUG] Tüm paket önbelleği temizlendi! Mevcut önbellek boşaltıldı.');
  },
  
  /**
   * Paket önbelleğini temizler ve hemen yeniden yükler
   * @param fetchFn - Paketleri getiren fonksiyon
   */
  async refreshPackageCache(fetchFn: () => Promise<any>): Promise<any> {
    console.log('[CACHE-DEBUG] Paket önbelleği yenileniyor - sıfırlanıyor ve yeniden yükleniyor...');
    
    // Tüm paket önbelleğini temizle
    this.invalidateAllPackageCache();
    
    // Yeniden yükle
    console.log('[CACHE-DEBUG] Paketler yeniden yükleniyor...');
    try {
      const result = await fetchFn();
      console.log('[CACHE-DEBUG] Paketler başarıyla yeniden yüklendi.');
      return result;
    } catch (error) {
      console.error('[CACHE-DEBUG] Paketleri yeniden yüklerken hata:', error);
      throw error;
    }
  }
};
