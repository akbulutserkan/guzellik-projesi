/**
 * Hizmet modülü için formatlama ve doğrulama yardımcıları
 */

/**
 * Hizmet adını formatlar (Her kelimenin ilk harfi büyük)
 */
export const formatServiceName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Fiyatı formatlar (TL sembolü ve binlik ayraç ekleme)
 */
export const formatServicePrice = (price: number): string => {
  if (price === undefined || price === null) return '';
  
  return price.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  });
};

/**
 * Hizmet süresini formatlar (45 -> 45 dk)
 */
export const formatServiceDuration = (durationMinutes: number): string => {
  if (!durationMinutes && durationMinutes !== 0) return '';
  
  if (durationMinutes < 60) {
    return `${durationMinutes} dk`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} saat`;
  }
  
  return `${hours} saat ${minutes} dk`;
};

/**
 * Fiyatı API için normalleştirir (string -> number)
 */
export const normalizePrice = (price: string | number): number => {
  if (typeof price === 'number') return price;
  
  // TL sembolünü ve binlik ayraçları kaldır
  const cleaned = price.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Hizmet süresinin geçerli olup olmadığını kontrol eder
 */
export const isValidServiceDuration = (duration: number): boolean => {
  return typeof duration === 'number' && 
    duration >= 0 && 
    duration <= 480 && // 8 saat maksimum süre
    Number.isInteger(duration);
};

/**
 * Kategori ID'sinin geçerli olup olmadığını kontrol eder
 */
export const isValidCategoryId = (categoryId: string): boolean => {
  return !!categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0;
};

/**
 * Hizmet adının geçerli olup olmadığını kontrol eder
 */
export const isValidServiceName = (name: string): boolean => {
  return !!name && typeof name === 'string' && name.trim().length >= 2;
};

/**
 * Fiyatın geçerli olup olmadığını kontrol eder
 */
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && 
    price >= 0 && 
    price <= 100000; // Makul bir üst sınır
};
