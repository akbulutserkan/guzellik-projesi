'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface AppointmentActionsProps {
  appointment: any;
  onUpdate: () => Promise<void>;
  toast: any;
  forceUpdate: (value: any) => void;
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
}: AppointmentActionsProps) {
  
  // Arka planda takvim güncellemesi
  const refreshCalendarInBackground = useCallback(async () => {
    try {
      console.log('Takvim arka planda güncelleniyor - Modal KAPANMADAN');
      // Güncelleme işlemi başladı
      isUpdatingRef.current = true;
      
      // Sadece değişen randevu bilgisini API'dan çek
      const response = await fetch(`/api/appointments/${appointment.id}`);
      if (!response.ok) {
        throw new Error('Randevu bilgisi yüklenemedi');
      }
      
      // Güncellenmiş randevu bilgisini al ve lokalden güncelle
      const updatedAppointment = await response.json();
      
      // ÖNEMLİ: Appointment nesnesini doğrudan güncelle, bu sayede modalın içeriği otomatik yenilenecek
      if (appointment) {
        // Servis bilgilerini güncelle
        if (updatedAppointment.service) {
          appointment.service = updatedAppointment.service;
        }
        
        // Personel bilgilerini güncelle
        if (updatedAppointment.staff) {
          appointment.staff = updatedAppointment.staff;
        }
        
        // Diğer bilgileri güncelle
        appointment.notes = updatedAppointment.notes;
        appointment.amount = updatedAppointment.amount;
        appointment.status = updatedAppointment.status;
      }
      
      // UI'yi yeniden render et
      forceUpdate({});
      forceRefresh();
      
      return updatedAppointment;
    } catch (err) {
      console.error('Takvim güncelleme hatası:', err);
      return null;
    } finally {
      // Güncelleme işlemi bitti
      isUpdatingRef.current = false;
    }
  }, [appointment, forceRefresh, forceUpdate, isUpdatingRef]);

  // Notları kaydetme işlemi
  const saveNotes = useCallback(async (notes: string, originalNotes: string, setIsEditingNotes: (value: boolean) => void, setLoading: (value: boolean) => void) => {
    if (notes === originalNotes) {
      setIsEditingNotes(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Include the required status field to avoid Prisma validation error
      const requestBody = { 
        notes,
        status: appointment.status || 'BOOKED'  // Send the current status or default to BOOKED
      };
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `HTTP Hata: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          console.error('API yanıtı parse edilemedi:', parseError);
        }
        
        throw new Error(`Notlar güncellenemedi: ${errorMessage}`);
      }
      
      // Başarılı güncelleme
      toast({
        title: 'Başarılı',
        description: 'Notlar güncellendi'
      });
      
      // Doğrudan appointment nesnesini güncelle - modal yeniden yüklenmeden
      appointment.notes = notes;
      
      // Lokal state'leri güncelle 
      setIsEditingNotes(false);
      
      // UI'yi yeniden render et
      forceUpdate({});
      forceRefresh();
      
    } catch (error) {
      console.error('Not güncelleme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Not Güncelleme Hatası',
        description: error instanceof Error ? error.message : 'Notlar güncellenirken bir hata oluştu.'
      });
    } finally {
      setLoading(false);
    }
  }, [appointment, forceRefresh, forceUpdate, toast]);

  // Tahsilatı kaydetme
  const handlePaymentSave = useCallback(async (paymentAmount: string, customPrice: string, handleOpenChange: (open: boolean) => void, setLoading: (value: boolean) => void, router: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          customerId: appointment.customerId,
          amount: parseFloat(paymentAmount) || parseFloat(customPrice) || appointment.service?.price || 0,
          serviceId: appointment.serviceId,
          paymentMethod: 'CASH',
          notes: `${appointment.service?.name || 'Hizmet'} için tahsilat`,
        }),
      });
      if (!response.ok) {
        throw new Error('Tahsilat kaydedilemedi');
      }
      await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      toast({
        title: 'Başarılı',
        description: 'Tahsilat kaydedildi ve randevu tamamlandı',
      });
      router.push('/payments');
      handleOpenChange(false);
    } catch (error) {
      console.error('Tahsilat kaydetme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Tahsilat kaydedilirken bir hata oluştu',
      });
    } finally {
      setLoading(false);
    }
  }, [appointment, toast]);

  // Gelmedi durumunu işaretleme
  const handleNoShow = useCallback(async (setLoading: (value: boolean) => void, setShowNoShowConfirm: (value: boolean) => void, handleOpenChange: (open: boolean) => void, router: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'NO_SHOW',
          attendance: 'NO_SHOW'
        }),
      });
      if (!response.ok) {
        let errorMessage = `HTTP Hata: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          console.error('API yanıtı parse edilemedi:', parseError);
        }
        throw new Error(`Randevu durumu güncellenemedi: ${errorMessage}`);
      }
      toast({
        title: 'Başarılı',
        description: 'Randevu gelmedi olarak işaretlendi'
      });
      await onUpdate();
      router.push('/appointments?filter=noshow');
      handleOpenChange(false);
    } catch (error) {
      console.error('Randevu güncelleme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Randevu Güncelleme Hatası',
        description: 'Randevu "gelmedi" olarak işaretlenemedi. Lütfen daha sonra tekrar deneyiniz.'
      });
    } finally {
      setLoading(false);
      setShowNoShowConfirm(false);
    }
  }, [appointment, onUpdate, toast]);

  return {
    refreshCalendarInBackground,
    saveNotes,
    handlePaymentSave,
    handleNoShow
  };
}
