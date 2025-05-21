import { useState, useCallback, useRef } from 'react';
// Eski API referansını kaldırıp yeni servis fonksiyonunu kullan
// Geçici bir çözüm olarak bu fonksiyonu burada import etmiyoruz çünkü artık kullanılmıyor
// import { checkWorkingHours } from '@/services/staffService';
import { autoScheduleAppointmentAfterService, createAppointmentWithConflictResolution } from '../utils/appointmentUtils';

interface UseAppointmentSubmitProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  allServices: any[];
  validateForm: () => boolean;
  setError: React.Dispatch<React.SetStateAction<string>>;
  customerSearch: string;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  serviceSearch: string;
  setServiceSearch: React.Dispatch<React.SetStateAction<string>>;
  toast: any;
  onSuccess: (appointmentData?: any) => void;
  onOpenChange: (open: boolean) => void;
  setShowWorkingHoursWarning: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWorkingHoursValid: React.Dispatch<React.SetStateAction<boolean>>;
  showWorkingHoursWarning: boolean;
  appointment?: any;
  defaultCustomerId?: string;
  defaultStartTime?: string;
  setHasConflict?: React.Dispatch<React.SetStateAction<boolean>>;  
  setShowConflictConfirmation?: React.Dispatch<React.SetStateAction<boolean>>;
  setConflictMessage?: React.Dispatch<React.SetStateAction<string>>;
  checkShiftEndConflict?: boolean; // Mesai bitiş saati kontrolü aktif mi
}

export const useAppointmentSubmit = ({
  formData,
  setFormData,
  allServices,
  validateForm,
  setError,
  customerSearch,
  setCustomerSearch,
  serviceSearch,
  setServiceSearch,
  toast,
  onSuccess,
  onOpenChange,
  showWorkingHoursWarning,
  setShowWorkingHoursWarning,
  setIsWorkingHoursValid,
  appointment,
  defaultCustomerId,
  defaultStartTime,
  setHasConflict = () => {},
  setShowConflictConfirmation = () => {},
  setConflictMessage = () => {},
  checkShiftEndConflict = false // Varsayılan olarak mesai bitiş kontrolü kapalı
}: UseAppointmentSubmitProps) => {
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions

  // Form gönderme işlevi
  const handleSubmit = useCallback(async () => {
    // Çift gönderim kontrolü
    if (isSubmittingRef.current) {
      console.log('Zaten bir gönderim işlemi devam ediyor, yeni istek engellendi');
      return;
    }
    
    // Çift tetiklemeyi önlemek için bu çağrı son 500ms içinde tetiklendiyse engelle
    const now = Date.now();
    const lastSubmitTime = window._lastFormSubmitTime || 0;
    
    if (now - lastSubmitTime < 500) {
      console.log('Çok hızlı tekrar eden gönderim engellendi');
      return;
    }
    
    // Gönderim zamanını kaydet
    window._lastFormSubmitTime = now;

    try {
      isSubmittingRef.current = true; // İşlem başladı
      console.log('handleSubmit çağrıldı - formData:', JSON.stringify(formData));
      setLoading(true);
      
      // Doğrulama yap
      if (!validateForm()) {
        console.log('Form doğrulanmadı, işlem iptal ediliyor');
        setLoading(false);
        isSubmittingRef.current = false; // İşlem tamamlandı
        return;
      }
      
      console.log('Form doğrulandı, işlem devam ediyor...');
      console.log('defaultCustomerId:', defaultCustomerId);
      console.log('defaultStartTime:', defaultStartTime);
      
      // Çakışma kontrolü ile randevu oluştur
      const result = await createAppointmentWithConflictResolution(
        formData,
        appointment,
        allServices,
        toast,
        onSuccess,
        onOpenChange,
        setFormData,
        setCustomerSearch,
        setServiceSearch,
        setShowWorkingHoursWarning,
        setIsWorkingHoursValid
      );
      
      // Çakışma durumunu kontrol et
      if (result && result.conflict) {
        // Çakışma var, kullanıcıya bildir
        console.log("Çakışma tespit edildi:", result);
        setHasConflict(true);
        
        // Mesai saatleri dışında bir öneri mi?
        if (result.type === 'outside_hours') {
          setConflictMessage(`Bu hizmete ait randevu işletme mesai saatleri dışına denk geliyor. Onaylıyor musunuz?`);
        } else {
          // Boş saat bulunmadığı için öneri
          setConflictMessage("Seçilen saatte başka bir randevu bulunmaktadır. Çakışmayı göz ardı edip randevuyu oluşturmak istiyor musunuz?");
        }
        
        setShowConflictConfirmation(true);
        setLoading(false);
        isSubmittingRef.current = false; // İşlem tamamlandı
        return;
      }
      
      // Eğer müşteri ve saati otomatik doldurmakla ilgileniyorsak
      if (defaultCustomerId && defaultStartTime) {
        console.log('Otomatik planlamaya geçiliyor: defaultCustomerId ve defaultStartTime mevcut');
        try {
          // Yeni hizmeti otomatik olarak ekle
          const result = await autoScheduleAppointmentAfterService(
            formData,
            defaultStartTime,
            defaultCustomerId,
            allServices,
            toast,
            onSuccess,
            onOpenChange,
            setFormData,
            setCustomerSearch,
            setServiceSearch
          );
          
          console.log('Otomatik planlama sonucu:', result);
          
          // Boş saat bulunamadıysa veya işletme mesai saatleri dışına denk geliyorsa kullanıcıya sor
          if (result && result.conflict) {
            console.log('Otomatik planlama çakışma sonucu:', result);
            setHasConflict(true);
            
            // Mesai saatleri dışında bir öneri mi?
            if (result.type === 'outside_hours') {
              setConflictMessage(result.message);
            } 
            // İşletme kapalı mı?
            else if (result.type === 'closed') {
              setConflictMessage(result.message);
            }
            // Boş saat bulunmadığı için öneri
            else {
              // Önerilen zamanı format
              const proposedTime = result.proposedStart ? 
                `${result.proposedStart.getHours().toString().padStart(2, '0')}:${result.proposedStart.getMinutes().toString().padStart(2, '0')}` : 
                "";
              
              setConflictMessage(`Personelin boş saati yok. Yeni hizmet ${proposedTime} saatine eklenebilir. Onaylıyor musunuz?`);
            }
            
            setShowConflictConfirmation(true);
          } else if (result) {
            // Başarılı bir şekilde oluşturuldu
            console.log('Hizmet başarıyla eklendi:', result);
            
            // Artık Event Bus kullanmak yerine, sadece onSuccess'i çağırıp UI güncellemesini sağlayalım
            if (onSuccess) {
              await onSuccess(result);
            }
            
            // Herhangi bir sorun yoksa ve hızlı mod etkinse, modalı kapat
            onOpenChange(false);
          }
        } catch (err: any) {
          console.error('Otomatik planlama sırasında hata:', err);
          
          // Hata mesajında öneri varsa, kullanıcıya göster
          if (err.message && err.message.includes('Önerilen zaman:')) {
            setHasConflict(true);
            setConflictMessage(err.message.replace('Personelin boş saati bulunamadı.', 'Personelin boş saati yok. Yeni hizmet') + ' saatine eklenebilir. Onaylıyor musunuz?');
            setShowConflictConfirmation(true);
          } else {
            setError(err.message || "Otomatik planlama sırasında bir hata oluştu");
          }
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Gönderim hatası:', err);
      setError(err.message || "Beklenmeyen bir hata oluştu");
      setLoading(false);
    } finally {
      isSubmittingRef.current = false; // İşlem tamamlandı
    }
  }, [formData, 
     validateForm, 
     appointment, 
     allServices, 
     toast, 
     onSuccess, 
     onOpenChange, 
     setCustomerSearch, 
     setServiceSearch, 
     setFormData, 
     setShowWorkingHoursWarning, 
     setIsWorkingHoursValid, 
     setHasConflict, 
     setConflictMessage, 
     setShowConflictConfirmation,
     defaultCustomerId,
     defaultStartTime]);

  return {
    loading,
    handleSubmit
  };
};