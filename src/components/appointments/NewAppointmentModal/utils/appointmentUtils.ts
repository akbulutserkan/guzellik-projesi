// Utility functions for appointment creation and management

import { addMinutes } from "date-fns";
// Sunucu ve istemci tarafı birlikte çalıştığı için merkezi API servisini kullanıyoruz
import { ApiService } from "@/services/api";
import { checkBusinessHours, findNextAvailableSlot } from "./timeSlotUtils";

// Randevunun mesai saatlerini aşıp aşmadığını kontrol et
export const checkIfOutsideBusinessHours = async (staffId: string, startTime: Date, endTime: Date) => {
  // Çalışma saatlerini al
  const businessHoursCheck = await checkBusinessHours(staffId, startTime);
  
  if (!businessHoursCheck.isWorkingDay) {
    return {
      isOutside: true,
      message: businessHoursCheck.message
    };
  }
  
  if (!businessHoursCheck.businessHours) {
    return {
      isOutside: true,
      message: "Bu gün için çalışma saati bilgisi alınamadı."
    };
  }
  
  // Çalışma saatlerini parse et
  const [startHour, startMinute] = businessHoursCheck.businessHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = businessHoursCheck.businessHours.endTime.split(':').map(Number);
  
  // İşyeri başlangıç ve bitiş saatleri
  const businessStart = new Date(startTime);
  businessStart.setHours(startHour, startMinute, 0, 0);
  
  const businessEnd = new Date(startTime);
  businessEnd.setHours(endHour, endMinute, 0, 0);
  
  // Randevunun başlangıç veya bitiş saati mesai dışında mı kontrol et
  const isStartBeforeBusiness = startTime < businessStart;
  const isEndAfterBusiness = endTime > businessEnd;
  
  if (isStartBeforeBusiness) {
    return {
      isOutside: true,
      message: `Randevu başlangıç saati (${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}) işyeri açılış saatinden (${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}) önce.`
    };
  }
  
  if (isEndAfterBusiness) {
    return {
      isOutside: true,
      message: `Randevu bitiş saati (${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}) işyeri kapanış saatinden (${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}) sonra.`,
      businessHours: businessHoursCheck.businessHours
    };
  }
  
  return {
    isOutside: false,
    message: "Randevu işyeri çalışma saatleri içerisinde."
  };
};

// Auto-schedule an appointment after a previous service
export const autoScheduleAppointmentAfterService = async (
  formData: any,
  defaultStartTime: string,
  defaultCustomerId: string,
  allServices: any[],
  toast: any,
  onSuccess: (appointmentData?: any) => Promise<void>,
  onOpenChange: (open: boolean) => void,
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>,
  setServiceSearch: React.Dispatch<React.SetStateAction<string>>
) => {
  try {
    console.log("Otomatik hizmet planlama başlatılıyor...");
    console.log("Form verileri:", JSON.stringify(formData));
    console.log("defaultStartTime:", defaultStartTime);
    console.log("defaultCustomerId:", defaultCustomerId);
    
    // Eğer gerekli bilgiler eksikse
    if (!defaultStartTime || !defaultCustomerId || !formData.staffId || !formData.serviceId) {
      console.log("Otomatik planlama için eksik bilgiler:");
      console.log("defaultStartTime:", defaultStartTime ? "var" : "yok");
      console.log("defaultCustomerId:", defaultCustomerId ? "var" : "yok");
      console.log("formData.staffId:", formData.staffId ? "var" : "yok");
      console.log("formData.serviceId:", formData.serviceId ? "var" : "yok");
      throw new Error("Otomatik planlama için eksik bilgi");
    }

    console.log(`Önceki randevu bitiş zamanı: ${defaultStartTime}`);
    console.log(`Seçilen personel ID: ${formData.staffId}`);
    console.log(`Seçilen hizmet ID: ${formData.serviceId}`);
    
    // Önce allServices'i kontrol et
    if (!Array.isArray(allServices)) {
      console.error('HATA: allServices bir dizi değil:', allServices);
      throw new Error("Hizmet listesi yüklenemedi");
    }
    
    if (allServices.length === 0) {
      console.warn('UYARI: allServices dizisi boş');
      throw new Error("Hizmet listesi boş");
    }
    
    // Seçilen hizmet bilgisini manuel olarak bul
    let selectedService = null;
    for (let i = 0; i < allServices.length; i++) {
      if (allServices[i].id === formData.serviceId) {
        selectedService = allServices[i];
        break;
      }
    }
    if (!selectedService) {
      throw new Error("Hizmet bilgisi bulunamadı");
    }
    console.log(`Seçilen hizmet: ${selectedService.name}, Süresi: ${selectedService.duration} dakika`);
    
    // Önceki randevunun bitiş saatini al (bu, yeni randevunun en erken başlangıç saati olacak)
    const previousEndTime = new Date(defaultStartTime);
    const serviceDuration = selectedService.duration || 60;
      
    // Sonraki müsait saati bul
    console.log("Bir sonraki müsait saat aranıyor...");
    const nextSlot = await findNextAvailableSlot(formData.staffId, formData.serviceId, previousEndTime, allServices);

    // Eğer müsait bir zaman bulunursa onu kullan
    if (nextSlot) {
      console.log(`Müsait saat bulundu: ${nextSlot.toISOString()}`);
      const endTime = new Date(nextSlot.getTime() + serviceDuration * 60000);
      console.log(`Yeni hizmet başlangıç: ${nextSlot.toLocaleTimeString()}, bitiş: ${endTime.toLocaleTimeString()}`);

      try {
        // Create appointment data
        const appointmentData = {
          ...formData,
          startTime: nextSlot.toISOString(),
          endTime: endTime.toISOString(),
        };
        
        console.log("Oluşturulacak randevu verisi:", JSON.stringify(appointmentData));
        
        // Create appointment using ApiService (merkezi API servisi)
        console.log("DETAYLI LOG: Randevu oluşturuluyor API çağrısı ile...");
        let responseData;
        try {
          const result = await ApiService.appointments.create(appointmentData);
          
          if (!result.success) {
            throw new Error(result.error || 'Randevu oluşturulamadı');
          }
          
          responseData = result.data;
          console.log("DETAYLI LOG: Randevu başarıyla oluşturuldu, API yanıtı:", responseData);
        } catch (createError) {
          console.error("Randevu oluşturma sırasında hata yakalandı:", createError);
          toast({
            title: "Randevu Oluşturma Hatası",
            description: createError instanceof Error ? createError.message : 'Bilinmeyen hata',
            variant: "destructive"
          });
          throw createError;
        }
        
        // Normal başarı bildirimi
        toast({
          title: "Başarılı",
          description: "Yeni hizmet randevusu oluşturuldu",
          variant: "success"
        });
        
        // Zenginleştirilmiş veriyi dön
        const enrichedData = {
          ...responseData,
          start: nextSlot.toISOString(),
          end: endTime.toISOString(),
          service: selectedService
        };
        
        // Success, update calendar and close modal - onSuccess'i await olmadan çağır
        // böylece çift API çağrısını önleriz
        console.log("DETAYLI LOG: onSuccess callback çağrılıyor - await OLMADAN!");
        onSuccess(enrichedData);
        
        return enrichedData; // Return the created appointment data
      } catch (err: any) {
        console.error('Randevu oluşturma sırasında hata yakalandı:', err);
        // Eğer çakışma varsa veya mesai saatleri dışındaysa hata fırlat
        if (err.message.includes("çakışma") || 
            err.message.includes("conflict") ||
            err.message.includes("working hours") ||
            err.message.includes("mesai") ||
            err.message.includes("randevu bulunmaktadır")) {
          console.log("Otomatik randevu oluşturma sırasında çakışma tespit edildi:", err.message);
          throw err; // Hata fırlat, yukarıda kullanıcıya soracağız
        }
        throw err; // Diğer hataları da aynen fırlat
      }
    } else {
      // Boş saat bulunamadıysa, işletme çalışma saatleri kontrolü yap
      console.log("Müsait saat bulunamadı, işletme çalışma saatlerini kontrol ediyorum...");
      
      // Personelin randevularını getir
      const appointments = await fetch(`/api/appointments?staffId=${formData.staffId}&date=${previousEndTime.toISOString().split('T')[0]}`)
        .then(res => res.json());
      
      // Randevuları sırala
      const sortedAppointments = appointments.sort((a: any, b: any) => 
        new Date(a.endTime || a.end).getTime() - new Date(b.endTime || b.end).getTime());
      
      // Son randevuyu bul
      const lastAppointment = sortedAppointments.length > 0 ? 
        sortedAppointments[sortedAppointments.length - 1] : null;
      
      // Önerilen başlangıç saati - son randevunun bitiş saati veya önceki randevunun bitiş saati
      const proposedStart = lastAppointment ? 
        new Date(lastAppointment.endTime || lastAppointment.end) : 
        new Date(previousEndTime);
      
      // Yeni hizmetin bitiş zamanını hesapla
      const proposedEnd = new Date(proposedStart.getTime() + serviceDuration * 60000);
      
      // İşletme çalışma saatlerini kontrol et
      const businessHoursCheck = await checkBusinessHours(formData.staffId, proposedStart);
      
      // Eğer işletme kapalıysa
      if (!businessHoursCheck.isWorkingDay) {
        return {
          conflict: true,
          type: 'closed',
          message: businessHoursCheck.message,
          proposedStart: null
        };
      }
      
      // Öneri zamanı günlük işletme mesaisini aşıyor mu kontrol et
      if (businessHoursCheck.businessHours) {
        // Önce personelin çalışma saatlerini kontrol et
        const dayOfWeek = proposedStart.getDay(); // 0: Pazar, 1: Pazartesi, ...
        const staffSchedules = businessHoursCheck.staffSchedule || [];
        const staffWorkingHours = staffSchedules.find((day: any) => {
          // day veya dayOfWeek alanı kullanabilir
          return (day.day === dayOfWeek || day.dayOfWeek === dayOfWeek);
        });
        
        // Personel mesai bitiş saati
        let endHour, endMinute;
        let endTimeSource = "işletme";
        
        // Personel bugün çalışıyor mu? (isWorking veya isWorkingDay alanını kontrol et)
        const isPersonnelWorking = staffWorkingHours ? 
                                 (staffWorkingHours.isWorkingDay !== undefined ? 
                                  staffWorkingHours.isWorkingDay : 
                                  staffWorkingHours.isWorking) : 
                                 false;
        
        // Önce personelin çalışma saatlerini kontrol et, yoksa işletme saatlerini al
        if (staffWorkingHours && isPersonnelWorking && staffWorkingHours.endTime) {
          [endHour, endMinute] = staffWorkingHours.endTime.split(':').map(Number);
          endTimeSource = "personel";
        } else {
          [endHour, endMinute] = businessHoursCheck.businessHours.endTime.split(':').map(Number);
        }
        
        // Mesai bitiş saati
        const shiftEndTime = new Date(proposedStart);
        shiftEndTime.setHours(endHour, endMinute, 0, 0);
        
        if (proposedEnd > shiftEndTime) {
          // Saat bilgilerini formatla
          const startTime = `${proposedStart.getHours().toString().padStart(2, '0')}:${proposedStart.getMinutes().toString().padStart(2, '0')}`;
          const endTime = `${proposedEnd.getHours().toString().padStart(2, '0')}:${proposedEnd.getMinutes().toString().padStart(2, '0')}`;
          const closingTime = `${shiftEndTime.getHours().toString().padStart(2, '0')}:${shiftEndTime.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            conflict: true,
            type: 'outside_hours',
            message: `Bu hizmete ait randevu ${endTimeSource} mesai saatleri dışına denk geliyor. Önerilen saat: ${startTime} - ${endTime}, mesai bitiş saati: ${closingTime}`,
            proposedStart: proposedStart,
            proposedEnd: proposedEnd,
            shiftEndTime: shiftEndTime
          };
        }
      }
      
      // Saat bilgisini formatla
      const proposedTime = `${proposedStart.getHours().toString().padStart(2, '0')}:${proposedStart.getMinutes().toString().padStart(2, '0')}`;
      
      // Çakışma durumunda önerilen saati içeren bilgi dön
      return {
        conflict: true,
        type: 'booked',
        message: `Personelin boş saati bulunamadı. Önerilen zaman: ${proposedTime}`,
        proposedStart: proposedStart,
        proposedEnd: proposedEnd
      };
    }
  } catch (error) {
    console.error("Otomatik randevu planlamada hata:", error);
    throw error;
  }
};

// Create appointment with conflict resolution
export const createAppointmentWithConflictResolution = async (
  formData: any,
  appointment: any,
  allServices: any[],
  toast: any,
  onSuccess: (appointmentData?: any) => Promise<void>,
  onOpenChange: (open: boolean) => void,
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>,
  setServiceSearch: React.Dispatch<React.SetStateAction<string>>,
  setShowWorkingHoursWarning: React.Dispatch<React.SetStateAction<boolean>>,
  setIsWorkingHoursValid: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    // Önce allServices'i kontrol et - bu kontrol allServices.find hatalarını önler
    if (!Array.isArray(allServices)) {
      console.error('HATA: allServices bir dizi değil:', allServices);
      throw new Error("Hizmet listesi yüklenemedi");
    }
    
    if (allServices.length === 0) {
      console.warn('UYARI: allServices dizisi boş');
    }
    
    // Seçili hizmeti bul - array yerine manuel arama
    let selectedService = null;
    for (let i = 0; i < allServices.length; i++) {
      if (allServices[i].id === formData.serviceId) {
        selectedService = allServices[i];
        break;
      }
    }
    
    if (!selectedService) {
      throw new Error("Hizmet bilgisi bulunamadı");
    }
    
    const startTime = new Date(formData.startTime);
    const endTime = addMinutes(startTime, selectedService.duration || 60);

    // İşletme çalışma saatleri kontrolü
    const hoursCheck = await checkIfOutsideBusinessHours(formData.staffId, startTime, endTime);
    if (hoursCheck.isOutside) {
      // İşletme saatleri dışında - kullanıcı onayı iste
      return {
        conflict: true,
        type: 'outside_hours',
        message: hoursCheck.message,
        proposedStart: startTime,
        proposedEnd: endTime
      };
    }

    // Data to be sent for appointment
    const appointmentData = {
      ...formData,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    try {
      let response;
      
      // If editing an existing appointment, send PUT request
      // Otherwise send POST request for new appointment
      console.log("DETAYLI LOG: Randevu verileri gönderiliyor:", JSON.stringify(appointmentData));
      try {
        let result;
        if (appointment) {
          result = await ApiService.appointments.update(appointment.id, appointmentData);
        } else {
          result = await ApiService.appointments.create(appointmentData);
        }
        
        // API yanıtını kontrol et
        if (!result.success) {
          throw new Error(result.error || 'Randevu işlemi başarısız');
        }
        
        response = result.data;
        console.log("DETAYLI LOG: Randevu başarıyla oluşturuldu/güncellendi, yanıt:", response);
      } catch (createError) {
        console.error("Randevu oluşturma/güncelleme API hatası:", createError);
        // Çakışma hatası kontrolü
        if (createError instanceof Error && 
            (createError.message.includes("çakışma") || 
             createError.message.includes("conflict") || 
             createError.message.includes("mesai") ||
             createError.message.includes("working hours") ||
             createError.message.includes("randevu bulunmaktadır"))) {
          return {
            conflict: true,
            type: 'booked',
            message: createError.message,
            proposedStart: startTime,
            proposedEnd: endTime
          };
        }
        // Diğer hatalar için toast bildirimi
        toast({
          title: "Randevu Hatası",
          description: createError instanceof Error ? createError.message : 'Bilinmeyen hata',
          variant: "destructive"
        });
        throw createError; 
      }
      
      toast({
        title: "Başarılı",
        description: appointment ? "Randevu başarıyla güncellendi" : "Randevu başarıyla oluşturuldu",
      });
      
      // Zenginleştirilmiş veriyi oluştur
      const enrichedData = {
        ...response,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        service: selectedService
      };
      
      // Reset states on success - await KALDIRILIYOR
      // Çift API çağrısını önlemek için onSuccess'i await olmadan çağırıyoruz
      console.log("DETAYLI LOG: createAppointmentWithConflictResolution onSuccess çağrılıyor");
      onSuccess(enrichedData); // Refresh calendar and pass back enriched data
      
      // Close modal and reset all states
      setFormData({
        customerId: "",
        serviceId: "",
        staffId: "",
        startTime: "",
        notes: "",
      });
      setCustomerSearch("");
      setServiceSearch("");
      setShowWorkingHoursWarning(false);
      setIsWorkingHoursValid(true);
      onOpenChange(false);
      
      return enrichedData; // Return the created appointment data
    } catch (error: any) {
      // Çakışma durumunda hata fırlat - kulanıcıya sor
      if (error.message.includes("çakışma") || 
          error.message.includes("conflict") || 
          error.message.includes("working hours") ||
          error.message.includes("mesai") ||
          error.message.includes("randevu bulunmaktadır")) {
        return {
          conflict: true,
          type: 'booked',
          message: error.message,
          proposedStart: startTime,
          proposedEnd: endTime
        };
      } else {
        // Not a conflict error or editing existing appointment, re-throw
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Randevu işleminde hata:", error);
    throw error;
  }
};