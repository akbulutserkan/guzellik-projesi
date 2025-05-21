/**
 * Paket satışları sorgulama ve filtreleme işlemleri
 */
import { prisma } from '@/lib/prisma';
import { 
  ServiceResponse, 
  FormattedPackageSale,
  PackageSaleFilter
} from './types';
import { calculatePackageSaleExtras } from './helpers';

/**
 * Paket satışlarını filtreleme ve getirme
 */
export async function getPackageSalesFromDb(filters: PackageSaleFilter = {}): Promise<ServiceResponse<FormattedPackageSale[]>> {
  try {
    console.log('[package-sale-db-service] getPackageSalesFromDb çağrıldı, filtreler:', filters);
    
    // Veritabanı bağlantısını test et
    console.log('[package-sale-db-service] [DEBUG] prisma kontrol ediliyor...');
    if (!prisma) {
      throw new Error('Prisma client bulunamadı');
    }
    
    // Veritabanına bağlanıp bağlanmadığını kontrol et
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('[package-sale-db-service] [DEBUG] Veritabanı bağlantısı başarılı');
    } catch (dbError) {
      console.error('[package-sale-db-service] [ERROR] Veritabanı bağlantı hatası:', dbError);
      throw new Error(`Veritabanı bağlantı hatası: ${dbError.message}`);
    }

    // Filtreleri hazırla
    const where: any = {};
    
    // Tarih aralığı filtresi
    if (filters.startDate && filters.endDate) {
      where.saleDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }
    
    // Müşteri filtresi
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    
    // Personel filtresi
    if (filters.staffId) {
      where.staffId = filters.staffId;
    }

    // Paket filtresi
    if (filters.packageId) {
      where.packageId = filters.packageId;
    }

    // Durumda göre filtreleme (aktif/tamamlanan/expired)
    if (filters.status) {
      switch (filters.status) {
        case 'active':
          where.expiryDate = {
            gte: new Date()
          };
          where.isCompleted = false;
          break;
        case 'completed':
          where.isCompleted = true;
          break;
        case 'expired':
          where.expiryDate = {
            lt: new Date()
          };
          where.isCompleted = false;
          break;
      }
    }

    // Silinen kayıtları dahil et/etme
    if (filters.includeDeleted !== true) {
      where.deletedAt = null;
    }

    // Paket satışlarını getir
    console.log('[package-sale-db-service] [DEBUG] findMany sorgusu hazırlanıyor...');
    console.log('[package-sale-db-service] [DEBUG] Where koşulları:', JSON.stringify(where, null, 2));
    
    const packageSales = await prisma.packageSale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            price: true,
            packageServices: {
              include: {
                service: true
              }
            }
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        sessions: {
          where: {
            deletedAt: null
          },
          include: {
            // -------- DEĞİŞİKLİK BURADA --------
            appointments: { // "appointment" -> "appointments" olarak değiştirildi
            // -------- DEĞİŞİKLİK BURADA --------
              include: {
                staff: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                service: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        payments: {
          where: {
            deletedAt: null
          },
          orderBy: {
            date: 'desc'
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      }
    });

    // Ek bilgileri hesapla ve formatla
    const formattedSales = packageSales.map(sale => {
      const extras = calculatePackageSaleExtras(
        sale, 
        sale.payments, 
        sale.sessions
      );
      
      return {
        ...sale,
        ...extras
      };
    });

    console.log(`[package-sale-db-service] ${formattedSales.length} paket satışı bulundu`);
    return { success: true, data: formattedSales };
  } catch (error) {
    console.error('[package-sale-db-service] getPackageSalesFromDb hatası:', error);
    console.error('[package-sale-db-service] Hata detayları:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Özel prisma hatalarını kontrol et
    if (error.code === 'P2025') {
      return { success: false, error: 'İlgili veri bulunamadı' };
    } else if (error.code === 'P2002') {
      return { success: false, error: 'Tekillik ihlali' };
    } else if (error.code === 'P1001') {
      return { success: false, error: 'Veritabanına bağlanılamıyor' };
    }
    
    return { success: false, error: `Paket satışları getirilirken bir hata oluştu: ${error.message}` };
  }
}

/**
 * Müşteriye göre paket satışlarını getirme
 */
export async function getPackageSalesByCustomerFromDb(customerId: string, includeDeleted: boolean = false): Promise<ServiceResponse<FormattedPackageSale[]>> {
  try {
    console.log(`[package-sale-db-service] getPackageSalesByCustomerFromDb çağrıldı, customerId: ${customerId}`);

    const where: any = { customerId };
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const packageSales = await prisma.packageSale.findMany({
      where,
      include: {
        package: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            price: true,
            packageServices: {
              include: {
                service: true
              }
            }
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        sessions: {
          where: {
            deletedAt: null
          }
          // Not: Bu fonksiyonda sessionlar için appointment detayları çekilmiyor.
          // Eğer burada da çekilmesi gerekiyorsa, benzer bir "include: { appointments: { ... } }" bloğu eklenebilir.
          // Ancak mevcut hata sadece getPackageSalesFromDb fonksiyonundaydı.
        },
        payments: {
          where: {
            deletedAt: null
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      }
    });

    // Ek bilgileri hesapla ve formatla
    const formattedSales = packageSales.map(sale => {
      const extras = calculatePackageSaleExtras(
        sale, 
        sale.payments, 
        sale.sessions
      );
      
      return {
        ...sale,
        ...extras
      };
    });

    console.log(`[package-sale-db-service] ${formattedSales.length} paket satışı bulundu`);
    return { success: true, data: formattedSales };
  } catch (error) {
    console.error(`[package-sale-db-service] getPackageSalesByCustomerFromDb hatası:`, error);
    return { success: false, error: 'Müşterinin paket satışları getirilirken bir hata oluştu' };
  }
}