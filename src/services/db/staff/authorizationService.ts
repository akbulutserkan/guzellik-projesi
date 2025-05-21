/**
 * Personel yetkilendirme servisleri
 */
import { prisma } from '@/lib/prisma';

// Yetkili personelleri getir
export async function getAuthorizedStaffFromDb() {
  try {
    console.log('[DB] Yetkili personeller getiriliyor');
    
    // Aktif personelleri getir
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true,
        // Admin veya Manager hesap tiplerini filtrele
        accountType: {
          in: ['ADMIN', 'MANAGER']
        }
      },
      select: {
        id: true,
        name: true,
        position: true,
        accountType: true
      }
    });
    
    return {
      success: true,
      data: staff
    };
  } catch (error) {
    console.error('[DB] Yetkili personelleri getirme hatası:', error);
    return {
      success: false,
      error: error.message || 'Yetkili personeller getirilemedi',
      data: []
    };
  }
}