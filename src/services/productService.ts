'use client';

import { callMcpApi } from '@/lib/mcp/helpers';
import { Product, CreateProductParams, UpdateProductParams } from '@/types/product';

/**
 * Client tarafı ürün servisi.
 * Bu servis yalnızca API çağrıları yapar ve arabulucu (proxy) görevi görür.
 * Tüm iş mantığı ve veri işlemleri db/product servisinde gerçekleştirilir.
 */

/**
 * Tüm ürün listesini getir
 * @param includeDeleted Silinmiş ürünleri dahil et
 * @param showToast İşlem sonrası bildirim göster
 * @returns Ürün listesi
 */
export async function getProducts(includeDeleted: boolean = false, showToast: boolean = false): Promise<Product[]> {
  try {
    const response = await callMcpApi('get-products', { 
      includeDeleted 
    }, {
      showToast,
      customErrorMsg: 'Ürün listesi alınırken bir hata oluştu'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Ürün listesi alınamadı');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Ürün listesi alınırken hata:', error);
    throw error;
  }
}

/**
 * Ürün detayını getir
 * @param id Ürün ID
 * @param showToast İşlem sonrası bildirim göster
 * @returns Ürün detayı veya null
 */
export async function getProductById(id: string, showToast: boolean = false): Promise<Product | null> {
  try {
    const response = await callMcpApi('get-product-by-id', { 
      id 
    }, {
      showToast,
      customErrorMsg: 'Ürün detayı alınırken bir hata oluştu'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Ürün detayı alınamadı');
    }
    
    return response.data || null;
  } catch (error) {
    console.error(`Ürün detayı alınırken hata (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Yeni ürün oluştur
 * @param data Ürün verileri
 * @param showToast İşlem sonrası bildirim göster
 * @returns Oluşturulan ürün
 */
export async function createProduct(data: CreateProductParams, showToast: boolean = false): Promise<Product> {
  return await callMcpApi('create-product', data, {
    showToast,
    customErrorMsg: 'Ürün oluşturulurken bir hata oluştu'
  });
}

/**
 * Ürün güncelle
 * @param id Ürün ID
 * @param data Güncellenecek ürün verileri
 * @param showToast İşlem sonrası bildirim göster
 * @returns Güncellenmiş ürün
 */
export async function updateProduct(id: string, data: UpdateProductParams, showToast: boolean = false): Promise<Product> {
  return await callMcpApi('update-product', { 
    id, 
    ...data 
  }, {
    showToast,
    customErrorMsg: 'Ürün güncellenirken bir hata oluştu'
  });
}

/**
 * Ürün stok güncelle
 * @param id Ürün ID
 * @param newStock Yeni stok değeri
 * @param showToast İşlem sonrası bildirim göster
 * @returns İşlem sonucu
 */
export async function updateProductStock(id: string, newStock: number | string, showToast: boolean = false) {
  // Stok değerini sayıya dönüştür
  const stockValue = typeof newStock === 'string' ? parseInt(newStock) : newStock;
  
  return await callMcpApi('update-product-stock', {
    id,
    newStock: stockValue
  }, {
    showToast,
    customErrorMsg: 'Stok güncellenemedi'
  });
}

/**
 * Ürün sil
 * @param id Ürün ID
 * @param showToast İşlem sonrası bildirim göster
 * @returns İşlem sonucu
 */
export async function deleteProduct(id: string, showToast: boolean = false) {
  return await callMcpApi('delete-product', { 
    id 
  }, {
    showToast,
    customErrorMsg: 'Ürün silinirken bir hata oluştu'
  });
}