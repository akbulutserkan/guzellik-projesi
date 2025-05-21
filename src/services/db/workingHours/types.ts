/**
 * Çalışma saatleri modülü için tip tanımlamaları
 */
import { WorkingHour, BusinessDay, HolidayException, Staff } from '@prisma/client';

// Temel çalışma saati tipi
export type WorkingHourWithStaff = WorkingHour & {
  staff?: Pick<Staff, 'id' | 'name'> | null;
};

// Çalışma saati oluşturma/güncelleme için girdi tipi
export type WorkingHourInput = Omit<WorkingHour, 'id'>;
export type WorkingHourUpdateInput = Partial<WorkingHourInput>;

// İşletme çalışma günleri tip tanımlamaları
export type BusinessHour = BusinessDay;

// Tatil ve özel günler için istisna tanımlamaları
export type HolidayExceptionInput = {
  date: Date | string;
  description: string;
  isWorkingDay?: boolean;
};
export type HolidayExceptionUpdateInput = Partial<HolidayExceptionInput>;

// Servis yanıt tipi
export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
