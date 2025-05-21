/**
 * Product sale service types
 */
import { ProductSale, Customer, Staff, Product, Payment } from '@prisma/client';

// Tip tanımlamaları
export type ProductSaleWithRelations = ProductSale & {
  customer?: Customer;
  staff?: Staff;
  product?: Product;
  payments?: Payment[];
};

export type EnhancedProductSale = ProductSaleWithRelations & {
  totalPayments?: number;
  remainingAmount?: number;
  paymentStatus?: string;
  calculatedPaymentStatus?: string;
};

export type EnhancedPayment = Payment & {
  customerName?: string;
  processedByName?: string;
};

export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  deleteType?: string;
};
