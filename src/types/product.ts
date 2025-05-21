

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    isDeleted: boolean;
  }

  export interface CreateProductParams {
    name: string;
    price: number | string;
    stock: number | string;
    description?: string;
  }

  export interface UpdateProductParams {
    name?: string;
    price?: number | string;
    stock?: number | string;
    description?: string | null;
  }
  
  export interface Customer {
    id: string;
    name: string;
  }
  
  export interface Staff {
    id: string;
    name: string;
    position?: string;
    accountType: string;
  }
  
  export interface ProductSale {
    id: string;
    date: string;
    productId: string;
    customerId: string;
    staffId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    customerName: string;
    staffName: string;
    paymentStatus: string;
    createdAt: string;
  }
  
  export interface ProductSaleWithPayments extends ProductSale {
    payments?: Payment[];
    totalPayments?: number;
    remainingAmount?: number;
    paymentStatus?: string;
  }
  
  export interface Payment {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentType: string;
    date: string;
    notes?: string;
    status: string;
    customerId: string;
    customerName?: string;
    processedBy: string;
    processedByName?: string;
    productSaleId: string;
    createdAt: string;
  }
  
  export interface CreateProductSaleParams {
    productId: string;
    customerId: string;
    staffId: string;
    quantity: number;
    unitPrice: number;
    date: string;
    paymentType?: string;
    isFullyPaid?: boolean;
  }
  
  export interface UpdateProductSaleParams {
    quantity?: number;
    unitPrice?: number;
    paymentType?: string;
    paymentStatus?: string;
  }
  
  export interface CreatePaymentParams {
    customerId: string;
    customerName?: string;
    amount: number;
    paymentType: string;
    paymentMethod: string;
    productSaleId: string;
    processedBy: string;
    status?: string;
    notes?: string;
    date?: string;
  }