/**
 * Randevu yönetimi hook'ları için ortak export dosyası
 */

// Ana hook
export { default } from './useAppointmentManagement';
export { useAppointmentManagement } from './useAppointmentManagement';

// AppointmentFilterOptions tipini açıkça re-export ediyoruz
export type { AppointmentFilterOptions } from './useAppointmentData';

// Alt hook'lar
export * from './useAppointmentData';
export * from './useAppointmentUI';
export * from './useAppointmentPermissions';
export * from './useAppointmentCache';
export * from './useAppointmentStatus';
export * from './useAppointmentNotes';
export * from './useAppointmentConflict';

// Alt hook'ların default export'ları
export { default as useAppointmentData } from './useAppointmentData';
export { default as useAppointmentUI } from './useAppointmentUI';
export { default as useAppointmentPermissions } from './useAppointmentPermissions';
export { default as useAppointmentCache } from './useAppointmentCache';
export { default as useAppointmentStatus } from './useAppointmentStatus';
export { default as useAppointmentNotes } from './useAppointmentNotes';
export { default as useAppointmentConflict } from './useAppointmentConflict';