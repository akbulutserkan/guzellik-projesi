/**
 * Takvim modülü için sabitler
 */

// Gün adları için sabit dizi - Pazar günü 0 indeksli olarak başlar
export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

// Türkçe gün adları
export const TR_DAY_NAMES = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi'
];

// Ay adları
export const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
];

// Takvim görünüm tipleri
export const VIEW_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  AGENDA: 'agenda'
};

// Randevu durumları için renk kodları
export const STATUS_COLORS = {
  PENDING: {
    bg: '#FCD34D',
    border: '#D97706',
    text: '#000'
  },
  CONFIRMED: {
    bg: '#34D399',
    border: '#059669',
    text: '#000'
  },
  CANCELLED: {
    bg: '#F87171',
    border: '#DC2626',
    text: '#fff'
  },
  COMPLETED: {
    bg: '#60A5FA',
    border: '#2563EB',
    text: '#fff'
  },
  NO_SHOW: {
    bg: '#A78BFA',
    border: '#7C3AED',
    text: '#fff'
  }
};
