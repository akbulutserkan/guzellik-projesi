'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo, Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";
import dynamic from 'next/dynamic';

// Import components
import ModalHeader from './components/ModalHeader';
import ModalFooter from './components/ModalFooter';

// Lazy-loaded components
const AppointmentList = dynamic(() => import('./components/AppointmentList'), { ssr: false });
const PaymentSection = dynamic(() => import('./components/PaymentSection'), { ssr: false });
const NoteEditor = dynamic(() => import('./NoteEditor'), { ssr: false });
const Dialogs = dynamic(() => import('./Dialogs'), { ssr: false });
const PaymentMethodModal = dynamic(() => import('./components/PaymentMethodModal'), { ssr: false });
const ShiftEndConflictModal = dynamic(() => import('./modals/ShiftEndConflictModal'), { ssr: false });

// Import hooks
import useAppointmentModal from './hooks/useAppointmentModal';
import useAppointmentActions from './hooks/useAppointmentActions';
import { updateTotalAmount, calculateTotalPrice } from './utils/paymentUtils';

// Import handlers and utils
import { useDialogOpenHandler } from './handlers/DialogOpenHandler';
import { setupEventListeners } from './events/EventListeners';
import { useActionHandlers } from './handlers/ActionHandlers';

// Lazy-load NewAppointmentModal to prevent circular dependency issues
const NewAppointmentModal = dynamic(() => import('../NewAppointmentModal'), { 
  ssr: false,
  loading: () => <div className="loading-spinner">Yükleniyor...</div>
});

// Loading placeholder component
const LoadingPlaceholder = memo(() => (
  <div className="flex items-center justify-center p-6 h-64">
    <div className="flex flex-col items-center">
      <div className="animate-pulse h-8 w-8 rounded-full bg-blue-200 mb-2"></div>
      <p className="text-sm text-gray-500">Randevu detayları yükleniyor...</p>
    </div>
  </div>
));

interface AppointmentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any | null;
  allAppointments?: any[];
  onUpdate: () => Promise<void>;
}

function AppointmentDetailModal({
  open,
  onOpenChange,
  appointment,
  allAppointments = [],
  onUpdate,
}: AppointmentDetailModalProps) {
  console.log('👌 AppointmentDetailModal - Render başladı, appointment ID:', appointment?.id);
  const { toast } = useToast();
  
  // Global blur state for dropdowns and editing states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  
  // Mesai bitişi çakışma uyarısı için state'ler
  const [showShiftEndConflict, setShowShiftEndConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [pendingService, setPendingService] = useState<{staffId: string, serviceId: string, startTime: string} | null>(null);
  
  // Progressive loading states
  const [loadingModalContent, setLoadingModalContent] = useState<boolean>(true);
  const [renderFullContent, setRenderFullContent] = useState<boolean>(false);
  const contentLoadedRef = useRef<boolean>(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the appointment modal hook for state management with lazy initialization
  console.log('👌 AppointmentDetailModal - useAppointmentModal çağrılıyor, appointment ID:', appointment?.id);
  const appointmentModalState = useAppointmentModal({
    appointment,
    allAppointments,
    onUpdate,
    open
  });

  console.log('👌 AppointmentDetailModal - useAppointmentModal değerleri alındı');
  const {
    loading, setLoading, showCancelConfirm, setShowCancelConfirm,
    showEditModal, setShowEditModal, showNoShowConfirm, setShowNoShowConfirm,
    attendanceStatus, setAttendanceStatus, paymentAmount, setPaymentAmount,
    customPrice, setCustomPrice, showPaymentSection, refreshKey, forceRefresh,
    editingAppointmentId, setEditingAppointmentId, appointmentDate, setAppointmentDate,
    appointmentStartTime, setAppointmentStartTime, appointmentEndTime, setAppointmentEndTime,
    modalContentRef, notes, setNotes, isEditingNotes, setIsEditingNotes,
    originalNotes, setOriginalNotes, isUpdatingRef, localAppointments,
    showNewServiceModal, setShowNewServiceModal, findLatestAppointmentEndTime,
    handleAppointmentDeleted, handleOpenChange, handlePriceChange, handleStatusChange,
    forceUpdate
  } = appointmentModalState;

  // Listen for dropdown toggle events from AppointmentEditor
  useEffect(() => {
    const handleDropdownToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsDropdownOpen(customEvent.detail?.isOpen);
    };
    
    // Durum değişikliği taleplerini dinle
    const handleStatusChangeRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      const requestedStatus = customEvent.detail?.status;
      if (requestedStatus) {
        console.log('Durum değişikliği talebi alındı:', requestedStatus);
        // Direkt olarak hooktan gelen handleStatusChange fonksiyonunu çağır
        handleStatusChange(requestedStatus);
        
        // Durum değiştiğini bildiren olayı tetikle
        const attendanceEvent = new CustomEvent('attendance_status_changed', {
          detail: { status: requestedStatus, timestamp: Date.now() }
        });
        document.dispatchEvent(attendanceEvent);
      }
    };
    
    document.addEventListener('appointmentDropdownToggled', handleDropdownToggle as EventListener);
    document.addEventListener('status_change_requested', handleStatusChangeRequest as EventListener);
    
    return () => {
      document.removeEventListener('appointmentDropdownToggled', handleDropdownToggle as EventListener);
      document.removeEventListener('status_change_requested', handleStatusChangeRequest as EventListener);
    };
  }, [handleStatusChange]);

  // Use appointment actions hook for operations with memoization
  const appointmentActions = useAppointmentActions({
    appointment,
    onUpdate,
    toast,
    forceUpdate,
    forceRefresh,
    isUpdatingRef
  });

  const { 
    refreshCalendarInBackground, 
    saveNotes: saveNotesAction, 
    handlePaymentSave: handlePaymentSaveAction,
    handleNoShow: handleNoShowAction 
  } = appointmentActions;

  // Kullanım kolaylığı için action handlers'ı kullan
  const { saveNotes, handleGeldiButtonClick } = useActionHandlers({
    appointment,
    appointmentModalState,
    saveNotesAction,
    setOriginalNotes,
    handleStatusChange
  });

  // Ödeme yöntemi modalı için durum
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CASH');

  // Modal kapama işlevini güçlendiren yardımcı fonksiyon
  const forceCloseModal = useCallback(() => {
    // Önce state'leri güncelle
    setShowPaymentMethodModal(false);
    setShowEditModal(false);
    setShowNewServiceModal(false);
    setShowCancelConfirm(false);
    setShowNoShowConfirm(false);
    
    // Sonra modali kapat
    onOpenChange(false);
    handleOpenChange(false);
  }, [onOpenChange, handleOpenChange, setShowPaymentMethodModal, setShowEditModal, 
      setShowNewServiceModal, setShowCancelConfirm, setShowNoShowConfirm]);

  // Dialog open handler'ı kullan
  const { handleDialogOpenChange } = useDialogOpenHandler({
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
  });

  // Ödeme yöntemi seçme işlevi
  const handleSelectPaymentMethod = useCallback(async (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethodModal(false);
    
    try {
      setLoading(true);
      
      // Router'ı geç ve ödeme işlevine ilet
      const router = typeof window !== 'undefined' ? {
        refresh: () => {
          console.log('Router.refresh() çağrıldı');
          onUpdate();
        }
      } : null;
      
      // Burada ödeme yöntemini gönderiyoruz (güçlü modal kapatma fonksiyonuyla birlikte)
      await handlePaymentSaveAction(paymentAmount, customPrice, handleOpenChange, setLoading, router, method, forceCloseModal);
      
      // 200ms sonra takvim verilerini güncelle (sayfa yenilemeden)
      setTimeout(() => {
        onUpdate();
      }, 200);
      
    } catch (error) {
      console.error('Ödeme yöntemi seçimi sırasında hata:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Ödeme işlemi sırasında bir hata oluştu',
      });
    } finally {
      setLoading(false);
    }
  }, [paymentAmount, customPrice, handleOpenChange, setLoading, handlePaymentSaveAction, onUpdate, toast, forceCloseModal]);

  // Ödeme modalını açma işlevi
  const openPaymentMethodModal = useCallback(() => {
    setShowPaymentMethodModal(true);
  }, []);
  
  // Memoize payment save handler
  const handlePaymentSave = useCallback(async () => {
    // Önce ödeme yöntemi modalini aç
    openPaymentMethodModal();
  }, [openPaymentMethodModal]);

  // Memoize no-show functions
  const confirmNoShow = useCallback(() => {
    if (attendanceStatus === 'noshow') {
      handleStatusChange('unspecified');
      return;
    }
    setShowNoShowConfirm(true);
  }, [attendanceStatus, handleStatusChange, setShowNoShowConfirm]);
  
  const handleNoShow = useCallback(async () => {
    await handleNoShowAction(setLoading, setShowNoShowConfirm, handleOpenChange);
  }, [handleNoShowAction, setLoading, setShowNoShowConfirm, handleOpenChange]);
  
  // Çakışma kontrolü yapan yardımcı fonksiyon - iyileştirilmiş ve basitleştirilmiş versiyonu
  const checkForServiceConflict = useCallback(async (staffId: string, startTime: string) => {
    console.log('🔄 AppointmentDetailModal - checkForServiceConflict çağrıldı, staffId:', staffId);
    
    try {
      // Boş kontrollü - hatalı girdi olmasını engelle
      if (!staffId || !startTime) {
        console.error('Çakışma kontrolü için geçersiz parametreler:', { staffId, startTime });
        return null;
      }
      
      // Tarihi parse et
      const start = new Date(startTime);
      const formattedDate = start.toISOString().split('T')[0];
      
      // API'dan personelin uygunluk bilgilerini getir (timeout eklenmiş)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
      
      console.log(`Personel uygunluk bilgisi sorgulanıyor: /api/appointments/availability?staffId=${staffId}&date=${formattedDate}`);
      
      try {
        const availabilityResponse = await fetch(
          `/api/appointments/availability?staffId=${staffId}&date=${formattedDate}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!availabilityResponse.ok) {
          console.error('Uygunluk API hatası:', availabilityResponse.status);
          return null;
        }
        
        const availabilityData = await availabilityResponse.json();
        const dayOfWeek = start.getDay(); // 0: Pazar, 1: Pazartesi, ...
        
        // Personelin çalışma saatleri
        const staffSchedules = availabilityData.staffSchedule || [];
        const staffWorkingHours = staffSchedules.find((day: any) => day.dayOfWeek === dayOfWeek);
        
        // Çalışma günü ve saatleri kontrolü
        if (!staffWorkingHours || !staffWorkingHours.isWorkingDay) {
          return {
            hasConflict: true,
            message: `Seçilen personel bu gün çalışmıyor. Lütfen başka bir gün/saat veya personel seçin.`
          };
        }
        
        // Mesai bitiş saati kontrolü
        if (staffWorkingHours.endTime) {
          const [endH, endM] = staffWorkingHours.endTime.split(':').map(Number);
          
          // Mesai bitiş saati
          const shiftEnd = new Date(start);
          shiftEnd.setHours(endH, endM, 0, 0);
          
          // Hizmet için standart süre - 60 dakika
          const estimatedEnd = new Date(start.getTime() + 60 * 60000);
          
          console.log('Mesai kontrolü -', {
            mesaiBaslangic: staffWorkingHours.startTime,
            mesaiBitis: staffWorkingHours.endTime,
            randevuBaslangic: start.toLocaleTimeString(),
            tahminiRandevuBitis: estimatedEnd.toLocaleTimeString()
          });
          
          // Randevu mesai bitişinden sonraya sarkarsa uyarı ver
          if (estimatedEnd > shiftEnd) {
            return {
              hasConflict: true,
              message: `Randevu personelin mesai bitiş saati (${endH}:${endM.toString().padStart(2, '0')}) sonrasına kadar sürebilir. Yine de eklemek istiyor musunuz?`
            };
          }
        }
        
        // Çakışma yok, uygun
        return { hasConflict: false };
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('Personel uygunluk sorgusu zaman aşımına uğradı');
          return {
            hasConflict: true,
            message: `Personel bilgisi alınamadı, ağ bağlantısını kontrol edin ve tekrar deneyin.`
          };
        }
        
        throw fetchError; // Diğer hataları dışa ilet
      }
    } catch (err) {
      console.error('Çakışma kontrolünde hata:', err);
      return {
        hasConflict: true,
        message: `Mesai saati kontrolünde bir hata oluştu. Lütfen yöneticinize bildirin.`
      };
    }
  }, []);
  
  // Mesai bitişi çakışmasını yok sayarak randevu oluşturma
  const createServiceIgnoringConflict = useCallback(() => {
    try {
      // Çakışma uyarısını kapat
      setShowShiftEndConflict(false);
      
      // Yeni hizmet modalini aç
      setShowNewServiceModal(true);
    } catch (err) {
      console.error('Hizmet ekleme hatası:', err);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Yeni hizmet eklenirken bir hata oluştu.',
      });
    }
  }, [setShowNewServiceModal, toast]);
  
  // Add new service with memoization
  const addNewService = useCallback(async (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log('DETAYLI LOG - addNewService çağrıldı');
    
    // Prevent default action and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Önemli: Eğer zaten bir modal açıksa, işlemi durduralım
    if (showNewServiceModal) {
      console.log('DETAYLI LOG - Modal zaten açık, yeni istek engellendi');
      return;
    }
    
    // Find customer's latest appointment end time
    const latestEndTime = findLatestAppointmentEndTime();
    const staffId = appointment.staffId || appointment.resourceId;
    
    // Öncelikle çakışma kontrolü yap
    const conflict = await checkForServiceConflict(staffId, latestEndTime);
    
    if (conflict?.hasConflict) {
      // Çakışma varsa uyarı modalini göster
      setConflictMessage(conflict.message);
      setShowShiftEndConflict(true);
    } else {
      // Çakışma yoksa yeni hizmet modalini aç
      setShowNewServiceModal(true);
    }
    
    // Debug log ekleyelim
    console.log('DETAYLI LOG - Yeni hizmet/çakışma kontrolü yapılıyor, müşteri ID:', appointment?.customerId);
  }, [findLatestAppointmentEndTime, appointment?.customerId, appointment?.staffId, appointment?.resourceId, checkForServiceConflict, setConflictMessage, setShowShiftEndConflict, setShowNewServiceModal, showNewServiceModal]);

  // Handle total amount update with memoization
  const handleUpdateTotalAmount = useCallback((newPrice: number) => {
    // Önce standart güncellemeyi yap
    const productSalesData = appointmentModalState.productSales || [];
    updateTotalAmount(newPrice, localAppointments, setCustomPrice, setPaymentAmount, forceRefresh, productSalesData);
    
    // Eğer durum "showed" (Geldi) ise ürünleri de hesaba kat
    if (attendanceStatus === 'showed' && appointment?.customerId) {
      // Ürün satışlarını getir ve toplamı güncelle
      const fetchAndUpdateTotal = async () => {
        try {
          const response = await fetch(`/api/product-sales?customerId=${appointment.customerId}&includeStaff=true`);
          if (response.ok) {
            const productSales = await response.json();
            // Hizmetler ve ürünleri beraber hesaplayarak toplamı güncelle
            const totalPrice = calculateTotalPrice(localAppointments, productSales);
            setCustomPrice(totalPrice.toString());
            setPaymentAmount(totalPrice.toString());
            forceRefresh();
          }
        } catch (error) {
          console.error('Ürün satışlarını getirme hatası:', error);
        }
      };
      
      fetchAndUpdateTotal();
    }
  }, [localAppointments, setCustomPrice, setPaymentAmount, forceRefresh, attendanceStatus, appointment?.customerId]);

  // Event listeners for updates
  useEffect(() => {
    return setupEventListeners({
      open,
      appointment,
      localAppointments,
      setCustomPrice,
      setPaymentAmount,
      forceRefresh,
      appointmentModalState,
      forceUpdate
    });
  }, [open, appointment, localAppointments, setCustomPrice, setPaymentAmount, forceRefresh, appointmentModalState, forceUpdate]);

  // Process content loading with useMemo to minimize rerenders
  useEffect(() => {
    if (open) {
      // First render essential UI components
      setLoadingModalContent(true);
      
      // Clear any previous timeouts to prevent race conditions
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      // Use a shorter timeout for better performance
      loadTimeoutRef.current = setTimeout(() => {
        if (!contentLoadedRef.current) {
          setRenderFullContent(true);
          setLoadingModalContent(false);
          contentLoadedRef.current = true;
          
          // Use the appointmentService to get data instead of direct fetch
          if (appointment && appointment.id) {
            try {
              // Import and use the service instead of direct fetch
              import('@/services/appointmentService').then(({ getAppointmentById }) => {
                getAppointmentById(appointment.id.split('_')[0], true)
                  .then(data => {
                    console.log('Modal açılışında elde edilen veriler:', data);
                    // Tüm randevuların toplamını hesapla
                    let total = 0;
                    if (data._allAppointments && Array.isArray(data._allAppointments)) {
                      data._allAppointments.forEach(apt => {
                        if (apt.service && apt.service.price) {
                          total += parseFloat(apt.service.price);
                        }
                      });
                    }
                    console.log('Modal açılışında hesaplanan toplam tutar:', total);
                    // Toplamı güncelle
                    setCustomPrice(total.toString());
                    setPaymentAmount(total.toString());
                    forceRefresh();
                  });
              });
            } catch (err) {
              console.error('Modal açılışında toplam hesaplama hatası:', err);
            }
          }
        }
      }, 50);
      
      // Cleanup function
      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    } else {
      // Reset state when modal closes for cleaner cleanup
      setRenderFullContent(false);
      contentLoadedRef.current = false;
    }
  }, [open, appointment, setCustomPrice, setPaymentAmount, forceRefresh]);

  // Prevent rendering if appointment is not available
  if (!appointment) return null;

  console.log('👌 AppointmentDetailModal - UI render ediliyor...');

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-[800] appointment-detail-overlay" 
          aria-hidden="true"
        />
      )}
      <Dialog open={open} onOpenChange={handleDialogOpenChange} modal={false}>
        <DialogContent className="sm:max-w-[800px] p-0 max-h-[98vh] bg-white rounded-xl shadow-lg divide-none z-[850]" hideCloseButton={true}>
          <DialogTitle className="sr-only">Randevu Detayları</DialogTitle>
          
          {/* Customer and Date/Time Information - Always render */}
          <ModalHeader 
            appointment={appointment}
            appointmentDate={appointmentDate}
            setAppointmentDate={setAppointmentDate}
            appointmentStartTime={appointmentStartTime}
            setAppointmentStartTime={setAppointmentStartTime}
            appointmentEndTime={appointmentEndTime}
            setAppointmentEndTime={setAppointmentEndTime}
            toast={toast}
            forceUpdate={forceUpdate}
            forceRefresh={forceRefresh}
            onUpdate={onUpdate}
            addNewService={addNewService}
            loading={loading}
          />

          {/* Modal Content Structure */}
          <div className="flex flex-col h-full" style={{ maxHeight: 'calc(98vh - 180px)' }}>
            {/* Main Content Area */}
            {renderFullContent ? (
              <Suspense fallback={<LoadingPlaceholder />}>
                {/* Appointment and Product Lists (scrollable) */}
                <div className="flex-1 overflow-y-auto">
                  {/* Notes Section - Matched with service and staff row width */}
                  <div className={`px-4 pt-3 pb-4 ${isDropdownOpen || editingSaleId ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div style={{ display: 'flex', width: '100%' }}>
                      <div style={{ display: 'flex', width: '100%' }}>
                        <div style={{ flex: '1', width: '100%', maxWidth: 'calc(100% - 40px)' }}>
                          <Suspense fallback={<div className="animate-pulse h-10 bg-gray-100 rounded"></div>}>
                            <NoteEditor
                              notes={notes}
                              setNotes={setNotes}
                              isEditingNotes={isEditingNotes}
                              setIsEditingNotes={setIsEditingNotes}
                              originalNotes={originalNotes}
                              loading={loading}
                              saveNotes={saveNotes}
                            />
                          </Suspense>
                        </div>
                        <div style={{ width: '40px' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Appointments and Products List */}
                  <AppointmentList 
                    appointment={appointment}
                    allAppointments={localAppointments}
                    refreshKey={refreshKey}
                    onUpdate={handleAppointmentDeleted}
                    forceRefresh={forceRefresh}
                    toast={toast}
                    editingAppointmentId={editingAppointmentId}
                    setEditingAppointmentId={setEditingAppointmentId}
                    updateTotalAmount={handleUpdateTotalAmount}
                    addNewService={addNewService}
                    loading={loading}
                    editingSaleId={editingSaleId}
                    setEditingSaleId={setEditingSaleId}
                  />
                </div>
                
                {/* Fixed Payment Section (outside scrollable area) */}
                <div className={`px-4 py-2 border-t border-gray-100 ${isDropdownOpen || editingSaleId ? 'opacity-40 pointer-events-none' : ''}`} ref={modalContentRef}>
                  {/* Payment Section */}
                  <Suspense fallback={<div className="animate-pulse h-8 bg-gray-100 rounded mt-2"></div>}>
                    <PaymentSection 
                      showPaymentSection={showPaymentSection}
                      appointment={{
                        ...appointment,
                        _allAppointments: localAppointments
                      }}
                    />
                  </Suspense>
                </div>
              </Suspense>
            ) : (
              <LoadingPlaceholder />
            )}
          </div>

          {/* Control Buttons - Always render for better UX */}
          <ModalFooter 
            loading={loading}
            attendanceStatus={attendanceStatus}
            handleStatusChange={handleGeldiButtonClick}
            confirmNoShow={confirmNoShow}
            handlePaymentSave={handlePaymentSave}
            setShowCancelConfirm={setShowCancelConfirm}
            isDropdownOpen={isDropdownOpen}
            editingSaleId={editingSaleId}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Components - Only render when needed */}
      {(showCancelConfirm || showNoShowConfirm) && (
        <Dialogs 
          appointment={{...appointment, _allAppointments: localAppointments}}
          showCancelConfirm={showCancelConfirm} 
          setShowCancelConfirm={setShowCancelConfirm}
          showNoShowConfirm={showNoShowConfirm}
          setShowNoShowConfirm={setShowNoShowConfirm}
          handleNoShow={handleNoShow}
          loading={loading}
          setLoading={setLoading}
          onUpdate={onUpdate}
          handleOpenChange={handleOpenChange}
          onOpenChange={onOpenChange} /* Ana modal kapanma fonksiyonu */
          toast={toast}
        />
      )}

      {/* Ödeme Yöntemi Modalı */}
      <PaymentMethodModal
        open={showPaymentMethodModal}
        onOpenChange={setShowPaymentMethodModal}
        onSelectMethod={handleSelectPaymentMethod}
        loading={loading}
      />

      {/* Appointment Edit Modal - Dynamic import for better performance */}
      {showEditModal && (
        <NewAppointmentModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={async () => {
            await onUpdate();
            setShowEditModal(false);
          }}
          appointment={appointment}
        />
      )}

      {/* New Service Modal - LOGLAR ÇOĞALTILDI */}
      {showNewServiceModal && (
        <NewAppointmentModal
          /* Modal her açıldığında aynı key değeri kullanıyoruz, böylece state'ler korunur */
          key={"new-service-modal-" + refreshKey}
          open={showNewServiceModal}
          onOpenChange={(isOpen) => {
            // Modal kapatıldığında
            if (!isOpen) {
              console.log('DETAYLI LOG: Yeni hizmet modalı kapanıyor');
              // Sadece modalın kapanma durumunu güncelle
              setShowNewServiceModal(false);
            }
          }}
          onSuccess={async (newAppointmentData) => {
          console.log('DETAYLI LOG: NEW SERVICE ADDED - onSuccess çağrıldı:', newAppointmentData);
          
          try {
            // ANALİZ: Modalı kapatmadan önce yeni hizmeti doğrudan ekleyelim
            if (newAppointmentData) {
              console.log('DETAYLI LOG: Yeni eklenen hizmet:', newAppointmentData);
              
              // Mevcut randevuları al
              const currentAppointments = [...localAppointments];
              
              // Yeni randevu verilerini düzenleyelim - API formatına uyacak şekilde
              const formattedNewAppointment = {
                ...newAppointmentData,
                id: newAppointmentData.id || `temp_${Date.now()}`,
                title: newAppointmentData.title || newAppointmentData.service?.name || 'Yeni Hizmet',
                start: newAppointmentData.start || newAppointmentData.startTime,
                end: newAppointmentData.end || newAppointmentData.endTime
              };
              
              // Eğer yeni randevu zaten listede yoksa ekleyelim
              if (!currentAppointments.some(app => app.id === formattedNewAppointment.id)) {
                // Yeni randevuyu listeye ekleyelim
                const updatedAppointments = [...currentAppointments, formattedNewAppointment];
                
                // Randevuları tarih sırasına göre sıralayalım
                updatedAppointments.sort((a, b) => {
                  const startTimeA = a.start ? new Date(a.start).getTime() : 0;
                  const startTimeB = b.start ? new Date(b.start).getTime() : 0;
                  return startTimeA - startTimeB;
                });
                
                // DoDğRUDAN GÜNCELLEME: Listeyi güncelleyelim ve UI'ı yenileyelim
                console.log('DETAYLI LOG: localAppointments doğrudan güncelleniyor');
                appointmentModalState.setLocalAppointments(updatedAppointments);
                forceRefresh();
              }
            }
            
            // Şimdi modalı kapatabiliriz
            setShowNewServiceModal(false);
            
            // VE ARKA PLANDA TAM GÜNCELLEME: API çağrıları ve diğer işlemler
            setTimeout(async () => {
              try {
                // Tam veri güncellemesi - önce kalenderi güncelleyelim
                console.log('DETAYLI LOG: Tam veri güncellemesi yapılıyor...');
                await onUpdate();
                
                // Ödeme bölümünü yenileme olayını tetikle
                const paymentEvent = new CustomEvent('force_payment_refresh', {
                  detail: { timestamp: Date.now() }
                });
                document.dispatchEvent(paymentEvent);
                
                // Ancak bu noktada ekstra bir API çağrısı yapalım - daha güvenli
                try {
                  // Ana randevu ID'sini alalım
                  const appointmentId = appointment.id.split('_')[0];
                  const response = await fetch(`/api/appointments/${appointmentId}?includeServices=true`);
                  
                  if (response.ok) {
                    const serverData = await response.json();
                    
                    // Güncel verileri state'e ayarlayalım
                    if (serverData._allAppointments && Array.isArray(serverData._allAppointments)) {
                      console.log('DETAYLI LOG: API verileri alındı, localAppointments güncelleniyor');
                      appointmentModalState.setLocalAppointments([...serverData._allAppointments]);
                      forceRefresh();
                    }
                  }
                } catch (fetchErr) {
                  console.error('API veri çekme hatası:', fetchErr);
                }
              } catch (err) {
                console.error('Güncelleme işlemi sırasında hata:', err);
                toast({
                  title: "Hata",
                  description: "Güncelleme işlemi sırasında bir hata oluştu.",
                  variant: "destructive"
                });
              }
            }, 100);
          } catch (err) {
            console.error('KRITIK HATA:', err);
            toast({
              title: "Hata",
              description: "Bir hata oluştu, lütfen sayfayı yenileyin.",
              variant: "destructive"
            });
          }
          }}
          appointment={null} /* Yeni hizmet eklediğimizde appointment null olmalı */
          defaultCustomerId={appointment.customerId}
          defaultStartTime={findLatestAppointmentEndTime()}
          initialStaffId={appointment.staffId || appointment.resourceId}
          checkShiftEndConflict={true} /* Mesai bitiş saati kontrolünü aktif et */
        />
      )}
      
      {/* Mesai Bitişi Çakışma Uyarısı - Ayrı komponente taşındı */}
      <ShiftEndConflictModal
        open={showShiftEndConflict}
        onOpenChange={setShowShiftEndConflict}
        conflictMessage={conflictMessage}
        onConfirm={createServiceIgnoringConflict}
      />
    </>
  );
}

// Export a memoized version of the component to prevent unnecessary re-renders
export default memo(AppointmentDetailModal);