/**
 * Package Sale formatters and validators
 * These utility functions handle formatting and validating package sale data
 */
import { PackageSale, Payment } from "@/types/package";

/**
 * Format price as currency
 * @param price Price in number format
 * @returns Formatted price string in TRY currency
 */
export const formatPrice = (price: number): string => {
  if (typeof price !== 'number' || isNaN(price)) return '0,00 ₺';
  
  return price.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  });
};

/**
 * Format date to Turkish date format
 * @param dateString Date string in ISO format
 * @returns Formatted date string (DD.MM.YYYY)
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format date with time to Turkish format
 * @param dateString Date string in ISO format
 * @returns Formatted date and time string (DD.MM.YYYY HH:MM)
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate total received payments amount
 * @param payments Array of payment objects
 * @returns Total payment amount
 */
export const calculateTotalReceived = (payments: Payment[]): number => {
  if (!Array.isArray(payments)) return 0;
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
};

/**
 * Calculate remaining amount to be paid
 * @param totalPrice Total price of package sale
 * @param payments Array of payment objects
 * @returns Remaining amount to be paid
 */
export const calculateRemainingAmount = (totalPrice: number, payments: Payment[]): number => {
  const totalReceived = calculateTotalReceived(payments);
  return totalPrice - totalReceived;
};

/**
 * Get human-readable payment method text
 * @param paymentType Payment type code
 * @returns Human-readable payment method text
 */
export const getPaymentTypeText = (paymentType: string): string => {
  const types: Record<string, string> = {
    'CASH': 'Nakit',
    'CREDIT_CARD': 'Kredi Kartı',
    'BANK_TRANSFER': 'Havale/EFT',
    'TRANSFER': 'Havale/EFT',
    'PACKAGE_SALE': 'Nakit'
  };
  return types[paymentType] || 'Diğer';
};

/**
 * Get human-readable payment method category text
 * @param paymentMethod Payment method code
 * @returns Human-readable payment method category text
 */
export const getPaymentMethodText = (paymentMethod: string): string => {
  const methods: Record<string, string> = {
    'PACKAGE_PAYMENT': 'Paket Ödemesi',
    'SERVICE_PAYMENT': 'Hizmet Ödemesi',
    'PRODUCT_PAYMENT': 'Ürün Ödemesi'
  };
  return methods[paymentMethod] || paymentMethod;
};

/**
 * Count completed sessions from package sale sessions
 * @param sale Package sale object
 * @returns Count of completed sessions
 */
export const countCompletedSessions = (sale: PackageSale): number => {
  if (!sale || !Array.isArray(sale.sessions)) return 0;
  return sale.sessions.filter(session => session.status === 'COMPLETED').length;
};

/**
 * Validate package sale input data
 * @param data Package sale input data
 * @returns Validation result with error message if invalid
 */
export const validateSaleData = (data: any): { valid: boolean; message?: string } => {
  if (!data.customerId) {
    return { valid: false, message: 'Müşteri seçimi zorunludur' };
  }
  
  if (!data.packageId) {
    return { valid: false, message: 'Paket seçimi zorunludur' };
  }
  
  if (!data.staffId) {
    return { valid: false, message: 'Personel seçimi zorunludur' };
  }
  
  const price = parseFloat(data.price?.toString() || '0');
  if (isNaN(price) || price <= 0) {
    return { valid: false, message: 'Geçerli bir satış fiyatı girilmelidir' };
  }
  
  // Validate payment data if present
  if (data.payment) {
    const paymentAmount = parseFloat(data.payment.amount?.toString() || '0');
    
    if (paymentAmount > 0) {
      if (!data.payment.paymentMethod) {
        return { valid: false, message: 'Ödeme yöntemi seçilmelidir' };
      }
      
      if (paymentAmount > price) {
        return { valid: false, message: 'Tahsilat tutarı satış tutarından büyük olamaz' };
      }
    }
  }
  
  // Check if sale date is valid
  if (data.saleDate) {
    const saleDate = new Date(data.saleDate);
    if (isNaN(saleDate.getTime())) {
      return { valid: false, message: 'Geçersiz satış tarihi' };
    }
  }
  
  // Check if expiry date is valid and after sale date
  if (data.expiryDate) {
    const expiryDate = new Date(data.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      return { valid: false, message: 'Geçersiz son geçerlilik tarihi' };
    }
    
    if (data.saleDate) {
      const saleDate = new Date(data.saleDate);
      if (expiryDate < saleDate) {
        return { valid: false, message: 'Son geçerlilik tarihi satış tarihinden önce olamaz' };
      }
    }
  }
  
  return { valid: true };
};

/**
 * Validate payment data
 * @param data Payment input data
 * @param remainingAmount Remaining amount that can be paid
 * @returns Validation result with error message if invalid
 */
export const validatePaymentData = (data: any, remainingAmount: number): { valid: boolean; message?: string } => {
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    return { valid: false, message: 'Geçerli bir tutar giriniz' };
  }
  
  const amount = parseFloat(data.amount);
  if (amount > remainingAmount) {
    return { valid: false, message: 'Ödeme tutarı kalan tutardan büyük olamaz' };
  }
  
  if (!data.paymentType) {
    return { valid: false, message: 'Ödeme yöntemi seçiniz' };
  }
  
  return { valid: true };
};

/**
 * Returns the toLocalISOString of a date (without timezone offset)
 * @param date Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const toLocalISOString = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

/**
 * Ensures a package sale object has all required properties
 * @param sale Package sale object to validate
 * @returns Validated and normalized package sale object
 */
export const validateSale = (sale: any): PackageSale => {
  if (!sale || typeof sale !== "object") throw new Error("Invalid sale data");
  
  return {
    ...sale,
    customer: { ...sale.customer, name: sale.customer?.name || "" },
    package: { ...sale.package, packageServices: sale.package?.packageServices || [] },
    sessions: sale.sessions || [],
    payments: sale.payments || [],
  };
};
