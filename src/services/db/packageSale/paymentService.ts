/**
 * Ödeme işlemleri ile ilgili servis
 */
import { prisma } from '@/lib/prisma';
import { 
  ServiceResponse, 
  PaymentWithRelations,
  CreatePaymentData
} from './types';

/**
 * Paket satışına ait ödemeleri getirme
 */
export async function getPaymentsByPackageSaleFromDb(packageSaleId: string): Promise<ServiceResponse<PaymentWithRelations[]>> {
  try {
    console.log(`[package-sale-db-service] getPaymentsByPackageSaleFromDb çağrıldı, packageSaleId: ${packageSaleId}`);

    // Paket satışının var olup olmadığını kontrol et
    const packageSaleExists = await prisma.packageSale.findUnique({
      where: { id: packageSaleId, deletedAt: null }
    });

    if (!packageSaleExists) {
      return { success: false, error: 'Belirtilen paket satışı bulunamadı' };
    }

    // Ödemeleri getir
    const payments = await prisma.payment.findMany({
      where: {
        packageSaleId,
        deletedAt: null
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`[package-sale-db-service] ${payments.length} ödeme bulundu`);
    return { success: true, data: payments };
  } catch (error) {
    console.error(`[package-sale-db-service] getPaymentsByPackageSaleFromDb hatası:`, error);
    return { success: false, error: 'Ödemeler getirilirken bir hata oluştu' };
  }
}

/**
 * Ödeme oluşturma
 */
export async function createPaymentInDb(data: CreatePaymentData): Promise<ServiceResponse<PaymentWithRelations>> {
  try {
    console.log('[package-sale-db-service] createPaymentInDb çağrıldı, data:', data);

    // Gerekli alanların kontrolü
    if (!data.packageSaleId || data.amount === undefined) {
      return { success: false, error: 'Paket satışı ID ve ödeme tutarı gereklidir' };
    }

    // Paket satışının var olup olmadığını kontrol et
    const packageSale = await prisma.packageSale.findUnique({
      where: { id: data.packageSaleId, deletedAt: null },
      include: {
        payments: {
          where: { deletedAt: null }
        }
      }
    });

    if (!packageSale) {
      return { success: false, error: 'Belirtilen paket satışı bulunamadı' };
    }

    // Toplam ödenen tutarı hesapla
    const totalPaid = packageSale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingAmount = Number(packageSale.price) - totalPaid;

    // Ödeme tutarını kontrol et
    if (Number(data.amount) > remainingAmount && remainingAmount > 0) {
      return { success: false, error: `Ödeme tutarı kalan tutardan (${remainingAmount}₺) fazla olamaz` };
    }

    // Ödemeyi oluştur
    const payment = await prisma.payment.create({
      data: {
        packageSaleId: data.packageSaleId,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        method: data.method || 'cash',
        notes: data.notes || '',
        staffId: data.staffId || null
      },
      include: {
        packageSale: {
          include: {
            customer: {
              select: {
                id: true,
                name: true
              }
            },
            package: {
              select: {
                id: true,
                name: true
              }
            }
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

    console.log(`[package-sale-db-service] Ödeme oluşturuldu, id: ${payment.id}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error('[package-sale-db-service] createPaymentInDb hatası:', error);
    return { success: false, error: 'Ödeme oluşturulurken bir hata oluştu' };
  }
}

/**
 * Ödeme silme (soft delete)
 */
export async function deletePaymentFromDb(id: string): Promise<ServiceResponse<PaymentWithRelations>> {
  try {
    console.log(`[package-sale-db-service] deletePaymentFromDb çağrıldı, id: ${id}`);

    // Ödemenin var olup olmadığını kontrol et
    const existingPayment = await prisma.payment.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingPayment) {
      return { success: false, error: 'Silinecek ödeme bulunamadı' };
    }

    // Ödemeyi soft delete işlemi
    const deletedPayment = await prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    console.log(`[package-sale-db-service] Ödeme silindi, id: ${id}`);
    return { success: true, data: deletedPayment };
  } catch (error) {
    console.error(`[package-sale-db-service] deletePaymentFromDb hatası:`, error);
    return { success: false, error: 'Ödeme silinirken bir hata oluştu' };
  }
}
