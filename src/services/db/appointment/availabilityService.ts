/**
 * Staff availability and appointment time conflict checks
 */

import { prisma } from '@/lib/prisma';
import { FormattedAppointment, ServiceResponse } from './types';
import { normalizeWorkingHours } from './helpers';

/**
 * Personel uygunluğunu kontrol eder
 * @param staffId - Personel ID'si
 * @param startTime - Başlangıç zamanı
 * @param endTime - Bitiş zamanı
 * @param excludeEventId - Hariç tutulacak randevu ID'si (opsiyonel)
 * @returns {Promise<ServiceResponse<{isAvailable: boolean, conflictingAppointments?: any[], workingHoursIssue?: string}>>}
 */
export async function checkStaffAvailabilityFromDb(
  staffId: string, 
  startTime: string, 
  endTime: string, 
  excludeEventId?: string
): Promise<ServiceResponse<{isAvailable: boolean, conflictingAppointments?: any[], workingHoursIssue?: string}>> {
  try {
    // Tarih formatlarını kontrol et ve düzelt
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        error: 'Geçersiz tarih formatı'
      };
    }
    
    // 1. Personel çalışma saatleri kontrolü
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { workingHours: true }
    });
    
    if (!staff) {
      return {
        success: false,
        error: 'Personel bulunamadı'
      };
    }
    
    // Haftanın günü (0-6, 0 = Pazar)
    const dayOfWeek = start.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Personelin çalışma saatleri
    // Çalışma saatlerini normalize et
    const normalizedWorkingHours = normalizeWorkingHours(staff.workingHours);
    const workingHours = normalizedWorkingHours?.[dayName];
    
    if (!workingHours || !workingHours.enabled) {
      return {
        success: true,
        data: {
          isAvailable: false,
          workingHoursIssue: `Personel seçilen günde çalışmıyor (${dayName})`
        }
      };
    }
    
    // 1. Dakika cinsinden hesapla (yerel saat)
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const startTimeMinutes = startHour * 60 + startMinute;
    
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    const endTimeMinutes = endHour * 60 + endMinute;
    
    // 2. Çalışma saatlerini dakika cinsinden hesapla
    const [workingStartHour, workingStartMinute] = workingHours.start.split(':').map(Number);
    const workingStartMinutes = workingStartHour * 60 + workingStartMinute;
    
    const [workingEndHour, workingEndMinute] = workingHours.end.split(':').map(Number);
    const workingEndMinutes = workingEndHour * 60 + workingEndMinute;
    
    // Log kaydetme
    console.log(`Saat karşılaştırma (dakika cinsinden): Randevu ${startTimeMinutes}-${endTimeMinutes}, Çalışma ${workingStartMinutes}-${workingEndMinutes}`);
    
    // 3. Sayısal değerleri karşılaştır (metin karşılaştırması değil)
    if (startTimeMinutes < workingStartMinutes || endTimeMinutes > workingEndMinutes) {
      console.log(`Çalışma saati kontrolü BAŞARISIZ: ${startTimeMinutes} < ${workingStartMinutes} veya ${endTimeMinutes} > ${workingEndMinutes}`);
      return {
        success: true,
        data: {
          isAvailable: false,
          workingHoursIssue: `Seçilen zaman dilimi personelin çalışma saatleri dışında (${workingHours.start}-${workingHours.end})`
        }
      };
    } else {
      console.log(`Çalışma saati kontrolü BAŞARILI: ${startTimeMinutes} >= ${workingStartMinutes} ve ${endTimeMinutes} <= ${workingEndMinutes}`);
    }
    
    // 2. Çakışma kontrolü
    let whereClause: any = {
      staffId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      AND: [
        {
          startTime: {
            lt: end
          }
        },
        {
          endTime: {
            gt: start
          }
        }
      ]
    };
    
    // Hariç tutulacak randevu varsa, sorguya ekle
    if (excludeEventId) {
      whereClause.NOT = {
        id: excludeEventId
      };
    }
    
    const conflictingAppointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (conflictingAppointments.length > 0) {
      return {
        success: true,
        data: {
          isAvailable: false,
          conflictingAppointments,
          workingHoursIssue: 'Seçilen zaman diliminde çakışan randevular bulunuyor'
        }
      };
    }
    
    // Müsait durumda
    return {
      success: true,
      data: {
        isAvailable: true,
        conflictingAppointments: []
      }
    };
  } catch (error: any) {
    console.error('Personel uygunluğu kontrol hatası:', error);
    return {
      success: false,
      error: `Personel uygunluğu kontrol edilirken hata oluştu: ${error.message}`
    };
  }
}

/**
 * Randevu taşıma veya yeniden boyutlandırma işlemini gerçekleştirir
 * @param data - Güncelleme verileri
 * @returns {Promise<ServiceResponse<FormattedAppointment>>}
 */
export async function updateAppointmentDragFromDb(data: {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  staffId?: string;
}): Promise<ServiceResponse<FormattedAppointment>> {
  try {
    // Randevu var mı kontrol et
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.id }
    });
    
    if (!appointment) {
      return {
        success: false,
        error: 'Randevu bulunamadı'
      };
    }
    
    // Güncellenecek verileri hazırla
    const updateData: any = {
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime)
    };
    
    // Eğer personel değiştiyse güncelle
    if (data.staffId && data.staffId !== appointment.staffId) {
      updateData.staffId = data.staffId;
    }
    
    // Randevuyu güncelle
    const updatedAppointment = await prisma.appointment.update({
      where: { id: data.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    });
    
    // Takvim için uygun formata dönüştür
    const formattedAppointment: FormattedAppointment = {
      id: updatedAppointment.id,
      title: `${updatedAppointment.customer?.name || 'Müşteri'} - ${updatedAppointment.service?.name || 'Hizmet'}`,
      start: updatedAppointment.startTime,
      end: updatedAppointment.endTime,
      resourceId: updatedAppointment.staffId,
      staffId: updatedAppointment.staffId,
      customerId: updatedAppointment.customerId,
      serviceId: updatedAppointment.serviceId,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      customer: updatedAppointment.customer,
      staff: updatedAppointment.staff,
      service: updatedAppointment.service
    };
    
    return {
      success: true,
      data: formattedAppointment
    };
  } catch (error: any) {
    console.error('Randevu taşıma hatası:', error);
    return {
      success: false,
      error: `Randevu taşınırken hata oluştu: ${error.message}`
    };
  }
}
