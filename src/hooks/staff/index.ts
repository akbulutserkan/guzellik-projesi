/**
 * Personel yönetimi hook'ları için ortak export dosyası
 */

// Ana hook
export { default } from './useStaffManagement';

// Alt hook'lar
export { useStaffManagement } from './useStaffManagement';
export { useStaffData } from './useStaffData';
export { useStaffPermissions } from './useStaffPermissions';
export { useStaffWorkingHours } from './useStaffWorkingHours';