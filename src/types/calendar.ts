/**
 * Takvim modülü için tip tanımlamaları
 */

/** Randevu durumu */
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

/** Katılım durumu */
export enum AttendanceStatus {
  PENDING = 'PENDING',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
  LATE = 'LATE',
  CANCELLED = 'CANCELLED'
}

/** Takvim görünüm modu */
export enum ViewMode {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  AGENDA = 'agenda'
}

/** Takvim filtreleme parametreleri */
export interface CalendarFilter {
  staffId?: string | null; // Personel ID'ye göre filtreleme
  customerId?: string | null; // Müşteri ID'ye göre filtreleme
  serviceId?: string | null; // Hizmet ID'ye göre filtreleme
  status?: string | null; // Durum değerine göre filtreleme
  [key: string]: any; // Esnek filtreleme desteği
}

/** Takvim görünüm seçenekleri */
export interface CalendarViewOptions {
  startDate: string; // Başlangıç tarihi
  endDate: string; // Bitiş tarihi
  forceRefresh?: boolean; // Zorunlu yenileme bayrağı
  staffId?: string | null; // Personel filtresi
  customerId?: string | null; // Müşteri filtresi
  serviceId?: string | null; // Hizmet filtresi
  status?: string | null; // Durum filtresi
  [key: string]: any; // Esnek parametreler
}
