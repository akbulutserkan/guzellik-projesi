// Belirli bir gün ve saat için çalışma saatlerini kontrol et
export const checkBusinessHours = async (staffId: string, date: Date) => {
  try {
    // Günün tarihini YYYY-MM-DD formatında al
    const formattedDate = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0: Pazar, 1: Pazartesi, ...
    
    // API'den çalışma saatlerini getir
    const response = await fetch(`/api/appointments/availability?staffId=${staffId}&date=${formattedDate}`);
    
    if (!response.ok) {
      throw new Error('Günün çalışma saatleri alınamadı');
    }
    
    const data = await response.json();
    console.log('Çalışma saatleri verisi:', data);
    
    // Personel çalışma saatlerini kontrol et
    const staffSchedule = data.staffSchedule || [];
    const staffWorkingHours = staffSchedule.find((day: any) => day.dayOfWeek === dayOfWeek);
    
    // İşyeri çalışma saatlerini al
    const businessHours = data.businessHours || [];
    const businessDay = businessHours.find((day: any) => day.dayOfWeek === dayOfWeek);
    
    // Tatil veya özel gün mü kontrol et
    const exceptions = data.exceptions || [];
    const isHoliday = exceptions.length > 0 && !exceptions[0].isWorkingDay;
    
    // Personel bulunamazsa veya tatil günüyse
    if (isHoliday) {
      return { isWorkingDay: false, message: "Bugün işyeri kapalı.", businessHours: null, staffSchedule };
    }
    
    // Personel bu gün çalışıyor mu? (isWorking ve isWorkingDay alanlarını kontrol et)
    if (staffWorkingHours) {
    // Personel verisi hem 'isWorkingDay' hem de 'isWorking' alanı kullanabilir
      const isPersonnelWorking = staffWorkingHours.isWorkingDay !== undefined ? 
                               staffWorkingHours.isWorkingDay : 
                               staffWorkingHours.isWorking;
    
    // Eğer personel çalışmıyorsa
    if (isPersonnelWorking === false) {
      return { isWorkingDay: false, message: "Seçilen personel bu gün çalışmıyor.", businessHours: null, staffSchedule };
    }
  }
    
    // İşyeri bu gün açık mı?
    if (!businessDay || !businessDay.isWorkingDay) {
      return { isWorkingDay: false, message: "Bu gün işyeri kapalı.", businessHours: null, staffSchedule };
    }
    
    // Çalışma saatlerini dön
    const workingHours = {
      startTime: staffWorkingHours?.startTime || businessDay.startTime || "09:00",
      endTime: staffWorkingHours?.endTime || businessDay.endTime || "18:00"
    };
    
    return { 
      isWorkingDay: true, 
      message: "Bu gün işyeri açık.", 
      businessHours: workingHours,
      staffSchedule 
    };
  } catch (error) {
    console.error('Çalışma saati kontrolu hatası:', error);
    return { 
      isWorkingDay: true, // Hata durumunda varsayılan olarak açık kabul edelim
      message: "Bilgi alınamadı, varsayılan çalışma saatleri kullanılıyor.",
      businessHours: { startTime: "09:00", endTime: "18:00" },
      staffSchedule: [] 
    };
  }
};// Utility functions for finding available time slots

import { fetchAvailability } from '../services/api';
import { addDays } from 'date-fns';

// Format date for datetime-local input
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Personelin sonraki müsait saatini bul
export const findNextAvailableSlot = async (
  staffId: string, 
  serviceId: string, 
  startTime: Date,
  allServices: any[]
) => {
  try {
    const selectedService = allServices.find(s => s.id === serviceId);
    if (!selectedService) throw new Error("Hizmet bulunamadı");
    const serviceDuration = selectedService.duration || 60;

    // Günün tarihini al (YYYY-MM-DD)
    const dateStr = startTime.toISOString().split('T')[0];
    
    // Personelin günlük müsaitliğini getir
    const availabilityData = await fetchAvailability(staffId, startTime);
    
    // Randevuları sırala
    const appointments = availabilityData.appointments || [];
    const sortedAppointments = appointments.sort((a: any, b: any) => {
      const aStart = new Date(a.start || a.startTime);
      const bStart = new Date(b.start || b.startTime);
      return aStart.getTime() - bStart.getTime();
    });

    // Çalışma saatlerini kontrol et
    const dayOfWeek = startTime.getDay(); // 0: Pazar, 1: Pazartesi, ...
    
    // Önce personelin çalışma saatlerini kontrol et
    const staffSchedules = availabilityData.staffSchedule || [];
    const staffWorkingHours = staffSchedules.find((day: any) => day.dayOfWeek === dayOfWeek);
    
    // Varsayılan çalışma saatleri
    let startHour = 9;  
    let endHour = 18;   
    
    // Personel bugün çalışıyor mu? (isWorking veya isWorkingDay alanını kontrol et)
    const isPersonnelWorking = staffWorkingHours ? 
                             (staffWorkingHours.isWorkingDay !== undefined ? 
                              staffWorkingHours.isWorkingDay : 
                              staffWorkingHours.isWorking) : 
                             false;
                             
    if (staffWorkingHours && isPersonnelWorking) {
      // Evet, personelin çalışma saatlerini kullan
      if (staffWorkingHours.startTime && staffWorkingHours.endTime) {
        const [startH] = staffWorkingHours.startTime.split(':').map(Number);
        const [endH] = staffWorkingHours.endTime.split(':').map(Number);
        
        startHour = startH || startHour;
        endHour = endH || endHour;
      }
    } else {
      // Hayır, işletmenin çalışma saatlerini kontrol et
      const businessHours = availabilityData.businessHours || [];
      const businessDay = businessHours.find((day: any) => day.dayOfWeek === dayOfWeek);
      
      if (businessDay && businessDay.isWorkingDay) {
        // İşletme bugün açık
        if (businessDay.startTime && businessDay.endTime) {
          const [startH] = businessDay.startTime.split(':').map(Number);
          const [endH] = businessDay.endTime.split(':').map(Number);
          
          startHour = startH || startHour;
          endHour = endH || endHour;
        }
      } else {
        // Bugün iş günü değil
        return null;
      }
    }
    
    // Mesai saatleri için Date objeleri
    const businessStart = new Date(startTime);
    businessStart.setHours(startHour, 0, 0, 0);
    
    const businessEnd = new Date(startTime);
    businessEnd.setHours(endHour, 0, 0, 0);

    // Başlangıç zamanını ayarla (eğer çalışma saatleri içindeyse)
    let potentialStart = new Date(startTime);
    if (potentialStart < businessStart) {
      potentialStart = new Date(businessStart);
    }
    
    // Eğer zaten mesai saatleri bitti ise
    if (potentialStart >= businessEnd) {
      return null; // bugün için uygun zaman yok
    }
    
    // Her randevu için kontrol et
    for (let i = 0; i <= sortedAppointments.length; i++) {
      const current = sortedAppointments[i];
      const previousEnd = i === 0 ? potentialStart : new Date(sortedAppointments[i - 1].end || sortedAppointments[i - 1].endTime);
      const nextStart = current ? new Date(current.start || current.startTime) : businessEnd;
      
      // Boşluk yüksekliği (dakika olarak)
      const gap = (nextStart.getTime() - previousEnd.getTime()) / 60000;
      
      // Eğer yeterince boşluk varsa
      if (gap >= serviceDuration) {
        // Bitiş saati iş günü sonunu geçiyor mu?
        const randevuBitisi = new Date(previousEnd.getTime() + serviceDuration * 60000);
        if (randevuBitisi <= businessEnd) {
          return previousEnd; // Bu zamanla başlayabilir
        }
      }
    }

    // Mesai saatleri içinde uygun boşluk bulunamadı
    return null;
  } catch (error) {
    console.error('sonraki müsait saat aranirken hata:', error);
    throw error;
  }
};

// Find first available time slot with improved reliability
export const findFirstAvailableSlot = async (
  staffId: string, 
  serviceId: string, 
  startDate: Date,
  allServices: any[]
) => {
  try {
    console.log('Sonraki müsait zaman dilimi aranıyor...');
    console.log('Personel ID:', staffId);
    console.log('Hizmet ID:', serviceId);
    console.log('Başlangıç zamanı:', startDate.toISOString());
    
    // Hizmetin süresini bul
    const selectedService = allServices.find(s => s.id === serviceId);
    if (!selectedService) {
      console.error('Hizmet bulunamadı');
      throw new Error('Hizmet bilgisi bulunamadı');
    }
    
    const serviceDuration = selectedService.duration || 60; // Varsayılan 60 dakika
    console.log('Hizmet süresi:', serviceDuration, 'dakika');
    
    // Başlangıç tarihi için kopyasını al (yerel saat diliminde)
    let currentDate = new Date(startDate);
    
    // Eğer geçmiş bir zamansa, şu anki zamana ayarla
    const now = new Date();
    if (currentDate < now) {
      currentDate = new Date(now);
      // Dakikaları yuvarla (30 dakikalık dilimlere)
      const minutes = Math.ceil(currentDate.getMinutes() / 15) * 15;
      currentDate.setMinutes(minutes, 0, 0);
      
      // Eğer 60 dakikaya yuvarlama saat değişikliğine sebep olursa
      if (minutes === 60) {
        currentDate.setHours(currentDate.getHours() + 1, 0, 0, 0);
      }
      
      console.log('Başlangıç zamanı şu anki zamana güncellendi:', currentDate.toISOString());
    }

    // Maksimum 7 gün arayalım
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      // Eğer ilk gün değilse, sonraki güne geç
      if (dayOffset > 0) {
        currentDate = addDays(currentDate, 1);
        // Günün başlangıcına ayarla (genellikle sabah 9)
        currentDate.setHours(9, 0, 0, 0);
      }
      
      console.log(`Gün ${dayOffset + 1} için müsaitlik kontrol ediliyor: ${currentDate.toDateString()}`);
      
      try {
        // Bu gün için müsaitlik verisini al
        const availabilityData = await fetchAvailability(staffId, currentDate);
        
        // Varsayılan çalışma saatleri
        let startHour = 9;  
        let endHour = 18;   
        
        // Haftanın hangi günü olduğunu bul
        const dayOfWeek = currentDate.getDay(); // 0: Pazar, 1: Pazartesi, ...
        
        // Önce personelin çalışma saatlerini kontrol et
        const staffSchedules = availabilityData.staffSchedule || [];
        const staffWorkingHours = staffSchedules.find((day: any) => day.dayOfWeek === dayOfWeek);
        
        // Personel bugün çalışıyor mu? (isWorking veya isWorkingDay alanını kontrol et)
        const isPersonnelWorking = staffWorkingHours ? 
                                 (staffWorkingHours.isWorkingDay !== undefined ? 
                                  staffWorkingHours.isWorkingDay : 
                                  staffWorkingHours.isWorking) : 
                                 false;
                                 
        if (staffWorkingHours && isPersonnelWorking) {
          // Evet, personelin çalışma saatlerini kullan
          if (staffWorkingHours.startTime && staffWorkingHours.endTime) {
            const [startH] = staffWorkingHours.startTime.split(':').map(Number);
            const [endH] = staffWorkingHours.endTime.split(':').map(Number);
            
            startHour = startH || startHour;
            endHour = endH || endHour;
          }
        } else {
          // Hayır, işletmenin çalışma saatlerini kontrol et
          const businessHours = availabilityData.businessHours || [];
          const businessDay = businessHours.find((day: any) => day.dayOfWeek === dayOfWeek);
          
          if (businessDay && businessDay.isWorkingDay) {
            // İşletme bugün açık
            if (businessDay.startTime && businessDay.endTime) {
              const [startH] = businessDay.startTime.split(':').map(Number);
              const [endH] = businessDay.endTime.split(':').map(Number);
              
              startHour = startH || startHour;
              endHour = endH || endHour;
            }
          } else {
            // Ne personel ne de işletme bugün çalışıyor
            console.log(`${currentDate.toDateString()} günü çalışma günü değil, sonraki güne geçiliyor.`);
            continue; // Sonraki güne geç
          }
        }
        
        // İstisnai günleri kontrol et (tatiller, vb.)
        const exceptions = availabilityData.exceptions || [];
        if (exceptions.length > 0) {
          const todayException = exceptions[0]; // Aynı gün için istisna
          if (todayException && !todayException.isWorkingDay) {
            console.log(`${currentDate.toDateString()} tatil günü olarak işaretlenmiş, sonraki güne geçiliyor.`);
            continue; // Sonraki güne geç
          }
        }
        
        // Şu anki zaman vardiya sonuna yakın mı?
        if (dayOffset === 0 && 
            (currentDate.getHours() > endHour || 
             (currentDate.getHours() === endHour && currentDate.getMinutes() > 0))) {
          console.log('Mesai saatleri bitmiş, sonraki güne geçiliyor.');
          continue; // Sonraki güne geç
        }
        
        // Vardiya başlangıcından önce miyiz?
        let startingHour = currentDate.getHours();
        let startingMinute = currentDate.getMinutes();
        
        if (dayOffset === 0 && currentDate.getHours() < startHour) {
          console.log('Mesai saatleri henüz başlamamış, başlangıç saatine ayarlanıyor.');
          startingHour = startHour;
          startingMinute = 0;
        }
        
        // Aktif randevuları al - sadece PENDING ve CONFIRMED durumundakiler
        const existingAppointments = availabilityData.appointments || [];
        console.log(`Bugün için ${existingAppointments.length} aktif randevu var.`);
        
        // Her zaman dilimini 15 dakikalık aralıklarla kontrol et
        for (let hour = startingHour; hour < endHour; hour++) {
          // Başlangıç dakikası - eğer şu anki saatse, şu anki dakikadan başla
          let startMin = hour === startingHour ? startingMinute : 0;
          // 15 dakikalık dilimlere yuvarla
          startMin = Math.ceil(startMin / 15) * 15;
          
          // Her saatte 15 dakikalık dilimleri kontrol et (0, 15, 30, 45)
          for (let minute = startMin; minute < 60; minute += 15) {
            // Test edilecek zaman dilimi
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, minute, 0, 0);
            
            // Hizmetin bitiş zamanı
            const slotEnd = new Date(slotTime.getTime() + serviceDuration * 60000);
            
            // Eğer hizmet mesai saatlerinin dışına taşıyorsa, atla
            if (slotEnd.getHours() > endHour || 
                (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) {
              continue;
            }
            
            // Bu zaman dilimi için çakışma kontrol et
            let hasConflict = false;
            
            for (const apt of existingAppointments) {
              // Randevunun başlangıç ve bitiş zamanları
              // API cevap formatına uygun alan adlarını kullan
              const aptStart = new Date(apt.start || apt.startTime);
              const aptEnd = new Date(apt.end || apt.endTime);
              
              // Çakışma kontrol formülü
              // (A başlangıç < B bitiş) VE (A bitiş > B başlangıç)
              if (slotTime < aptEnd && slotEnd > aptStart) {
                hasConflict = true;
                break;
              }
            }
            
            // Eğer bu zaman dilimi müsaitse
            if (!hasConflict) {
              console.log(`Müsait zaman dilimi bulundu: ${slotTime.toLocaleTimeString()}`);
              return slotTime; // İlk müsait zaman dilimini hemen döndür
            }
          }
        }
        
        console.log(`${currentDate.toDateString()} günü için müsait zaman bulunamadı, sonraki güne geçiliyor.`);
      } catch (err) {
        console.error(`Gün ${dayOffset + 1} için müsaitlik verisi alınırken hata:`, err);
        // Hata olursa sonraki güne geç, günü atla
      }
    }
    
    // Tüm günler kontrol edildi ama müsait zaman bulunamadı
    console.warn('7 gün içinde müsait zaman bulunamadı');
    return null;
    
  } catch (error) {
    console.error('Müsait zaman aranırken hata oluştu:', error);
    throw error; // Hatayı yukarı ilet
  }
};