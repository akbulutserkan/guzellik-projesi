'use client';

import { callMcpApi } from '@/lib/mcp/helpers';
import { CreateProductSaleParams, CreatePaymentParams, UpdateProductSaleParams, ProductSaleWithPayments, Payment } from '@/types/product';

/**
 * Tüm ürün satışlarını getir
 */
export async function getProductSales(filters: { startDate?: string; endDate?: string; showToast?: boolean } = {}) {
  const { showToast = false, ...restFilters } = filters;
  return await callMcpApi('get-product-sales', restFilters, {
    showToast,
    customErrorMsg: 'Ürün satışları alınırken bir hata oluştu'
  });
}

/**
 * ID'ye göre ürün satışı getir
 */
export async function getProductSaleById(id: string, showToast: boolean = false) {
  return await callMcpApi('get-product-sale-by-id', { id }, {
    showToast,
    customErrorMsg: `Ürün satışı detayı alınamadı (ID: ${id})`
  });
}

/**
 * Yetkili satış personellerini getir
 */
export async function getAuthorizedStaff(showToast: boolean = false) {
  return await callMcpApi('get-authorized-staff', {}, {
    showToast,
    customErrorMsg: 'Yetkili personel listesi alınamadı'
  });
}

/**
 * Müşterinin ürün satışlarını getir
 */
export async function getProductSalesByCustomer(customerId: string, includeStaff: boolean = true, showToast: boolean = false) {
  return await callMcpApi('get-product-sales-by-customer', { 
    customerId,
    includeStaff
  }, {
    showToast,
    customErrorMsg: 'Müşteri ürün satışları alınırken bir hata oluştu'
  });
}

/**
 * Ürün satışı oluştur
 */
export async function createProductSale(data: CreateProductSaleParams, showToast: boolean = false) {
  return await callMcpApi('create-product-sale', data, {
    showToast,
    customErrorMsg: 'Ürün satışı oluşturulurken bir hata oluştu'
  });
}

/**
 * Ürün satışı güncelle
 */
export async function updateProductSale(id: string, data: UpdateProductSaleParams, showToast: boolean = false) {
  return await callMcpApi('update-product-sale', { 
    id, 
    ...data 
  }, {
    showToast,
    customErrorMsg: 'Ürün satışı güncellenirken bir hata oluştu'
  });
}

/**
 * Ürün satışı sil
 */
export async function deleteProductSale(id: string, showToast: boolean = false) {
  return await callMcpApi('delete-product-sale', { 
    id 
  }, {
    showToast,
    customErrorMsg: 'Ürün satışı silinirken bir hata oluştu'
  });
}

/**
 * Belirli bir ürün satışının ödemelerini getir
 */
export async function getPaymentsByProductSale(productSaleId: string, showToast: boolean = false) {
  return await callMcpApi('get-payments-by-product-sale', { productSaleId }, {
    showToast,
    customErrorMsg: `Ödeme bilgileri alınamadı (Satış ID: ${productSaleId})`
  });
}

/**
 * Yeni ödeme ekle
 */
export async function createProductSalePayment(data: CreatePaymentParams, showToast: boolean = false) {
  return await callMcpApi('create-payment', data, {
    showToast,
    customErrorMsg: 'Ödeme eklenemedi'
  });
}

/**
 * Ödeme sil
 */
export async function deleteProductSalePayment(id: string, showToast: boolean = false) {
  return await callMcpApi('delete-payment', { id }, {
    showToast,
    customErrorMsg: `Ödeme silinemedi (ID: ${id})`
  });
}