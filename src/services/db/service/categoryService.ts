/**
 * Hizmet Kategorileri (Service Category) işlemleri
 */
import { prisma } from '@/lib/prisma';
import {
  ServiceCategoryWithCount,
  ServiceCategoryWithServices,
  ServiceResponse
} from './types';
import {
  formatName,
  validateCategoryData,
  addServiceCountToCategories,
  formatServiceList
} from './helpers';

/**
 * Tüm hizmet kategorilerini veritabanından getiren fonksiyon
 */
export async function getServiceCategoriesFromDb(): Promise<ServiceResponse<ServiceCategoryWithCount[]>> {
  try {
    console.log('[service-db-service] getServiceCategoriesFromDb çağrıldı');
    
    // Kategori ve alt kayıtlarını getir, siralama uygula
    const categories = await prisma.serviceCategory.findMany({
      include: {
        services: {
          where: { deletedAt: null },
          select: { id: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Kategori içindeki hizmet sayısını hesapla
    const categoriesWithCount = addServiceCountToCategories(categories);

    console.log(`[service-db-service] ${categoriesWithCount.length} kategori bulundu`);
    
    return {
      success: true,
      data: categoriesWithCount
    };
  } catch (error) {
    console.error('[service-db-service] Kategoriler alınırken hata:', error);
    
    return {
      success: false,
      error: `Kategoriler alınırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * ID'ye göre bir hizmet kategorisini veritabanından getiren fonksiyon
 */
export async function getServiceCategoryByIdFromDb(id: string): Promise<ServiceResponse<ServiceCategoryWithServices>> {
  try {
    console.log(`[service-db-service] getServiceCategoryByIdFromDb çağrıldı, id: ${id}`);
    
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      console.log(`[service-db-service] ${id} ID'li kategori bulunamadı`);
      return {
        success: false,
        error: 'Kategori bulunamadı'
      };
    }

    // Kategori içindeki hizmetlere kategori adını ekle
    const formattedCategory = {
      ...category,
      services: formatServiceList(category.services)
    };

    console.log(`[service-db-service] ${id} ID'li kategori bulundu`);
    
    return {
      success: true,
      data: formattedCategory
    };
  } catch (error) {
    console.error(`[service-db-service] ID:${id} kategorisi alınırken hata:`, error);
    
    return {
      success: false,
      error: `Kategori alınırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Yeni bir hizmet kategorisi oluşturan fonksiyon
 */
export async function createServiceCategoryInDb(name: string): Promise<ServiceResponse<ServiceCategoryWithCount>> {
  try {
    console.log(`[service-db-service] createServiceCategoryInDb çağrıldı, name: ${name}`);
    
    // Veri doğrulama
    const validationError = validateCategoryData(name);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Formatlanmış kategori adı
    const formattedName = formatName(name);

    // Veritabanında oluştur
    const newCategory = await prisma.serviceCategory.create({
      data: {
        name: formattedName
      }
    });

    // Hizmet sayısını ekle (yeni kategoride 0)
    const categoryWithCount = {
      ...newCategory,
      serviceCount: 0
    };

    console.log('[service-db-service] Yeni kategori oluşturuldu:', categoryWithCount);
    
    return {
      success: true,
      data: categoryWithCount
    };
  } catch (error) {
    console.error('[service-db-service] Kategori oluşturulurken hata:', error);
    
    // Unique constraint hatası
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Bu isimde bir kategori zaten mevcut'
      };
    }
    
    return {
      success: false,
      error: `Kategori oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Bir hizmet kategorisini güncelleyen fonksiyon
 */
export async function updateServiceCategoryInDb(id: string, name: string): Promise<ServiceResponse<ServiceCategoryWithCount>> {
  try {
    console.log(`[service-db-service] updateServiceCategoryInDb çağrıldı, id: ${id}, name: ${name}`);
    
    // Kategori mevcut mu kontrol et
    const categoryExists = await prisma.serviceCategory.findUnique({
      where: { id }
    });

    if (!categoryExists) {
      return {
        success: false,
        error: 'Güncellenecek kategori bulunamadı'
      };
    }

    // Veri doğrulama
    const validationError = validateCategoryData(name);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Formatlanmış kategori adı
    const formattedName = formatName(name);

    // Veritabanında güncelle
    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name: formattedName
      }
    });

    // Hizmet sayısını ve kategorisiyle döndür
    const categoryWithCount = {
      ...updatedCategory,
      serviceCount: await prisma.service.count({
        where: { categoryId: id, deletedAt: null }
      })
    };

    console.log(`[service-db-service] ${id} ID'li kategori güncellendi:`, updatedCategory);
    
    return {
      success: true,
      data: categoryWithCount
    };
  } catch (error) {
    console.error(`[service-db-service] ID:${id} kategorisi güncellenirken hata:`, error);
    
    // Unique constraint hatası
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Bu isimde bir kategori zaten mevcut'
      };
    }
    
    return {
      success: false,
      error: `Kategori güncellenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Bir hizmet kategorisini silen fonksiyon
 */
export async function deleteServiceCategoryFromDb(id: string): Promise<ServiceResponse<ServiceCategoryWithCount>> {
  try {
    console.log(`[service-db-service] deleteServiceCategoryFromDb çağrıldı, id: ${id}`);
    
    // Kategori mevcut mu kontrol et
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          where: { deletedAt: null },
          select: { id: true }
        }
      }
    });

    if (!category) {
      return {
        success: false,
        error: 'Silinecek kategori bulunamadı'
      };
    }

    // Kategoriye bağlı hizmetler varsa engelle
    if (category.services.length > 0) {
      return {
        success: false,
        error: `Bu kategoride ${category.services.length} adet hizmet bulunuyor. Önce bu hizmetleri silmeli veya başka bir kategoriye taşımalısınız.`
      };
    }

    // Kategoriyi sil
    const deletedCategory = await prisma.serviceCategory.delete({
      where: { id }
    });

    // Hizmet sayısını ekle (0 olacak zaten)
    const categoryWithCount = {
      ...deletedCategory,
      serviceCount: 0
    };

    console.log(`[service-db-service] ${id} ID'li kategori silindi`);
    
    return {
      success: true,
      data: categoryWithCount
    };
  } catch (error) {
    console.error(`[service-db-service] ID:${id} kategorisi silinirken hata:`, error);
    
    return {
      success: false,
      error: `Kategori silinirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}
