/**
 * Ayarlar (Settings) modülü için tip tanımlamaları
 */
import { Settings, BusinessDay } from '@prisma/client';

// İşletme çalışma günü formatı
export type BusinessDaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

// Frontend için haftanın günleri formatı
export type BusinessDaysFormat = {
  sunday: BusinessDaySchedule;
  monday: BusinessDaySchedule;
  tuesday: BusinessDaySchedule;
  wednesday: BusinessDaySchedule;
  thursday: BusinessDaySchedule;
  friday: BusinessDaySchedule;
  saturday: BusinessDaySchedule;
  [key: string]: BusinessDaySchedule;
};

// Sistem ayarları formatı
export type SystemSettings = {
  [key: string]: string;
};

// Servis yanıt tipi
export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
