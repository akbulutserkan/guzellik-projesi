import { useRouter } from 'next/navigation';
import {
  saveAppointmentNotes,
  saveAppointmentPayment,
  markAppointmentAsNoShow
} from '../services/api';

/**
 * Hook for handling appointment actions like saving notes, payments, and attendance status
 */
interface UseAppointmentActionsProps {
  appointment: any;
  onUpdate: () => Promise<void>;
  toast: any;
  forceUpdate: () => void;
  forceRefresh: () => void;
  isUpdatingRef: React.MutableRefObject<boolean>;
}

export default function useAppointmentActions({
  appointment,
  onUpdate,
  toast,
  forceUpdate,
  forceRefresh,
  isUpdatingRef
}: UseAppointmentActionsProps) {
  const router = useRouter();

  // Refresh calendar in background without closing modal
  const refreshCalendarInBackground = async () => {
    console.log('🟢 useAppointmentActions - refreshCalendarInBackground çağrıldı');
    try {
      // Set updating flag to prevent modal closing during update
      isUpdatingRef.current = true;
      console.log('Refreshing calendar in background...');
      // Call onUpdate in background
      await onUpdate();
      // Force a refresh within the modal
      forceRefresh();
    } catch (error) {
      console.error('Error refreshing calendar:', error);
    } finally {
      // Always reset the updating flag when done, even if there was an error
      isUpdatingRef.current = false;
      console.log('Calendar refresh completed, isUpdatingRef set to false');
    }
  };

  // Save notes
  const saveNotes = async (
    notes: string, 
    originalNotes: string, 
    setIsEditingNotes: (editing: boolean) => void,
    setLoading: (loading: boolean) => void
  ) => {
    console.log('🟢 useAppointmentActions - saveNotes çağrıldı, notlar uzunluğu:', notes?.length);
    // If notes haven't changed, just exit edit mode
    if (notes === originalNotes) {
      setIsEditingNotes(false);
      return;
    }

    try {
      setLoading(true);
      const result = await saveAppointmentNotes(appointment.id, notes);
      console.log('Notes saved:', result);
      
      toast({
        title: 'Success',
        description: 'Notes updated successfully',
      });
      
      // Exit edit mode
      setIsEditingNotes(false);
      
      // Refresh calendar data in background
      await refreshCalendarInBackground();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notes',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle payment save
  const handlePaymentSave = async (
    paymentAmount: string,
    customPrice: string,
    handleOpenChange: (open: boolean) => void,
    setLoading: (loading: boolean) => void,
    router: any = null, // router parametresini opsiyonel yaptık
    paymentMethod: string = 'Nakit', // Ödeme yöntemi parametresi Trürkçe değer
    forceCloseModalFn: Function = null // Tüm modalları kapatmak için güçlü fonksiyon
  ) => {
    console.log('🟢 useAppointmentActions - handlePaymentSave çağrıldı, tutar:', paymentAmount, '- yöntem:', paymentMethod);
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid payment amount',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate amount
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      // API çağrısına timeout ekleyelim (10 saniye)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const result = await saveAppointmentPayment(appointment.id, paymentAmount, controller.signal, paymentMethod);
        clearTimeout(timeoutId);
        console.log('Payment saved:', result);
        
        toast({
          title: 'Success',
          description: 'Payment processed successfully',
        });
        
        // Güçlü kapama fonksiyonu varsa onu kullan
        if (forceCloseModalFn && typeof forceCloseModalFn === 'function') {
          try {
            forceCloseModalFn();
          } catch (err) {
            console.error('Güçlü modal kapama hatası:', err);
          }
        } else {
          // Normal yoldan kapatmayı dene
          handleOpenChange(false);
        }
        
        // Önce takvim verilerini güncelle
        await onUpdate();

        // Router refresh - sayfa yenilenmeden takvimi yenile
        if (router && router.refresh) {
          router.refresh();
        }
      } catch (apiError) {
        clearTimeout(timeoutId);
        let errorMessage = 'Failed to process payment';
        
        if (apiError instanceof Error) {
          errorMessage = apiError.message;
          console.error('API Error:', apiError);
        } else if (apiError?.toString().includes('aborted')) {
          errorMessage = 'Ödeme işlemi zaman aşımına uğradı';
        }
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle No-Show
  const handleNoShow = async (
    setLoading?: (loading: boolean) => void,
    setShowNoShowConfirm?: (show: boolean) => void, 
    handleOpenChange?: (open: boolean) => void,
    router: any = null
  ) => {
    console.log('🟢 useAppointmentActions - handleNoShow çağrıldı');
    try {
      if (setLoading) setLoading(true);
      if (setShowNoShowConfirm) setShowNoShowConfirm(false);
      
      const result = await markAppointmentAsNoShow(appointment.id);
      console.log('Appointment marked as no-show:', result);
      
      toast({
        title: 'No-Show Recorded',
        description: 'Appointment has been marked as no-show',
      });
      
      // Modalı kapat
      if (handleOpenChange) handleOpenChange(false);
      
      // Takvim verilerini yenile - onUpdate'i hemen çağır
      await onUpdate();
      
      // Sonrasında router refresh yapabilirsin
      if (router) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error marking as no-show:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark appointment as no-show',
      });
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  return {
    refreshCalendarInBackground,
    saveNotes,
    handlePaymentSave,
    handleNoShow
  };
}