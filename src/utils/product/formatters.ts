/**
 * Ürün modülü için formatleyici ve doğrulama fonksiyonları
 * 
 * Bu dosya, ürünlerle ilgili formatlama, doğrulama ve dönüştürme
 * işlemlerini içeren yardımcı fonksiyonları barındırır.
 */

/**
 * Ürün adını formatlar (her kelimenin ilk harfi büyük)
 */
export const formatProductName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Fiyat formatla (TL para birimi formatında)
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
};

/**
 * Stok durumunu formatla (sayısal değer) 
 */
export const formatStock = (stock: number): string => {
  return stock.toString();
};

/**
 * Stok durumunu kontrol et
 */
export const isInStock = (stock: number): boolean => {
  return stock > 0;
};

/**
 * Ürün adının geçerli olup olmadığını kontrol eder
 */
export const isValidProductName = (name: string): boolean => {
  return !!name && name.trim().length >= 2;
};

/**
 * Fiyatın geçerli olup olmadığını kontrol eder
 */
export const isValidPrice = (price: number | string): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Stok değerinin geçerli olup olmadığını kontrol eder
 */
export const isValidStock = (stock: number | string): boolean => {
  const numStock = typeof stock === 'string' ? parseInt(stock) : stock;
  return !isNaN(numStock) && numStock >= 0;
};

/**
 * Ürün verisini doğrula ve hata mesajlarını döndür
 */
export const validateProductData = (data: {
  name?: string;
  price?: number | string;
  stock?: number | string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (data.name !== undefined && !isValidProductName(data.name)) {
    errors.name = 'Ürün adı en az 2 karakter olmalıdır';
  }
  
  if (data.price !== undefined && !isValidPrice(data.price)) {
    errors.price = 'Geçerli bir fiyat giriniz';
  }
  
  if (data.stock !== undefined && !isValidStock(data.stock)) {
    errors.stock = 'Geçerli bir stok değeri giriniz';
  }
  
  return { 
    valid: Object.keys(errors).length === 0,
    errors 
  };
};

/**
 * Ürün verilerini normalize et (formatla ve doğru tiplere dönüştür)
 */
export const normalizeProductData = (data: {
  name?: string;
  price?: number | string;
  stock?: number | string;
  description?: string | null;
}): {
  name?: string;
  price?: number;
  stock?: number;
  description?: string | null;
} => {
  const normalized: any = {};
  
  if (data.name !== undefined) {
    normalized.name = formatProductName(data.name);
  }
  
  if (data.price !== undefined) {
    normalized.price = typeof data.price === 'string' 
      ? parseFloat(data.price) 
      : data.price;
  }
  
  if (data.stock !== undefined) {
    normalized.stock = typeof data.stock === 'string' 
      ? parseInt(data.stock) 
      : data.stock;
  }
  
  if (data.description !== undefined) {
    normalized.description = data.description;
  }
  
  return normalized;
};
