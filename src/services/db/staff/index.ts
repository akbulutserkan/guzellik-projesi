/**
 * Personel (Staff) modülü index dosyası
 * Tüm personel ile ilgili servisleri tek bir yerden dışa aktarır
 */

// Tip tanımlamalarını dışa aktar
export * from './types';

// Temel CRUD işlemlerini dışa aktar
export * from './crudService';

// İzin işlemlerini dışa aktar
export * from './permissionService';

// Çalışma saatleri ve takvim işlemlerini dışa aktar
export * from './scheduleService';

// Yetkilendirme işlemlerini dışa aktar
export * from './authorizationService';

// Yardımcı fonksiyonları dışa aktar
export * from './helpers';

// Eski çalışma saatleri doğrulama işlevini yönlendirme (geriye uyumluluk için)
export async function validateWorkingHoursFromDb(workingHours: any[]) {
  try {
    console.log('[staff-db-service] validateWorkingHoursFromDb çağrıldı (ESKI YONTEM)');
    console.log('[staff-db-service] UYARI: Bu fonksiyon yakında kaldırılacaktır. Lütfen "/src/services/db/workingHours" modülünü kullanın.');
    
    // Yeni merkezi servisi içe aktar ve yönlendir
    const { validateWorkingHoursFromDb: newValidateWorkingHoursFromDb } = await import('@/services/db/workingHours');
    return await newValidateWorkingHoursFromDb(workingHours);
  } catch (error) {
    console.error('[staff-db-service] Çalışma saatleri doğrulanırken hata:', error);
    return {
      success: false,
      error: 'Çalışma saatleri doğrulanırken bir hata oluştu'
    };
  }
}
