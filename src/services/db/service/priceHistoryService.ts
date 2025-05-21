/**
 * Hizmet fiyat geçmişi veritabanı servisleri
 */
import { prisma } from '@/lib/prisma';

// Fiyat geçmişi getir
export async function getServicePriceHistoryFromDb() {
  try {
    console.log('[DB] Hizmet fiyat geçmişi getiriliyor');
    
    // Fiyat geçmişini getir
    const priceHistory = await prisma.servicePriceHistory.findMany({
      include: {
        service: true,
        updatedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      data: priceHistory
    };
  } catch (error) {
    console.error('[DB] Hizmet fiyat geçmişi getirme hatası:', error);
    return {
      success: false,
      error: error.message || 'Hizmet fiyat geçmişi getirilemedi',
      data: []
    };
  }
}

// Toplu fiyat güncellemesi önizleme
export async function bulkUpdatePreviewServicePricesInDb(params: {
  services: Array<{ id: string; price: number; }>
}) {
  try {
    console.log('[DB] Toplu fiyat güncellemesi önizlemesi yapılıyor');
    
    const { services } = params;
    
    if (!services || !Array.isArray(services) || services.length === 0) {
      return {
        success: false,
        error: 'Güncellenecek hizmet listesi boş veya hatalı format'
      };
    }
    
    // Her bir hizmet için şu anki fiyatı getir
    const serviceIds = services.map(s => s.id);
    const currentServices = await prisma.service.findMany({
      where: {
        id: { in: serviceIds }
      },
      select: {
        id: true,
        name: true,
        price: true
      }
    });
    
    // Hizmetleri, eskisi ve yenisi şeklinde eşleştir
    const previewData = services.map(newService => {
      const currentService = currentServices.find(s => s.id === newService.id);
      
      if (!currentService) {
        return {
          id: newService.id,
          name: 'Bulunamadı',
          oldPrice: 0,
          newPrice: newService.price,
          priceDifference: 0,
          status: 'error'
        };
      }
      
      const priceDifference = newService.price - currentService.price;
      const percentDifference = currentService.price > 0 
        ? (priceDifference / currentService.price) * 100 
        : 0;
      
      return {
        id: newService.id,
        name: currentService.name,
        oldPrice: currentService.price,
        newPrice: newService.price,
        priceDifference,
        percentDifference: parseFloat(percentDifference.toFixed(2)),
        status: 'ready'
      };
    });
    
    return {
      success: true,
      data: previewData
    };
  } catch (error) {
    console.error('[DB] Toplu fiyat güncellemesi önizleme hatası:', error);
    return {
      success: false,
      error: error.message || 'Toplu fiyat güncellemesi önizlemesi yapılamadı'
    };
  }
}

// Toplu fiyat güncellemesi
export async function bulkUpdateServicePricesInDb(params: {
  services: Array<{ id: string; price: number; }>;
  staffId: string;
}) {
  try {
    console.log('[DB] Toplu fiyat güncellemesi yapılıyor');
    
    const { services, staffId } = params;
    
    if (!services || !Array.isArray(services) || services.length === 0) {
      return {
        success: false,
        error: 'Güncellenecek hizmet listesi boş veya hatalı format'
      };
    }
    
    if (!staffId) {
      return {
        success: false,
        error: 'Güncellemeyi yapan personel ID\'si gerekli'
      };
    }
    
    // Veritabanı işlemleri için transaction başlat
    const results = await prisma.$transaction(async (tx) => {
      const updateResults = [];
      
      for (const service of services) {
        // Hizmetin mevcut durumunu kontrol et
        const currentService = await tx.service.findUnique({
          where: { id: service.id },
          select: { id: true, name: true, price: true }
        });
        
        if (!currentService) {
          updateResults.push({
            id: service.id,
            status: 'error',
            message: 'Hizmet bulunamadı'
          });
          continue;
        }
        
        // Fiyat değişikliği yoksa geç
        if (currentService.price === service.price) {
          updateResults.push({
            id: service.id,
            name: currentService.name,
            status: 'skipped',
            message: 'Fiyat değişmedi'
          });
          continue;
        }
        
        try {
          // Fiyat geçmişine kaydet
          await tx.servicePriceHistory.create({
            data: {
              serviceId: service.id,
              oldPrice: currentService.price,
              newPrice: service.price,
              updatedById: staffId,
            }
          });
          
          // Hizmet fiyatını güncelle
          await tx.service.update({
            where: { id: service.id },
            data: { price: service.price }
          });
          
          updateResults.push({
            id: service.id,
            name: currentService.name,
            oldPrice: currentService.price,
            newPrice: service.price,
            status: 'success',
            message: 'Fiyat güncellendi'
          });
        } catch (error) {
          updateResults.push({
            id: service.id,
            name: currentService.name,
            status: 'error',
            message: `Fiyat güncellenirken hata: ${error.message}`
          });
        }
      }
      
      return updateResults;
    });
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('[DB] Toplu fiyat güncellemesi hatası:', error);
    return {
      success: false,
      error: error.message || 'Toplu fiyat güncellemesi yapılamadı'
    };
  }
}

// Fiyat geçmişi kaydını geri al
export async function revertPriceHistoryInDb(id: string) {
  try {
    console.log('[DB] Fiyat geçmişi kaydı geri alınıyor, ID:', id);
    
    // İlk olarak geçmiş kaydını getir
    const historyRecord = await prisma.servicePriceHistory.findUnique({
      where: { id },
      include: { service: true }
    });
    
    if (!historyRecord) {
      return {
        success: false,
        error: 'Geri alınacak fiyat geçmişi kaydı bulunamadı'
      };
    }
    
    // Hizmetin şu anki fiyatını kontrol et
    const currentService = await prisma.service.findUnique({
      where: { id: historyRecord.serviceId }
    });
    
    if (!currentService) {
      return {
        success: false,
        error: 'Hizmet bulunamadı'
      };
    }
    
    // Eğer hizmetin şu anki fiyatı, geçmiş kaydındaki yeni fiyattan farklıysa uyarı ver
    if (currentService.price !== historyRecord.newPrice) {
      return {
        success: false,
        error: 'Hizmet fiyatı daha sonra değiştirilmiş, geri alınamaz'
      };
    }
    
    // Veritabanı işlemleri için transaction başlat
    await prisma.$transaction([
      // Hizmet fiyatını eski fiyata güncelle
      prisma.service.update({
        where: { id: historyRecord.serviceId },
        data: { price: historyRecord.oldPrice }
      }),
      
      // Geçmiş kaydını sil
      prisma.servicePriceHistory.delete({
        where: { id }
      })
    ]);
    
    return {
      success: true,
      message: 'Fiyat değişikliği başarıyla geri alındı',
      data: {
        serviceId: historyRecord.serviceId,
        serviceName: historyRecord.service.name,
        oldPrice: historyRecord.newPrice,
        newPrice: historyRecord.oldPrice
      }
    };
  } catch (error) {
    console.error('[DB] Fiyat geçmişi kaydı geri alma hatası:', error);
    return {
      success: false,
      error: error.message || 'Fiyat geçmişi kaydı geri alınamadı'
    };
  }
}