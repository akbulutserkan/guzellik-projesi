/**
 * Paket veritabanı servisi
 * Bu servis tüm paket işlemleri için veritabanı işlemlerini ve iş mantığını içerir.
 * Client tarafındaki packageService.ts ile çalışır.
 * @see /src/services/packageService.ts Client tarafı paket servisi
 */
import { prisma } from '@/lib/prisma';
import { CreatePackageData, UpdatePackageData, ServiceResult, FormattedServiceInfo } from './types';
import { checkCategoryExists } from './helpers';

/**
 * Paketleri getiren fonksiyon
 * @param {Object} options Filtre seçenekleri
 * @param {boolean} [options.includeDeleted=false] Silinmiş paketleri de getir
 * @returns {Promise<ServiceResult>} Sonuç
 */
export async function getPackagesFromDb(options: { includeDeleted?: boolean } = {}): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] [DEBUG] getPackagesFromDb çağrıldı, options:`, options);
    
    // Veritabanı bağlantısını kontrol et
    try {
      console.log(`[package-db-service] [DEBUG] Veritabanı bağlantısı kontrol ediliyor...`);
      // Basit bir sorgu ile bağlantıyı test edelim
      await prisma.$queryRaw`SELECT 1`;
      console.log(`[package-db-service] [DEBUG] Veritabanı bağlantısı başarılı!`);
    } catch (dbError) {
      console.error(`[package-db-service] [ERROR] Veritabanı bağlantı hatası:`, dbError);
      return {
        success: false,
        error: `Veritabanı bağlantı hatası: ${dbError.message || 'Bilinmeyen hata'}`,
        dbConnectionError: true
      };
    }
    
    const { includeDeleted = false } = options;
    
    console.log(`[package-db-service] [DEBUG] Paketler sorgulanıyor, includeDeleted=${includeDeleted}`);
    
    const packages = await prisma.package.findMany({
      where: includeDeleted ? {} : {
        deletedAt: null
      },
      include: {
        category: true,
        packageServices: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`[package-db-service] [DEBUG] Veritabanından ${packages.length} paket alındı, format düzenlemesi yapılıyor...`);
    
    // Servisleri düzenli formatta getir
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      services: pkg.packageServices.map(s => ({
        id: s.serviceId,
        name: s.service.name,
        duration: s.service.duration,
        price: s.service.price
      }))
    }));
    
    console.log(`[package-db-service] [DEBUG] ${formattedPackages.length} paket başarıyla formatı düzenlendi ve hazırlandı`);
    return {
      success: true,
      data: formattedPackages
    };
  } catch (error) {
    console.error('[package-db-service] [ERROR] Paketler getirilirken ciddi hata:', error);
    console.error('[package-db-service] [ERROR] Hata detayları:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Daha detaylı hata mesajı döndür
    return {
      success: false,
      error: `Paketler getirilemedi: ${error.message || 'Bilinmeyen bir hata oluştu'}`,
      errorDetails: error.code || error.name,
      stack: error.stack
    };
  }
}

/**
 * ID'ye göre paket detayı getiren fonksiyon
 * @param {string} id Paket ID'si
 * @returns {Promise<ServiceResult>} Paket detayı sonuç
 */
export async function getPackageByIdFromDb(id: string): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] getPackageByIdFromDb çağrıldı, id: ${id}`);
    
    const pkg = await prisma.package.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        packageServices: {
          include: {
            service: true
          }
        }
      }
    });
    
    if (!pkg) {
      console.log(`[package-db-service] ID'si ${id} olan paket bulunamadı`);
      return {
        success: false,
        error: 'Paket bulunamadı'
      };
    }
    
    // Servisleri düzenli formatta getir
    const formattedPackage = {
      ...pkg,
      services: pkg.packageServices.map(s => ({
        id: s.serviceId,
        name: s.service.name,
        duration: s.service.duration,
        price: s.service.price
      }))
    };
    
    console.log(`[package-db-service] ID'si ${id} olan paket bulundu`);
    return {
      success: true,
      data: formattedPackage
    };
  } catch (error) {
    console.error(`[package-db-service] Paket (${id}) detayı getirilirken hata:`, error);
    return {
      success: false,
      error: 'Paket detayı getirilemedi'
    };
  }
}

/**
 * Yeni paket oluşturan fonksiyon
 * @param {CreatePackageData} data Paket verileri
 * @returns {Promise<ServiceResult>} Oluşturulan paket sonuç
 */
export async function createPackageInDb(data: CreatePackageData): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] createPackageInDb çağrıldı, data:`, JSON.stringify(data, null, 2));
    console.log(`[package-db-service] Veri Tipleri:`, {
      name: typeof data.name,
      sessionCount: typeof data.sessionCount,
      price: typeof data.price,
      categoryId: typeof data.categoryId,
      serviceIds: Array.isArray(data.serviceIds) ? `array (${data.serviceIds.length})` : typeof data.serviceIds
    });
    
    // Veriler Null veya Undefined kontrolü
    if (!data) {
      console.error(`[package-db-service] Data null veya undefined!`);
      return {
        success: false,
        error: 'Paket verileri geçersiz: null veya undefined'
      };
    }
    
    // Gerekli alanları temizleme ve dönüştürme 
    const name = data.name ? String(data.name) : '';
    const sessionCount = data.sessionCount ? Number(data.sessionCount) : 0;
    const price = data.price ? Number(data.price) : 0;
    const categoryId = data.categoryId ? String(data.categoryId) : '';
    const serviceIds = Array.isArray(data.serviceIds) ? data.serviceIds : [];
    
    console.log(`[package-db-service] Temizlenmiş veriler:`, { 
      name, sessionCount, price, categoryId, serviceIds 
    });
    
    // Gerekli alanların validasyonu
    if (!name) {
      console.error(`[package-db-service] Paket adı boş!`);
      return {
        success: false,
        error: 'Paket adı gereklidir'
      };
    }
    
    if (!sessionCount || sessionCount <= 0) {
      console.error(`[package-db-service] Geçersiz seans sayısı: ${sessionCount}`);
      return {
        success: false,
        error: 'Geçerli bir seans sayısı gereklidir'
      };
    }
    
    if (price < 0) {
      console.error(`[package-db-service] Geçersiz fiyat: ${price}`);
      return {
        success: false,
        error: 'Geçerli bir fiyat gereklidir'
      };
    }
    
    if (!categoryId) {
      console.error(`[package-db-service] Kategori ID boş!`);
      return {
        success: false,
        error: 'Kategori seçimi gereklidir'
      };
    }
    
    if (!serviceIds.length) {
      console.error(`[package-db-service] Hizmet seçilmemiş!`);
      return {
        success: false,
        error: 'En az bir hizmet seçilmelidir'
      };
    }
    
    // Kategori var mı kontrol et
    const categoryResult = await checkCategoryExists(categoryId);
    if (!categoryResult.success) {
      console.error(`[package-db-service] Kategori bulunamadı: ${categoryId}`);
      return categoryResult;
    }
    
    // Servisleri kontrol et
    console.log(`[package-db-service] Hizmetler kontrol ediliyor: ${serviceIds.join(', ')}`);
    const servicesCount = await prisma.service.count({
      where: {
        id: {
          in: serviceIds
        }
      }
    });
    
    if (servicesCount !== serviceIds.length) {
      console.error(`[package-db-service] Bazı hizmetler bulunamadı, bulunan: ${servicesCount}, istenen: ${serviceIds.length}`);
      return {
        success: false,
        error: 'Bazı hizmetler bulunamadı'
      };
    }
    
    // Paket oluştur
    console.log(`[package-db-service] Veritabanına paket oluşturuluyor...`);
    try {
      const createdPackage = await prisma.package.create({
        data: {
          name,
          sessionCount,
          price,
          categoryId,
          packageServices: {
            create: serviceIds.map(serviceId => ({
              service: {
                connect: {
                  id: serviceId
                }
              }
            }))
          }
        },
        include: {
          category: true,
          packageServices: {
            include: {
              service: true
            }
          }
        }
      });
      
      // Servisleri düzenli formatta getir
      const formattedPackage = {
        ...createdPackage,
        services: createdPackage.packageServices.map(s => ({
          id: s.serviceId,
          name: s.service.name,
          duration: s.service.duration,
          price: s.service.price
        }))
      };
      
      console.log(`[package-db-service] Yeni paket oluşturuldu, id: ${createdPackage.id}`);
      return {
        success: true,
        data: formattedPackage
      };
    } catch (dbError) {
      console.error(`[package-db-service] Veritabanı işlemi sırasında hata:`, dbError);
      return {
        success: false,
        error: `Veritabanı hatası: ${dbError.message || 'Bilinmeyen hata'}`,
        details: {
          code: dbError.code,
          meta: dbError.meta
        }
      };
    }
  } catch (error) {
    console.error('[package-db-service] Paket oluşturulurken hata:', error);
    console.error('[package-db-service] Hata detayları:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return {
      success: false,
      error: `Paket oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Paketi güncelleyen fonksiyon
 * @param {string} id Paket ID'si
 * @param {UpdatePackageData} data Güncellenecek veriler
 * @returns {Promise<ServiceResult>} Güncellenen paket sonuç
 */
export async function updatePackageInDb(id: string, data: UpdatePackageData): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] updatePackageInDb çağrıldı, id: ${id}, data:`, data);
    
    // Paket var mı kontrol et
    const existingPackage = await prisma.package.findUnique({
      where: {
        id
      }
    });
    
    if (!existingPackage) {
      console.log(`[package-db-service] ID'si ${id} olan paket bulunamadı`);
      return {
        success: false,
        error: 'Güncellenecek paket bulunamadı'
      };
    }
    
    const { name, sessionCount, price, categoryId, serviceIds } = data;
    
    // Kategori var mı kontrol et (eğer kategori değiştiriliyorsa)
    if (categoryId) {
      const categoryResult = await checkCategoryExists(categoryId);
      if (!categoryResult.success) {
        return categoryResult;
      }
    }
    
    // Servisleri kontrol et (eğer servisler değiştiriliyorsa)
    if (serviceIds && serviceIds.length > 0) {
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
    }
    
    // Veritabanı güncellemesini başlat
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (sessionCount !== undefined) updateData.sessionCount = sessionCount;
    if (price !== undefined) updateData.price = price;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    
    // İlişkili servisleri güncelle
    let updatedPackage;
    
    if (serviceIds && serviceIds.length > 0) {
      // Önce mevcut ilişkileri sil
      await prisma.packageService.deleteMany({
        where: {
          packageId: id
        }
      });
      
      // Sonra yeni ilişkileri ekle
      updatedPackage = await prisma.package.update({
        where: {
          id
        },
        data: {
          ...updateData,
          packageServices: {
            create: serviceIds.map(serviceId => ({
              service: {
                connect: {
                  id: serviceId
                }
              }
            }))
          }
        },
        include: {
          category: true,
          packageServices: {
            include: {
              service: true
            }
          }
        }
      });
    } else {
      // Sadece paket verilerini güncelle
      updatedPackage = await prisma.package.update({
        where: {
          id
        },
        data: updateData,
        include: {
          category: true,
          packageServices: {
            include: {
              service: true
            }
          }
        }
      });
    }
    
    // Servisleri düzenli formatta getir
    const formattedPackage = {
      ...updatedPackage,
      services: updatedPackage.packageServices.map(s => ({
        id: s.serviceId,
        name: s.service.name,
        duration: s.service.duration,
        price: s.service.price
      }))
    };
    
    console.log(`[package-db-service] Paket güncellendi, id: ${id}`);
    return {
      success: true,
      data: formattedPackage
    };
  } catch (error) {
    console.error(`[package-db-service] Paket (${id}) güncellenirken hata:`, error);
    return {
      success: false,
      error: 'Paket güncellenemedi'
    };
  }
}

/**
 * Paketi akıllı şekilde silen fonksiyon (ilişki varsa soft delete, yoksa hard delete)
 * @param {string} id Paket ID'si
 * @returns {Promise<ServiceResult>} Silme işlemi sonuç
 */
export async function deletePackageFromDb(id: string): Promise<ServiceResult> {
  try {
    console.log(`[package-db-service] [AKILLI-SİLME] Paket silme işlemi başlatılıyor, ID: ${id}`);
    
    // Paket var mı kontrol et
    const existingPackage = await prisma.package.findUnique({
      where: { id }
    });
    
    if (!existingPackage) {
      console.log(`[package-db-service] [AKILLI-SİLME] ID'si ${id} olan paket bulunamadı`);
      return {
        success: false,
        error: 'Silinecek paket bulunamadı'
      };
    }
    
    // İlişkili kayıtları kontrol et
    console.log(`[package-db-service] [AKILLI-SİLME] Paket için ilişkiler kontrol ediliyor...`);
    
    // 1. Paket satışları var mı kontrol et
    const packageSalesCount = await prisma.packageSale.count({
      where: {
        packageId: id,
        deletedAt: null
      }
    });
    console.log(`[package-db-service] [AKILLI-SİLME] İlişkili paket satış sayısı: ${packageSalesCount}`);
    
    // 2. Paket oturumları var mı kontrol et
    const packageSessionsCount = await prisma.packageSession.count({
      where: {
        packageSale: {
          packageId: id
        }
      }
    });
    console.log(`[package-db-service] [AKILLI-SİLME] İlişkili paket oturum sayısı: ${packageSessionsCount}`);
    
    // 3. Paket ödemeleri var mı kontrol et
    const paymentsCount = await prisma.payment.count({
      where: {
        packageSale: {
          packageId: id
        }
      }
    });
    console.log(`[package-db-service] [AKILLI-SİLME] İlişkili ödeme sayısı: ${paymentsCount}`);
    
    // Tüm ilişki sayısını topla
    const totalRelations = packageSalesCount + packageSessionsCount + paymentsCount;
    console.log(`[package-db-service] [AKILLI-SİLME] Toplam ilişki sayısı: ${totalRelations}`);
    
    // İlişki durumuna göre silme türünü belirle
    if (totalRelations === 0) {
      // Hard Delete - İlişki yok, tamamen silinebilir
      console.log(`[package-db-service] [AKILLI-SİLME] İlişki bulunmadı, HARD DELETE uygulanıyor...`);
      
      // Önce packageService ilişkilerini sil
      await prisma.packageService.deleteMany({
        where: { packageId: id }
      });
      
      // Sonra paketi sil
      const deletedPackage = await prisma.package.delete({
        where: { id }
      });
      
      console.log(`[package-db-service] [AKILLI-SİLME] Paket başarıyla tamamen silindi (HARD DELETE), ID: ${id}`);
      return {
        success: true,
        data: { id: deletedPackage.id }
      };
    } else {
      // Soft Delete - İlişki var, pasife alınacak
      console.log(`[package-db-service] [AKILLI-SİLME] ${totalRelations} ilişki bulundu, SOFT DELETE uygulanıyor...`);
      
      const deletedPackage = await prisma.package.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });
      
      console.log(`[package-db-service] [AKILLI-SİLME] Paket başarıyla pasife alındı (SOFT DELETE), ID: ${id}`);
      return {
        success: true,
        data: { id: deletedPackage.id }
      };
    }
  } catch (error) {
    console.error(`[package-db-service] [AKILLI-SİLME] Paket (${id}) silinirken hata:`, error);
    return {
      success: false,
      error: `Paket silinemedi: ${error.message || 'Bilinmeyen bir hata oluştu'}`
    };
  }
}