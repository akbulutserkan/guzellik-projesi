'use client';

import { useState, useCallback, useEffect } from 'react';
import { Staff, Appointment } from '@/types/appointment';
import moment from 'moment';
import { getCalendarData, getBusinessHours } from '@/services/calendarService';
import {
  CalendarViewOptions,
  ViewMode,
  CalendarFilter
} from '@/types/calendar';
import { useCalendarUI } from './useCalendarUI';

export interface UseCalendarDataOptions {
  initialDate?: Date;
  initialView?: ViewMode;
  refreshInterval?: number;
  forceInitialLoad?: boolean;
  defaultFilters?: CalendarFilter;
}

export interface UseCalendarDataResult {
  staff: Staff[];
  events: Appointment[];
  loading: boolean;
  error: string | null;
  businessHours: any;
  updating: boolean;
  fetchCalendarData: (force?: boolean) => Promise<void>;
  refreshCalendar: () => Promise<void>;
  fetchBusinessHours: (force?: boolean) => Promise<any>;
}

/**
 * Takvim verilerini yöneten hook
 */
export const useCalendarData = (
  options: UseCalendarDataOptions = {},
  selectedDate: Date,
  viewMode: ViewMode,
  filters: CalendarFilter
): UseCalendarDataResult => {
  // UI hook'unu kullan
  const { showErrorToast } = useCalendarUI();
  
  // Temel state'ler
  const [staff, setStaff] = useState<Staff[]>([]);
  const [events, setEvents] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<any>(null);
  
  // İş saatlerini getir
  const fetchBusinessHours = useCallback(async (force = false) => {
    try {
      const result = await getBusinessHours(force);
      if (!result.success) {
        throw new Error(result.error || 'İş saatleri alınırken bir hata oluştu');
      }
      setBusinessHours(result.data);
      return result.data;
    } catch (err) {
      console.error('İş saatleri alınırken hata oluştu:', err);
      showErrorToast('İş saatleri alınırken bir hata oluştu');
      return null;
    }
  }, [showErrorToast]);

  // Takvim verilerini getir
  const fetchCalendarData = useCallback(async (force = false) => {
    // Performans ölçümü başlat
    const startTime = performance.now();
    console.log('[useCalendarData] Takvim verileri getiriliyor (force:', force, ')');
    
    // İşlem güvenliği
    const isSafeToLoad = !updating;
    
    if (isSafeToLoad && (force || events.length === 0)) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // İş saatlerini getir (ilk seferde veya force edildiğinde)
      if (force || !businessHours) {
        await fetchBusinessHours(force);
      }
      
      // View mode'a göre tarih aralığı hesaplama
      let startDate: string;
      let endDate: string;
      
      switch(viewMode) {
        case ViewMode.DAY:
          startDate = moment(selectedDate).startOf('day').format('YYYY-MM-DD');
          endDate = moment(selectedDate).endOf('day').format('YYYY-MM-DD');
          break;
        case ViewMode.WEEK:
          startDate = moment(selectedDate).startOf('week').format('YYYY-MM-DD');
          endDate = moment(selectedDate).endOf('week').format('YYYY-MM-DD');
          break;
        case ViewMode.AGENDA:
          startDate = moment(selectedDate).subtract(1, 'week').format('YYYY-MM-DD');
          endDate = moment(selectedDate).add(2, 'week').format('YYYY-MM-DD');
          break;
        case ViewMode.MONTH:
        default:
          startDate = moment(selectedDate).startOf('month').subtract(1, 'week').format('YYYY-MM-DD');
          endDate = moment(selectedDate).endOf('month').add(1, 'week').format('YYYY-MM-DD');
          break;
      }
      
      // API parametrelerini hazırla
      const calendarOptions: CalendarViewOptions = {
        startDate,
        endDate,
        forceRefresh: force,
        ...filters // Tüm filtreleri API çağrısına dahil et
      };
      
      // API çağrısı öncesi log
      console.log('[useCalendarData] API çağrısı parametreleri:', JSON.stringify(calendarOptions, null, 2));
      console.log(`[useCalendarData] Tarih aralığı: ${startDate} - ${endDate}`);
      
      try {
        // API çağrısı
        console.log('[useCalendarData] getCalendarData fonksiyonu çağrılıyor...');
        const result = await getCalendarData(calendarOptions);
        
        if (!result.success) {
          throw new Error(result.error || 'Takvim verileri alınırken bir hata oluştu');
        }
        
        const calendarData = result.data;
        
        // API yanıtı temel kontrol
        console.log('[useCalendarData] getCalendarData yanıtı alındı');
        
        // Yanıtı kontrol etmek için, personel ve randevu sayılarını logla
        const staffCount = Array.isArray(calendarData?.staff) ? calendarData.staff.length : 0;
        const appointmentsCount = Array.isArray(calendarData?.appointments) ? calendarData.appointments.length : 0;
        
        console.log(`[useCalendarData] Veri içeriği: ${staffCount} personel, ${appointmentsCount} randevu`);
        
        // Personel verilerini güncelle
        const newStaff = Array.isArray(calendarData?.staff) ? calendarData.staff : [];
        // Randevu verilerini güncelle
        const newAppointments = Array.isArray(calendarData?.appointments) ? calendarData.appointments : [];
        
        // API yanıtında ilk randevu örneği (doğruluğunu kontrol için)
        if (newAppointments.length > 0) {
          console.log('[useCalendarData] Örnek randevu:', JSON.stringify(newAppointments[0], null, 2));
        } else {
          console.log('[useCalendarData] Randevu bulunamadı!', viewMode, selectedDate.toISOString());
        }
        
        // State güncellemeleri
        console.log('[useCalendarData] State güncellemesi yapılıyor');
        
        // Personel state'ini güncelle
        setStaff(newStaff);
        console.log(`[useCalendarData] Personel listesi güncellendi (${newStaff.length} personel)`);
        
        // Randevu state'ini güncelle
        setEvents(newAppointments);
        console.log(`[useCalendarData] Randevu listesi güncellendi (${newAppointments.length} randevu)`);
        
        // Performans ölçümü bitir
        const endTime = performance.now();
        console.log(`[useCalendarData] Takvim verileri yüklendi (${(endTime - startTime).toFixed(2)}ms)`);
        
      } catch (error) {
        console.error('[useCalendarData] Veri çekme hatası:', error);
        console.error('[useCalendarData] Hata mesajı:', error.message);
        
        if (error.stack) {
          console.error('[useCalendarData] Hata stack:', error.stack);
        }
        
        // Hatayı kullanıcıya göster
        setError(`Takvim verileri alınamadı: ${error.message || 'Bilinmeyen hata'}`);
        
        // Boş state ile devam et
        setStaff([]);
        setEvents([]);
        throw error;
      }
    } catch (err) {
      console.error('Takvim verileri alınırken hata oluştu:', err);
      setError(err instanceof Error ? err.message : 'Takvim verileri alınırken bir hata oluştu');
      
      showErrorToast(err instanceof Error ? err.message : 'Takvim verileri alınırken bir hata oluştu');
    } finally {
      if (isSafeToLoad) {
        setLoading(false);
      }
    }
  }, [selectedDate, updating, viewMode, filters, businessHours, fetchBusinessHours, showErrorToast]);
  
  // Takvimi yenile - zorla yenileme yapar
  const refreshCalendar = useCallback(async () => {
    await fetchCalendarData(true);
  }, [fetchCalendarData]);
  
  // İlk yükleme state'i
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // İlk yükleme - sadece bir kez çalışır 
  useEffect(() => {
    // Eğer ilk yükleme gerçekleşmediyse veya zorunlu ise
    if (!isInitialLoadComplete || options.forceInitialLoad) {
      console.log("[useCalendarData] İlk yükleme başlatılıyor...");
      setLoading(true); // Yükleme göstergesini aktifleştir
      
      // İlk yükleme işlevini tanımla
      const loadInitialData = async () => {
        try {
          console.log("[useCalendarData] Takvim için randevu verileri getiriliyor (ilk yükleme)...");
          
          // Önce iş saatlerini getir (takvim görünümü için gerekli)
          try {
            console.log("[useCalendarData] İş saatleri getiriliyor...");
            await fetchBusinessHours(true); // true ile force-refresh
            console.log("[useCalendarData] İş saatleri başarıyla yüklendi");
          } catch (error) {
            console.warn("[useCalendarData] İş saatleri yüklenemedi, devam ediliyor:", error.message);
          }
          
          // Force = true ile çağır (zorunlu yenileme)
          console.log("[useCalendarData] Randevu verileri getiriliyor...");
          await fetchCalendarData(true);
          
          console.log("[useCalendarData] Takvim ilk yükleme tamamlandı, sonuç:", {
            staff: staff.length,
            events: events.length
          });
          
          // Başarılı yükleme işareti
          setIsInitialLoadComplete(true);
        } catch (err) {
          console.error("[useCalendarData] Takvim ilk yükleme hatası:", err);
          setError(err instanceof Error ? err.message : 'Takvim verileri alınırken bir hata oluştu');
          
          // Hatayı kullanıcıya göster
          showErrorToast(err instanceof Error ? err.message : 'Takvim verileri alınırken bir hata oluştu');
          
          // Tekrar denemeyi öner
          setTimeout(() => {
            // 3 saniye sonra otomatik olarak tekrar dene
            setError("Takvim yüklemesi başarısız oldu. Lütfen sayfayı yenileyin veya 'Yeniden Dene' butonuna basın.");
          }, 3000);
        } finally {
          // Yükleme durumunu her zaman false yap
          setLoading(false);
        }
      };
      
      // İlk yükleme işlemini başlat
      loadInitialData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece bileşen mount olduğunda çalışsın
  
  // Periyodik yenileme - ayrı bir effect olarak
  useEffect(() => {
    // Periyodik yenileme için
    if (!options.refreshInterval || options.refreshInterval <= 0) {
      return; // Yenileme aralığı yoksa hiçbir şey yapma
    }
    
    // Varsayılan olarak periyodik yenileme yapmamak için minimum 10 saniye süre sınırı ekledik
    const interval = Math.max(10000, options.refreshInterval);
    console.log(`[CalendarData] Periyodik yenileme aktif: ${interval}ms`);
    
    // Güvenli bir şekilde fetch fonksiyonunu çağıran bir işlev
    const refreshData = async () => {
      if (!document.hidden) {
        try {
          await fetchCalendarData(true);
        } catch (error) {
          console.error("Periyodik yenileme hatası:", error);
        }
      }
    };
    
    const intervalId = setInterval(refreshData, interval);
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.refreshInterval]); // Sadece yenileme aralığı değiştiğinde yeniden ayarla
  
  // Seçili tarih, görünüm modu veya filtreler değiştiğinde, takvimi güncelle
  useEffect(() => {
    // Son değişiklikten 300ms sonra veri yükle (debounce)
    const timerId = setTimeout(() => {
      fetchCalendarData();
    }, 300);
    
    return () => clearTimeout(timerId); // Temizleme fonksiyonu
  }, [selectedDate, viewMode, filters, fetchCalendarData]);

  return {
    staff,
    events,
    loading,
    error,
    businessHours,
    updating,
    fetchCalendarData,
    refreshCalendar,
    fetchBusinessHours
  };
};
