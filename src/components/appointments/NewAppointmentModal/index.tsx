'use client';

import { useState, useEffect, useMemo, Suspense, lazy, memo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from 'lucide-react';

// Doğrudan import et - bunlar her zaman gerekli
import FormActions from './components/FormActions';
import FormError from './components/FormError';
import CustomerSelector from './CustomerSelector';
import AppointmentDateTime from './AppointmentDateTime';

// Bu bileşenleri önden yükle ama gecikmeli olarak monte et (lazy mount)
const StaffSelector = lazy(() => import('./StaffSelector'));
const ServiceSelector = lazy(() => import('./ServiceSelector'));
const NotesField = lazy(() => import('./components/NotesField'));
const Dialogs = lazy(() => import('./Dialogs'));

// API ve veri önbelleği 
import { preloadAppointmentData } from './services/dataPreloader';
import { useAppointmentForm } from './hooks/useAppointmentForm';
import { useAppointmentSubmit } from './hooks/useAppointmentSubmit';
import { findFirstAvailableSlot } from './utils/timeSlotUtils';
import { addMinutes } from 'date-fns';

import { createAppointment } from '@/services/appointmentService';

// Event bus'ı import et (önemli - ana modal'ı yeni randevular hakkında bilgilendirmek için)
import { AppointmentEventBus } from '../AppointmentDetailModal/hooks/useAppointmentModal';

// Yükleme göstergesi
const LoadingPlaceholder = memo(() => (
  <div className="w-full h-12 bg-gray-100 rounded animate-pulse"></div>
));

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (appointmentData?: any) => void;
  initialDate?: Date;
  initialStaffId?: string;
  appointment?: any;
  defaultCustomerId?: string;
  defaultStartTime?: string;
  checkShiftEndConflict?: boolean; // Varsayılan olarak kapalı
}

function NewAppointmentModalNew({
  open,
  onOpenChange,
  onSuccess,
  initialDate,
  initialStaffId,
  appointment,
  defaultCustomerId,
  defaultStartTime,
  checkShiftEndConflict = false, // Varsayılan olarak kapalı
}: NewAppointmentModalProps) {
  console.log("Modal Props", {
    appointment,
    defaultCustomerId,
    defaultStartTime,
    initialStaffId
  });
  
  const { toast } = useToast();
  
  // Çift gönderim için ref
  const isSubmittingRef = useRef(false);
  
  // Çakışma mesajları ve işlem durumu için state
  const [hasConflict, setHasConflict] = useState(false);
  const [autoFindingTime, setAutoFindingTime] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Çakışma onay modalı ve zorla kayıt durumları
  const [showConflictConfirmation, setShowConflictConfirmation] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  
  // Modal açılmadan önce verileri yükle
  useEffect(() => {
    // Sayfa yüklenince hemen modal verilerini arka planda hazırla
    const preloadTimer = setTimeout(() => {
      preloadAppointmentData();
    }, 1000); // Sayfa yüklendikten 1 saniye sonra verileri hazırla
    
    return () => {
      clearTimeout(preloadTimer);
    };
  }, []);
  
  // Hook çağrısını öne alıyoruz ve formData'yı burada tanımlıyoruz
  // Form verilerini yönet
  console.log('👀 NewAppointmentModal - useAppointmentForm hook çağrılıyor, defaultCustomerId:', defaultCustomerId);
  const formState = useAppointmentForm({
    open,
    initialDate,
    initialStaffId,
    appointment,
    defaultCustomerId,
    defaultStartTime
  });

  const { 
    error,
    setError,
    staff,
    availableServices,
    customerSearch,
    setCustomerSearch,
    filteredCustomers,
    serviceSearch,
    setServiceSearch,
    filteredServices,
    formData,
    setFormData,
    showWorkingHoursWarning,
    setShowWorkingHoursWarning,
    setIsWorkingHoursValid,
    handleCustomerSelect,
    handleServiceSelect,
    handleServiceInputFocus,
    allServices,
    validateForm
  } = formState;

  // Modal açıldığında daha hızlı erişim için verileri önceden hazırla
  useEffect(() => {
    if (open) {
      // Modal açıldığında hemen veri yüklemeyi başlat
      preloadAppointmentData();
      setHasConflict(false);
      setShowConflictConfirmation(false);
      setAutoFindingTime(false);
      setCreatedAppointment(null);
      setCreationSuccess(false);
      
      // initialStaffId kontrolü hakkında log
      if (initialStaffId) {
        console.log("Modal açıldığında initialStaffId:", initialStaffId);
      }
    }
  }, [open, initialStaffId]);
  
  // initialStaffId değiştiğinde form verisini güncelle
  // formData artık yukarıda tanımlı olduğu için güvenle kullanabiliriz
  useEffect(() => {
    if (initialStaffId && initialStaffId.trim() !== '') {
      console.log("initialStaffId değişti, formData güncelleniyor:", initialStaffId);
      
      setFormData(prev => ({
        ...prev,
        staffId: initialStaffId
      }));
    }
  }, [initialStaffId, setFormData]);

  // NOT: Event Bus mekanizması devre dışı bırakıldı - çift ekleme sorununu önlemek için
  // Bu fonksiyon yerine artık direkt olarak onSuccess kullanılıyor

  // Çakışma olsa bile randevuyu zorla kaydetme işlevi
  const handleForceSubmitWithConflict = useCallback(async () => {
    // Çift gönderim kontrolü
    if (isSubmittingRef.current) {
      console.log('Zaten bir zorla kayıt işlemi devam ediyor, yeni istek engellendi');
      return;
    }

    try {
      isSubmittingRef.current = true; // İşlem başladı
      console.log('handleForceSubmitWithConflict çağrıldı');
      console.log('Mevcut formData:', JSON.stringify(formData));
      console.log('Hizmet ID:', formData.serviceId);
      
      setLoading(true);
      setError("");
      
      const selectedService = allServices.find(s => s.id === formData.serviceId);
      if (!selectedService) {
        throw new Error("Hizmet bilgisi bulunamadı");
      }
      
      console.log('Seçilen hizmet:', selectedService.name);
      
      // Çakışma mesajından önerilen saati çıkar
      let startTime = new Date(formData.startTime);
      
      // Eğer önerilen bir saat varsa, mesajdan al ve kullan
      if (conflictMessage && conflictMessage.includes("saatine eklenebilir")) {
        const timeMatch = conflictMessage.match(/([0-9]{1,2}:[0-9]{2}) saatine/);
        if (timeMatch && timeMatch[1]) {
          // Saati ayarla (HH:MM formatından)
          const [hours, minutes] = timeMatch[1].split(':').map(Number);
          startTime = new Date(startTime); // Mevcut tarihi korur, sadece saati değiştirir
          startTime.setHours(hours, minutes, 0, 0);
          console.log('Önerilen saat kullanılıyor:', timeMatch[1]);
          console.log('Yeni startTime:', startTime);
        }
      }
      
      const endTime = addMinutes(startTime, selectedService.duration || 60);
      console.log('Hesaplanan endTime:', endTime);

      // Randevu verisi oluştur
      const appointmentData = {
        ...formData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        forceCreate: true // Çakışma kontrolünü atla
      };

      console.log('Zorla oluşturulacak randevu verisi:', JSON.stringify(appointmentData));
      
      // Randevuyu zorla oluştur - yeni servis API'si formatına uygun şekilde çağrı yapıyoruz
      const response = await createAppointment(appointmentData);
      console.log('Zorla randevu oluşturma yanıtı:', response);

      // Başarı mesajı göster
      toast({
        title: "Randevu Oluşturuldu",
        description: `Randevu ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')} saatinde başarıyla oluşturuldu.`,
        variant: "success"
      });

      // Oluşturulan randevu verisini UI'a gönder
      await onSuccess(response);

      // Yeni randevu verisini zenginleştir - Event Bus kullanmadan
      const enrichedData = {
        ...response,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        service: selectedService
      };
      
      // Event bus devre dışı bırakıldı (bug sebebiyle)
      // Doğrudan onSuccess'e veriyi iletiyoruz

      // Formu temizle ve modalı kapat
      setFormData({
        customerId: "",
        serviceId: "",
        staffId: "",
        startTime: "",
        notes: "",
      });
      setCustomerSearch("");
      setServiceSearch("");
      setHasConflict(false);
      setShowConflictConfirmation(false);
      
      // Başarı durumunu göster
      setCreatedAppointment({
        startTime: startTime,
        serviceTitle: selectedService.name,
        endTime: endTime
      });
      setCreationSuccess(true);

    } catch (error: any) {
      console.error("Zorla randevu oluşturma hatası:", error);
      setError(error?.message || "Randevu oluşturulurken bir hata meydana geldi");
      toast({
        title: "Hata",
        description: error?.message || "Randevu oluşturulurken bir hata meydana geldi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false; // İşlem tamamlandı
    }
  }, [formData, allServices, toast, onSuccess, onOpenChange, setCustomerSearch, setServiceSearch, setFormData, setHasConflict, setError, setLoading, conflictMessage]);

  // Çakışma durumunda otomatik olarak müsait zaman bulma ve direkt randevu oluşturma
  const handleAutoFindTime = async () => {
    // Çift gönderim kontrolü
    if (isSubmittingRef.current) {
      console.log('Zaten bir müsait saat arama işlemi devam ediyor, yeni istek engellendi');
      return;
    }

    if (!formData.staffId || !formData.serviceId || !formData.customerId) {
      setError("Lütfen önce tüm alanları doldurun");
      return;
    }
    
    try {
      isSubmittingRef.current = true; // İşlem başladı
      setAutoFindingTime(true);
      setError("");
      setCreationSuccess(false);
      setCreatedAppointment(null);
      
      // Şu anki seçili zamanı al
      const startTime = new Date(formData.startTime || new Date());
      
      console.log("Bir sonraki müsait zaman aranıyor...");
      console.log("Başlangıç zamanı:", startTime.toISOString());
      console.log("Personel ID:", formData.staffId);
      console.log("Hizmet ID:", formData.serviceId);
      
      // Sonraki müsait zamanı bul
      const nextAvailableTime = await findFirstAvailableSlot(
        formData.staffId, 
        formData.serviceId, 
        startTime, 
        allServices
      );
      
      if (nextAvailableTime) {
        console.log("Müsait zaman bulundu:", nextAvailableTime.toISOString());
        
        // Seçilen hizmeti bul ve süresini hesapla
        const selectedService = allServices.find(s => s.id === formData.serviceId);
        if (!selectedService) {
          throw new Error("Hizmet bilgisi bulunamadı");
        }
        
        const serviceDuration = selectedService.duration || 60;
        const endTime = addMinutes(nextAvailableTime, serviceDuration);
        
        console.log("Hizmet süresi:", serviceDuration, "dakika");
        console.log("Bitiş zamanı:", endTime.toISOString());
        
        // Bulunan zamanı formda güncelle (görsel geribildirim için)
        const formattedTime = nextAvailableTime.toISOString().slice(0, 16);
        setFormData(prev => ({
          ...prev,
          startTime: formattedTime
        }));
        
        // Direkt olarak randevu oluştur
        const appointmentData = {
          ...formData,
          startTime: nextAvailableTime.toISOString(),
          endTime: endTime.toISOString()
        };
        
        console.log("Randevu oluşturuluyor:", appointmentData);
        
        // Randevuyu yeni API servis formatına uygun şekilde oluştur
        const createdData = await createAppointment(appointmentData);
        
        // Oluşturulan randevu verisini zenginleştir
        const enrichedAppointmentData = {
          ...createdData,
          startTime: nextAvailableTime,
          start: nextAvailableTime.toISOString(),
          endTime: endTime,
          end: endTime.toISOString(),
          serviceTitle: selectedService.name,
          service: selectedService,
          customer: { name: customerSearch },
          customerId: formData.customerId,
          staffId: formData.staffId,
          resourceId: formData.staffId,
          status: 'CONFIRMED'
        };
        
        // BUG: Event bus mekanizması çift ekleme hatasına neden oluyor - tamamen kaldırıldı
        // Bunun yerine direkt olarak onSuccess kullanılıyor
        
        // Oluşturulan randevu bilgisini kaydet ve başarı durumunu ayarla
        setCreatedAppointment({
          ...enrichedAppointmentData,
          startTime: nextAvailableTime,
          serviceTitle: selectedService.name,
          endTime: endTime
        });
        setCreationSuccess(true);
        
        // Başarı mesajı göster
        toast({
          title: "Randevu Oluşturuldu",
          description: `Randevu ${nextAvailableTime.getHours().toString().padStart(2, '0')}:${nextAvailableTime.getMinutes().toString().padStart(2, '0')} saatinde başarıyla oluşturuldu.`,
          variant: "success"
        });
        
        // Takvimi arka planda yenile (modal kapanmadan)
        onSuccess();
        
        // Modal içinde başarı durumunu göster
        setHasConflict(false);
        setAutoFindingTime(false);
      } else {
        setAutoFindingTime(false);
        setError("Bugün için müsait zaman bulunamadı. Lütfen farklı bir gün deneyin.");
      }
    } catch (err: any) {
      console.error("Müsait zaman bulunurken hata oluştu:", err);
      setAutoFindingTime(false);
      
      // Boş saat bulunamadı ve alternatif zaman önerisi var mı kontrol et
      if (err.message && err.message.includes("Personelin boş saati bulunamadı. Önerilen zaman:")) {
        // Önerilen zamanı al
        const proposedTimeMatch = err.message.match(/Önerilen zaman: ([0-9:]+)/);
        const proposedTime = proposedTimeMatch ? proposedTimeMatch[1] : null;
        
        if (proposedTime) {
          // Çakışma modalını göster ve önerilen zamanı belirt
          setConflictMessage(`Personelin boş saati yok. Yeni hizmet ${proposedTime} saatine eklenebilir. Onaylıyor musunuz?`);
          setShowConflictConfirmation(true);
          setHasConflict(true);
          return;
        }
      }
      
      // Diğer hatalar için normal hata mesajını göster
      setError(err?.message || "Müsait zaman araması sırasında bir hata oluştu");
    } finally {
      isSubmittingRef.current = false; // İşlem tamamlandı
    }
  };

  // Çakışma tespit edildiğinde direkt dialog aç
  useEffect(() => {
    if (hasConflict && !showConflictConfirmation && !creationSuccess) {
      setConflictMessage(error || 'Seçtiğiniz saatte bir çakışma bulunmaktadır. Seçilen personel için bu saatte başka bir randevu var veya mesai bitiş saatine denk geliyor.');
      setShowConflictConfirmation(true);
    }
  }, [hasConflict, showConflictConfirmation, creationSuccess, error]);

  // Form gönderme işlemlerini yönet
  console.log('👀 NewAppointmentModal - useAppointmentSubmit hook çağrılıyor...');
  const submitState = useAppointmentSubmit({
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
    setHasConflict,
    setShowConflictConfirmation,
    setConflictMessage,
    // enrichAndPublishAppointment kaldırıldı - artık kullanılmıyor
    checkShiftEndConflict
  });

  const { handleSubmit } = submitState;
  
  // Modal yüklenme işlemi tamamlandığında çağrılacak fonksiyon
  // NOT: Çakışma kontrolü yapılmayacak, bu kontrol AppointmentDetailModal içinde yapılacak

  // Modal başlığını optimize et
  const dialogTitle = useMemo(() => {
    console.log('👀 NewAppointmentModal - Modal başlığı hesaplanıyor, appointment ID:', appointment?.id);
    if (appointment) return "Randevu Düzenle";
    if (defaultCustomerId) return "Yeni Hizmet";
    return "Yeni Randevu Oluştur";
  }, [appointment, defaultCustomerId]);

// Handle dialog open state change with optimized performance
  const handleDialogOpenChange = useCallback((isOpen: boolean) => {
    console.log('👀 NewAppointmentModal - handleDialogOpenChange çağrıldı, isOpen:', isOpen);
    // Eğer mesai saati çakışması varsa modalın kapanmasını engelle
    if (!isOpen && hasConflict) {
      console.log('Modal kapanması engellendi: Çakışma uyarısı var');
      return; // Modalı açık tutmak için erken dön
    }
    
    if (open && !isOpen) {
      onOpenChange(false);
    } else if (!open && isOpen) {
      onOpenChange(true);
    }
  }, [open, onOpenChange, hasConflict]);

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-[60] new-appointment-overlay" 
          aria-hidden="true"
        />
      )}
      <Dialog open={open} onOpenChange={handleDialogOpenChange} modal={false}>
        <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] bg-white rounded-lg shadow-lg z-[80]" style={{zIndex: 80}} hideCloseButton={true}>
          <DialogHeader className="px-6 py-4 sticky top-0 bg-white z-10">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
            {/* Hata mesajını göster */}
            <FormError error={error} />
            
            {/* Başarı mesajı - randevu oluşturulduğunda */}
            {creationSuccess && createdAppointment && (
              <Alert className="mb-4 bg-green-50 border-green-100">
                <AlertDescription className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex flex-col">
                    <p className="font-medium text-green-700">Randevu başarıyla oluşturuldu!</p>
                    <p className="text-sm text-green-600">
                      <span className="font-medium">{createdAppointment.serviceTitle}</span> hizmeti için{' '}
                      <span className="font-medium">
                        {createdAppointment.startTime.getHours().toString().padStart(2, '0')}:
                        {createdAppointment.startTime.getMinutes().toString().padStart(2, '0')}
                      </span>{' '}
                      saatinde randevu oluşturuldu.
                    </p>
                    <button 
                      className="mt-2 text-sm bg-white text-green-600 border border-green-200 py-1 px-4 rounded hover:bg-green-50"
                      onClick={() => onOpenChange(false)}
                    >
                      Kapat
                    </button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Çakışma durumunu doğrudan dialog olarak göster, modal içinde gösterme */}
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Müşteri Seçici - doğrudan yükle, en önemli bileşen */}
                <CustomerSelector 
                  customerSearch={customerSearch}
                  setCustomerSearch={setCustomerSearch}
                  formData={formData}
                  setFormData={setFormData}
                  filteredCustomers={filteredCustomers}
                  handleCustomerSelect={handleCustomerSelect}
                  defaultCustomerId={defaultCustomerId}
                />

                {/* Tarih/Saat Seçici - doğrudan yükle, form için kritik */}
                <AppointmentDateTime 
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>

              {/* Personel Seçici - gecikmeli yükle ama hızlı göster */}
              <Suspense fallback={<LoadingPlaceholder />}>
                <StaffSelector 
                  formData={formData}
                  setFormData={setFormData}
                  staff={staff}
                  appointment={appointment}
                  initialStaffId={initialStaffId}
                />
              </Suspense>

              {/* Hizmet Seçici - gecikmeli yükle */}
              <Suspense fallback={<LoadingPlaceholder />}>
                <ServiceSelector 
                  serviceSearch={serviceSearch}
                  setServiceSearch={setServiceSearch}
                  formData={formData}
                  setFormData={setFormData}
                  filteredServices={filteredServices}
                  handleServiceSelect={handleServiceSelect}
                  handleServiceInputFocus={handleServiceInputFocus}
                  availableServices={availableServices}
                />
              </Suspense>

              {/* Notlar alanı - sadece yeni hizmet eklenmiyorsa göster */}
              {!defaultCustomerId && (
                <Suspense fallback={<LoadingPlaceholder />}>
                  <NotesField formData={formData} setFormData={setFormData} />
                </Suspense>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-white sticky bottom-0 z-10">
            {creationSuccess ? (
              <button 
                onClick={() => onOpenChange(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
              >
                Kapat
              </button>
            ) : (
              <FormActions 
                handleSubmit={handleSubmit}
                loading={loading}
                appointment={appointment}
                defaultCustomerId={defaultCustomerId}
              />
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Çalışma Saatleri Uyarı Dialoğu - sadece gerektiğinde göster */}
      {showWorkingHoursWarning && (
        <Suspense fallback={null}>
          <Dialogs 
            showWorkingHoursWarning={showWorkingHoursWarning}
            setShowWorkingHoursWarning={setShowWorkingHoursWarning}
            setIsWorkingHoursValid={setIsWorkingHoursValid}
            handleSubmit={handleSubmit}
          />
        </Suspense>
      )}

      {/* Çakışma Onay Dialoğu */}
      {showConflictConfirmation && (
        <Suspense fallback={null}>
          <Dialogs 
            showWorkingHoursWarning={false}
            setShowWorkingHoursWarning={setShowWorkingHoursWarning}
            setIsWorkingHoursValid={setIsWorkingHoursValid}
            handleSubmit={handleSubmit}
            showConflictConfirmation={showConflictConfirmation}
            setShowConflictConfirmation={setShowConflictConfirmation}
            handleForceSubmitWithConflict={handleForceSubmitWithConflict}
            conflictMessage={conflictMessage}
          />
        </Suspense>
      )}
    </>
  );
}

// Bileşeni memoize et
export default memo(NewAppointmentModalNew);