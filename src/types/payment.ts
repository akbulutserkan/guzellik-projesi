/**
 * Tahsilat arayüzü (type tanımı)
 */
export interface Payment {
  id: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  installment: number | null;
  receiptNumber: string | null;
  status: string;
  processedBy: string;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  packageSale?: {
    id: string;
    package: {
      id: string;
      name: string;
    };
    price: number;
  };
  productSale?: {
    id: string;
    product: {
      id: string;
      name: string;
    };
  };
  appointment?: {
    id: string;
    service: {
      id: string;
      name: string;
    };
  };
}

/**
 * Tahsilat oluşturma parametre arayüzü
 */
export interface CreatePaymentParams {
  customerId: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  packageSaleId?: string;
  productSaleId?: string;
  appointmentId?: string;
  processedBy: string;
  status?: string;
  installment?: number;
  receiptNumber?: string;
  notes?: string;
  date?: string;
}

/**
 * Tahsilat düzenleme parametre arayüzü
 */
export interface UpdatePaymentParams {
  amount?: number;
  paymentType?: string;
  paymentMethod?: string;
  installment?: number;
  receiptNumber?: string;
  notes?: string;
  processedBy?: string;
}

/**
 * Tahsilat filtreleme parametre arayüzü
 */
export interface PaymentFilterOptions {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  staffId?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}
