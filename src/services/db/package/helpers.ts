import { prisma } from '@/lib/prisma';
import { ServiceResult } from './types';

/**
 * Kategori ID'sine göre kategorinin varlığını kontrol eden yardımcı fonksiyon
 * @param {string} categoryId Kategori ID'si
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function checkCategoryExists(categoryId: string): Promise<ServiceResult> {
  try {
    // Kategori ID boş kontrol et
    if (!categoryId) {
      console.log(`[package-db-service] Kategori ID boş gönderildi`);
      return {
        success: false,
        error: 'Kategori seçilmelidir'
      };
    }

    // Log ekleyelim
    console.log(`[package-db-service] Kategori kontrol ediliyor, ID: ${categoryId}`);
    
    // Kategori var mı kontrol et - düzeltildi: serviceCategory olarak değiştirildi
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      console.log(`[package-db-service] Kategori bulunamadı, ID: ${categoryId}`);
      return {
        success: false,
        error: 'Seçilen kategori bulunamadı'
      };
    }
    
    console.log(`[package-db-service] Kategori bulundu, ID: ${categoryId}, isim: ${category.name}`);
    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error('[package-db-service] Kategori kontrolü sırasında hata:', error);
    return {
      success: false,
      error: 'Kategori kontrolü sırasında hata oluştu',
      details: error
    };
  }
}

/**
 * Servislerin varlığını kontrol eden yardımcı fonksiyon
 * @param {string[]} serviceIds Servis ID listesi
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function checkServicesExist(serviceIds: string[]): Promise<ServiceResult> {
  try {
    if (!serviceIds || serviceIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    const servicesCount = await prisma.service.count({
      where: {
        id: {
          in: serviceIds
        }
      }
    });
    
    if (servicesCount !== serviceIds.length) {
      console.log(`[package-db-service] Bazı hizmetler bulunamadı, bulunan: ${servicesCount}, istenen: ${serviceIds.length}`);
      return {
        success: false,
        error: 'Bazı hizmetler bulunamadı'
      };
    }
    
    return {
      success: true,
      data: { count: servicesCount }
    };
  } catch (error) {
    console.error(`[package-db-service] Servis kontrolü sırasında hata:`, error);
    return {
      success: false,
      error: 'Servis kontrolü sırasında hata oluştu'
    };
  }
}

/**
 * Paket verilerini formatlayan yardımcı fonksiyon
 * @param {any} pkg Paket verisi (ilişkili verilerle)
 * @returns {any} Formatlanmış paket verisi
 */
export function formatPackageData(pkg: any): any {
  return {
    ...pkg,
    services: pkg.services.map((s: any) => ({
      id: s.serviceId,
      name: s.service.name,
      duration: s.service.duration,
      price: s.service.price
    }))
  };
}
