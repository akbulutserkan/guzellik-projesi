/**
 * Product sale CRUD operations
 */
import { prisma } from '@/lib/prisma';
import { EnhancedProductSale, ProductSaleWithRelations, ServiceResponse } from './types';
import { calculatePaymentInfo } from './helpers';

/**
 * Veritabanından ürün satışlarını getiren fonksiyon
 * @param filters Filtre parametreleri (startDate, endDate, staffId, vb.)
 */
export async function getProductSalesFromDb(filters: any = {}): Promise<ServiceResponse<ProductSaleWithRelations[]>> {
  try {
    console.log('[product-sale-db-service] getProductSalesFromDb çağrıldı:', filters);
    
    // Filtre parametrelerini ayıkla
    const { 
      startDate, 
      endDate, 
      staffId, 
      customerId,
      includeStaff = true
    } = filters;
    
    // Sorgu koşullarını oluştur
    const whereClause: any = {};
    
    // Müşteri filtresi
    if (customerId) {
      whereClause.customerId = customerId;
    }
    
    // Personel filtresi
    if (staffId) {
      whereClause.staffId = staffId;
    }
    
    // Tarih aralığı filtresi
    if (startDate || endDate) {
      whereClause.date = {};
      
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }
    
    console.log('[product-sale-db-service] Sorgu koşulları:', whereClause);
    
    // Veritabanı sorgusu
    const productSales = await prisma.productSale.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        product: true,
        customer: true,
        staff: includeStaff,
        payments: true
      }
    });
    
    console.log(`[product-sale-db-service] ${productSales.length} ürün satışı bulundu`);
    
    return {
      success: true,
      data: productSales
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ürün satışları getirme hatası:', error);
    return {
      success: false,
      error: `Ürün satışları alınırken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Müşteriye ait ürün satışlarını getiren fonksiyon
 * @param customerId Müşteri ID'si
 * @param includeStaff Personel bilgilerini dahil etme durumu
 */
export async function getProductSalesByCustomerFromDb(
  customerId: string, 
  includeStaff: boolean = true
): Promise<ServiceResponse<EnhancedProductSale[]>> {
  try {
    console.log(`[product-sale-db-service] ${customerId} ID'li müşterinin satışları getiriliyor`);
    
    // Müşteri bilgisini kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      return {
        success: false,
        error: `Müşteri bulunamadı: ${customerId}`
      };
    }
    
    // Müşterinin ürün satışlarını getir
    const productSales = await prisma.productSale.findMany({
      where: {
        customerId: customerId
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        product: true,
        customer: true,
        staff: includeStaff,
        payments: true
      }
    });
    
    console.log(`[product-sale-db-service] ${productSales.length} ürün satışı bulundu`);
    
    // Her satış için ödeme toplamlarını hesapla
    const enhancedSales = productSales.map(sale => {
      // Ödeme bilgilerini hesapla
      const paymentInfo = calculatePaymentInfo(sale);
      
      // Ek bilgilerle zenginleştirilmiş satış verisi
      return {
        ...sale,
        ...paymentInfo
      };
    });
    
    return {
      success: true,
      data: enhancedSales
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Müşteri ürün satışları getirme hatası:', error);
    return {
      success: false,
      error: `Müşteri ürün satışları alınırken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * ID'ye göre ürün satışı detayı getiren fonksiyon
 * @param id Ürün satışı ID'si
 */
export async function getProductSaleByIdFromDb(id: string): Promise<ServiceResponse<EnhancedProductSale>> {
  try {
    console.log(`[product-sale-db-service] ${id} ID'li ürün satışı getiriliyor`);
    
    // Ürün satışını getir
    const productSale = await prisma.productSale.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        staff: true,
        payments: true
      }
    });
    
    if (!productSale) {
      return {
        success: false,
        error: `Ürün satışı bulunamadı: ${id}`
      };
    }
    
    console.log(`[product-sale-db-service] Ürün satışı bulundu: ${productSale.id}`);
    
    // Ödeme bilgilerini hesapla
    const paymentInfo = calculatePaymentInfo(productSale);
    
    // Ek bilgilerle zenginleştirilmiş satış verisi
    const enhancedSale = {
      ...productSale,
      ...paymentInfo
    };
    
    return {
      success: true,
      data: enhancedSale
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ürün satışı detayı getirme hatası:', error);
    return {
      success: false,
      error: `Ürün satışı detayı alınırken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Yeni ürün satışı oluşturan fonksiyon
 * @param data Ürün satışı bilgileri
 */
export async function createProductSaleInDb(data: any): Promise<ServiceResponse<ProductSaleWithRelations>> {
  try {
    console.log('[product-sale-db-service] Yeni ürün satışı oluşturuluyor:', data);
    
    // Gerekli alanları kontrol et
    if (!data.productId || !data.customerId) {
      return {
        success: false,
        error: 'Ürün ID ve Müşteri ID alanları zorunludur'
      };
    }
    
    // İlişkili kayıtların varlığını kontrol et
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });
    
    if (!product) {
      return {
        success: false,
        error: `Ürün bulunamadı: ${data.productId}`
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
    if (data.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: data.staffId }
      });
      
      if (!staff) {
        return {
          success: false,
          error: `Personel bulunamadı: ${data.staffId}`
        };
      }
    }
    
    // Ürün stoğu kontrolü ve güncelleme
    if (product.stock !== null && product.stock !== undefined) {
      // Yeni ürün satışının miktarı
      const quantity = data.quantity || 1;
      
      // Yeterli stok var mı kontrol et
      if (product.stock < quantity) {
        return {
          success: false,
          error: `Yetersiz stok: ${product.name} (Mevcut: ${product.stock}, İstenen: ${quantity})`
        };
      }
      
      // Stok güncelle
      await prisma.product.update({
        where: { id: data.productId },
        data: { stock: product.stock - quantity }
      });
      
      console.log(`[product-sale-db-service] Ürün stoğu güncellendi: ${product.name}, Yeni stok: ${product.stock - quantity}`);
    }
    
    // Yeni satış kayıt verisini hazırla
    const productSaleData = {
      date: data.date ? new Date(data.date) : new Date(),
      productId: data.productId,
      customerId: data.customerId,
      staffId: data.staffId || null,
      quantity: data.quantity || 1,
      unitPrice: parseFloat(data.unitPrice || product.price || 0),
      totalPrice: parseFloat(data.totalPrice || (data.quantity || 1) * (data.unitPrice || product.price || 0)),
      paymentStatus: data.paymentStatus || 'PENDING',
      paymentType: data.paymentType || null,
      notes: data.notes || '',
      isFullyPaid: data.isFullyPaid || false
    };
    
    // Veritabanı kaydı oluştur
    const newProductSale = await prisma.productSale.create({
      data: productSaleData,
      include: {
        product: true,
        customer: true,
        staff: true,
        payments: true
      }
    });
    
    console.log(`[product-sale-db-service] Yeni ürün satışı oluşturuldu: ${newProductSale.id}`);
    
    // Tam ödeme durumu kontrolü
    if (data.isFullyPaid && data.paymentType) {
      try {
        // Otomatik ödeme kaydı oluştur
        const paymentData = {
          customerId: data.customerId,
          productSaleId: newProductSale.id,
          amount: newProductSale.totalPrice,
          paymentType: data.paymentType,
          paymentMethod: data.paymentType, // Basitlik için aynı değer atanıyor
          status: 'COMPLETED',
          date: newProductSale.date,
          processedBy: data.staffId || 'SYSTEM',
          notes: 'Otomatik oluşturulan ödeme kaydı'
        };
        
        const payment = await prisma.payment.create({
          data: paymentData
        });
        
        console.log(`[product-sale-db-service] Otomatik ödeme kaydı oluşturuldu: ${payment.id}`);
        
        // Ödeme eklenmiş satış verisini döndür
        const updatedSale = await prisma.productSale.findUnique({
          where: { id: newProductSale.id },
          include: {
            product: true,
            customer: true,
            staff: true,
            payments: true
          }
        });
        
        return {
          success: true,
          data: updatedSale,
          message: 'Ürün satışı ve ödeme kaydı başarıyla oluşturuldu'
        };
      } catch (paymentError) {
        console.error('[product-sale-db-service] Otomatik ödeme kaydı hatası:', paymentError);
        // Ödeme hatası durumunda satış kaydını silme (rollback)
        await prisma.productSale.delete({
          where: { id: newProductSale.id }
        });
        
        return {
          success: false,
          error: `Ödeme kaydı oluşturulurken hata: ${paymentError.message}`
        };
      }
    }
    
    return {
      success: true,
      data: newProductSale,
      message: 'Ürün satışı başarıyla oluşturuldu'
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ürün satışı oluşturma hatası:', error);
    return {
      success: false,
      error: `Ürün satışı oluşturulurken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Ürün satışını güncelleyen fonksiyon
 * @param id Ürün satışı ID'si
 * @param data Güncellenecek bilgiler
 */
export async function updateProductSaleInDb(id: string, data: any): Promise<ServiceResponse<EnhancedProductSale>> {
  try {
    console.log(`[product-sale-db-service] ${id} ID'li ürün satışı güncelleniyor:`, data);
    
    // Ürün satışının var olup olmadığını kontrol et
    const existingSale = await prisma.productSale.findUnique({
      where: { id },
      include: { product: true }
    });
    
    if (!existingSale) {
      return {
        success: false,
        error: `Ürün satışı bulunamadı: ${id}`
      };
    }
    
    // Stok güncelleme kontrolü (miktar değişimi varsa)
    if (data.quantity !== undefined && data.quantity !== existingSale.quantity) {
      const quantityDiff = data.quantity - existingSale.quantity;
      
      if (existingSale.product.stock !== null && existingSale.product.stock !== undefined) {
        // Stok azalıyorsa, yeterli stok olup olmadığını kontrol et
        if (quantityDiff > 0 && existingSale.product.stock < quantityDiff) {
          return {
            success: false,
            error: `Yetersiz stok: ${existingSale.product.name} (Mevcut: ${existingSale.product.stock}, Gereken: ${quantityDiff})`
          };
        }
        
        // Stok güncelle
        await prisma.product.update({
          where: { id: existingSale.productId },
          data: { stock: existingSale.product.stock - quantityDiff }
        });
        
        console.log(`[product-sale-db-service] Ürün stoğu güncellendi: ${existingSale.product.name}, Yeni stok: ${existingSale.product.stock - quantityDiff}`);
      }
    }
    
    // Toplam fiyat hesaplaması
    let totalPrice = data.totalPrice;
    
    if (data.quantity !== undefined && data.unitPrice !== undefined) {
      totalPrice = data.quantity * data.unitPrice;
    } else if (data.quantity !== undefined) {
      totalPrice = data.quantity * (existingSale.unitPrice || 0);
    } else if (data.unitPrice !== undefined) {
      totalPrice = (existingSale.quantity || 1) * data.unitPrice;
    }
    
    // Güncelleme verisini hazırla
    const updateData: any = {};
    
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unitPrice = parseFloat(data.unitPrice);
    if (totalPrice !== undefined) updateData.totalPrice = parseFloat(totalPrice);
    if (data.paymentType !== undefined) updateData.paymentType = data.paymentType;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.staffId !== undefined) updateData.staffId = data.staffId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isFullyPaid !== undefined) updateData.isFullyPaid = data.isFullyPaid;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    
    console.log('[product-sale-db-service] Güncelleme verileri:', updateData);
    
    // Veritabanı kaydını güncelle
    const updatedProductSale = await prisma.productSale.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        customer: true,
        staff: true,
        payments: true
      }
    });
    
    console.log(`[product-sale-db-service] Ürün satışı güncellendi: ${updatedProductSale.id}`);
    
    // Ödeme toplamını hesapla
    const totalPayments = updatedProductSale.payments?.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0) || 0;
    
    // Güncelleme sonrası ödeme durumu kontrolü
    if (data.isFullyPaid === true && updatedProductSale.totalPrice > totalPayments) {
      // Otomatik ödeme kaydı oluştur
      try {
        const paymentData = {
          customerId: updatedProductSale.customerId,
          productSaleId: updatedProductSale.id,
          amount: updatedProductSale.totalPrice - totalPayments,
          paymentType: updatedProductSale.paymentType || 'CASH',
          paymentMethod: updatedProductSale.paymentType || 'CASH',
          status: 'COMPLETED',
          date: new Date(),
          processedBy: data.staffId || 'SYSTEM',
          notes: 'Otomatik oluşturulan ödeme kaydı (güncelleme sonrası)'
        };
        
        const payment = await prisma.payment.create({
          data: paymentData
        });
        
        console.log(`[product-sale-db-service] Otomatik ödeme kaydı oluşturuldu: ${payment.id}`);
      } catch (paymentError) {
        console.error('[product-sale-db-service] Otomatik ödeme kaydı hatası:', paymentError);
        // Bu durumda satış güncellemesi başarılı olduğu için hata döndürme
      }
    }
    
    // Güncellenmiş kaydı tekrar getir (ödeme bilgileriyle)
    const finalSale = await prisma.productSale.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        staff: true,
        payments: true
      }
    });
    
    // Ödeme bilgilerini hesapla
    const paymentInfo = calculatePaymentInfo(finalSale);
    
    // Ek bilgilerle zenginleştirilmiş satış verisi
    const enhancedSale = {
      ...finalSale,
      ...paymentInfo,
      calculatedPaymentStatus: paymentInfo.paymentStatus
    };
    
    return {
      success: true,
      data: enhancedSale,
      message: 'Ürün satışı başarıyla güncellendi'
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ürün satışı güncelleme hatası:', error);
    return {
      success: false,
      error: `Ürün satışı güncellenirken bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Ürün satışını silen fonksiyon
 * @param id Ürün satışı ID'si
 */
export async function deleteProductSaleFromDb(id: string): Promise<ServiceResponse<void>> {
  try {
    console.log(`[product-sale-db-service] ${id} ID'li ürün satışı siliniyor`);
    
    // Ürün satışının var olup olmadığını kontrol et
    const existingSale = await prisma.productSale.findUnique({
      where: { id },
      include: { 
        product: true,
        payments: true 
      }
    });
    
    if (!existingSale) {
      return {
        success: false,
        error: `Ürün satışı bulunamadı: ${id}`
      };
    }
    
    // İlişkili ödemeleri kontrol et
    if (existingSale.payments && existingSale.payments.length > 0) {
      console.log(`[product-sale-db-service] Ürün satışına ait ${existingSale.payments.length} ödeme kaydı bulundu`);
      
      // Ödemeleri silme
      await prisma.payment.deleteMany({
        where: { productSaleId: id }
      });
      
      console.log(`[product-sale-db-service] İlişkili ödemeler silindi`);
    }
    
    // Stok güncelleme işlemi
    if (existingSale.product.stock !== null && existingSale.product.stock !== undefined) {
      // Satıştan silinen miktarı stoğa ekle
      await prisma.product.update({
        where: { id: existingSale.productId },
        data: { stock: existingSale.product.stock + (existingSale.quantity || 1) }
      });
      
      console.log(`[product-sale-db-service] Ürün stoğu güncellendi: ${existingSale.product.name}, Yeni stok: ${existingSale.product.stock + (existingSale.quantity || 1)}`);
    }
    
    // Ürün satışını sil
    await prisma.productSale.delete({
      where: { id }
    });
    
    console.log(`[product-sale-db-service] Ürün satışı silindi: ${id}`);
    
    return {
      success: true,
      message: 'Ürün satışı ve ilişkili ödemeler başarıyla silindi',
      deleteType: existingSale.payments.length > 0 ? 'CASCADE' : 'SIMPLE'
    };
    
  } catch (error) {
    console.error('[product-sale-db-service] Ürün satışı silme hatası:', error);
    return {
      success: false,
      error: `Ürün satışı silinirken bir hata oluştu: ${error.message}`
    };
  }
}
