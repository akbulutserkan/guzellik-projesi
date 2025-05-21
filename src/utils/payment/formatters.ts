'use client';

/**
 * Tahsilatlar modülü için formatlama ve doğrulama işlevleri
 */

import { format, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Para miktarını TL formatında formatlayan fonksiyon
 */
export const formatPrice = (amount: number): string => {
  if (amount === undefined || amount === null) return '';
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Para birimini hesaplama formatında formatlayan fonksiyon (sembol olmadan)
 */
export const formatDecimal = (value: number): string => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Tarihi formatlayan fonksiyon
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'dd MMMM yyyy', { locale: tr });
};

/**
 * Tarih ve saati formatlayan fonksiyon
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'dd MMMM yyyy HH:mm', { locale: tr });
};

/**
 * Sadece saat bilgisini formatlayan fonksiyon
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'HH:mm', { locale: tr });
};

/**
 * Tarihi lokalleştirilmiş ISO formatına çevirir (YYYY-MM-DD)
 */
export const toLocalISOString = (date: Date): string => {
  if (!date || !isValid(date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Ödeme geçmişi için grup başlığı formatlaması
 */
export const formatPaymentHistoryGroupTitle = (date: string): string => {
  // Aynı gün içindeki ödemeleri gruplamak için
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return date;
  
  return format(dateObj, 'd MMMM yyyy', { locale: tr });
};

/**
 * Ödeme türünü standardize eden fonksiyon
 */
export const getPaymentTypeText = (type: string): string => {
  if (!type) return '';
  
  const paymentTypeMap: Record<string, string> = {
    'CASH': 'Nakit',
    'Nakit': 'Nakit',
    'nakit': 'Nakit',
    'CREDIT_CARD': 'Kredi Kartı',
    'Kredi Kartı': 'Kredi Kartı',
    'kredi kartı': 'Kredi Kartı',
    'kredi karti': 'Kredi Kartı',
    'Kart': 'Kredi Kartı',
    'kart': 'Kredi Kartı',
    'BANK_TRANSFER': 'Havale/EFT',
    'Havale/EFT': 'Havale/EFT',
    'havale/eft': 'Havale/EFT',
    'havale': 'Havale/EFT',
    'Havale': 'Havale/EFT',
    'EFT': 'Havale/EFT',
    'eft': 'Havale/EFT'
  };
  
  return paymentTypeMap[type] || type;
};

/**
 * Ödeme şeklini standardize eden fonksiyon
 */
export const getPaymentMethodText = (method: string): string => {
  if (!method) return '';
  
  const paymentMethodMap: Record<string, string> = {
    'SERVICE_PAYMENT': 'Hizmet Ödemesi',
    'Hizmet Ödemesi': 'Hizmet Ödemesi',
    'hizmet ödemesi': 'Hizmet Ödemesi',
    'hizmet odemesi': 'Hizmet Ödemesi',
    'PACKAGE_PAYMENT': 'Paket Ödemesi',
    'Paket Ödemesi': 'Paket Ödemesi',
    'paket ödemesi': 'Paket Ödemesi',
    'paket odemesi': 'Paket Ödemesi',
    'PRODUCT_PAYMENT': 'Ürün Ödemesi',
    'Ürün Ödemesi': 'Ürün Ödemesi',
    'ürün ödemesi': 'Ürün Ödemesi',
    'urun odemesi': 'Ürün Ödemesi'
  };
  
  return paymentMethodMap[method] || method;
};

/**
 * Ödeme durumunu standardize eden fonksiyon
 */
export const getStatusText = (status: string): string => {
  if (!status) return '';
  
  const statusMap: Record<string, string> = {
    'COMPLETED': 'Tamamlandı',
    'Tamamlandı': 'Tamamlandı',
    'REFUNDED': 'İade Edildi',
    'İade Edildi': 'İade Edildi',
    'CANCELLED': 'İptal Edildi',
    'İptal Edildi': 'İptal Edildi'
  };
  
  return statusMap[status] || status;
};

/**
 * Ödeme durumuna göre renk sınıfları döndüren fonksiyon
 */
export const getStatusColor = (status: string): string => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusKey = status.toUpperCase();
  const colors: Record<string, string> = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'TAMAMLANDI': 'bg-green-100 text-green-800',
    'REFUNDED': 'bg-yellow-100 text-yellow-800',
    'İADE EDILDI': 'bg-yellow-100 text-yellow-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'İPTAL EDILDI': 'bg-red-100 text-red-800'
  };
  
  return colors[statusKey] || 'bg-gray-100 text-gray-800';
};

/**
 * Ödeme durumuna göre badge component sınıflarını döndüren fonksiyon
 */
export const getStatusBadgeClass = (status: string): string => {
  if (!status) return 'bg-gray-100';
  
  const statusKey = status.toUpperCase();
  const colors: Record<string, string> = {
    'COMPLETED': 'bg-green-500',
    'TAMAMLANDI': 'bg-green-500',
    'REFUNDED': 'bg-yellow-500',
    'İADE EDILDI': 'bg-yellow-500',
    'CANCELLED': 'bg-red-500',
    'İPTAL EDILDI': 'bg-red-500'
  };
  
  return colors[statusKey] || 'bg-gray-500';
};

/**
 * Tahsilat için özet bilgi formatlaması
 */
export const formatPaymentSummary = (payment: any): string => {
  if (!payment) return '';
  
  const methodText = getPaymentMethodText(payment.paymentMethod);
  const typeText = getPaymentTypeText(payment.paymentType);
  const formattedAmount = formatPrice(payment.amount);
  
  return `${formattedAmount} - ${typeText} (${methodText})`;
};

/**
 * Tahsilat oluşturma/güncelleme form verisini doğrulama
 */
export const validatePaymentData = (
  data: {
    customerId?: string;
    amount?: string | number;
    paymentType?: string;
    paymentMethod?: string;
    processedBy?: string;
    packageSaleId?: string;
    productSaleId?: string;
  }
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Müşteri seçilmiş mi?
  if (!data.customerId) {
    errors.customerId = 'Müşteri seçilmelidir';
  }
  
  // Tutar geçerli mi?
  if (!data.amount) {
    errors.amount = 'Tutar girilmelidir';
  } else {
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Geçerli bir tutar girilmelidir';
    }
  }
  
  // Ödeme türü seçilmiş mi?
  if (!data.paymentType) {
    errors.paymentType = 'Ödeme türü seçilmelidir';
  }
  
  // Ödeme şekli seçilmiş mi?
  if (!data.paymentMethod) {
    errors.paymentMethod = 'Ödeme şekli seçilmelidir';
  }
  
  // Ödeme şekli paket ödemesi ise paket seçilmiş mi?
  if (data.paymentMethod === 'Paket Ödemesi' && !data.packageSaleId) {
    errors.packageSaleId = 'Paket seçilmelidir';
  }
  
  // Ödeme şekli ürün ödemesi ise ürün seçilmiş mi?
  if (data.paymentMethod === 'Ürün Ödemesi' && !data.productSaleId) {
    errors.productSaleId = 'Ürün seçilmelidir';
  }
  
  // İşlemi yapan personel girilmiş mi?
  if (!data.processedBy) {
    errors.processedBy = 'İşlemi yapan personel girilmelidir';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Tamamlanmış tahsilatların toplam tutarını hesaplayan yardımcı fonksiyon
 */
export const calculateTotalAmount = (payments: any[]): number => {
  if (!Array.isArray(payments)) return 0;
  
  return payments.reduce((sum: number, payment: any) => {
    if (!payment || !payment.amount) return sum;
    
    if (payment.status === 'COMPLETED' || payment.status === 'Tamamlandı') {
      return sum + payment.amount;
    }
    return sum;
  }, 0);
};

/**
 * Ödeme tiplerine göre toplam tutarları hesaplayan yardımcı fonksiyon
 */
export const calculatePaymentTypeBreakdown = (payments: any[]): Record<string, number> => {
  if (!Array.isArray(payments)) return {};
  
  const breakdown: Record<string, number> = {
    cash: 0,       // Nakit
    creditCard: 0, // Kredi Kartı
    transfer: 0    // Havale/EFT
  };
  
  payments.forEach(payment => {
    if (!payment || !payment.amount || payment.status !== 'Tamamlandı') return;
    
    const type = payment.paymentType.toLowerCase();
    
    if (type.includes('nakit')) {
      breakdown.cash += payment.amount;
    } else if (type.includes('kart')) {
      breakdown.creditCard += payment.amount;
    } else if (type.includes('havale') || type.includes('eft')) {
      breakdown.transfer += payment.amount;
    }
  });
  
  return breakdown;
};

/**
 * Para birimini sayısal değere dönüştüren fonksiyon
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  
  // TL, ₺, nokta, virgül ve boşlukları temizle
  const cleanedValue = value.replace(/[^0-9,]/g, '').replace(',', '.');
  const parsedValue = parseFloat(cleanedValue);
  
  return isNaN(parsedValue) ? 0 : parsedValue;
};

/**
 * Ödeme referans numarası formatlaması
 */
export const formatReferenceNumber = (refNumber: string | number): string => {
  if (!refNumber) return '';
  
  const refString = String(refNumber);
  
  // 16 haneli kredi kartı referans numarası formatlaması
  if (/^\d{16}$/.test(refString)) {
    return refString.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  }
  
  return refString;
};
