'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { updateTotalAmount, calculateTotalPrice } from '../../utils/paymentUtils';

/**
 * Hook for managing payment-related functionality in the AppointmentDetailModal
 */
export const usePaymentSection = ({
  appointment,
  localAppointments,
  attendanceStatus,
  forceRefresh,
  onUpdate
}: {
  appointment: any;
  localAppointments: any[];
  attendanceStatus: string;
  forceRefresh: () => void;
  onUpdate: () => Promise<void>;
}) => {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CASH');
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Calculate and update total amount based on services and products
   */
  const handleUpdateTotalAmount = useCallback((newPrice: number) => {
    // Update total amount based on appointments
    const productSalesData = appointment.productSales || [];
    updateTotalAmount(newPrice, localAppointments, setCustomPrice, setPaymentAmount, forceRefresh, productSalesData);
    
    // If status is "showed", include product sales in total
    if (attendanceStatus === 'showed' && appointment?.customerId) {
      // Fetch and include product sales in total
      const fetchAndUpdateTotal = async () => {
        try {
          // Import and use the service instead of direct fetch
          const response = await fetch(`/api/product-sales?customerId=${appointment.customerId}&includeStaff=true`);
          if (response.ok) {
            const productSales = await response.json();
            // Calculate total price including services and products
            const totalPrice = calculateTotalPrice(localAppointments, productSales);
            setCustomPrice(totalPrice.toString());
            setPaymentAmount(totalPrice.toString());
            forceRefresh();
          }
        } catch (error) {
          console.error('Error fetching product sales:', error);
        }
      };
      
      fetchAndUpdateTotal();
    }
  }, [localAppointments, appointment, attendanceStatus, forceRefresh]);

  /**
   * Open payment method selection modal
   */
  const openPaymentMethodModal = useCallback(() => {
    setShowPaymentMethodModal(true);
  }, []);

  /**
   * Handle payment method selection and save payment
   */
  const handleSelectPaymentMethod = useCallback(async (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethodModal(false);
    
    try {
      setLoading(true);
      
      // Make the API call to save payment with selected method
      const appointmentId = appointment.id.split('_')[0];
      const response = await fetch(`/api/appointments/${appointmentId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          customPrice: parseFloat(customPrice),
          paymentMethod: method
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }
      
      // Show success message
      toast({
        title: 'Başarılı',
        description: 'Ödeme başarıyla kaydedildi'
      });
      
      // Update UI after successful payment
      setTimeout(() => {
        onUpdate();
      }, 200);
      
    } catch (error) {
      console.error('Error selecting payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Ödeme işlemi sırasında bir hata oluştu',
      });
    } finally {
      setLoading(false);
    }
  }, [appointment, paymentAmount, customPrice, toast, onUpdate]);

  /**
   * Handle "Save Payment" button click
   */
  const handlePaymentSave = useCallback(() => {
    // Open payment method selection modal
    openPaymentMethodModal();
  }, [openPaymentMethodModal]);

  // Return state and functions
  return {
    paymentAmount,
    setPaymentAmount,
    customPrice,
    setCustomPrice,
    showPaymentMethodModal,
    setShowPaymentMethodModal,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    loading,
    setLoading,
    handleUpdateTotalAmount,
    handlePaymentSave,
    handleSelectPaymentMethod,
  };
};

export default usePaymentSection;
