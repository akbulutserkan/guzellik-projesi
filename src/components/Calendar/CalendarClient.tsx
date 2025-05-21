'use client'

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Calendar, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import NewAppointmentModalNew from '@/components/appointments/NewAppointmentModal';
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal';
import '@/styles/calendar.css';
import { Appointment, Staff } from '@/types/appointment';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/utility/useIsMobile';
import { 
  useCalendarManagement, 
  UseCalendarManagementOptions
} from '@/hooks/calendar/useCalendarManagement';
import { ViewMode } from '@/types/calendar';
import { 
  Views, 
  ResponsiveToolbar 
} from './components/ResponsiveToolbar';
import { TimeSlotWrapper } from './components/TimeSlotWrapper';
import { LoadingSpinner } from './components/LoadingSpinner';
import { 
  formatEventStyle, 
  formatTimeRange,
  formatDayProps,
  formatSlotProps,
  determineTimeSlotType,
  DAY_NAMES
} from '@/utils/calendar/formatters';
import { localizer } from './utils/localizer';


dayjs.extend(isBetween);

const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarClientProps {
  options?: UseCalendarManagementOptions;
}

const CalendarClient = ({ options = {} }: CalendarClientProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [appointmentsForModal, setAppointmentsForModal] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [modalCloseTimerId, setModalCloseTimerId] = useState<NodeJS.Timeout | null>(null);

  // Merkezi hook ile takvim verilerini yönet
  const {
    staff,
    events,
    loading,
    error,
    businessHours,
    selectedDate: currentDate,
    setSelectedDate: setCurrentDate,
    selectedEvent,
    setSelectedEvent,
    viewMode: currentView,
    setViewMode: setCurrentView,
    fetchCalendarData,
    updateEventAfterDrag,
    getEventDetails,
    getCustomerEvents,
    refreshCalendar,
    checkAvailability,
    canCreate,
    canUpdate,
    navigateToDate,
    navigateNext,
    navigatePrevious,
    navigateToToday
  } = useCalendarManagement({
    initialDate: options.initialDate || new Date(),
    initialView: options.initialView || ViewMode.DAY,
    defaultFilters: options.defaultFilters || {},
    refreshInterval: 30000, // 30 saniyede bir yenile
    forceInitialLoad: options.forceInitialLoad || true
  });

  // Zamanlayıcıyı temizle
  useEffect(() => {
    return () => {
      if (modalCloseTimerId) {
        clearTimeout(modalCloseTimerId);
      }
    };
  }, [modalCloseTimerId]);

  // Modal durumunu değiştirme yardımcı fonksiyonu
  const handleModalStateChange = useCallback((isOpen: boolean, isCurrentlyOpen: boolean, setModalState: (state: boolean) => void) => {
    // Modal kapanırken
    if (!isOpen && isCurrentlyOpen) {
      // Önce kapanıyor olarak işaretle
      setIsModalClosing(true);
      
      // Modalı kapat
      setModalState(false);
      
      // Eski zamanlayıcıyı temizle
      if (modalCloseTimerId) {
        clearTimeout(modalCloseTimerId);
      }
      
      // 300ms sonra takvime tıklamayı tekrar aktif et
      const timerId = setTimeout(() => {
        setIsModalClosing(false);
      }, 300);
      
      // Zamanlayıcı ID'sini kaydet
      setModalCloseTimerId(timerId);
    } else {
      // Normal açılma durumu
      setModalState(isOpen);
    }
  }, [modalCloseTimerId]);

  // personel listesi ön işleme - sadece takvimde gösterilecekleri göster
  const processedStaff = useMemo(() => staff.filter(s => s.showInCalendar), [staff]);

  // İş saatlerinden min ve max zamanları hesapla
  const [minTime, maxTime] = useMemo(() => {
    // Varsayılan değerler
    const defaultMinStart = '09:00';
    const defaultMaxEnd = '19:00';
    
    if (!businessHours) {
      return formatTimeRange(defaultMinStart, defaultMaxEnd);
    }
    
    // En erken başlangıç ve en geç bitiş saatlerini hesapla
    let minStart = defaultMinStart;
    let maxEnd = defaultMaxEnd;
    
    Object.entries(businessHours).forEach(([day, settings]: [string, any]) => {
      if (settings && settings.enabled) {
        if (settings.start && settings.start < minStart) {
          minStart = settings.start;
        }
        if (settings.end && settings.end > maxEnd) {
          maxEnd = settings.end;
        }
      }
    });
    
    console.log(`Min ve max saatler hesaplandı: ${minStart} - ${maxEnd}`);
    return formatTimeRange(minStart, maxEnd);
  }, [businessHours]);

  // Slot seçimi işleyicisi
  const handleSelectSlot = useCallback((slot: SlotInfo) => {
    // Eğer modal kapanıyorsa veya oluşturma yetkisi yoksa, slot seçimini engelle
    if (isModalClosing || !canCreate) {
      if (!canCreate) {
        toast({
          title: "Yetki Hatası",
          description: "Randevu oluşturma yetkiniz bulunmuyor.",
          variant: "destructive"
        });
      } else {
        console.log('Modal kapanıyor, slot seçimi engellendi');
      }
      return;
    }
    
    // Seçilen zamanın gün ve saat bilgilerini al - saat dilimi farkını düzenle
    const slotTime = moment(slot.start);
    // UTC saati yerine yerel saate çevir
    const timeStr = slotTime.local().format('HH:mm');
    // Yerel saat dilimine göre gün al
    const day = slotTime.local().day();
    const dayName = DAY_NAMES[day];
    
    try {
      // İşletme çalışma saatleri kontrolü
      const dayHours = businessHours?.[dayName];
      console.log(`Seçilen slot: ${timeStr}, Gün: ${dayName}, Çalışma Saatleri:`, dayHours);
      
      // Daha detaylı debug logları ekle
      const rawSlotTime = moment(slot.start).format('HH:mm');
      const localSlotTime = moment(slot.start).local().format('HH:mm');
      console.log('UTC saat:', rawSlotTime, 'Yerel saat:', localSlotTime, 'Kullanılan:', timeStr);
      
      // İşletme çalışma saatleri dışındaysa işlem yapma - Moment nesneleri kullanarak düzgün karşılaştırma
      const isBeforeStart = dayHours?.start && moment(timeStr, 'HH:mm').isBefore(moment(dayHours.start, 'HH:mm'));
      const isAfterEnd = dayHours?.end && moment(timeStr, 'HH:mm').isAfter(moment(dayHours.end, 'HH:mm'));
      const isDisabled = !dayHours?.enabled;
      
      console.log('Karşılaştırma sonucu:', {
        isDisabled,
        isBeforeStart,
        isAfterEnd,
        startHour: dayHours?.start,
        endHour: dayHours?.end
      });
      
      if (isDisabled || isBeforeStart || isAfterEnd) {
        toast({
          title: "İşletme Çalışma Saatleri Dışında",
          description: `Seçilen zaman dilimi işletme çalışma saatleri dışındadır. Çalışma saatleri: ${dayHours?.start || '09:00'} - ${dayHours?.end || '19:00'}`,
          variant: "destructive"
        });
        return;
      }
      
      // Randevu oluşturma işlemine devam et
      setSelectedSlot(slot);
      setCurrentDate(slot.start);
      setShowModal(true);
      
    } catch (error) {
      console.error("Randevu oluşturma sırasında bir hata oluştu:", error);
      
      // Hata olsa bile modalı göster - kritik işlevi korumak için
      setSelectedSlot(slot);
      setCurrentDate(slot.start);
      setShowModal(true);
    }
    
  }, [isModalClosing, businessHours, toast, canCreate, setCurrentDate]);
  
  // Seçim işlemine devam etme yardımcı fonksiyonu - İlerde tekrar kullanılabilir (ARTIK KULLANILMIYOR)
  const continueSlotSelection = useCallback((slot: SlotInfo) => {
  console.log('Slot seçim fonksiyonu - kullanımdan kaldırıldı');
  // NOT: Bu fonksiyon sadece geriye dönük uyumluluk için korunuyor
  // Slot seçim mantığı, tüm hataları önlemek için handleSelectSlot içine taşındı
  }, []);
  
  const handleSelectEvent = useCallback(async (event: Appointment) => {
    try {
      // Önce yükleme durumunu göster
      setSelectedEvent(null);
      setAppointmentsForModal([]);
      setShowDetailModal(true);
      
      // Servis kullanarak güncel randevu bilgilerini al
      const currentEvent = await getEventDetails(event.id);
      
      // Tarih bilgisini al
      const eventDate = new Date(currentEvent.start || currentEvent.startTime);
      
      // Müşteri ID'si varsa, aynı müşterinin diğer randevularını da al
      if (currentEvent.customer?.id || currentEvent.customerId) {
        const customerId = currentEvent.customer?.id || currentEvent.customerId;
        
        // Servis kullanarak müşterinin diğer randevularını al
        const customerAppointments = await getCustomerEvents(customerId, eventDate);
        
        // Seçtiğimiz randevuyu vurgulamak için
        const updatedAppointments = customerAppointments.map(apt => {
          if (apt.id === currentEvent.id) {
            return currentEvent;
          }
          return apt;
        });
        
        setAppointmentsForModal(updatedAppointments);
        setSelectedEvent(currentEvent);
      } else {
        // Eğer müşteri ID'si yoksa sadece güncel randevu bilgisini göster
        setAppointmentsForModal([currentEvent]);
        setSelectedEvent(currentEvent);
      }
      
    } catch (error) {
      console.error('Randevu detayları getirme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Randevu detayları alınırken bir hata oluştu.'
      });
      
      // Hata durumunda, lokal events listesindeki veriyi göster
      const localEvent = events.find(e => e.id === event.id) || event;
      setAppointmentsForModal([localEvent]);
      setSelectedEvent(localEvent);
    }
    
  }, [events, toast, getEventDetails, getCustomerEvents, setSelectedEvent]);

  // Personel listesi için memoization
  const memoizedStaff = useMemo(() => {
    console.log('MemoizedStaff', 'Personel listesi hazırlanıyor', { count: processedStaff.length });
    return processedStaff;
  }, [processedStaff]);
  
  // Events memorization
  const memoizedEvents = useMemo(() => {
    console.log('MemoizedEvents', 'Takvim olayları hazırlanıyor');
    console.log('MemoizedEvents events:', events);
    return events;
  }, [events]);

  if (loading && staff.length === 0) return <LoadingSpinner />;

  if (error) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <p className="text-red-500 max-w-md text-center">{error}</p>
      <button
        onClick={() => refreshCalendar()}
        className="px-4 py-2 bg-calendar-primary text-white rounded hover:bg-calendar-primary-dark transition-colors"
      >
        Yeniden Dene
      </button>
    </div>
  );

  return (
    <div className="calendar-container h-full p-2 pt-0">
      <DragAndDropCalendar
        localizer={localizer}
        formats={{
          timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
        }}
        showMultiDayTimes={true}
        events={memoizedEvents}
        resources={memoizedStaff}
        resourceIdAccessor={resourceIdAccessor}
        resourceTitleAccessor={resourceTitleAccessor}
        startAccessor={(event) => event.start ? new Date(event.start) : new Date()}
        endAccessor={(event) => event.end ? new Date(event.end) : new Date()}
        views={[Views.DAY, Views.WEEK, Views.MONTH]}
        view={currentView as any} // ViewMode'dan View'a dönüşüm için
        onView={setCurrentView}
        date={currentDate}
        onNavigate={navigateToDate}
        selectable
        resizable
        draggableAccessor={() => true}
        onEventDrop={updateEventAfterDrag}
        onEventResize={updateEventAfterDrag}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        dayPropGetter={formatDayProps}
        slotPropGetter={formatSlotProps}
        className="custom-calendar shadow-lg rounded-lg overflow-hidden"
        eventPropGetter={formatEventStyle}
        min={minTime}
        max={maxTime}
        rtl={false}
        showAllEvents={true}
        step={15}
        timeslots={isMobile ? 2 : 1}
        components={{
          toolbar: (props) => (
            <ResponsiveToolbar
              isMobile={isMobile}
              {...props}
              onView={setCurrentView}
              view={currentView as any}
              navigateToToday={navigateToToday}
              navigateNext={navigateNext}
              navigatePrevious={navigatePrevious}
            />
          ),
          timeSlotWrapper: (timeSlotProps) => {
            // value ve children prop'larını açıkça timeSlotProps'dan çıkartıyoruz
            const { value, children } = timeSlotProps;
            return (
              <TimeSlotWrapper 
                value={value}
                children={children}
                businessHours={businessHours}
                staff={staff}
              />
            );
          }
        }}
        messages={{
          showMore: (total) => `+${total} daha`,
          noEventsInRange: 'Bu aralıkta randevu bulunmamaktadır.'
        }}
      />
      
      <NewAppointmentModalNew
        open={showModal}
        onOpenChange={(isOpen) => handleModalStateChange(isOpen, showModal, setShowModal)}
        onSuccess={async () => {
          await refreshCalendar(); // Takvimi yenile
          setShowModal(false);
        }}
        initialDate={selectedSlot ? selectedSlot.start : new Date()}
        // Takvimde tıklanan personel ID'sini mümkünse kullan, yoksa ilk aktif personeli kullan
        initialStaffId={
          // Eğer slot'ta resourceId varsa ve personel listesinde geçerli bir ID ise kullan
          selectedSlot?.resourceId && processedStaff.some(s => s.id === selectedSlot.resourceId)
            ? selectedSlot.resourceId.toString() 
            // Değilse ve personel listesi doluysa ilk personeli seç
            : (processedStaff.length > 0 ? processedStaff[0].id : '')
        }
      />

      <AppointmentDetailModal
        open={showDetailModal}
        onOpenChange={(isOpen) => handleModalStateChange(isOpen, showDetailModal, setShowDetailModal)}
        appointment={selectedEvent}
        allAppointments={appointmentsForModal}
        onUpdate={async () => {
          await refreshCalendar();
        }}
      />
    </div>
  );
};

// Staff için access fonksiyonları
const resourceIdAccessor = (resource: any) => resource.id;
// Personel isimlerini göstermek için açık renk kullan
const resourceTitleAccessor = (resource: any) => {
  return <span style={{color: '#000', fontWeight: 'bold'}}>{resource.name}</span>;
};

export default React.memo(CalendarClient);
