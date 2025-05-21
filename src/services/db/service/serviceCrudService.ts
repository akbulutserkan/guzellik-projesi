/**
 * Hizmet (Service) CRUD işlemleri
 */
import { prisma } from '@/lib/prisma';
import {
  ServiceFilterOptions,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServiceWithCategory,
  ServiceResponse
} from './types';
import {
  formatName,
  validateServiceData,
  formatServiceList,
  addCategoryNameToService
} from './helpers';

/**
 * Tüm hizmetleri veritabanından getiren fonksiyon
 */
export async function getServicesFromDb(filters?: ServiceFilterOptions): Promise<ServiceResponse<ServiceWithCategory[]>> {
  try {
    console.log('[service-db-service] getServicesFromDb çağrıldı, filtreler:', filters);
    
    // Temel filtreleme koşulları
    const where: any = {};
    
    // Kategori filtreleme
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    // Aktiflik durumu filtreleme
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    // Arama sorgusu filtreleme
    if (filters?.searchQuery) {
      where.name = {
        contains: filters.searchQuery,
        mode: 'insensitive'
      };
    }
    
    // Silinmiş hizmetleri dahil etme/etmeme
    if (!filters?.includeDeleted) {
      where.deletedAt = null;
    }

    // Veritabanı sorgusu
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Kategori adını doğrudan ekleyelim
    const formattedServices = formatServiceList(services);

    console.log(`[service-db-service] ${formattedServices.length} hizmet bulundu`);
    
    return {
      success: true,
      data: formattedServices
    };
  } catch (error) {
    console.error('[service-db-service] Hizmetler alınırken hata:', error);
    
    return {
      success: false,
      error: `Hizmetler alınırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * ID'ye göre bir hizmeti veritabanından getiren fonksiyon
 */
export async function getServiceByIdFromDb(id: string): Promise<ServiceResponse<ServiceWithCategory>> {
  try {
    console.log(`[service-db-service] getServiceByIdFromDb çağrıldı, id: ${id}`);
    
    const service = await prisma.service.findUnique({
      where: {
        id,
        deletedAt: null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!service) {
      console.log(`[service-db-service] ${id} ID'li hizmet bulunamadı`);
      return {
        success: false,
        error: 'Hizmet bulunamadı'
      };
    }

    // Kategori adını doğrudan ekleyelim
    const formattedService = addCategoryNameToService(service);

    console.log(`[service-db-service] ${id} ID'li hizmet bulundu`);
    
    return {
      success: true,
      data: formattedService
    };
  } catch (error) {
    console.error(`[service-db-service] ID:${id} hizmeti alınırken hata:`, error);
    
    return {
      success: false,
      error: `Hizmet alınırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Yeni bir hizmet oluşturan fonksiyon - HATAYAKALA SÜRÜMÜ
 */
export async function createServiceInDb(data: ServiceCreateInput): Promise<ServiceResponse<ServiceWithCategory>> {
  try {
  console.log('[service-db-service] [HATA-GIDER] createServiceInDb çağrıldı, veriler:', JSON.stringify(data, null, 2));
        
        // Sadece gerekli alanları içeren temiz bir nesne oluştur
        const cleanData = {
            name: data.name,
            price: Number(data.price),
            duration: Number(data.duration),
            categoryId: data.categoryId,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
        };

        console.log('[service-db-service] [HATA-GIDER] Temizlenmiş veri:', JSON.stringify(cleanData, null, 2));
    
    // Verileri doğrulama
    const validationError = validateServiceData(data);
    if (validationError) {
      console.log('[service-db-service] [HATA-GIDER] Doğrulama hatası:', validationError);
      return {
        success: false,
        error: validationError
      };
    }

    // Kategori mevcut mu kontrol et
    console.log('[service-db-service] [HATA-GIDER] Kategori kontrol ediliyor, ID:', data.categoryId);
    const categoryExists = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId }
    });

    if (!categoryExists) {
      console.log('[service-db-service] [HATA-GIDER] Kategori bulunamadı, ID:', data.categoryId);
      return {
        success: false,
        error: 'Seçili kategori bulunamadı'
      };
    }
    console.log('[service-db-service] [HATA-GIDER] Kategori bulundu:', categoryExists.name);

    // Formatlanmış veri
    const formattedName = formatName(data.name);
    console.log('[service-db-service] [HATA-GIDER] Hizmet adı formatlandı:', formattedName);

    // Veritabanında oluştur
    console.log('[service-db-service] [HATA-GIDER] Veritabanı işlemi başlıyor, gönderilen veri:', {
      name: formattedName,
      description: data.description,
      price: data.price,
      duration: data.duration,
      categoryId: data.categoryId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDeleted: false, // Açıkça false olarak belirtelim
      deletedAt: null   // Açıkça null olarak belirtelim
    });
    
    // Hizmet adının benzersiz olduğundan emin olalım
    console.log('[service-db-service] [HATA-GIDER] Aynı isimde hizmet var mı kontrol ediliyor...');
    const existingService = await prisma.service.findFirst({
      where: {
        name: formattedName,
        deletedAt: null
      }
    });

    if (existingService) {
      console.log('[service-db-service] [HATA-GIDER] Aynı isimde hizmet zaten var:', existingService.id);
      return {
        success: false,
        error: 'Bu isimde bir hizmet zaten mevcut'
      };
    }
    
    // Veritabanına yazma işlemi
    const newService = await prisma.service.create({
      data: {
        name: cleanData.name,
        price: cleanData.price,
        duration: cleanData.duration,
        categoryId: cleanData.categoryId,
        isActive: cleanData.isActive,
        isDeleted: false, // Açıkça false olarak belirtelim
        deletedAt: null   // Açıkça null olarak belirtelim
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Kategori adını doğrudan ekleyelim
    const serviceWithCategoryName = addCategoryNameToService(newService);

    // Hizmet kaydını hemen kontrol edelim
    console.log('[service-db-service] [HATA-GIDER] Hizmet oluşturuldu, ID:', serviceWithCategoryName.id);
    console.log('[service-db-service] [HATA-GIDER] Oluşturulan hizmeti veritabanından kontrol ediyorum...');
    
    const checkService = await prisma.service.findUnique({
      where: { id: serviceWithCategoryName.id },
      include: { category: true }
    });
    
    if (!checkService) {
      console.error('[service-db-service] [HATA-GIDER] KRİTİK: Hizmet oluşturuldu ama veritabanında bulunamadı!');
    } else {
      console.log('[service-db-service] [HATA-GIDER] Hizmet doğrulandı:', checkService.name);
    }
    
    return {
      success: true,
      data: serviceWithCategoryName
    };
  } catch (error) {
    console.error('[service-db-service] [HATA-GIDER] Hizmet oluşturulurken HATA:', error);
    
    // Unique constraint hatası
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Bu isimde bir hizmet zaten mevcut'
      };
    }
    
    return {
      success: false,
      error: `Hizmet oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Bir hizmeti güncelleyen fonksiyon
 */
export async function updateServiceInDb(id: string, data: ServiceUpdateInput): Promise<ServiceResponse<ServiceWithCategory>> {
  try {
    console.log(`[service-db-service] updateServiceInDb çağrıldı, id: ${id}, veriler:`, data);
    
    // Hizmet mevcut mu kontrol et
    const serviceExists = await prisma.service.findUnique({
      where: { id, deletedAt: null }
    });

    if (!serviceExists) {
      return {
        success: false,
        error: 'Güncellenecek hizmet bulunamadı'
      };
    }

    // Veri doğrulama
    const validationError = validateServiceData(data);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Kategori ID'si belirtilmişse, kategori mevcut mu kontrol et
    if (data.categoryId) {
      const categoryExists = await prisma.serviceCategory.findUnique({
        where: { id: data.categoryId }
      });

      if (!categoryExists) {
        return {
          success: false,
          error: 'Seçili kategori bulunamadı'
        };
      }
    }

    // Güncellenecek veri hazırlama
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = formatName(data.name);
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }
    
    if (data.price !== undefined) {
      updateData.price = data.price;
    }
    
    if (data.duration !== undefined) {
      updateData.duration = data.duration;
    }
    
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId;
    }
    
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    
    // Kategori değiştirildi mi?
    if (data.categoryId !== undefined && data.categoryId !== serviceExists.categoryId) {
      console.log(`[service-db-service] Hizmet kategorisi değişiyor: ${serviceExists.categoryId} -> ${data.categoryId}`);
      
      // Bu transaction ile hem hizmet hem de ilişkili paketleri tek bir işlemde güncelleyeceğiz
      const result = await prisma.$transaction(async (tx) => {
        // 1. Önce hizmeti güncelle
        const updatedService = await tx.service.update({
          where: { id },
          data: updateData,
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        // 2. Bu hizmeti içeren paketleri bul
        const relatedPackages = await tx.packageService.findMany({
          where: { serviceId: id },
          select: { 
            packageId: true 
          }
        });
        
        const packageIds = [...new Set(relatedPackages.map(p => p.packageId))];
        console.log(`[service-db-service] Bu hizmetin kullanıldığı paket sayısı: ${packageIds.length}`);
        
        // 3. Her paket için kategori güncelleme kontrolü
        for (const packageId of packageIds) {
          // Paketin içindeki tüm hizmetleri getir
          const packageServices = await tx.packageService.findMany({
            where: { packageId },
            include: { 
              service: true 
            }
          });
          
          // Tüm hizmetlerin kategorilerini kontrol et
          const serviceCategories = packageServices.map(ps => ps.service.categoryId);
          const uniqueCategories = [...new Set(serviceCategories)];
          
          console.log(`[service-db-service] Paket ID=${packageId}, içinde ${serviceCategories.length} hizmet, ${uniqueCategories.length} farklı kategori var`);
          
          // Eğer tüm hizmetler aynı kategorideyse, paket kategorisini güncelle
          if (uniqueCategories.length === 1) {
            const newCategoryId = uniqueCategories[0];
            
            // Paket kategorisini güncelle
            await tx.package.update({
              where: { id: packageId },
              data: { 
                categoryId: newCategoryId,
                updatedAt: new Date() // Son güncelleme tarihini de yenile
              }
            });
            
            console.log(`[service-db-service] Paket ID=${packageId} kategorisi güncellendi: ${newCategoryId}`);
          }
        }
        
        // Kategori adını doğrudan ekleyelim
        const serviceWithCategoryName = addCategoryNameToService(updatedService);
        return serviceWithCategoryName;
      });
      
      console.log(`[service-db-service] Transaction tamamlandı, hizmet güncellemesi ve paket kategori güncellemeleri başarılı`);
      return { success: true, data: result };
    }
    
    // Kategori değişmediyse normal güncelleme devam eder
    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Kategori adını doğrudan ekleyelim
    const serviceWithCategoryName = addCategoryNameToService(updatedService);

    console.log(`[service-db-service] ${id} ID'li hizmet güncellendi:`, serviceWithCategoryName);
    
    return {
      success: true,
      data: serviceWithCategoryName
    };
  } catch (error) {
    console.error(`[service-db-service] ID:${id} hizmeti güncellenirken hata:`, error);
    
    // Unique constraint hatası
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Bu isimde bir hizmet zaten mevcut'
      };
    }
    
    return {
      success: false,
      error: `Hizmet güncellenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Bir hizmeti akıllı şekilde silen fonksiyon (ilişki varsa soft delete, yoksa hard delete)
 */
export async function deleteServiceFromDb(id: string): Promise<ServiceResponse<ServiceWithCategory>> {
  try {
    console.log(`[SİLME-DETAY] *** AKILLI DELETE İŞLEMİ BAŞLADI - HİZMET ID: ${id} ***`);
    
    // Hizmet mevcut mu kontrol et
    const serviceExists = await prisma.service.findUnique({
      where: { id, deletedAt: null }
    });
    
    console.log(`[SİLME-DETAY] Hizmet bulundu mu: ${serviceExists ? 'EVET' : 'HAYIR'}, Detaylar:`, serviceExists);

    if (!serviceExists) {
      console.log(`[SİLME-DETAY] HATA: Silinecek hizmet bulunamadı`);
      return {
        success: false,
        error: 'Silinecek hizmet bulunamadı'
      };
    }
    
    // 1. Randevularda kullanılıyor mu?
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId: id }
    });
    
    console.log(`[SİLME-DETAY] İLİŞKİ KONTROL - Randevu sayısı: ${appointmentCount}`);
    
    // 2. Paket seanslarında kullanılıyor mu?
    const packageSessionCount = await prisma.packageSession.count({
      where: { serviceId: id }
    });
    
    console.log(`[SİLME-DETAY] İLİŞKİ KONTROL - Paket seans sayısı: ${packageSessionCount}`);
    
    // 3. Paket hizmetlerinde kullanılıyor mu?
    const packageServiceCount = await prisma.packageService.count({
      where: { serviceId: id }
    });
    
    console.log(`[SİLME-DETAY] İLİŞKİ KONTROL - Paket tanımı sayısı: ${packageServiceCount}`);

    // Tüm ilişki sayısını topla
    const totalRelations = appointmentCount + packageSessionCount + packageServiceCount;
    console.log(`[SİLME-DETAY] Toplam ilişki sayısı: ${totalRelations}`);
    
    // İlişki durumuna göre silme türünü belirle
    if (totalRelations === 0) {
      // Hard Delete - İlişki yok, tamamen silinebilir
      console.log(`[SİLME-DETAY] İlişki bulunmadı, HARD DELETE uygulanıyor...`);
      
      try {
        const deletedService = await prisma.service.delete({
          where: { id }
        });
        
        console.log(`[SİLME-DETAY] SİLME İŞLEMİ BAŞARILI: HARD DELETE`);
        
        return {
          success: true,
          data: deletedService
        };
      } catch (hardDeleteError) {
        console.error(`[SİLME-DETAY] HARD DELETE HATASI:`, hardDeleteError);
        return {
          success: false,
          error: `Hizmet silinirken bir hata oluştu: ${hardDeleteError.message}`
        };
      }
    } else {
      // Soft Delete - İlişki var, pasife alınacak
      console.log(`[SİLME-DETAY] ${totalRelations} ilişki bulundu, SOFT DELETE uygulanıyor...`);
      
      try {
        const deactivatedService = await prisma.service.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            isActive: false
          }
        });
        
        console.log(`[SİLME-DETAY] SİLME İŞLEMİ BAŞARILI: SOFT DELETE (pasife alındı)`);
        
        return {
          success: true,
          data: deactivatedService
        };
      } catch (softDeleteError) {
        console.error(`[SİLME-DETAY] SOFT DELETE HATASI:`, softDeleteError);
        return {
          success: false,
          error: `Hizmet pasife alınırken bir hata oluştu: ${softDeleteError.message}`
        };
      }
    }
  } catch (error) {
    console.error(`[SİLME-DETAY] GENEL İŞLEM HATASI:`, error);
    
    return {
      success: false,
      error: `Hizmet silinirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Kategori ID'sine göre hizmetleri getiren fonksiyon
 */
export async function getServicesByCategoryFromDb(categoryId: string): Promise<ServiceResponse<ServiceWithCategory[]>> {
  try {
    console.log(`[service-db-service] getServicesByCategoryFromDb çağrıldı, categoryId: ${categoryId}`);
    
    // Kategori mevcut mu kontrol et
    const categoryExists = await prisma.serviceCategory.findUnique({
      where: { id: categoryId }
    });

    if (!categoryExists) {
      return {
        success: false,
        error: 'Kategori bulunamadı'
      };
    }

    // Kategoriye ait hizmetleri getir
    const services = await prisma.service.findMany({
      where: {
        categoryId,
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Kategori adını doğrudan ekleyelim
    const formattedServices = formatServiceList(services);

    console.log(`[service-db-service] ${categoryId} ID'li kategoride ${formattedServices.length} hizmet bulundu`);
    
    return {
      success: true,
      data: formattedServices
    };
  } catch (error) {
    console.error(`[service-db-service] Kategori ID:${categoryId} hizmetleri alınırken hata:`, error);
    
    return {
      success: false,
      error: `Kategori hizmetleri alınırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
    };
  }
}