import { testServiceRelations } from './test-service-ref';
import { deleteServiceFromDb } from '@/services/db/service/serviceCrudService';

/**
 * Bir hizmeti silmeyi deneyen test fonksiyonu
 */
export async function testDeleteService(serviceId: string) {
  try {
    console.log('[TEST] Hizmet silme testi başlatılıyor...');
    
    // Önce ilişkileri kontrol et
    const relationsResult = await testServiceRelations(serviceId);
    
    if (!relationsResult.success) {
      console.error('[TEST] İlişki testi başarısız:', relationsResult.error);
      return { 
        success: false, 
        error: 'Hizmet ilişkilerini kontrol ederken bir hata oluştu.' 
      };
    }
    
    // İlişki sonuçlarını logla
    console.log('[TEST] İlişki testi sonuçları:', relationsResult.data);
    
    // Hizmet silinebilir mi kontrol et
    if (!relationsResult.data.canDelete) {
      return {
        success: false,
        error: `Bu hizmet başka yerlerde kullanılıyor ve silinemiyor. İlişkiler: ${relationsResult.data.totalReferences} adet (Randevular: ${relationsResult.data.appointmentCount}, Paket Seansları: ${relationsResult.data.packageSessionCount}, Paket Tanımları: ${relationsResult.data.packageServiceCount})`
      };
    }
    
    // Hizmet silinebilir, silme işlemini gerçekleştir
    console.log('[TEST] Hizmet silinebilir, silme işlemi başlatılıyor...');
    const deleteResult = await deleteServiceFromDb(serviceId);
    
    if (!deleteResult.success) {
      console.error('[TEST] Silme işlemi başarısız:', deleteResult.error);
      return deleteResult;
    }
    
    console.log('[TEST] Silme işlemi başarılı!');
    return deleteResult;
  } catch (error) {
    console.error('[TEST] Silme işlemi sırasında hata:', error);
    return {
      success: false,
      error: `Hizmet silme işlemi sırasında beklenmeyen bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`
    };
  }
}