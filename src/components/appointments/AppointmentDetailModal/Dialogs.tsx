'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { deleteAppointment, markAppointmentAsNoShow } from '@/services/appointmentService';

interface DialogsProps {
  appointment: any;
  showCancelConfirm: boolean;
  setShowCancelConfirm: (show: boolean) => void;
  showNoShowConfirm: boolean;
  setShowNoShowConfirm: (show: boolean) => void;
  handleNoShow: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onUpdate: () => Promise<void>;
  handleOpenChange: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void; // Ana modal kapatma fonksiyonu (opsiyonel)
  toast: any;
}

export default function Dialogs({
  appointment,
  showCancelConfirm,
  setShowCancelConfirm,
  showNoShowConfirm,
  setShowNoShowConfirm,
  handleNoShow,
  loading,
  setLoading,
  onUpdate,
  handleOpenChange,
  onOpenChange,
  toast
}: DialogsProps) {
  return (
    <>
      {/* Randevu İptal Onay Dialogu */}
      <AlertDialog 
        open={showCancelConfirm} 
        onOpenChange={(open) => {
          // Esc tuşuna basıldığında eski onay kutusunun kendiliğinden açılmasını engellemek için
          // Modal açılırken sadece onOpenChange değil, diğer işlemleri de yapalım
          if (!open) {
            // Modal kapanıyorsa (iptal veya vazgeç ile)
            setShowCancelConfirm(false);
          } else {
            setShowCancelConfirm(true);
          }
        }}>
      
        <AlertDialogContent className="rounded-xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Randevu İptal</AlertDialogTitle>
            <AlertDialogDescription>
              Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
            onClick={async () => {
            setShowCancelConfirm(false);
            setLoading(true);
            try {
            // Eğer birden fazla randevu varsa (appointment ve allAppointments prop'ları ile erişilebilir)
            // Önce tüm randevuların idlerini topla
            const allAppointmentIds = (appointment._allAppointments || []).map(apt => apt.id);
            
            console.log('İptal edilecek tüm randevular:', allAppointmentIds);
            
            // Her randevu için iptal işlemi yap - MCP API ile
            const cancelPromises = allAppointmentIds.map(async (appointmentId) => {
              try {
                // İki metod var: API servis fonksiyonu veya MCP API çağrısı
                await deleteAppointment(appointmentId);
                
                console.log(`Randevu başarıyla iptal edildi: ${appointmentId}`);
              } catch (error) {
                console.error(`Randevu iptal edilirken hata (ID: ${appointmentId}):`, error);
                throw new Error(`Randevu iptal edilirken hata (ID: ${appointmentId})`);
              }
            });
            
            // Asıl randevuyu da iptal et (eğer listede değilse)
            if (!allAppointmentIds.includes(appointment.id)) {
              try {
                // İki metod var: API servis fonksiyonu veya MCP API çağrısı
                await deleteAppointment(appointment.id);
                
                console.log(`Ana randevu başarıyla iptal edildi: ${appointment.id}`);
              } catch (error) {
                console.error('Randevu iptal edilirken hata:', error);
                throw new Error('Randevu iptal edilirken hata');
              }
            }
            
            // Tüm işlemlerin tamamlanmasını bekle
            await Promise.all(cancelPromises);
                  
                  toast({
                    title: 'Başarılı',
                    description: allAppointmentIds.length > 0 ? 'Tüm randevular iptal edildi' : 'Randevu iptal edildi',
                  });
                  
                  await onUpdate();
                  
                  // Tüm randevular iptal edildikten sonra modalı kapat
                  // 1. İç state'i güncelle
                  handleOpenChange(false);
                  
                  // 2. Ana modal kapanma fonksiyonunu çağır (doğrudan modal state'ini günceller)
                  if (onOpenChange) {
                    onOpenChange(false);
                  }
                  
                  // 3. Modalı zorla kapatmak için ilave yöntem - Klavye Escape eventi tetikle
                  // Bu, tüm modların kapanmasını sağlar
                  setTimeout(() => {
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                      key: 'Escape',
                      code: 'Escape',
                      keyCode: 27,
                      which: 27,
                      bubbles: true
                    }));
                  }, 100);
                } catch (error) {
                  console.error('Randevu iptal hatası:', error);
                  toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: 'Randevu iptal edilirken bir hata oluştu',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              İptal Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gelmedi Onay Dialogu */}
      <AlertDialog 
        open={showNoShowConfirm} 
        onOpenChange={(open) => {
          // Esc tuşuna basıldığında eski onay kutusunun kendiliğinden açılmasını engellemek için
          if (!open) {
            // Modal kapanıyorsa (iptal veya vazgeç ile)
            setShowNoShowConfirm(false);
          } else {
            setShowNoShowConfirm(true);
          }
        }}>
      
        <AlertDialogContent className="rounded-xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Gelmedi Olarak İşaretle</AlertDialogTitle>
            <AlertDialogDescription>
              Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                // handleNoShow yerine burada tüm randevuları işaretleme mantığını kendimiz yürütelim
                setShowNoShowConfirm(false);
                setLoading(true);
                
                try {
                  // Aynı müşterinin o günkü tüm randevularını bul
                  const allAppointmentIds = (appointment._allAppointments || [])
                    .filter(apt => apt.customerId === appointment.customerId) // Sadece aynı müşteriye ait randevular
                    .map(apt => apt.id);
                  
                  console.log(`${allAppointmentIds.length} adet randevu bulundu - Hepsi gelmedi olarak işaretlenecek`);
                  
                  // Her randevu için gelmedi olarak işaretleme işlemi yap - MCP API ile
                  const noShowPromises = allAppointmentIds.map(async (appointmentId) => {
                    try {
                      // API servis modülü ile randevuyu "gelmedi" olarak işaretle
                      await markAppointmentAsNoShow(appointmentId);
                      
                      console.log(`Randevu başarıyla gelmedi olarak işaretlendi: ${appointmentId}`);
                    } catch (error) {
                      console.error(`Randevu gelmedi olarak işaretlenirken hata (ID: ${appointmentId}):`, error);
                      throw new Error(`Randevu gelmedi olarak işaretlenirken hata (ID: ${appointmentId})`);
                    }
                  });
                  
                  // Seçilen randevuyu da gelmedi olarak işaretle (eğer listede değilse)
                  if (!allAppointmentIds.includes(appointment.id)) {
                    try {
                      // API servis modülü ile randevuyu "gelmedi" olarak işaretle
                      await markAppointmentAsNoShow(appointment.id);
                      
                      console.log(`Ana randevu başarıyla gelmedi olarak işaretlendi: ${appointment.id}`);
                    } catch (error) {
                      console.error('Randevu gelmedi olarak işaretlenirken hata:', error);
                      throw new Error('Randevu gelmedi olarak işaretlenirken hata');
                    }
                  }
                  
                  // Tüm işlemlerin tamamlanmasını bekle
                  await Promise.all(noShowPromises);
                  
                  toast({
                    title: 'Başarılı',
                    description: allAppointmentIds.length > 0 ? 
                      `Müşterinin ${allAppointmentIds.length + 1} randevusu gelmedi olarak işaretlendi` : 
                      'Randevu gelmedi olarak işaretlendi',
                  });
                  
                  // Takvim verilerini yenile
                  await onUpdate();
                  
                  // Modalı kapat
                  if (onOpenChange) {
                    onOpenChange(false);
                  }
                  
                  // Son bir önlem olarak sayfayı yenile
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                } catch (error) {
                  console.error('Randevu gelmedi olarak işaretlenirken hata:', error);
                  toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: 'Randevu gelmedi olarak işaretlenirken bir hata oluştu',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Evet, Gelmedi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
