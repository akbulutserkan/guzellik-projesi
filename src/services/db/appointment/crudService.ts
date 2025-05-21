/**
 * Appointment CRUD operations
 */

import { prisma } from '@/lib/prisma';
import { debugLog, traceLog, errorLog, startPerf, endPerf } from '@/utils/debug-logger';
import { AppointmentWithRelations, FormattedAppointment, ServiceResponse } from './types';
import { normalizeWorkingHours } from './helpers';

/**
 * Veritabanından bir randevu kaydını ID'ye göre getirir
 * @param id - Getirilecek randevunun kimliği
 * @param includeServices - İlişkili tüm randevuları (aynı müşteri, aynı gün) getir
 * @returns {Promise<ServiceResponse<FormattedAppointment>>}
 */
export async function getAppointmentByIdFromDb(
  id: string, 
  includeServices: boolean = false
): Promise<ServiceResponse<FormattedAppointment>> {
  try {
    console.log(`[appointment-db-service] Randevu ID ile getiriliyor: ${id}, includeServices: ${includeServices}`);
    
    // Ana randevu ID'sini ayıkla (eğer '_' içeriyorsa alt randevudur)
    const mainAppointmentId = id.includes('_') ? id.split('_')[0] : id;
    
    // Randevuyu getir
    const appointment = await prisma.appointment.findUnique({
      where: { id: mainAppointmentId },
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

    if (!appointment) {
      console.log(`[appointment-db-service] Randevu bulunamadı: ${mainAppointmentId}`);
      return { 
        success: false, 
        error: `Randevu bulunamadı: ${mainAppointmentId}` 
      };
    }
    
    // Temel randevu verilerini hazırla
    const formattedAppointment: FormattedAppointment = {
      id: appointment.id,
      title: `${appointment.customer?.name || 'Müşteri'} - ${appointment.service?.name || 'Hizmet'}`,
      start: appointment.startTime,
      end: appointment.endTime,
      resourceId: appointment.staffId,
      staffId: appointment.staffId,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      status: appointment.status,
      notes: appointment.notes,
      attendance: appointment.attendance,
      amount: appointment.amount,
      paymentMethod: appointment.paymentMethod,
      paymentStatus: appointment.paymentStatus,
      customer: appointment.customer,
      staff: appointment.staff,
      service: appointment.service
    };
    
    // Eğer tüm ilişkili randevular isteniyorsa
    if (includeServices) {
      console.log(`[appointment-db-service] İlişkili randevular getiriliyor. Müşteri: ${appointment.customerId}`);
      
      // Aynı müşterinin aynı gündeki tüm randevularını getir
      const startDate = new Date(appointment.startTime);
      startDate.setHours(0, 0, 0, 0); // Günün başlangıcı
      
      const endDate = new Date(appointment.startTime);
      endDate.setHours(23, 59, 59, 999); // Günün sonu
      
      const allAppointments = await prisma.appointment.findMany({
        where: {
          customerId: appointment.customerId,
          startTime: {
            gte: startDate,
            lte: endDate
          },
          status: { not: 'CANCELLED' }
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true
            }
          },
          staff: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      
      console.log(`[appointment-db-service] ${allAppointments.length} ilişkili randevu bulundu`);
      
      // Takvim formatına uygun olarak randevuları dönüştür
      const formattedAppointments = allAppointments.map(apt => ({
        id: apt.id,
        title: `${appointment.customer?.name || 'Müşteri'} - ${apt.service?.name || 'Hizmet'}`,
        start: apt.startTime,
        end: apt.endTime,
        resourceId: apt.staffId,
        staffId: apt.staffId,
        customerId: apt.customerId,
        serviceId: apt.serviceId,
        status: apt.status,
        attendance: apt.attendance,
        amount: apt.amount,
        paymentMethod: apt.paymentMethod,
        paymentStatus: apt.paymentStatus,
        notes: apt.notes,
        service: apt.service,
        staff: apt.staff
      }));
      
      // Tüm ilişkili randevuları sonuca ekle
      formattedAppointment._allAppointments = formattedAppointments;
    }
    
    return {
      success: true,
      data: formattedAppointment
    };
  } catch (error: any) {
    console.error(`[appointment-db-service] Randevu getirme hatası:`, error);
    return { 
      success: false, 
      error: `Randevu getirilirken hata oluştu: ${error.message}` 
    };
  }
}

/**
 * Veritabanında yeni bir randevu oluşturur
 * @param data - Randevu verileri
 * @returns {Promise<ServiceResponse<AppointmentWithRelations>>}
 */
export async function createAppointmentInDb(data: {
  customerId: string;
  staffId: string;
  serviceId: string;
  startTime: string | Date;
  endTime?: string | Date;
  notes?: string;
  status?: string;
  forceCreate?: boolean;
}): Promise<ServiceResponse<AppointmentWithRelations>> {
  const COMPONENT = 'appointment-db-service:createAppointmentInDb';
  traceLog(COMPONENT, 1, 'Fonksiyon başlatıldı');
  const perfData = startPerf(COMPONENT, 'createAppointment');
  
  try {
    debugLog(COMPONENT, 'Gelen veriler', data);
    
    // Gerekli alanları kontrol et
    traceLog(COMPONENT, 2, 'Zorunlu alanları kontrol ediliyor');
    if (!data.customerId || !data.staffId || !data.serviceId || !data.startTime) {
      errorLog(COMPONENT, 'Eksik zorunlu alanlar', { 
        customerId: !!data.customerId, 
        staffId: !!data.staffId, 
        serviceId: !!data.serviceId, 
        startTime: !!data.startTime 
      });
      return {
        success: false,
        error: 'Eksik zorunlu alan. customerId, staffId, serviceId ve startTime alanları gereklidir.'
      };
    }
    
    // Müşteri kontrolü
    traceLog(COMPONENT, 3, 'Müşteri kontrolü yapılıyor');
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      
      debugLog(COMPONENT, 'Müşteri sorgusu sonucu', !!customer ? 'Müşteri bulundu' : 'Müşteri bulunamadı');
      
      if (!customer) {
        errorLog(COMPONENT, 'Müşteri bulunamadı', { customerId: data.customerId });
        return {
          success: false,
          error: `Müşteri bulunamadı: ${data.customerId}`
        };
      }
    } catch (customerError: any) {
      errorLog(COMPONENT, 'Müşteri sorgulama hatası', customerError);
      return {
        success: false,
        error: `Müşteri sorgulanırken hata: ${customerError.message}`
      };
    }
    
    // Personel kontrolü
    traceLog(COMPONENT, 4, 'Personel kontrolü yapılıyor');
    try {
      const staff = await prisma.staff.findUnique({
        where: { id: data.staffId }
      });
      
      debugLog(COMPONENT, 'Personel sorgusu sonucu', !!staff ? 'Personel bulundu' : 'Personel bulunamadı');
      
      if (!staff) {
        errorLog(COMPONENT, 'Personel bulunamadı', { staffId: data.staffId });
        return {
          success: false,
          error: `Personel bulunamadı: ${data.staffId}`
        };
      }
      
      // Personelin çalışma saatlerini kontrol et
      traceLog(COMPONENT, 5, 'Personel çalışma saatleri kontrolü');
      const startTime = new Date(data.startTime);
      const dayOfWeek = startTime.getDay(); // 0: Pazar, 1: Pazartesi, ...
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      debugLog(COMPONENT, 'Tarih bilgileri', { 
        tarih: startTime.toISOString(), 
        gun: dayOfWeek, 
        gunAdi: dayName 
      });
      
      // Personelin çalışma saatlerini kontrol et
      if (staff.workingHours) {
        debugLog(COMPONENT, 'Personel çalışma saatleri (ham veri)', staff.workingHours);
        
        // Çalışma saatlerini normalize et
        const normalizedWorkingHours = normalizeWorkingHours(staff.workingHours);
        debugLog(COMPONENT, 'Normalize edilmiş çalışma saatleri', normalizedWorkingHours);
        
        if (normalizedWorkingHours) {
          const workingHoursForDay = normalizedWorkingHours[dayName];
          
          if (!workingHoursForDay || !workingHoursForDay.enabled) {
            errorLog(COMPONENT, 'Personel bu gün çalışmıyor', { dayName, workingHoursForDay });
            if (!data.forceCreate) {
              return {
                success: false,
                error: `Personel bu gün (${dayName}) çalışmıyor.`
              };
            } else {
              debugLog(COMPONENT, 'Personel bugün çalışmıyor ama forceCreate=true, devam ediliyor');
            }
          } else {
            // Saat kontrolü
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const startTimeMinutes = startHour * 60 + startMinute;
            
            const [workingStartHour, workingStartMinute] = workingHoursForDay.start.split(':').map(Number);
            const workingStartMinutes = workingStartHour * 60 + workingStartMinute;
            
            const [workingEndHour, workingEndMinute] = workingHoursForDay.end.split(':').map(Number);
            const workingEndMinutes = workingEndHour * 60 + workingEndMinute;
            
            debugLog(COMPONENT, 'Saat karşılaştırması', { 
              randevuBaslangic: `${startHour}:${startMinute} (${startTimeMinutes} dk)`,
              mesaiBaslangic: `${workingStartHour}:${workingStartMinute} (${workingStartMinutes} dk)`,
              mesaiBitis: `${workingEndHour}:${workingEndMinute} (${workingEndMinutes} dk)`
            });
            
            if (startTimeMinutes < workingStartMinutes || startTimeMinutes > workingEndMinutes) {
              errorLog(COMPONENT, 'Randevu saati çalışma saatleri dışında', { 
                randevuSaati: `${startHour}:${startMinute}`,
                calismaSaatleri: `${workingHoursForDay.start}-${workingHoursForDay.end}`
              });
              
              if (!data.forceCreate) {
                return {
                  success: false,
                  error: `Randevu saati (${startHour}:${startMinute}) personelin çalışma saatleri (${workingHoursForDay.start}-${workingHoursForDay.end}) dışında.`
                };
              } else {
                debugLog(COMPONENT, 'Çalışma saati dışında ama forceCreate=true, devam ediliyor');
              }
            }
          }
        }
      } else {
        debugLog(COMPONENT, 'Personel için çalışma saati tanımlanmamış');
      }
    } catch (staffError: any) {
      errorLog(COMPONENT, 'Personel sorgulama hatası', staffError);
      return {
        success: false,
        error: `Personel sorgulanırken hata: ${staffError.message}`
      };
    }
    
    // Hizmet kontrolü
    traceLog(COMPONENT, 6, 'Hizmet kontrolü yapılıyor');
    let service;
    try {
      service = await prisma.service.findUnique({
        where: { id: data.serviceId }
      });
      
      debugLog(COMPONENT, 'Hizmet sorgusu sonucu', !!service ? 'Hizmet bulundu' : 'Hizmet bulunamadı');
      
      if (!service) {
        errorLog(COMPONENT, 'Hizmet bulunamadı', { serviceId: data.serviceId });
        return {
          success: false,
          error: `Hizmet bulunamadı: ${data.serviceId}`
        };
      }
    } catch (serviceError: any) {
      errorLog(COMPONENT, 'Hizmet sorgulama hatası', serviceError);
      return {
        success: false,
        error: `Hizmet sorgulanırken hata: ${serviceError.message}`
      };
    }
    
    // endTime belirtilmemişse hesapla
    let startTimeObj: Date;
    let endTimeObj: Date;
    
    if (typeof data.startTime === 'string') {
      startTimeObj = new Date(data.startTime);
    } else {
      startTimeObj = data.startTime;
    }
    
    if (!data.endTime) {
      traceLog(COMPONENT, 7, 'endTime hesaplanıyor');
      endTimeObj = new Date(startTimeObj.getTime() + (service.duration || 60) * 60000);
      debugLog(COMPONENT, 'Hesaplanan endTime', endTimeObj.toISOString());
    } else {
      if (typeof data.endTime === 'string') {
        endTimeObj = new Date(data.endTime);
      } else {
        endTimeObj = data.endTime;
      }
    }
    
    // Çakışma kontrolü
    if (!data.forceCreate) {
      traceLog(COMPONENT, 8, 'Çakışma kontrolü yapılıyor');
      try {
        debugLog(COMPONENT, 'Çakışma kontrolü için tarih aralığı', {
          start: startTimeObj.toISOString(),
          end: endTimeObj.toISOString()
        });
        
        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            staffId: data.staffId,
            status: { notIn: ['CANCELLED'] },
            AND: [
              {
                startTime: {
                  lt: endTimeObj
                }
              },
              {
                endTime: {
                  gt: startTimeObj
                }
              }
            ]
          }
        });
        
        if (conflictingAppointment) {
          errorLog(COMPONENT, 'Çakışan randevu bulundu', {
            conflictId: conflictingAppointment.id,
            conflictStart: conflictingAppointment.startTime,
            conflictEnd: conflictingAppointment.endTime
          });
          
          return {
            success: false,
            error: 'Bu saat için personelin başka bir randevusu var.'
          };
        }
        
        debugLog(COMPONENT, 'Çakışma kontrolü başarılı, çakışan randevu yok');
      } catch (conflictError: any) {
        errorLog(COMPONENT, 'Çakışma kontrolü hatası', conflictError);
        return {
          success: false,
          error: `Çakışma kontrolü sırasında hata: ${conflictError.message}`
        };
      }
    } else {
      debugLog(COMPONENT, 'forceCreate=true olduğu için çakışma kontrolü atlandı');
    }
    
    // Randevu oluşturma
    traceLog(COMPONENT, 9, 'Randevu veritabanına kaydediliyor');
    try {
      debugLog(COMPONENT, 'Prisma create için hazırlanan veriler', {
        customerId: data.customerId,
        staffId: data.staffId,
        serviceId: data.serviceId,
        startTime: startTimeObj.toISOString(),
        endTime: endTimeObj.toISOString(),
        notes: data.notes || '',
        status: data.status || 'PENDING'
      });
      
      const appointment = await prisma.appointment.create({
        data: {
          customerId: data.customerId,
          staffId: data.staffId,
          serviceId: data.serviceId,
          startTime: startTimeObj,
          endTime: endTimeObj,
          notes: data.notes || '',
          status: data.status || 'PENDING'
        },
        include: {
          customer: true,
          staff: true,
          service: true
        }
      });
      
      traceLog(COMPONENT, 10, 'Randevu başarıyla oluşturuldu');
      debugLog(COMPONENT, 'Oluşturulan randevu', {
        id: appointment.id,
        customerId: appointment.customerId,
        staffId: appointment.staffId,
        serviceId: appointment.serviceId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status
      });
      
      // Performans ölçümünü bitir
      endPerf(perfData);
      
      return {
        success: true,
        data: appointment
      };
    } catch (createError: any) {
      errorLog(COMPONENT, 'Randevu oluşturma hatası', createError);
      return {
        success: false,
        error: `Randevu oluşturulurken hata oluştu: ${createError.message}`
      };
    }
  } catch (error: any) {
    errorLog(COMPONENT, 'Genel bir hata oluştu', error);
    return {
      success: false,
      error: `Randevu oluşturulurken beklenmeyen bir hata oluştu: ${error.message}`
    };
  }
}

/**
 * Veritabanından randevu kaydını siler
 * @param id - Silinecek randevunun kimliği
 * @returns {Promise<ServiceResponse<void>>}
 */
export async function deleteAppointmentFromDb(id: string): Promise<ServiceResponse<void>> {
  try {
    // Önce randevunun var olup olmadığını kontrol et
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return { 
        success: false, 
        error: `Randevu bulunamadı: ${id}` 
      };
    }
    
    // Randevuyu sil
    await prisma.appointment.delete({
      where: { id }
    });
    
    // İlgili tahsilatları da sil (eğer varsa)
    try {
      await prisma.payment.deleteMany({
        where: { appointmentId: id }
      });
    } catch (paymentError) {
      console.error('Randevu ödemeleri silinirken hata:', paymentError);
      // Bu hatayı geçiyoruz, asıl randevu silme işlemi başarılı olduysa
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Randevu silme hatası:', error);
    return { 
      success: false, 
      error: `Randevu silinirken hata oluştu: ${error.message}` 
    };
  }
}

/**
 * Veritabanında randevu durumunu günceller
 * @param id - Randevu ID'si
 * @param status - Yeni durum değeri
 * @returns {Promise<ServiceResponse<AppointmentWithRelations>>}
 */
export async function updateAppointmentStatusInDb(
  id: string, 
  status: string
): Promise<ServiceResponse<AppointmentWithRelations>> {
  try {
    // Önce randevunun var olup olmadığını kontrol et
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return { 
        success: false, 
        error: `Randevu bulunamadı: ${id}` 
      };
    }
    
    // Randevu durumunu güncelle
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        staff: true,
        service: true
      }
    });
    
    return { 
      success: true,
      data: updatedAppointment
    };
  } catch (error: any) {
    console.error('Randevu durumu güncelleme hatası:', error);
    return { 
      success: false, 
      error: `Randevu durumu güncellenirken hata oluştu: ${error.message}` 
    };
  }
}

/**
 * Veritabanında randevu bilgilerini günceller
 * @param id - Randevu ID'si
 * @param data - Güncellenecek veriler
 * @returns {Promise<ServiceResponse<AppointmentWithRelations>>}
 */
export async function updateAppointmentInDb(
  id: string, 
  data: {
    startTime?: string | Date;
    endTime?: string | Date;
    staffId?: string;
    serviceId?: string;
    notes?: string;
    status?: string;
    attendance?: string;
  }
): Promise<ServiceResponse<AppointmentWithRelations>> {
  try {
    // Önce randevunun var olup olmadığını kontrol et
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return { 
        success: false, 
        error: `Randevu bulunamadı: ${id}` 
      };
    }
    
    // Güncellenecek verileri hazırla
    const updateData: any = {};
    
    // Sadece tanımlı alanları güncelle
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.staffId) updateData.staffId = data.staffId;
    if (data.serviceId) updateData.serviceId = data.serviceId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;
    if (data.attendance) updateData.attendance = data.attendance;
    
    // Randevuyu güncelle
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        staff: true,
        service: true
      }
    });
    
    return { 
      success: true,
      data: updatedAppointment
    };
  } catch (error: any) {
    console.error('Randevu güncelleme hatası:', error);
    return { 
      success: false, 
      error: `Randevu güncellenirken hata oluştu: ${error.message}` 
    };
  }
}
