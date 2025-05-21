/**
 * Payment services for product sales
 */
import { prisma } from '@/lib/prisma';
import { EnhancedPayment, ServiceResponse } from './types';
import { Payment } from '@prisma/client';

/**
 * Belirli bir ürün satışına ait ödemeleri getiren fonksiyon
 * @param productSaleId Ürün satışı ID'si
 */
export async function getPaymentsByProductSaleFromDb(productSaleId: string): Promise<ServiceResponse<EnhancedPayment[]>> {
  try {
    console.log(`[product-sale-db-service] ${productSaleId} ID'li ürün satışının ödemeleri getiriliyor`);
    
    // Ürün satışının var olup olmadığını kontrol et
    const productSale = await prisma.productSale.findUnique({
      where: { id: productSaleId }
    });
    
    if (!productSale) {
      return {
        success: false,
        error: `Ürün satışı bulunamadı: ${productSaleId}`
      };
    }
    
    // Ödemeleri getir
    const payments = await prisma.payment.findMany({
      where: { productSaleId },
      orderBy: { date: 'desc' },
      include: {
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
    
    console.log(`[product-sale-db-service] ${payments.length} ödeme kaydı bulundu`);
    
    // Ödeme kayıtlarını dönüştür (personel ve müşteri adlarını ekle)
    const enhancedPayments = payments.map(payment => ({
      ...payment,
      customerName: payment.customer?.name,
      processedByName: payment.staff?.name
    }));
    
    return {
      success: true,
      data: enhancedPayments
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ödemeleri getirme hatası:', error);
    return {
      success: false,
      error: `Ödemeler alınırken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Yeni ödeme kaydı oluşturan fonksiyon
 * @param data Ödeme bilgileri
 */
export async function createPaymentInDb(data: any): Promise<ServiceResponse<EnhancedPayment>> {
  try {
    console.log('[product-sale-db-service] Yeni ödeme oluşturuluyor:', data);
    
    // Gerekli alanları kontrol et
    if (!data.productSaleId || !data.customerId || !data.amount) {
      return {
        success: false,
        error: 'Ürün Satış ID, Müşteri ID ve Tutar alanları zorunludur'
      };
    }
    
    // İlişkili kayıtların varlığını kontrol et
    const productSale = await prisma.productSale.findUnique({
      where: { id: data.productSaleId },
      include: { payments: true }
    });
    
    if (!productSale) {
      return {
        success: false,
        error: `Ürün satışı bulunamadı: ${data.productSaleId}`
      };
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });
    
    if (!customer) {
      return {
        success: false,
        error: `Müşteri bulunamadı: ${data.customerId}`
      };
    }
    
    // Personel (opsiyonel) kontrolü
    if (data.processedBy && data.processedBy !== 'SYSTEM') {
      const staff = await prisma.staff.findUnique({
        where: { id: data.processedBy }
      });
      
      if (!staff) {
        return {
          success: false,
          error: `Personel bulunamadı: ${data.processedBy}`
        };
      }
    }
    
    // Mevcut ödemelerin toplamını hesapla
    const existingPayments = productSale.payments || [];
    const totalPaid = existingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Toplam satış tutarı
    const totalSaleAmount = productSale.totalPrice || 0;
    
    // Kalan tutar
    const remainingAmount = Math.max(0, totalSaleAmount - totalPaid);
    
    // Ödeme tutarı kontrolü
    if (parseFloat(data.amount) > remainingAmount) {
      // Uyarı: Fazla ödeme durumu
      console.warn(`[product-sale-db-service] Fazla ödeme uyarısı! Kalan: ${remainingAmount}, Ödenen: ${data.amount}`);
    }
    
    // Yeni ödeme kaydı verisini hazırla
    const paymentData = {
      customerId: data.customerId,
      productSaleId: data.productSaleId,
      amount: parseFloat(data.amount),
      paymentType: data.paymentType || 'CASH',
      paymentMethod: data.paymentMethod || data.paymentType || 'CASH',
      status: data.status || 'COMPLETED',
      date: data.date ? new Date(data.date) : new Date(),
      processedBy: data.processedBy || 'SYSTEM',
      notes: data.notes || ''
    };
    
    // Veritabanı kaydı oluştur
    const newPayment = await prisma.payment.create({
      data: paymentData,
      include: {
        customer: true,
        staff: true
      }
    });
    
    console.log(`[product-sale-db-service] Yeni ödeme oluşturuldu: ${newPayment.id}`);
    
    // Ürün satışının ödeme durumunu güncelle
    const updatedTotalPaid = totalPaid + parseFloat(data.amount);
    const isFullyPaid = updatedTotalPaid >= totalSaleAmount;
    
    await prisma.productSale.update({
      where: { id: data.productSaleId },
      data: {
        paymentStatus: isFullyPaid ? 'PAID' : (updatedTotalPaid > 0 ? 'PARTIAL' : 'PENDING'),
        isFullyPaid
      }
    });
    
    console.log(`[product-sale-db-service] Ürün satışı ödeme durumu güncellendi: ${isFullyPaid ? 'TAM ÖDEME' : 'KISMİ ÖDEME'}`);
    
    // Personel ve müşteri adlarını ekle
    const enhancedPayment = {
      ...newPayment,
      customerName: newPayment.customer?.name,
      processedByName: newPayment.staff?.name
    };
    
    return {
      success: true,
      data: enhancedPayment,
      message: 'Ödeme başarıyla oluşturuldu'
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ödeme oluşturma hatası:', error);
    return {
      success: false,
      error: `Ödeme oluşturulurken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Ödeme kaydını silen fonksiyon
 * @param id Ödeme ID'si
 */
export async function deletePaymentFromDb(id: string): Promise<ServiceResponse<void>> {
  try {
    console.log(`[product-sale-db-service] ${id} ID'li ödeme siliniyor`);
    
    // Ödemenin var olup olmadığını kontrol et
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { productSale: { include: { payments: true } } }
    });
    
    if (!existingPayment) {
      return {
        success: false,
        error: `Ödeme bulunamadı: ${id}`
      };
    }
    
    // İlgili ürün satışını al
    const productSale = existingPayment.productSale;
    
    if (!productSale) {
      return {
        success: false,
        error: `Ödemeye ait ürün satışı bulunamadı`
      };
    }
    
    // Ödemeyi sil
    await prisma.payment.delete({
      where: { id }
    });
    
    console.log(`[product-sale-db-service] Ödeme silindi: ${id}`);
    
    // Kalan ödemelerin toplamını hesapla
    const remainingPayments = productSale.payments.filter(p => p.id !== id);
    const updatedTotalPaid = remainingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Toplam satış tutarı
    const totalSaleAmount = productSale.totalPrice || 0;
    
    // Ürün satışının ödeme durumunu güncelle
    const isFullyPaid = updatedTotalPaid >= totalSaleAmount;
    
    await prisma.productSale.update({
      where: { id: productSale.id },
      data: {
        paymentStatus: isFullyPaid ? 'PAID' : (updatedTotalPaid > 0 ? 'PARTIAL' : 'PENDING'),
        isFullyPaid
      }
    });
    
    console.log(`[product-sale-db-service] Ürün satışı ödeme durumu güncellendi: ${isFullyPaid ? 'TAM ÖDEME' : 'KISMİ ÖDEME'}`);
    
    return {
      success: true,
      message: 'Ödeme başarıyla silindi'
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ödeme silme hatası:', error);
    return {
      success: false,
      error: `Ödeme silinirken bir hata oluştu: ${error.message}`
    };
  }
}
