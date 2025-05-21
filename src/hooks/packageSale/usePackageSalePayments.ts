'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ApiService } from '@/services/api';

interface PaymentFormData {
  packageSaleId: string;
  amount: number;
  date?: string;
  method?: string;
  notes?: string;
  staffId?: string | null;
}

export interface UsePackageSalePaymentsOptions {
  showToasts?: boolean;
  onSuccess?: (paymentId: string, packageSaleId: string) => void;
}

export interface UsePackageSalePaymentsResult {
  loading: boolean;
  error: string | null;
  addPayment: (data: PaymentFormData) => Promise<any | null>;
  deletePayment: (id: string, packageSaleId: string) => Promise<boolean>;
  calculateTotalPaid: (payments: any[]) => number;
  calculateRemainingAmount: (totalPrice: number, payments: any[]) => number;
}

/**
 * Paket satışı ödemelerini yöneten hook
 */
export const usePackageSalePayments = ({
  showToasts = true,
  onSuccess
}: UsePackageSalePaymentsOptions = {}): UsePackageSalePaymentsResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  /**
   * Ödeme ekle
   */
  const addPayment = useCallback(async (data: PaymentFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.addPayment(data);
      
      if (result.success) {
        if (showToasts) {
          toast({
            title: "Başarılı",
            description: 'Ödeme başarıyla eklendi'
          });
        }
        
        // Başarı callback'i çağır
        if (onSuccess) {
          onSuccess(result.data.id, data.packageSaleId);
        }
        
        return result.data;
      } else {
        setError(result.error || 'Ödeme eklenirken bir hata oluştu');
        
        if (showToasts) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: result.error || 'Ödeme eklenirken bir hata oluştu'
          });
        }
        
        return null;
      }
    } catch (err) {
      console.error('Ödeme eklenirken hata:', err);
      setError('Ödeme eklenirken bir hata oluştu');
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: 'Ödeme eklenirken bir hata oluştu'
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, onSuccess]);
  
  /**
   * Ödeme sil
   */
  const deletePayment = useCallback(async (id: string, packageSaleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ApiService.packageSales.deletePayment(id);
      
      if (result.success) {
        if (showToasts) {
          toast({
            title: "Başarılı",
            description: 'Ödeme başarıyla silindi'
          });
        }
        
        // Başarı callback'i çağır
        if (onSuccess) {
          onSuccess(id, packageSaleId);
        }
        
        return true;
      } else {
        setError(result.error || 'Ödeme silinirken bir hata oluştu');
        
        if (showToasts) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: result.error || 'Ödeme silinirken bir hata oluştu'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Ödeme silinirken hata:', err);
      setError('Ödeme silinirken bir hata oluştu');
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: 'Ödeme silinirken bir hata oluştu'
        });
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToasts, toast, onSuccess]);
  
  /**
   * Toplam ödenen tutarı hesapla
   */
  const calculateTotalPaid = useCallback((payments: any[]): number => {
    if (!payments || !Array.isArray(payments)) return 0;
    return payments.reduce((total, payment) => total + (payment.amount || 0), 0);
  }, []);
  
  /**
   * Kalan tutarı hesapla
   */
  const calculateRemainingAmount = useCallback((totalPrice: number, payments: any[]): number => {
    const totalPaid = calculateTotalPaid(payments);
    return Math.max(0, totalPrice - totalPaid);
  }, [calculateTotalPaid]);

  return {
    loading,
    error,
    addPayment,
    deletePayment,
    calculateTotalPaid,
    calculateRemainingAmount
  };
};
