'use client';

import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Tüm ödeme listesini getir
 */
export async function getPayments(filters: any = {}) {
  return await callMcpApi('get-payments', filters, {
    showToast: false,
    customErrorMsg: 'Ödemeler alınırken bir hata oluştu'
  });
}

/**
 * Ödeme detayını getir
 */
export async function getPaymentById(id: string) {
  return await callMcpApi('get-payment-by-id', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Ödeme detayı alınırken bir hata oluştu'
  });
}

/**
 * Müşterinin ödemelerini getir
 */
export async function getPaymentsByCustomer(customerId: string) {
  return await callMcpApi('get-payments-by-customer', { 
    customerId 
  }, {
    showToast: false,
    customErrorMsg: 'Müşteri ödemeleri alınırken bir hata oluştu'
  });
}

/**
 * Yeni ödeme oluştur
 */
export async function createPayment(data: any) {
  return await callMcpApi('create-payment', data, {
    showToast: false,
    customErrorMsg: 'Ödeme oluşturulurken bir hata oluştu'
  });
}

/**
 * Ödeme güncelle
 */
export async function updatePayment(id: string, data: any) {
  return await callMcpApi('update-payment', { 
    id, 
    ...data 
  }, {
    showToast: false,
    customErrorMsg: 'Ödeme güncellenirken bir hata oluştu'
  });
}

/**
 * Ödeme sil
 */
export async function deletePayment(id: string) {
  return await callMcpApi('delete-payment', { 
    id 
  }, {
    showToast: false,
    customErrorMsg: 'Ödeme silinirken bir hata oluştu'
  });
}