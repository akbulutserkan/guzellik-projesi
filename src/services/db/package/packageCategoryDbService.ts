import { prisma } from '@/lib/prisma';
import { PackageCategoryData, ServiceResult } from './types';

/**
 * Tüm paket kategorilerini veritabanından getiren fonksiyon
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function getPackageCategoriesFromDb(): Promise<ServiceResult> {
  try {
    console.log('[package-db-service] getPackageCategoriesFromDb çağrıldı');
    
    const categories = await prisma.serviceCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`[package-db-service] ${categories.length} paket kategorisi bulundu`);
    return {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error('[package-db-service] Paket kategorileri getirilirken hata:', error);
    return {
      success: false,
      error: 'Paket kategorileri getirilemedi'
    };
  }
}

/**
 * ID'ye göre paket kategorisi detayı getiren fonksiyon
 * @param {string} id Kategori ID'si
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function getPackageCategoryByIdFromDb(id: string): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] getPackageCategoryByIdFromDb çağrıldı, id: ${id}`);
    
    const category = await prisma.serviceCategory.findUnique({
      where: {
        id
      }
    });
    
    if (!category) {
      console.log(`[package-db-service] ID'si ${id} olan kategori bulunamadı`);
      return {
        success: false,
        error: 'Kategori bulunamadı'
      };
    }
    
    console.log(`[package-db-service] ID'si ${id} olan kategori bulundu`);
    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error(`[package-db-service] Kategori (${id}) detayı getirilirken hata:`, error);
    return {
      success: false,
      error: 'Kategori detayı getirilemedi'
    };
  }
}

/**
 * Yeni paket kategorisi oluşturan fonksiyon
 * @param {string} name Kategori adı
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function createPackageCategoryInDb(name: string): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] createPackageCategoryInDb çağrıldı, name: ${name}`);
    
    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        name
      }
    });
    
    if (existingCategory) {
      console.log(`[package-db-service] "${name}" isimli kategori zaten var`);
      return {
        success: false,
        error: 'Bu isimde bir kategori zaten var'
      };
    }
    
    const category = await prisma.serviceCategory.create({
      data: {
        name
      }
    });
    
    console.log(`[package-db-service] Yeni kategori oluşturuldu, id: ${category.id}`);
    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error(`[package-db-service] Kategori oluşturulurken hata:`, error);
    return {
      success: false,
      error: 'Kategori oluşturulamadı'
    };
  }
}

/**
 * Paket kategorisini güncelleyen fonksiyon
 * @param {string} id Kategori ID'si
 * @param {string} name Yeni kategori adı
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function updatePackageCategoryInDb(id: string, name: string): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] updatePackageCategoryInDb çağrıldı, id: ${id}, name: ${name}`);
    
    // Kategori var mı kontrol et
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: {
        id
      }
    });
    
    if (!existingCategory) {
      console.log(`[package-db-service] ID'si ${id} olan kategori bulunamadı`);
      return {
        success: false,
        error: 'Güncellenecek kategori bulunamadı'
      };
    }
    
    // Aynı isimde başka kategori var mı kontrol et
    const duplicateCategory = await prisma.serviceCategory.findFirst({
      where: {
        name,
        id: {
          not: id
        }
      }
    });
    
    if (duplicateCategory) {
      console.log(`[package-db-service] "${name}" isimli başka bir kategori zaten var`);
      return {
        success: false,
        error: 'Bu isimde başka bir kategori zaten var'
      };
    }
    
    const updatedCategory = await prisma.serviceCategory.update({
      where: {
        id
      },
      data: {
        name
      }
    });
    
    console.log(`[package-db-service] Kategori güncellendi, id: ${id}`);
    return {
      success: true,
      data: updatedCategory
    };
  } catch (error) {
    console.error(`[package-db-service] Kategori (${id}) güncellenirken hata:`, error);
    return {
      success: false,
      error: 'Kategori güncellenemedi'
    };
  }
}

/**
 * Paket kategorisini silen fonksiyon
 * @param {string} id Kategori ID'si
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function deletePackageCategoryFromDb(id: string): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] deletePackageCategoryFromDb çağrıldı, id: ${id}`);
    
    // Kategoriye bağlı paketler var mı kontrol et
    const packagesCount = await prisma.package.count({
      where: {
        categoryId: id
      }
    });
    
    if (packagesCount > 0) {
      console.log(`[package-db-service] ID'si ${id} olan kategoriye bağlı ${packagesCount} paket bulundu`);
      return {
        success: false,
        error: 'Bu kategoriye bağlı paketler bulunduğu için silinemez'
      };
    }
    
    // Kategoriyi sil
    await prisma.serviceCategory.delete({
      where: {
        id
      }
    });
    
    console.log(`[package-db-service] Kategori silindi, id: ${id}`);
    return {
      success: true,
      data: { id }
    };
  } catch (error) {
    console.error(`[package-db-service] Kategori (${id}) silinirken hata:`, error);
    return {
      success: false,
      error: 'Kategori silinemedi'
    };
  }
}