/**
 * Paket satışı ile ilgili yardımcı fonksiyonlar
 */

// Paket satışları için ek bilgileri hesaplar (totalPaid, remainingAmount, vb.)
export function calculatePackageSaleExtras(sale: any, payments: any[] = [], packageSessions: any[] = []) {
  // Toplam ödeme tutarını hesapla
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remainingAmount = Number(sale.price) - totalPaid;
  
  // Kullanılan seans sayısını hesapla
  const usedSessions = packageSessions.length;
  const remainingSessions = sale.package?.sessionCount 
    ? sale.package.sessionCount - usedSessions 
    : 0;

  return {
    totalPaid,
    remainingAmount,
    usedSessions,
    remainingSessions,
    paymentStatus: remainingAmount <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'
  };
}
