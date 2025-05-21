/**
 * Hizmet hook'ları için ortak export dosyası
 */

// Ana hook
export { default } from './useServiceManagement';
export * from './useServiceManagement';

// Alt hook'lar
export { default as useServiceData } from './useServiceData';
export * from './useServiceData';

export { default as useServiceCategory } from './useServiceCategory';
export * from './useServiceCategory';

export { default as useServiceUI } from './useServiceUI';
export * from './useServiceUI';

export { default as useServicePermissions } from './useServicePermissions';
export * from './useServicePermissions';

export { default as useServiceCache } from './useServiceCache';
export * from './useServiceCache';

export { default as useServiceStatus } from './useServiceStatus';
export * from './useServiceStatus';