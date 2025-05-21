// hooks/businessHours/types.ts

/**
 * İşletme çalışma saati tipi
 */
export interface BusinessHours {
  [day: string]: {
    enabled: boolean;
    start: string;
    end: string;
  }
}

/**
 * Varsayılan çalışma saatleri
 */
export const defaultHours: BusinessHours = {
  monday: { enabled: true, start: '09:00', end: '19:00' },
  tuesday: { enabled: true, start: '09:00', end: '19:00' },
  wednesday: { enabled: true, start: '09:00', end: '19:00' },
  thursday: { enabled: true, start: '09:00', end: '19:00' },
  friday: { enabled: true, start: '09:00', end: '19:00' },
  saturday: { enabled: true, start: '09:00', end: '19:00' },
  sunday: { enabled: false, start: '09:00', end: '19:00' }
};

/**
 * Saat formatı kontrolü
 */
export const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};