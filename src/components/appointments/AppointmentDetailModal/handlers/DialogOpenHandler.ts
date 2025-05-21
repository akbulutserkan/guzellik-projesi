'use client';

import { MutableRefObject } from "react";

interface DialogOpenHandlerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleOpenChange: (open: boolean) => void;
  isUpdatingRef: MutableRefObject<boolean>;
  isEditingNotes: boolean;
  notes: string;
  originalNotes: string;
  saveNotes: () => Promise<void>;
  setLoadingModalContent: (loading: boolean) => void;
  setRenderFullContent: (render: boolean) => void;
  contentLoadedRef: MutableRefObject<boolean>;
  setShowEditModal: (show: boolean) => void;
  setShowNewServiceModal: (show: boolean) => void;
  showNewServiceModal: boolean;
  showEditModal: boolean;
  showPaymentMethodModal: boolean;
  onUpdate: () => Promise<void>;
}

/**
 * İyileştirilmiş dialog açma-kapama işleyicisi
 * Ana modalın açılması ve kapanması sırasında yapılması gereken işlemleri yönetir
 */
export function useDialogOpenHandler({
  open,
  onOpenChange,
  handleOpenChange,
  isUpdatingRef,
  isEditingNotes,
  notes,
  originalNotes,
  saveNotes,
  setLoadingModalContent,
  setRenderFullContent,
  contentLoadedRef,
  setShowEditModal,
  setShowNewServiceModal,
  showNewServiceModal,
  showEditModal,
  showPaymentMethodModal,
  onUpdate
}: DialogOpenHandlerProps) {
  console.log('🔵 DialogOpenHandler - useDialogOpenHandler çağrıldı, open:', open);

  /**
   * Ana modalın açılma ve kapanma davranışını yönetir
   * İyileştirilmiş ve sadeleştirilmiş versiyonu
   */
  const handleDialogOpenChange = (isOpen: boolean, e?: React.BaseSyntheticEvent) => {
    console.log('🔵 DialogOpenHandler - handleDialogOpenChange çağrıldı, isOpen:', isOpen, 'iç modallar:', { 
      showNewServiceModal, 
      showEditModal, 
      showPaymentMethodModal 
    });
    
    // MODAL AÇILMA DURUMU
    if (isOpen) {
      // Modal açılırken state'leri güncelle
      onOpenChange(true);
      handleOpenChange(true);
      
      // Modal açıldıktan sonra toplamı güncelle (mikro gecikme ile zamanlama sorunlarını önle)
      setTimeout(() => {
        const updateEvent = new CustomEvent('force_payment_refresh', { 
          detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(updateEvent);
      }, 100);
      
      return;
    }
    
    // MODAL KAPANMA DURUMU - Aşağıdaki koşulları sırayla kontrol et
    
    // 1. İç modallardan biri açıksa kapanmayı engelle
    if (showNewServiceModal || showEditModal || showPaymentMethodModal) {
      console.log('🔴 Ana modal kapanması engellendi: İç modal açık');
      e?.preventDefault();
      return;
    }
    
    // 2. Güncelleme devam ediyorsa kapanmayı engelle (timeout sonrası reset)
    if (isUpdatingRef.current) {
      console.log('🔴 Güncelleme işlemi devam ediyor, modal kapatılması engellendi');
      e?.preventDefault();
      
      // Güvenlik önlemi - 5 saniye sonra flag'i sıfırla
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 5000);
      
      return;
    }
    
    // 3. Not düzenleme modundaysa ve notlar değiştiyse, önce notları kaydet
    if (isEditingNotes && notes !== originalNotes) {
      console.log('🔴 Notlar değişmiş, önce kaydediliyor...');
      
      // Notları kaydet ve sonra kapat
      (async () => {
        try {
          await saveNotes();
          closeModalSafely();
        } catch (err) {
          console.error('Not kaydederken hata:', err);
          closeModalSafely(); // Hata olsa bile modalı kapat
        }
      })();
      
      return;
    }
    
    // Tüm koşullar geçildiyse güvenli şekilde kapat
    closeModalSafely();
  };
  
  // Modalı güvenli bir şekilde kapatmak için yardımcı fonksiyon
  const closeModalSafely = () => {
    // ESC tuşu kontrolü
    const escKeyPressed = document.activeElement === document.body &&
                      (window.event && (window.event as KeyboardEvent).key === 'Escape');
    
    // Yükleme durumlarını sıfırla
    setLoadingModalContent(true);
    setRenderFullContent(false);
    contentLoadedRef.current = false;
    
    // ESC tuşuna basıldıysa tüm moduları kapat
    if (escKeyPressed) {
      setShowEditModal(false);
      setShowNewServiceModal(false);
    }
    
    // Önce state'leri güncelle
    onOpenChange(false);
    handleOpenChange(false);
    
    // Modal kapandığını kesinleştirmek için son kontrol
    setTimeout(() => {
      if (open) { // Modal hala açıksa
        console.log('🔴 Modal kapanma işlemleri başarısız oldu, zorla yenileniyor');
        onUpdate(); // Takvimi zorla yenile
        onOpenChange(false); // Son bir defa daha kapatmayı dene
      }
    }, 300);   
  };

  return { handleDialogOpenChange };
}
