/**
 * Paket seansları ile ilgili işlemler
 */
import { prisma } from '@/lib/prisma';
import { 
  ServiceResponse, 
  PackageSessionWithRelations,
  CreatePackageSessionData,
  UpdatePackageSessionData
} from './types';

/**
 * Paket seansı oluşturma
 */
export async function createPackageSessionInDb(data: CreatePackageSessionData): Promise<ServiceResponse<PackageSessionWithRelations>> {
  try {
    console.log('[package-sale-db-service] createPackageSessionInDb çağrıldı, data:', data);

    // Gerekli alanların kontrolü
    if (!data.packageSaleId) {
      return { success: false, error: 'Paket satışı ID bilgisi gereklidir' };
    }

    // Paket satışının var olup olmadığını kontrol et
    const packageSale = await prisma.packageSale.findUnique({
      where: { id: data.packageSaleId, deletedAt: null },
      include: {
        package: true,
        packageSessions: {
          where: { deletedAt: null }
        }
      }
    });

    if (!packageSale) {
      return { success: false, error: 'Belirtilen paket satışı bulunamadı' };
    }

    // Seans limitini kontrol et
    if (packageSale.packageSessions.length >= packageSale.package.sessionCount) {
      return { success: false, error: 'Bu paket için kullanılabilecek maksimum seans sayısına ulaşıldı' };
    }

    // Paket seansını oluştur
    const packageSession = await prisma.packageSession.create({
      data: {
        packageSaleId: data.packageSaleId,
        appointmentId: data.appointmentId || null,
        sessionDate: data.sessionDate ? new Date(data.sessionDate) : new Date(),
        status: data.status || 'scheduled',
        notes: data.notes || null
      },
      include: {
        packageSale: {
          include: {
            package: true,
            customer: true
          }
        },
        appointment: {
          include: {
            staff: true,
            service: true
          }
        }
      }
    });

    console.log(`[package-sale-db-service] Paket seansı oluşturuldu, id: ${packageSession.id}`);
    return { success: true, data: packageSession };
  } catch (error) {
    console.error('[package-sale-db-service] createPackageSessionInDb hatası:', error);
    return { success: false, error: 'Paket seansı oluşturulurken bir hata oluştu' };
  }
}

/**
 * Paket seansını güncelleme
 */
export async function updatePackageSessionInDb(id: string, data: UpdatePackageSessionData): Promise<ServiceResponse<PackageSessionWithRelations>> {
  try {
    console.log(`[package-sale-db-service] updatePackageSessionInDb çağrıldı, id: ${id}, data:`, data);

    // Paket seansının var olup olmadığını kontrol et
    const existingPackageSession = await prisma.packageSession.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingPackageSession) {
      return { success: false, error: 'Güncellenecek paket seansı bulunamadı' };
    }

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (data.appointmentId !== undefined) updateData.appointmentId = data.appointmentId;
    if (data.sessionDate !== undefined) updateData.sessionDate = new Date(data.sessionDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Paket seansını güncelle
    const updatedPackageSession = await prisma.packageSession.update({
      where: { id },
      data: updateData,
      include: {
        packageSale: {
          include: {
            package: true,
            customer: true
          }
        },
        appointment: {
          include: {
            staff: true,
            service: true
          }
        }
      }
    });

    console.log(`[package-sale-db-service] Paket seansı güncellendi, id: ${id}`);
    return { success: true, data: updatedPackageSession };
  } catch (error) {
    console.error(`[package-sale-db-service] updatePackageSessionInDb hatası:`, error);
    return { success: false, error: 'Paket seansı güncellenirken bir hata oluştu' };
  }
}

/**
 * Paket seansını silme (soft delete)
 */
export async function deletePackageSessionFromDb(id: string): Promise<ServiceResponse<PackageSessionWithRelations>> {
  try {
    console.log(`[package-sale-db-service] deletePackageSessionFromDb çağrıldı, id: ${id}`);

    // Paket seansının var olup olmadığını kontrol et
    const existingPackageSession = await prisma.packageSession.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingPackageSession) {
      return { success: false, error: 'Silinecek paket seansı bulunamadı' };
    }

    // Paket seansını soft delete işlemi
    const deletedPackageSession = await prisma.packageSession.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    console.log(`[package-sale-db-service] Paket seansı silindi, id: ${id}`);
    return { success: true, data: deletedPackageSession };
  } catch (error) {
    console.error(`[package-sale-db-service] deletePackageSessionFromDb hatası:`, error);
    return { success: false, error: 'Paket seansı silinirken bir hata oluştu' };
  }
}
