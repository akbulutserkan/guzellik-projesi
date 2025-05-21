/**
 * Personel CRUD işlemleri
 */
import { prisma } from '@/lib/prisma';
import { UserRole, Permission } from '@prisma/client';
import {
  StaffWithServices,
  StaffCreateInput,
  StaffUpdateInput,
  StaffListResponse,
  ServiceResponse
} from './types';
import {
  formatStaffName,
  hashPassword,
  validateStaffData,
  sanitizeStaffData
} from './helpers';

/**
 * Tüm personel listesini veritabanından getir
 * @param options Filtre seçenekleri (includeInactive: tüm personeli içerir)
 * @returns Personel listesi
 */
export async function getStaffFromDb(options?: { includeInactive?: boolean }): Promise<ServiceResponse<StaffListResponse>> {
  try {
    console.log('[staff-db-service] getStaffFromDb çağrıldı, seçenekler:', options);
    
    const includeInactive = options?.includeInactive || false;
    
    // Veritabanı sorgusunu oluştur
    const whereCondition = includeInactive ? {} : { isActive: true };
    
    // Personel listesini getir
    const staff = await prisma.staff.findMany({
      where: whereCondition,
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        phone: true,
        accountType: true,
        permissions: true,
        isActive: true,
        serviceGender: true,
        showInCalendar: true,
        workingHours: true,
        services: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`[staff-db-service] ${staff.length} personel bulundu`);
    
    return {
      success: true,
      data: {
        activeStaff: staff.filter(s => s.isActive),
        allStaff: staff
      }
    };
  } catch (error) {
    console.error('[staff-db-service] Personel listesi alınırken hata:', error);
    return {
      success: false,
      error: 'Personel listesi alınamadı'
    };
  }
}

/**
 * ID'ye göre personel detayını veritabanından getir
 * @param id Personel ID
 * @returns Personel detayı
 */
export async function getStaffByIdFromDb(id: string): Promise<ServiceResponse<StaffWithServices>> {
  try {
    console.log(`[staff-db-service] getStaffByIdFromDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Personel ID bilgisi gerekli'
      };
    }
    
    const staff = await prisma.staff.findUnique({
      where: {
        id
      },
      include: {
        services: true
      }
    });

    if (!staff) {
      console.log(`[staff-db-service] Personel bulunamadı, id: ${id}`);
      return {
        success: false,
        error: 'Personel bulunamadı'
      };
    }

    console.log(`[staff-db-service] Personel bulundu, id: ${id}`);
    
    // Hassas bilgileri çıkar
    const sanitizedStaff = sanitizeStaffData(staff);
    
    return {
      success: true,
      data: sanitizedStaff
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel detayı alınırken hata (id: ${id}):`, error);
    return {
      success: false,
      error: 'Personel detayı alınamadı'
    };
  }
}

/**
 * Yeni personel oluştur
 * @param data Personel bilgileri
 * @returns Oluşturulan personel
 */
export async function createStaffInDb(data: StaffCreateInput): Promise<ServiceResponse<StaffWithServices>> {
  try {
    console.log('[staff-db-service] createStaffInDb çağrıldı');
    
    // Verileri doğrula
    const validationError = validateStaffData(data);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Kullanıcı adı kontrolü
    const existingStaff = await prisma.staff.findUnique({
      where: { username: data.username }
    });

    if (existingStaff) {
      console.log(`[staff-db-service] Kullanıcı adı zaten kullanılıyor: ${data.username}`);
      return {
        success: false,
        error: 'Bu kullanıcı adı zaten kullanılıyor'
      };
    }

    // Şifre hash'leme
    const hashedPassword = await hashPassword(data.password);

    // İsim formatlamayı uygula
    const formattedName = formatStaffName(data.name);

    // Hizmet ilişkilerini hazırla
    const serviceConnections = data.services && data.services.length > 0 
      ? { connect: data.services.map(serviceId => ({ id: serviceId })) }
      : undefined;

    // Staff oluşturma
    const staff = await prisma.staff.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: formattedName,
        phone: data.phone,
        email: data.email || null,
        accountType: data.accountType as UserRole,
        serviceGender: data.serviceGender || 'UNISEX',
        position: data.position || null,
        permissions: data.permissions || [],
        showInCalendar: data.showInCalendar ?? true,
        workingHours: data.workingHours || [],
        isActive: true,
        failedAttempts: 0,
        isLocked: false,
        services: serviceConnections
      },
      include: {
        services: true
      }
    });

    // Hassas bilgileri çıkar
    const sanitizedStaff = sanitizeStaffData(staff);
    
    console.log(`[staff-db-service] Personel oluşturuldu, id: ${staff.id}`);
    
    return {
      success: true,
      data: sanitizedStaff
    };
  } catch (error) {
    console.error('[staff-db-service] Personel oluşturulurken hata:', error);
    return {
      success: false,
      error: 'Personel oluşturulamadı'
    };
  }
}

/**
 * Personel bilgilerini güncelle
 * @param id Personel ID
 * @param data Güncellenecek veriler
 * @returns Güncellenen personel
 */
export async function updateStaffInDb(id: string, data: StaffUpdateInput): Promise<ServiceResponse<StaffWithServices>> {
  try {
    console.log(`[staff-db-service] updateStaffInDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Personel ID\'si gereklidir'
      };
    }

    // Güncellenecek veriyi hazırla
    const updateData: any = {};

    // İsim alanını formatlama işleminden geçir
    if (data.name) {
      updateData.name = formatStaffName(data.name);
    }

    // Diğer alanları ekle
    if (data.phone) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.accountType) updateData.accountType = data.accountType;
    if (data.serviceGender) updateData.serviceGender = data.serviceGender;
    if (data.showInCalendar !== undefined) updateData.showInCalendar = data.showInCalendar;
    if (data.workingHours) updateData.workingHours = data.workingHours;
    if (data.permissions) updateData.permissions = data.permissions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Şifre değişikliği varsa hash'le
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    // Hizmet ilişkilerini hazırla
    if (data.services && Array.isArray(data.services)) {
      updateData.services = {
        set: data.services.map(serviceId => ({ id: serviceId }))
      };
    }

    // Personeli güncelle
    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        services: true
      }
    });

    // Hassas bilgileri çıkar
    const sanitizedStaff = sanitizeStaffData(staff);
    
    console.log(`[staff-db-service] Personel güncellendi, id: ${id}`);
    
    return {
      success: true,
      data: sanitizedStaff
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel güncellenirken hata (id: ${id}):`, error);
    
    // Hata türüne göre daha spesifik mesajlar
    let errorMessage = 'Personel güncellenemedi';
    
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        errorMessage = 'Personel bulunamadı';
      } else if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = 'Geçersiz hizmet ID\'si';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Personeli silme işlemi (soft delete - isActive=false)
 * @param id Personel ID
 * @returns İşlem sonucu
 */
export async function deleteStaffFromDb(id: string): Promise<ServiceResponse<void>> {
  try {
    console.log(`[staff-db-service] deleteStaffFromDb çağrıldı, id: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Personel ID\'si gereklidir'
      };
    }

    // Soft delete - isActive'i false yap
    await prisma.staff.update({
      where: { id },
      data: { isActive: false }
    });

    console.log(`[staff-db-service] Personel silindi (pasif yapıldı), id: ${id}`);
    
    return {
      success: true,
      message: 'Personel başarıyla pasif duruma getirildi'
    };
  } catch (error) {
    console.error(`[staff-db-service] Personel silinirken hata (id: ${id}):`, error);
    
    // Hata türüne göre daha spesifik mesajlar
    let errorMessage = 'Personel silinemedi';
    
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        errorMessage = 'Personel bulunamadı';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
