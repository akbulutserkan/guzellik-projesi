import { prisma } from '@/lib/prisma';

/**
 * Bir hizmetin ilişkili tablolardaki kullanımını test eden fonksiyon
 */
export async function testServiceRelations(serviceId: string) {
  try {
    // 1. Randevularda kullanım
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId }
    });
    
    // 2. Paket seanslarında kullanım 
    const packageSessionCount = await prisma.packageSession.count({
      where: { serviceId }
    });
    
    // 3. Paket hizmetlerinde kullanım
    const packageServiceCount = await prisma.packageService.count({
      where: { serviceId }
    });
    
    return {
      success: true,
      data: {
        appointmentCount,
        packageSessionCount,
        packageServiceCount,
        totalReferences: appointmentCount + packageSessionCount + packageServiceCount,
        canDelete: (appointmentCount + packageSessionCount + packageServiceCount) === 0
      }
    };
  } catch (error) {
    console.error(`[TEST] Hizmet ilişki testi hatası:`, error);
    return {
      success: false,
      error: error.message || 'Hizmet ilişkileri test edilirken bir hata oluştu'
    };
  }
}