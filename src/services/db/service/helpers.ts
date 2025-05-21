/**
 * Hizmet (Service) modülü yardımcı fonksiyonları
 */
import { formatServiceName } from '@/utils/service/formatters';

/**
 * Bir hizmet adını formatlar
 * @param name Formatlanacak hizmet adı
 * @returns Formatlanmış hizmet adı
 */
export function formatName(name: string): string {
  return formatServiceName(name);
}

/**
 * Veri doğrulama hatalarını kontrol eder
 * @param data Doğrulanacak veriler
 * @returns Hata mesajı (hata yoksa null)
 */
export function validateServiceData(data: {
  name?: string;
  price?: number;
  duration?: number;
}): string | null {
  if (data.name !== undefined && data.name.trim().length < 2) {
    return 'Hizmet adı en az 2 karakter olmalıdır';
  }

  if (data.price !== undefined && (data.price < 0 || data.price > 100000)) {
    return 'Fiyat 0-100.000 TL arasında olmalıdır';
  }

  if (data.duration !== undefined && (data.duration < 0 || data.duration > 480)) {
    return 'Süre 0-480 dakika arasında olmalıdır';
  }

  return null;
}

/**
 * Kategori adını doğrudan hizmet verisine ekler
 * @param service Hizmet verisi
 * @returns Kategori adı eklenmiş hizmet verisi
 */
export function addCategoryNameToService(service: any): any {
  return {
    ...service,
    categoryName: service.category?.name
  };
}

/**
 * Hizmet listesini formatlar ve kategori adlarını ekler
 * @param services Hizmet listesi
 * @returns Formatlanmış hizmet listesi
 */
export function formatServiceList(services: any[]): any[] {
  return services.map(service => addCategoryNameToService(service));
}

/**
 * Kategori validation
 * @param name Kategori adı
 * @returns Hata mesajı (hata yoksa null)
 */
export function validateCategoryData(name: string): string | null {
  if (!name || name.trim().length < 2) {
    return 'Kategori adı en az 2 karakter olmalıdır';
  }
  
  return null;
}

/**
 * Kategori listesi için hizmet sayısını ekleme
 * @param categories Kategori listesi
 * @returns Hizmet sayısı eklenmiş kategori listesi
 */
export function addServiceCountToCategories(categories: any[]): any[] {
  return categories.map(category => ({
    ...category,
    serviceCount: category.services?.length || 0,
    services: undefined // services dizisini kaldır
  }));
}
