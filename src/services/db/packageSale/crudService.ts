/**
 * Paket satışı temel CRUD işlemleri
 */
import { prisma } from '@/lib/prisma';
import { 
  ServiceResponse, 
  PackageSaleWithRelations, 
  FormattedPackageSale,
  CreatePackageSaleData,
  UpdatePackageSaleData
} from './types';
import { calculatePackageSaleExtras } from './helpers';

/**
 * ID'ye göre paket satışı getirme
 */
export async function getPackageSaleByIdFromDb(id: string): Promise<ServiceResponse<FormattedPackageSale>> {
  try {
    console.log(`[package-sale-db-service] getPackageSaleByIdFromDb çağrıldı, id: ${id}`);

    const packageSale = await prisma.packageSale.findUnique({
      where: { id, deletedAt: null },
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
        packageSessions: {
          where: {
            deletedAt: null
          },
          include: {
            appointment: {
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
      }
    });

    if (!packageSale) {
      return { success: false, error: 'Paket satışı bulunamadı' };
    }

    // Ek bilgileri hesapla
    const extras = calculatePackageSaleExtras(
      packageSale, 
      packageSale.payments, 
      packageSale.packageSessions
    );

    const formattedSale = {
      ...packageSale,
      ...extras
    };

    console.log(`[package-sale-db-service] Paket satışı bulundu, id: ${id}`);
    return { success: true, data: formattedSale };
  } catch (error) {
    console.error(`[package-sale-db-service] getPackageSaleByIdFromDb hatası:`, error);
    return { success: false, error: 'Paket satışı getirilirken bir hata oluştu' };
  }
}

/**
 * Yeni paket satışı oluşturma
 */
export async function createPackageSaleInDb(data: CreatePackageSaleData): Promise<ServiceResponse<PackageSaleWithRelations>> {
  try {
    console.log('[package-sale-db-service] createPackageSaleInDb çağrıldı, data:', data);

    // Gerekli alanların kontrolü
    if (!data.packageId || !data.customerId || !data.price) {
      return { success: false, error: 'Paket ID, müşteri ID ve fiyat bilgileri gereklidir' };
    }

    // Paketin var olup olmadığını kontrol et
    const packageExists = await prisma.package.findUnique({
      where: { id: data.packageId }
    });

    if (!packageExists) {
      return { success: false, error: 'Belirtilen paket bulunamadı' };
    }

    // Müşterinin var olup olmadığını kontrol et
    const customerExists = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customerExists) {
      return { success: false, error: 'Belirtilen müşteri bulunamadı' };
    }

    // Paket satışını oluştur
    const packageSale = await prisma.packageSale.create({
      data: {
        packageId: data.packageId,
        customerId: data.customerId,
        price: data.price,
        saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        staffId: data.staffId || null,
        notes: data.notes || null,
        isCompleted: data.isCompleted || false
      },
      include: {
        package: true,
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Ödeme bilgisi varsa ekle
    if (data.payment && data.payment.amount > 0) {
      await prisma.payment.create({
        data: {
          amount: data.payment.amount,
          date: data.payment.date ? new Date(data.payment.date) : new Date(),
          method: data.payment.method || 'cash',
          notes: data.payment.notes || '',
          staffId: data.payment.staffId || data.staffId || null,
          packageSaleId: packageSale.id
        }
      });
    }

    console.log(`[package-sale-db-service] Paket satışı oluşturuldu, id: ${packageSale.id}`);
    return { success: true, data: packageSale };
  } catch (error) {
    console.error('[package-sale-db-service] createPackageSaleInDb hatası:', error);
    return { success: false, error: 'Paket satışı oluşturulurken bir hata oluştu' };
  }
}

/**
 * Paket satışını güncelleme
 */
export async function updatePackageSaleInDb(id: string, data: UpdatePackageSaleData): Promise<ServiceResponse<FormattedPackageSale>> {
  try {
    console.log(`[package-sale-db-service] updatePackageSaleInDb çağrıldı, id: ${id}, data:`, data);

    // Paket satışının var olup olmadığını kontrol et
    const existingPackageSale = await prisma.packageSale.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingPackageSale) {
      return { success: false, error: 'Güncellenecek paket satışı bulunamadı' };
    }

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (data.price !== undefined) updateData.price = data.price;
    if (data.saleDate !== undefined) updateData.saleDate = new Date(data.saleDate);
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.staffId !== undefined) updateData.staffId = data.staffId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

    // Paket satışını güncelle
    const updatedPackageSale = await prisma.packageSale.update({
      where: { id },
      data: updateData,
      include: {
        package: true,
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        packageSessions: {
          where: {
            deletedAt: null
          },
          include: {
            appointment: true
          }
        },
        payments: {
          where: {
            deletedAt: null
          }
        }
      }
    });

    // Ek bilgileri hesapla
    const extras = calculatePackageSaleExtras(
      updatedPackageSale, 
      updatedPackageSale.payments, 
      updatedPackageSale.packageSessions
    );

    const formattedSale = {
      ...updatedPackageSale,
      ...extras
    };

    console.log(`[package-sale-db-service] Paket satışı güncellendi, id: ${id}`);
    return { success: true, data: formattedSale };
  } catch (error) {
    console.error(`[package-sale-db-service] updatePackageSaleInDb hatası:`, error);
    return { success: false, error: 'Paket satışı güncellenirken bir hata oluştu' };
  }
}

/**
 * Paket satışını silme (soft delete)
 */
export async function deletePackageSaleFromDb(id: string): Promise<ServiceResponse<PackageSaleWithRelations>> {
  try {
    console.log(`[package-sale-db-service] deletePackageSaleFromDb çağrıldı, id: ${id}`);

    // Paket satışının var olup olmadığını kontrol et
    const existingPackageSale = await prisma.packageSale.findUnique({
      where: { id, deletedAt: null },
      include: {
        packageSessions: true
      }
    });

    if (!existingPackageSale) {
      return { success: false, error: 'Silinecek paket satışı bulunamadı' };
    }

    // İlgili seansları soft delete
    if (existingPackageSale.packageSessions.length > 0) {
      await prisma.packageSession.updateMany({
        where: { packageSaleId: id },
        data: { deletedAt: new Date() }
      });
    }

    // Paket satışını soft delete işlemi
    const deletedPackageSale = await prisma.packageSale.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    console.log(`[package-sale-db-service] Paket satışı silindi, id: ${id}`);
    return { success: true, data: deletedPackageSale };
  } catch (error) {
    console.error(`[package-sale-db-service] deletePackageSaleFromDb hatası:`, error);
    return { success: false, error: 'Paket satışı silinirken bir hata oluştu' };
  }
}
