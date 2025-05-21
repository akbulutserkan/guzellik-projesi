'use client';

import { Appointment } from '@/utils/appointment/formatters';
import { AppointmentFilterOptions } from '@/services/appointmentService';

/**
 * Önbellek veri yapısı tiplemesi
 */
interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * Randevu önbelleği arayüzü
 */
interface AppointmentCache {
  [key: string]: CacheData<Appointment[]>;
}

// Önbellek nesnesi
const appointmentCache: AppointmentCache = {};

/**
 * Önbellek anahtarı oluşturan yardımcı fonksiyon
 * @param filters Filtre parametreleri
 * @returns Önbellek anahtarı
 */
export const createCacheKey = (filters: AppointmentFilterOptions = {}): string => {
  // Filtre anahtarlarını sıralayarak tutarlı bir anahtar oluştur
  const orderedFilters: Record<string, any> = {};
  
  // Anahtar sıralamasını garantilemek için
  Object.keys(filters).sort().forEach(key => {
    orderedFilters[key] = filters[key];
  });
  
  return `appointments_${JSON.stringify(orderedFilters)}`;
};

/**
 * Randevuları önbelleğe kaydeden fonksiyon
 * @param key Önbellek anahtarı
 * @param data Kaydedilecek randevu verileri
 * @param expiresInMs Önbellek süresi (ms cinsinden)
 */
export const cacheAppointments = (key: string, data: Appointment[], expiresInMs: number = 5 * 60 * 1000): void => {
  try {
    // Veri geçerliliğini kontrol et
    if (!Array.isArray(data)) {
      console.error(`[appointmentCache] Geçersiz veri türü (dizi değil), önbelleğe alınmadı, anahtar: ${key}`);
      return;
    }
    
    // Önbellekteki maksimum öğe sayısını kontrol et (50 öğeye kadar izin ver)
    const cacheSize = Object.keys(appointmentCache).length;
    if (cacheSize >= 50) {
      // En eski önbellek girdisini bul ve sil
      let oldestKey = key;
      let oldestTime = Date.now();
      
      Object.entries(appointmentCache).forEach(([cacheKey, cacheEntry]) => {
        if (cacheEntry.timestamp < oldestTime) {
          oldestTime = cacheEntry.timestamp;
          oldestKey = cacheKey;
        }
      });
      
      delete appointmentCache[oldestKey];
      console.log(`[appointmentCache] Önbellek limitine ulaşıldı, en eski girdi silindi: ${oldestKey}`);
    }
    
    appointmentCache[key] = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs
    };
    
    console.log(`[appointmentCache] ${data.length} randevu önbelleğe kaydedildi, anahtar: ${key}`);
  } catch (error) {
    console.error(`[appointmentCache] Önbelleğe kaydetme hatası, anahtar: ${key}`, error);
  }
};

/**
 * Önbellekten randevuları getiren fonksiyon
 * @param key Önbellek anahtarı
 * @returns Önbellekteki randevular veya null
 */
export const getCachedAppointments = (key: string): Appointment[] | null => {
  try {
    const cached = appointmentCache[key];
    if (!cached) {
      console.log(`[appointmentCache] Önbellekte veri bulunamadı, anahtar: ${key}`);
      return null;
    }
    
    // Süre kontrolü
    if (Date.now() - cached.timestamp > cached.expiresIn) {
      console.log(`[appointmentCache] Önbellek süresi doldu, anahtar: ${key}`);
      delete appointmentCache[key];
      return null;
    }
    
    // Veri geçerliliğini kontrol et
    if (!Array.isArray(cached.data)) {
      console.error(`[appointmentCache] Önbellekteki veri geçerli bir dizi değil, anahtar: ${key}`);
      delete appointmentCache[key];
      return null;
    }
    
    console.log(`[appointmentCache] ${cached.data.length} randevu önbellekten alındı, anahtar: ${key}`);
    return cached.data;
  } catch (error) {
    console.error(`[appointmentCache] Önbellek okuma hatası, anahtar: ${key}`, error);
    return null;
  }
};

/**
 * Belirli bir anahtara sahip önbelleği geçersiz kılan fonksiyon
 * @param key Geçersiz kılınacak önbellek anahtarı
 */
export const invalidateCache = (key: string): void => {
  if (appointmentCache[key]) {
    delete appointmentCache[key];
    console.log(`[appointmentCache] Önbellek geçersiz kılındı, anahtar: ${key}`);
  }
};

/**
 * Tüm randevu önbelleğini geçersiz kılan fonksiyon
 */
// Doğrudan export edilen fonksiyon, daha güvenli import için
export const invalidateAllAppointmentCache = (): void => {
  Object.keys(appointmentCache).forEach(key => {
    delete appointmentCache[key];
  });
  console.log(`[appointmentCache] Tüm randevu önbelleği geçersiz kılındı`);
};

/**
 * Önbellek durumunu kontrol eden fonksiyon
 * @returns Önbellek istatistikleri
 */
export const getCacheStats = (): { size: number, keys: string[] } => {
  return {
    size: Object.keys(appointmentCache).length,
    keys: Object.keys(appointmentCache)
  };
};