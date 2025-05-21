/**
 * Takvim ve randevu ekranları için formatlama yardımcı fonksiyonları
 * 3 katmanlı mimari içinde formatlama katmanında yer alır
 */

import { Appointment } from '@/types/appointment';
import { format, parse, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DAY_NAMES } from './constants';
import moment from 'moment';

// constants.ts'den yeniden export et - eski kodları bozmamak için
export { DAY_NAMES } from './constants';

// Zaman dilimi türünü belirtmek için enum
export enum TimeSlotType {
  WORKING_HOUR = 'workingHour',      // Çalışma saati
  NON_WORKING_HOUR = 'nonWorkingHour', // Çalışma saati dışı
  WEEKEND = 'weekend',               // Hafta sonu
  BREAK = 'break',                   // Mola saati
  STAFF_NON_WORKING = 'staffNonWorking', // Personel çalışma dışı
  INVALID = 'invalid'                // Geçersiz zaman dilimi
}

/**
 * Zaman diliminin türüne göre stil özelliklerini belirler
 * Bu, TimeSlotWrapper için gerekli
 */
export const getTimeSlotStyleByType = (slotType: TimeSlotType): any => {
  switch (slotType) {
    case TimeSlotType.WORKING_HOUR:
      return {
        className: 'working-hour-slot',
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.5)'
        }
      };
      
    case TimeSlotType.NON_WORKING_HOUR:
      return {
        className: 'non-working-hour-slot',
        style: {
          backgroundColor: 'rgba(243, 244, 246, 0.8)' // gray-100 with opacity
        }
      };
      
    case TimeSlotType.WEEKEND:
      return {
        className: 'weekend-slot',
        style: {
          backgroundColor: 'rgba(243, 244, 246, 0.8)' // gray-100 with opacity
        }
      };
      
    case TimeSlotType.BREAK:
      return {
        className: 'break-slot',
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.5)' // beyaz arka plan rengi
        }
      };
      
    case TimeSlotType.STAFF_NON_WORKING:
      return {
        className: 'staff-non-working-slot',
        style: {
          backgroundColor: 'rgba(254, 226, 226, 0.6)', // red-100 with more opacity
          position: 'relative',
          overflow: 'hidden'
        }
      };
      
    case TimeSlotType.INVALID:
    default:
      return {
        className: 'invalid-slot',
        style: {
          backgroundColor: 'rgba(254, 226, 226, 0.4)' // red-100 with opacity
        }
      };
  }
};

/**
 * Tarih formatını belirli bir formatta görüntüler
 */
export const formatDateDisplay = (date: Date | string, formatStr: string = 'dd MMMM yyyy'): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: tr });
  } catch (error) {
    console.error('Tarih formatlama hatası:', error);
    return '';
  }
};

/**
 * Saat formatını belirli bir formatta görüntüler
 */
export const formatTimeDisplay = (date: Date | string, formatStr: string = 'HH:mm'): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: tr });
  } catch (error) {
    console.error('Saat formatlama hatası:', error);
    return '';
  }
};

/**
 * Tarih ve saati birlikte formatlar
 */
export const formatDateTimeDisplay = (date: Date | string, formatStr: string = 'dd MMMM yyyy HH:mm'): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: tr });
  } catch (error) {
    console.error('Tarih ve saat formatlama hatası:', error);
    return '';
  }
};

/**
 * Zaman aralığı formatlama (takvim için)
 */
export const formatTimeRange = (startTime: string, endTime: string): [Date, Date] => {
  // Varsayılan değerler
  const defaultStart = new Date();
  defaultStart.setHours(9, 0, 0, 0);
  
  const defaultEnd = new Date();
  defaultEnd.setHours(19, 0, 0, 0);
  
  try {
    // Eğer geçerli saat formatı ise parse et
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    
    if (startParts.length < 2 || endParts.length < 2) {
      return [defaultStart, defaultEnd];
    }
    
    const start = new Date();
    start.setHours(startParts[0], startParts[1], 0, 0);
    
    const end = new Date();
    end.setHours(endParts[0], endParts[1], 0, 0);
    
    return [start, end];
  } catch (error) {
    console.error('Zaman aralığı formatlama hatası:', error);
    return [defaultStart, defaultEnd];
  }
};

/**
 * Belirli bir zaman diliminin türünü belirler
 * (Çalışma saati, çalışma dışı, mola, hafta sonu...)
 */
export const determineTimeSlotType = (
  date: Date | string | moment.Moment, 
  businessHours: any,
  staffId?: string,
  staff?: any[]
): TimeSlotType => {
  // Geçerli bir Date nesnesi oluştur - Moment nesnesini de destekle
  let dateObj: Date;
  
  if (date === null || date === undefined) {
    console.error('Geçersiz tarih: null veya undefined');
    return TimeSlotType.INVALID;
  }
  
  // Moment nesnesi mi kontrol et
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    // Moment nesnesi ise toDate kullanarak Date nesnesine dönüştür
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    // String ise Date nesnesi oluştur
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    // Zaten Date nesnesi ise doğrudan kullan
    dateObj = date;
  } else {
    console.error('Desteklenmeyen tarih formatı:', date);
    return TimeSlotType.INVALID;
  }
  
  // Date nesnesi geçerli mi kontrol et
  if (isNaN(dateObj.getTime())) {
    console.error('Geçersiz tarih:', date);
    return TimeSlotType.INVALID;
  }
  
  // Gün adını al (lowercase Sunday, Monday, ...)
  const dayOfWeek = dateObj.getDay(); // 0 = Pazar, 1 = Pazartesi
  const dayName = DAY_NAMES[dayOfWeek];
  
  // Debug bilgisi ekleyelim
  console.log(`Tarih: ${dateObj.toISOString()}, Gün: ${dayOfWeek}, Gün Adı: ${dayName}`);
  
  // Eğer hafta sonu ise
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // İşyeri için hafta sonu çalışma saatlerini kontrol et
    const businessDay = businessHours?.[dayName];
    if (!businessDay || !businessDay.enabled) {
      return TimeSlotType.WEEKEND;
    }
  }
  
  // Saat bilgisini al
  const hour = dateObj.getHours();
  const minute = dateObj.getMinutes();
  const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  // İş yeri çalışma saatleri kontrolü
  const businessDay = businessHours?.[dayName];
  if (!businessDay || !businessDay.enabled) {
    return TimeSlotType.NON_WORKING_HOUR;
  }
  
  // İş yeri çalışma saati dışında ise
  if (currentTime < businessDay.start || currentTime >= businessDay.end) {
    return TimeSlotType.NON_WORKING_HOUR;
  }
  
  // Eğer belirli bir personel için kontrol ediliyorsa
  if (staffId && staff && staff.length > 0) {
    const selectedStaff = staff.find(s => s.id === staffId);
    
    if (selectedStaff && selectedStaff.workingHours) {
      // Log
      console.log('Personel ID:', staffId);
      console.log('Günün tarih indeksi dayOfWeek:', dayOfWeek);
      console.log('Personel çalışma saatleri:', selectedStaff.workingHours);
      
      // Personelin çalışma saatlerini kontrol et
      const staffDay = selectedStaff.workingHours.find((day: any) => {
        console.log('Kontrol edilen gün objesi:', day, 'Aranan gün:', dayOfWeek);
        // DayOfWeek veya day özelliğini kontrol et - her ikisi de 0-6 arası bir sayı olmalı
        return day.dayOfWeek === dayOfWeek || day.day === dayOfWeek || 
               day.dayOfWeek === String(dayOfWeek) || day.day === String(dayOfWeek);
      });
      
      console.log('Eşleşen personel günü:', staffDay);
      
      // Personel o gün çalışmıyorsa - isWorkingDay veya isWorking alanını kontrol et
      if (!staffDay) {
        console.log('Personel için bugün bilgisi bulunamadı');
        return TimeSlotType.STAFF_NON_WORKING;
      }
      
      // Çalışma durumunu isWorkingDay veya isWorking alanından kontrol et
      const isStaffWorking = staffDay.isWorkingDay || staffDay.isWorking;
      if (!isStaffWorking) {
        console.log('Personel bugün çalışmıyor');
        return TimeSlotType.STAFF_NON_WORKING;
      }
      
      // Personelin çalışma saati dışında ise - startTime veya endTime alanını kontrol et
      const startTime = staffDay.startTime || staffDay.start;
      const endTime = staffDay.endTime || staffDay.end;
      
      console.log('Personel çalışma saatleri:', startTime, '-', endTime, 'kontrol edilen saat:', currentTime);
      
      if (startTime && endTime) {
        if (currentTime < startTime || currentTime >= endTime) {
          console.log('Saat, personelin çalışma saatleri dışında');
          return TimeSlotType.STAFF_NON_WORKING;
        }
      }
    }
  }
  
  return TimeSlotType.WORKING_HOUR;
};

/**
 * Takvim günleri için stil hesaplar
 */
export const formatDayProps = (date: Date): any => {
  const isToday = new Date().toDateString() === date.toDateString();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0: Pazar, 6: Cumartesi
  
  let className = '';
  let style = {};
  
  if (isToday) {
    className += ' rbc-today';
  }
  
  if (isWeekend) {
    className += ' rbc-weekend';
    style = { 
      ...style,
      backgroundColor: '#f8f9fa' 
    };
  }
  
  return { className, style };
};

/**
 * Takvim zaman dilimleri için stil hesaplar
 */
export const formatSlotProps = (date: Date): any => {
  const isCurrentHour = new Date().getHours() === date.getHours();
  
  let className = '';
  let style = {
    backgroundColor: '#ffffff' // Her zaman beyaz arka plan
  };
  
  if (isCurrentHour) {
    className += ' rbc-current-time-slot';
    // Önceden eklenen mavi tonunu kaldırıyoruz
    // style = { 
    //   ...style,
    //   backgroundColor: 'rgba(108, 93, 231, 0.05)' 
    // };
  }
  
  // Tüm zaman dilimleri (12-12.45 ve 16-16.45 dahil) beyaz arka plan rengine sahip olacak
  
  return { className, style };
};

/**
 * Randevular için stil hesaplar
 */
export const formatEventStyle = (event: Appointment): any => {
  if (!event) return {};
  
  let backgroundColor = '#3174ad';
  let borderColor = '#265985';
  let color = '#fff';
  
  switch (event.status) {
    case 'PENDING':
      backgroundColor = '#FCD34D';  // yellow-300
      borderColor = '#D97706';      // amber-600
      color = '#000';
      break;
    case 'CONFIRMED':
      backgroundColor = '#34D399';  // emerald-400
      borderColor = '#059669';      // emerald-600
      color = '#000';
      break;
    case 'CANCELLED':
      backgroundColor = '#F87171';  // red-400
      borderColor = '#DC2626';      // red-600
      color = '#fff';
      break;
    case 'COMPLETED':
      backgroundColor = '#60A5FA';  // blue-400
      borderColor = '#2563EB';      // blue-600
      color = '#fff';
      break;
    case 'NO_SHOW':
      backgroundColor = '#A78BFA';  // violet-400
      borderColor = '#7C3AED';      // violet-600
      color = '#fff';
      break;
  }
  
  return {
    className: `appointment-${event.status.toLowerCase()}`,
    style: {
      backgroundColor,
      borderColor,
      color,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '3px',
      padding: '2px 5px',
      fontWeight: 500
    }
  };
};

// API yanıtlarını ekranda gösterilecek veri formatına dönüştüren formatörler
export const formatAppointmentData = (data: any): Appointment => {
  if (!data) return null as unknown as Appointment;
  
  return {
    ...data,
    id: data.id,
    title: data.customer?.name || 'İsimsiz Müşteri',
    start: new Date(data.startTime || data.start),
    end: new Date(data.endTime || data.end),
    resourceId: data.staffId || data.resourceId,
    status: data.status || 'PENDING'
  };
};

/**
 * Müsaitlik kontrolü için tarih-saat parametresini formatlar
 * @param date Kontrol edilecek tarih
 * @param timeString Kontrol edilecek saat (HH:mm formatında)
 * @returns ISO string formatında tarih-saat
 */
export const formatAvailabilityDateTime = (date: Date | string, timeString?: string): string => {
  try {
    const baseDate = typeof date === 'string' ? new Date(date) : new Date(date);
    
    // Eğer saat belirtilmişse ekle
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }
    
    return baseDate.toISOString();
  } catch (error) {
    console.error('Müsaitlik tarih formatı hatası:', error);
    return new Date().toISOString(); // Hata durumunda şu anki zamanı döndür
  }
};
