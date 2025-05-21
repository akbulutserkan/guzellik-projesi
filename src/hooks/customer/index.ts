/**
 * Müşteri yönetimi hook'ları için ortak export dosyası
 */

// Ana hook
export { default } from './useCustomerManagement';
export { useCustomerManagement } from './useCustomerManagement';

// Alt hook'lar
export * from './useCustomerData';
export * from './useCustomerPermissions';
export * from './useCustomerUI';
export * from './useCustomerSearch';
export * from './useCustomerRelations';
export * from './useCustomerCache';