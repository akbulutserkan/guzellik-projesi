/**
 * Helper functions for product sale operations
 */
import { Payment, ProductSale } from '@prisma/client';

/**
 * Calculate payment totals and status for a product sale
 * @param sale Product sale with payments
 * @returns Enhanced sale with payment information
 */
export function calculatePaymentInfo(sale: ProductSale & { payments?: Payment[] }) {
  // Ödemelerin toplamını hesapla
  const totalPayments = sale.payments?.reduce((sum, payment) => {
    return sum + (payment.amount || 0);
  }, 0) || 0;
  
  // Kalan tutarı hesapla
  const totalPrice = sale.totalPrice || 0;
  const remainingAmount = Math.max(0, totalPrice - totalPayments);
  
  // Ödeme durumunu belirle
  let paymentStatus = 'PENDING';
  if (totalPayments >= totalPrice) {
    paymentStatus = 'PAID';
  } else if (totalPayments > 0) {
    paymentStatus = 'PARTIAL';
  }
  
  return {
    totalPayments,
    remainingAmount,
    paymentStatus
  };
}
