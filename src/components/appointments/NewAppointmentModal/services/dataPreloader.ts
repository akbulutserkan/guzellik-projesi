/**
 * Modal açılmadan önce verileri yükleyen ve önbelleğe alan servis
 * MCP Entegrasyonu ile güncellenmiş versiyon
 */

import { fetchStaff, fetchCustomers, fetchServices } from './api';

// Veri önbelleği için global bir depo
const dataCache = new Map<string, {data: any, timestamp: number}>();

// Önbellek süresini ayarla 
// Personel için 5 dakika, diğerleri için 30 dakika
const CACHE_DURATION_STAFF = 5 * 60 * 1000;  // 5 dakika
const CACHE_DURATION_DEFAULT = 30 * 60 * 1000;  // 30 dakika

/**
 * Randevu modalı için gerekli tüm verileri önceden yükler
 */
export const preloadAppointmentData = async () => {
  try {
    console.log('Ön yükleme başlatılıyor...');
    
    // Öncelikle personel verileri için önbelleği temizle
    dataCache.delete('staff_list');
    console.log('Personel önbelleği temizlendi');
    
    // Tüm kritik verileri paralel olarak yükle
    const promises = [
      getCachedData('staff_list', fetchStaff),
      getCachedData('customers_list', fetchCustomers),
      getCachedData('services_list', fetchServices)  // MCP API kullanıyor artık
    ];
    
    // Başlat ama sonuçları beklemeden devam et
    Promise.all(promises)
      .then(() => {
        console.log('Tüm veriler önbelleğe alındı');
      })
      .catch(err => {
        console.error('Veri ön yükleme hatası:', err);
      });
      
    // Modal açılışını geciktirmemek için hemen dön
    return true;
  } catch (error) {
    console.error('Veri ön yükleme hatası:', error);
    return false;
  }
};

/**
 * Önbelleğe alınmış verileri getir veya yeniden yükle
 */
export const getCachedData = async (key: string, fetchFunction: () => Promise<any>) => {
  const now = Date.now();
  const cachedItem = dataCache.get(key);
  
  // Personel verileri için daha kısa önbellek süresi kullan
  const cacheDuration = key === 'staff_list' ? CACHE_DURATION_STAFF : CACHE_DURATION_DEFAULT;
  
  // Personel verileri için her zaman yeniden yükle, diğerleri için önbellekten kontrol et
  if (key === 'staff_list' || !cachedItem || (now - cachedItem.timestamp > cacheDuration)) {
    try {
      console.log(`'${key}' yeniden yükleniyor...`);
      const data = await fetchFunction();
      
      // Önbelleğe kaydet
      dataCache.set(key, { data, timestamp: now });
      console.log(`'${key}' önbelleğe alındı`);
      
      return data;
    } catch (error) {
      // Personel harici verilerde, hata durumunda önbellekte veri varsa onu kullan
      if (key !== 'staff_list' && cachedItem) {
        console.warn(`'${key}' yüklenemedi, eski önbellek kullanılıyor`);
        return cachedItem.data;
      }
      throw error;
    }
  } else {
    // Önbellekte varsa kullan
    console.log(`'${key}' önbellekten kullanılıyor`);
    return cachedItem.data;
  }
};

/**
 * Önbelleği temizler
 */
export const clearDataCache = () => {
  dataCache.clear();
  console.log('Veri önbelleği temizlendi');
};

// Sayfa yüklenirken bir kez çalıştır
if (typeof window !== 'undefined') {
  // Sayfanın tam yüklenmesinden sonra arka planda verileri yükle
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloadAppointmentData();
    }, 2000);
  });
}