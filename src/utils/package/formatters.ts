/**
 * Paket veri formatlama işlevleri
 * 
 * Bu dosya, paket verilerinin formatlanması için gereken tüm işlevleri sağlar.
 * Frontend tarafında yapılacak formatlama işlemleri burada yer alır.
 */

// Paket adını formatlar (Her kelimenin ilk harfi büyük, diğerleri küçük)
export const formatPackageName = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Fiyatı para birimi formatına dönüştürür
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
};

// Seans sayısını formatlı gösterir
export const formatSessionCount = (count: number): string => {
  return `${count} Seans`;
};

// Tarihi formatlı gösterir
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Paket fiyatının geçerli olup olmadığını kontrol eder
export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && price >= 0;
};

// Seans sayısının geçerli olup olmadığını kontrol eder
export const isValidSessionCount = (count: number): boolean => {
  return !isNaN(count) && count > 0 && Number.isInteger(count);
};

// Paket adının geçerli olup olmadığını kontrol eder
export const isValidPackageName = (name: string): boolean => {
  return !!name && name.trim().length >= 2;
};

// Kategori ID'sinin geçerli olup olmadığını kontrol eder
export const isValidCategoryId = (categoryId: string): boolean => {
  return !!categoryId && categoryId.trim().length > 0;
};

// Hizmet ID'lerinin geçerli olup olmadığını kontrol eder
export const isValidServiceIds = (serviceIds: any): boolean => {
  if (!serviceIds) return false;
  if (!Array.isArray(serviceIds)) return false;
  if (serviceIds.length === 0) return false;
  
  // Tüm elemanların string olduğundan emin ol
  for (const id of serviceIds) {
    if (typeof id !== 'string') return false;
  }
  
  return true;
};

// Paket durumunu standardize eder
export const standardizePackageStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Aktif',
    'Aktif': 'Aktif',
    'INACTIVE': 'Pasif',
    'Pasif': 'Pasif',
    'DELETED': 'Silinmiş',
    'Silinmiş': 'Silinmiş'
  };
  
  return statusMap[status] || status;
};

/**
 * Paket verilerini API'ye göndermeden önce hazırlar
 * @param packageData - Ham paket verileri
 * @returns - Formatlanmış ve temizlenmiş paket verileri
 */
export const preparePackageData = (packageData: any) => {
  const prepared = { ...packageData };
  
  // Sayısal değerleri düzelt
  if (prepared.price) {
    prepared.price = Number(prepared.price);
  }
  
  if (prepared.sessionCount) {
    prepared.sessionCount = Number(prepared.sessionCount);
  }
  
  // Adı formatla
  if (prepared.name) {
    prepared.name = formatPackageName(prepared.name);
  }
  
  return prepared;
};

/**
 * Paket verilerini doğrular ve hata mesajlarını içeren bir nesne döndürür
 * @param data - Doğrulanacak paket verileri
 * @returns - Hata mesajlarını içeren nesne veya boş nesne (hata yoksa)
 */
export const validatePackageDataWithMessages = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Paket adı kontrolü
  if (!isValidPackageName(data.name)) {
    errors.name = 'Geçerli bir paket adı giriniz (en az 2 karakter)';
  }
  
  // Fiyat kontrolü
  if (!isValidPrice(data.price)) {
    errors.price = 'Geçerli bir fiyat giriniz (0 veya daha büyük)';
  }
  
  // Seans sayısı kontrolü
  if (!isValidSessionCount(data.sessionCount)) {
    errors.sessionCount = 'Geçerli bir seans sayısı giriniz (en az 1)';
  }
  
  // Kategori kontrolü
  if (!isValidCategoryId(data.categoryId)) {
    errors.categoryId = 'Kategori seçimi zorunludur';
  }
  
  // Hizmet seçimi kontrolü
  if (!isValidServiceIds(data.serviceIds)) {
    errors.serviceIds = 'En az bir hizmet seçilmelidir';
  }
  
  return errors;
};

// Paket arama sonucunda gelen verileri formatlar
export const formatPackageSearchResults = (packages: any[]): any[] => {
  if (!packages || !Array.isArray(packages)) return [];
  
  return packages.map(pkg => ({
    ...pkg,
    formattedPrice: formatPrice(pkg.price),
    formattedSessionCount: formatSessionCount(pkg.sessionCount)
  }));
};

// Kategori ismine göre paketleri gruplanmış şekilde döndürür
export const groupPackagesByCategory = (packages: any[]): Record<string, any[]> => {
  if (!packages || !Array.isArray(packages)) return {};
  
  return packages.reduce((acc, pkg) => {
    const categoryName = pkg.category?.name || 'Diğer';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(pkg);
    return acc;
  }, {} as Record<string, any[]>);
};
