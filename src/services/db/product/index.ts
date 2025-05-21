/**
 * Ürün veritabanı servisleri
 * Bu servis, tüm ürün işlemleri için veritabanı işlemlerini ve iş mantığını içerir.
 * Client tarafında kullanılan /services/productService.ts dosyası ile çalışır.
 * @see /src/services/productService.ts Client taraflı ürün servisi
 */
import { prisma } from '@/lib/prisma';

/**
 * Tüm ürünleri veritabanından getir
 * @param options Seçenekler
 * @param options.includeDeleted Silinmiş ürünleri dahil et
 * @param options.context İşlem konteksti (loglama için)
 * @returns Ürün listesi yanıtı
 */
export async function getProductsFromDb({ includeDeleted = false, context = '' } = {}) {
  try {
    console.log('[DB] Ürünler getiriliyor', { includeDeleted, context });
    
    // Silinmemiş ürünleri getir, istenirse silinmiş ürünleri de dahil et
    const products = await prisma.product.findMany({
      where: includeDeleted ? {} : { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      data: products
    };
  } catch (error) {
    console.error('[DB] Ürünleri getirme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ürünler getirilemedi',
      data: []
    };
  }
}

/**
 * ID'ye göre ürün getir
 * @param id Ürün ID
 * @returns Ürün detayı yanıtı
 */
export async function getProductByIdFromDb(id: string) {
  try {
    console.log('[DB] Ürün detayı getiriliyor, ID:', id);
    
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return {
        success: false,
        error: 'Ürün bulunamadı'
      };
    }
    
    return {
      success: true,
      data: product
    };
  } catch (error) {
    console.error('[DB] Ürün detayı getirme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ürün detayı getirilemedi'
    };
  }
}

/**
 * Yeni ürün oluştur
 * @param data Ürün verileri
 * @param data.name Ürün adı
 * @param data.price Ürün fiyatı
 * @param data.stock Ürün stok miktarı
 * @param data.description Ürün açıklaması
 * @returns Oluşturulan ürün yanıtı
 */
export async function createProductInDb({ name, price, stock, description = '' }) {
  try {
    console.log('[DB] Yeni ürün oluşturuluyor:', { name, price, stock, description });
    
    // Girdi doğrulama
    if (!name || name.trim() === '') {
      return {
        success: false,
        error: 'Ürün adı gereklidir'
      };
    }
    
    if (typeof price !== 'number' || price < 0) {
      return {
        success: false,
        error: 'Geçerli bir fiyat girilmelidir'
      };
    }
    
    if (typeof stock !== 'number' || stock < 0) {
      return {
        success: false,
        error: 'Geçerli bir stok miktarı girilmelidir'
      };
    }
    
    // Yeni ürün oluştur
    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        description
      }
    });
    
    return {
      success: true,
      data: product
    };
  } catch (error) {
    console.error('[DB] Ürün oluşturma hatası:', error);
    return {
      success: false,
      error: error.message || 'Ürün oluşturulamadı'
    };
  }
}

/**
 * Ürün güncelle
 * @param id Ürün ID
 * @param data Güncellenecek veriler
 * @param data.name Ürün adı
 * @param data.price Ürün fiyatı
 * @param data.stock Ürün stok miktarı
 * @param data.description Ürün açıklaması
 * @returns Güncellenen ürün yanıtı
 */
export async function updateProductInDb(id: string, data: {
  name?: string;
  price?: number;
  stock?: number;
  description?: string;
}) {
  try {
    console.log('[DB] Ürün güncelleniyor, ID:', id, 'Veriler:', data);
    
    // Ürünün var olup olmadığını kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return {
        success: false,
        error: 'Güncellenecek ürün bulunamadı'
      };
    }
    
    // Girdi doğrulama
    if (data.name !== undefined && data.name.trim() === '') {
      return {
        success: false,
        error: 'Ürün adı boş olamaz'
      };
    }
    
    if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
      return {
        success: false,
        error: 'Geçerli bir fiyat girilmelidir'
      };
    }
    
    if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
      return {
        success: false,
        error: 'Geçerli bir stok miktarı girilmelidir'
      };
    }
    
    // Ürünü güncelle
    const updatedProduct = await prisma.product.update({
      where: { id },
      data
    });
    
    return {
      success: true,
      data: updatedProduct
    };
  } catch (error) {
    console.error('[DB] Ürün güncelleme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ürün güncellenemedi'
    };
  }
}

/**
 * Ürün stok güncelle
 * @param id Ürün ID
 * @param newStock Yeni stok miktarı
 * @returns Güncellenen ürün yanıtı
 */
export async function updateProductStockInDb(id: string, newStock: number) {
  try {
    console.log('[DB] Ürün stok güncelleniyor, ID:', id, 'Yeni stok:', newStock);
    
    // Girdi doğrulama
    if (typeof newStock !== 'number' || newStock < 0) {
      return {
        success: false,
        error: 'Geçerli bir stok miktarı girilmelidir'
      };
    }
    
    // Ürünün var olup olmadığını kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return {
        success: false,
        error: 'Güncellenecek ürün bulunamadı'
      };
    }
    
    // Sadece stok alanını güncelle
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: newStock }
    });
    
    return {
      success: true,
      data: updatedProduct
    };
  } catch (error) {
    console.error('[DB] Ürün stok güncelleme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ürün stoku güncellenemedi'
    };
  }
}

/**
 * Ürün silme (soft delete)
 * @param id Ürün ID
 * @returns Silinen ürün yanıtı
 */
export async function deleteProductFromDb(id: string) {
  try {
    console.log('[DB] Ürün siliniyor, ID:', id);
    
    // Ürünün var olup olmadığını kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return {
        success: false,
        error: 'Silinecek ürün bulunamadı'
      };
    }
    
    // Soft delete yap
    const deletedProduct = await prisma.product.update({
      where: { id },
      data: { isDeleted: true }
    });
    
    return {
      success: true,
      data: deletedProduct
    };
  } catch (error) {
    console.error('[DB] Ürün silme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ürün silinemedi'
    };
  }
}