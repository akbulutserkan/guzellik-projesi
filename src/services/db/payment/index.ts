/**
 * Ödeme veritabanı servisleri
 */
import { prisma } from '@/lib/prisma';

// Ödemeleri getir (filtreleme seçenekleriyle)
export async function getPaymentsFromDb(filters: any = {}) {
  try {
    console.log('[DB] Ödemeler getiriliyor, filtreler:', filters);
    
    // Filtre parametrelerini düzenle
    let where: any = {};
    
    // Tarih filtreleri
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    } else if (filters.startDate) {
      where.createdAt = {
        gte: new Date(filters.startDate)
      };
    } else if (filters.endDate) {
      where.createdAt = {
        lte: new Date(filters.endDate)
      };
    }
    
    // Müşteri filtresi
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    
    // Personel filtresi
    if (filters.staffId) {
      where.processedById = filters.staffId;
    }
    
    // Ödeme yöntemi filtresi
    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    
    // Ödemeleri getir
    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        productSale: {
          include: {
            product: true
          }
        },
        packageSale: {
          include: {
            package: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      data: payments
    };
  } catch (error) {
    console.error('[DB] Ödemeleri getirme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ödemeler getirilemedi',
      data: []
    };
  }
}

// ID'ye göre ödeme getir
export async function getPaymentByIdFromDb(id: string) {
  try {
    console.log('[DB] Ödeme detayı getiriliyor, ID:', id);
    
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        productSale: {
          include: {
            product: true
          }
        },
        packageSale: {
          include: {
            package: true
          }
        }
      }
    });
    
    if (!payment) {
      return {
        success: false,
        error: 'Ödeme bulunamadı'
      };
    }
    
    return {
      success: true,
      data: payment
    };
  } catch (error) {
    console.error('[DB] Ödeme detayı getirme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ödeme detayı getirilemedi'
    };
  }
}

// Yeni ödeme oluştur
export async function createPaymentInDb({
  customerId,
  amount,
  paymentMethod,
  paymentType = 'manual',
  processedBy,
  date = new Date(),
  notes = ''
}) {
  try {
    console.log('[DB] Yeni ödeme oluşturuluyor:', { customerId, amount, paymentMethod, processedBy });
    
    // Girdi doğrulama
    if (!customerId) {
      return {
        success: false,
        error: 'Müşteri ID gereklidir'
      };
    }
    
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Geçerli bir ödeme tutarı girilmelidir'
      };
    }
    
    if (!paymentMethod) {
      return {
        success: false,
        error: 'Ödeme yöntemi gereklidir'
      };
    }
    
    if (!processedBy) {
      return {
        success: false,
        error: 'İşlemi yapan personel gereklidir'
      };
    }
    
    // Müşteri ve personelin var olup olmadığını kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      return {
        success: false,
        error: 'Müşteri bulunamadı'
      };
    }
    
    const staff = await prisma.staff.findUnique({
      where: { id: processedBy }
    });
    
    if (!staff) {
      return {
        success: false,
        error: 'Personel bulunamadı'
      };
    }
    
    // Yeni ödeme oluştur
    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentMethod,
        paymentType,
        createdAt: new Date(date),
        notes,
        customer: {
          connect: { id: customerId }
        },
        processedBy: {
          connect: { id: processedBy }
        }
      },
      include: {
        customer: true,
        processedBy: true
      }
    });
    
    return {
      success: true,
      data: payment
    };
  } catch (error) {
    console.error('[DB] Ödeme oluşturma hatası:', error);
    return {
      success: false,
      error: error.message || 'Ödeme oluşturulamadı'
    };
  }
}

// Ödeme durumu güncelle
export async function updatePaymentStatusInDb({ id, status, notes }) {
  try {
    console.log('[DB] Ödeme durumu güncelleniyor, ID:', id, 'Durum:', status);
    
    // Ödemenin var olup olmadığını kontrol et
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return {
        success: false,
        error: 'Güncellenecek ödeme bulunamadı'
      };
    }
    
    // Ödeme durumunu güncelle
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        notes: notes || existingPayment.notes
      }
    });
    
    return {
      success: true,
      data: updatedPayment
    };
  } catch (error) {
    console.error('[DB] Ödeme durumu güncelleme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ödeme durumu güncellenemedi'
    };
  }
}

// Ödeme sil
export async function deletePaymentFromDb(id: string) {
  try {
    console.log('[DB] Ödeme siliniyor, ID:', id);
    
    // Ödemenin var olup olmadığını kontrol et
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return {
        success: false,
        error: 'Silinecek ödeme bulunamadı'
      };
    }
    
    // Ödemeyi sil
    await prisma.payment.delete({
      where: { id }
    });
    
    return {
      success: true,
      message: 'Ödeme başarıyla silindi'
    };
  } catch (error) {
    console.error('[DB] Ödeme silme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ödeme silinemedi'
    };
  }
}