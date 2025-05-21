'use client';

import { Payment, PaymentFilterOptions } from '@/types/payment';

/**
 * Önbellek veri yapısı tiplemesi
 */
interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * Tahsilat önbelleği arayüzü
 */
interface PaymentCache {
  [key: string]: CacheData<Payment[]>;
}

// Önbellek nesnesi
const paymentCache: PaymentCache = {};

/**
 * Önbellek anahtarı oluşturan yardımcı fonksiyon
 * @param filters Filtre parametreleri
 * @returns Önbellek anahtarı
 */
export const createCacheKey = (filters: PaymentFilterOptions = {}): string => {
  return `payments_${JSON.stringify(filters)}`;
};

/**
 * Tahsilatları önbelleğe kaydeden fonksiyon
 * @param key Önbellek anahtarı
 * @param data Kaydedilecek tahsilat verileri
 * @param expiresInMs Önbellek süresi (ms cinsinden)
 */
export const cachePayments = (key: string, data: Payment[], expiresInMs: number = 5 * 60 * 1000): void => {
  paymentCache[key] = {
    data,
    timestamp: Date.now(),
    expiresIn: expiresInMs
  };
  
  console.log(`[paymentCache] ${data.length} tahsilat önbelleğe kaydedildi, anahtar: ${key}`);
};

/**
 * Önbellekten tahsilatları getiren fonksiyon
 * @param key Önbellek anahtarı
 * @returns Önbellekteki tahsilatlar veya null
 */
export const getCachedPayments = (key: string): Payment[] | null => {
  const cached = paymentCache[key];
  if (!cached) {
    console.log(`[paymentCache] Önbellekte veri bulunamadı, anahtar: ${key}`);
    return null;
  }
  
  // Süre kontrolü
  if (Date.now() - cached.timestamp > cached.expiresIn) {
    console.log(`[paymentCache] Önbellek süresi doldu, anahtar: ${key}`);
    delete paymentCache[key];
    return null;
  }
  
  console.log(`[paymentCache] ${cached.data.length} tahsilat önbellekten alındı, anahtar: ${key}`);
  return cached.data;
};

/**
 * Belirli bir anahtara sahip önbelleği geçersiz kılan fonksiyon
 * Eğer key belirtilmezse tüm önbelleği temizler
 * @param key Geçersiz kılınacak önbellek anahtarı (isteğe bağlı)
 */
export const invalidateCache = (key?: string): void => {
  if (key && paymentCache[key]) {
    delete paymentCache[key];
    console.log(`[paymentCache] Önbellek geçersiz kılındı, anahtar: ${key}`);
  } else if (!key) {
    // key belirtilmediyse tüm önbelleği temizle
    invalidateAllPaymentCache();
  }
};

/**
 * Tüm tahsilat önbelleğini geçersiz kılan fonksiyon
 */
export const invalidateAllPaymentCache = (): void => {
  Object.keys(paymentCache).forEach(key => {
    delete paymentCache[key];
  });
  console.log(`[paymentCache] Tüm tahsilat önbelleği geçersiz kılındı`);
};

/**
 * Önbellek durumunu kontrol eden fonksiyon
 * @returns Önbellek istatistikleri
 */
export const getCacheStats = (): { size: number, keys: string[] } => {
  return {
    size: Object.keys(paymentCache).length,
    keys: Object.keys(paymentCache)
  };
};
