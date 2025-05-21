'use client';

/**
 * Ürün satışları için formatlama ve doğrulama işlevleri.
 * Tüm formatlama işlemleri burada merkezileştirilmiştir.
 */

/**
 * Tarih formatlaması (tr-TR)
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('tr-TR');
};

/**
 * Fiyat formatlaması (TL sembolü ile)
 */
export const formatPrice = (price: number): string => {
  if (price === undefined || price === null) return '';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
};

/**
 * Adet formatlaması
 */
export const formatQuantity = (quantity: number): string => {
  if (quantity === undefined || quantity === null) return '';
  return quantity.toString();
};

/**
 * Ödeme yöntemi metinsel gösterimi
 */
export const getPaymentMethodText = (method: string): string => {
  const methods: { [key: string]: string } = {
    'kart': 'Kart',
    'nakit': 'Nakit',
    'havale': 'Havale/EFT',
    'online': 'Online Ödeme',
    'diger': 'Diğer'
  };
  
  return methods[method] || method || 'Belirtilmemiş';
};

/**
 * Ödeme durumu metinsel gösterimi
 */
export const getPaymentStatusText = (status: string): string => {
  const statuses: { [key: string]: string } = {
    'paid': 'Ödendi',
    'partial': 'Kısmi Ödeme',
    'unpaid': 'Ödenmedi',
    'pending': 'Beklemede',
    'cancelled': 'İptal Edildi'
  };
  
  return statuses[status] || status || 'Belirtilmemiş';
};

/**
 * Toplam tahsilat hesaplama
 */
export const calculateTotalReceived = (payments: any[]): number => {
  if (!payments || !Array.isArray(payments)) return 0;
  return payments.reduce((total, payment) => total + (payment.amount || 0), 0);
};

/**
 * Kalan tutar hesaplama
 */
export const calculateRemainingAmount = (totalAmount: number, payments: any[]): number => {
  const totalReceived = calculateTotalReceived(payments);
  return Math.max(0, totalAmount - totalReceived);
};

/**
 * Form veri doğrulama
 */
export const validateSaleData = (data: {
  productId?: string;
  customerId?: string;
  staffId?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  date?: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!data.productId) {
    errors.productId = 'Ürün seçimi zorunludur';
  }
  
  if (!data.customerId) {
    errors.customerId = 'Müşteri seçimi zorunludur';
  }
  
  if (!data.staffId) {
    errors.staffId = 'Personel seçimi zorunludur';
  }
  
  const quantity = Number(data.quantity);
  if (!data.quantity || isNaN(quantity) || quantity <= 0) {
    errors.quantity = 'Geçerli bir adet girilmelidir';
  }
  
  const unitPrice = Number(data.unitPrice);
  if (!data.unitPrice || isNaN(unitPrice) || unitPrice < 0) {
    errors.unitPrice = 'Geçerli bir fiyat girilmelidir';
  }
  
  if (!data.date) {
    errors.date = 'Tarih seçimi zorunludur';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Ödeme veri doğrulama
 */
export const validatePaymentData = (data: {
  amount?: number | string;
  paymentMethod?: string;
  date?: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const amount = Number(data.amount);
  if (!data.amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'Geçerli bir tutar girilmelidir';
  }
  
  if (!data.paymentMethod) {
    errors.paymentMethod = 'Ödeme yöntemi seçimi zorunludur';
  }
  
  if (!data.date) {
    errors.date = 'Tarih seçimi zorunludur';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * ISO format tarih string'ine dönüştürme
 */
export const toLocalISOString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
