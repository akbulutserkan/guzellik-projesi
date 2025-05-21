/**
 * Personel izinleri ile ilgili işlemler
 */
import { prisma } from '@/lib/prisma';
import { Permission, Staff } from '@prisma/client';
import { ServiceResponse } from './types';
import { sanitizeStaffData } from './helpers';

/**
 * Personel izinlerini güncelle
 * @param id Personel ID
 * @param permissions İzin listesi
 * @returns İşlem sonucu
 */
export async function updateStaffPermissionsInDb(id: string, permissions: Permission[]): Promise<ServiceResponse<Omit<Staff, 'password'>>> {
  try {
    console.log(`[staff-db-service] updateStaffPermissionsInDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Personel ID\'si gereklidir'
      };
    }
    
    if (!Array.isArray(permissions)) {
      return {
        success: false,
        error: 'İzinler dizisi geçersiz format'
      };
    }

    // Mevcut personeli getir
    const staff = await prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        accountType: true
      }
    });

    if (!staff) {
      console.log(`[staff-db-service] Personel bulunamadı, id: ${id}`);
      return {
        success: false,
        error: 'Personel bulunamadı'
      };
    }

    // İzinlerin zaten Permission tipinde olduğundan emin ol
    const validPermissions = permissions as Permission[];

    // Personel izinlerini güncelle
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: { permissions: validPermissions }
    });

    // Hassas bilgileri çıkar
    const sanitizedStaff = sanitizeStaffData(updatedStaff);

    console.log(`[staff-db-service] Personel izinleri güncellendi, id: ${id}`);
    
    return {
      success: true,
      data: sanitizedStaff
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel izinleri güncellenirken hata (id: ${id}):`, error);
    return {
      success: false,
      error: 'Personel izinleri güncellenemedi'
    };
  }
}

/**
 * Personel rolüne göre varsayılan izinleri getir
 * @param role Personel rolü
 * @returns İzin listesi
 */
export async function getDefaultPermissionsByRoleFromDb(role: string): Promise<ServiceResponse<Permission[]>> {
  try {
    console.log(`[staff-db-service] getDefaultPermissionsByRoleFromDb çağrıldı, role: ${role}`);
    
    // Rol bazlı varsayılan izinleri tanımla
    const defaultPermissions: Record<string, Permission[]> = {
      ADMIN: [
        'ADMIN_DASHBOARD', 'MANAGE_STAFF', 'MANAGE_SERVICES',
        'MANAGE_CUSTOMERS', 'MANAGE_APPOINTMENTS', 'VIEW_REPORTS',
        'MANAGE_SETTINGS', 'MANAGE_PACKAGES', 'VIEW_CALENDAR'
      ] as Permission[],
      MANAGER: [
        'ADMIN_DASHBOARD', 'MANAGE_SERVICES', 'MANAGE_CUSTOMERS',
        'MANAGE_APPOINTMENTS', 'VIEW_REPORTS', 'VIEW_CALENDAR'
      ] as Permission[],
      STAFF: [
        'VIEW_CALENDAR', 'MANAGE_APPOINTMENTS', 'VIEW_CUSTOMERS'
      ] as Permission[],
      RECEPTIONIST: [
        'VIEW_CALENDAR', 'MANAGE_APPOINTMENTS', 'MANAGE_CUSTOMERS',
        'VIEW_SERVICES'
      ] as Permission[]
    };
    
    // İstenilen role göre izinleri döndür
    const uppercaseRole = role.toUpperCase();
    const permissions = defaultPermissions[uppercaseRole] || [];
    
    console.log(`[staff-db-service] ${uppercaseRole} rolü için ${permissions.length} izin bulundu`);
    
    return {
      success: true,
      data: permissions
    };
  } catch (error) {
    console.error(`[staff-db-service] Varsayılan izinler alınırken hata (rol: ${role}):`, error);
    return {
      success: false,
      error: 'Varsayılan izinler alınamadı'
    };
  }
}
