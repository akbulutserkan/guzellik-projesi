/**
 * Hooks ana index dosyası
 * Bu dosya, tüm hooks modüllerini tek bir yerden export eder
 * ve alt klasörlerdeki modüllere @/hooks/modulName şeklinde erişim sağlar
 * 
 * Tüm modüller standart bir yapıya göre düzenlendi:
 * - UI işlemleri için *UI hooks (ör. useServiceUI)
 * - Veri işlemleri için *Data hooks (ör. useServiceData)
 * - Ana modül yönetimi için *Management hooks (ör. useServiceManagement)
 */

// Doğrudan hooks klasöründeki hook'lar - artık modüler yapıya taşındı
export * from './businessHours';  // Taşındı
export * from './permissions';   // Taşındı
export * from './utility';      // Yeni utility modülü (useClickOutside, useIsMobile)
export * from './workingHours'; // Taşındı

// Alt klasörlerdeki hook'lar
export * from './appointment';
export * from './calendar';
export * from './customer';
export * from './package';
export * from './packageSale';
export * from './payment';
export * from './product';
export * from './productSale';
export * from './service';
export * from './staff';

// Default export'lar için re-export
export { default as useAppointmentManagement } from './appointment';
export { default as useCalendarManagement } from './calendar';
export { default as usePaymentManagement } from './payment';

// Not: Gerekirse diğer alt klasörlerin default export'ları da eklenebilir
