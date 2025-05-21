// hooks/workingHours/types.ts

/**
 * Çalışma saati tipi
 */
export type WorkingHour = {
  id: string;
  dayOfWeek: number; // 0-6 (Pazar-Cumartesi)
  startTime: string; // HH:MM formatı
  endTime: string; // HH:MM formatı
  isActive: boolean;
  staff?: { id: string; name: string; } | null;
  staffId?: string | null;
};

/**
 * Çalışma saati oluşturma/güncelleme için input tipi
 */
export type WorkingHourInput = Omit<WorkingHour, 'id'>;

/**
 * Çalışma saati istisnası tipi
 */
export type WorkingHourException = {
  id: string;
  date: string | Date;
  description: string;
  isWorkingDay: boolean;
};

/**
 * İşletme çalışma saati tipi
 */
export type BusinessHour = {
  id: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};
