/**
 * Ürün hook'ları için ortak export dosyası
 */

// Ana hook
export { default } from './useProductManagement';
export { useProductManagement } from './useProductManagement';

// Alt hook'lar
export { useProductCache } from './useProductCache';
export { useProductData } from './useProductData';
export { useProductInventory } from './useProductInventory';
export { useProductPermissions } from './useProductPermissions';
export { useProductStatus } from './useProductStatus';
export { useProductUI } from './useProductUI';