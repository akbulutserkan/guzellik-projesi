/**
 * Çalışma saatleri modülü için yardımcı fonksiyonlar
 */

/**
 * Zaman formatı doğrulaması (HH:MM)
 * @param time Kontrol edilecek zaman değeri
 * @returns Format doğru ise true, değilse false
 */
export function isValidTimeFormat(time?: string): boolean {
  if (!time) return false;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Zaman aralığı doğrulaması (başlangıç < bitiş)
 * @param startTime Başlangıç zamanı (HH:MM)
 * @param endTime Bitiş zamanı (HH:MM)
 * @returns Doğru sıralamada ise true, değilse false
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return startMinutes < endMinutes;
}

/**
 * Zaman değerini dakika cinsine çevirir
 * @param time Zaman değeri (HH:MM)
 * @returns Dakika cinsinden toplam değer
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Çalışma saatlerinde çakışma kontrolü yapar
 * @param workingHours Kontrol edilecek çalışma saatleri dizisi
 * @returns Hata mesajları dizisi, sorun yoksa boş dizi
 */
export function checkTimeOverlaps(workingHours: any[]): string[] {
  const errors: string[] = [];
  
  // Aynı gün için çakışma kontrolü
  const dayGroups: { [key: string]: any[] } = {};
  
  workingHours.forEach(hour => {
    if (hour.dayOfWeek !== undefined) {
      if (!dayGroups[hour.dayOfWeek]) {
        dayGroups[hour.dayOfWeek] = [];
      }
      
      dayGroups[hour.dayOfWeek].push(hour);
    }
  });
  
  for (const day in dayGroups) {
    const periods = dayGroups[day];
    
    if (periods.length <= 1) continue;
    
    // Zaman aralıklarını dakika cinsinden diziye çevir
    const timeRanges = periods.map(period => {
      return {
        start: timeToMinutes(period.startTime),
        end: timeToMinutes(period.endTime)
      };
    });
    
    // Çakışma kontrolü
    for (let i = 0; i < timeRanges.length; i++) {
      for (let j = i + 1; j < timeRanges.length; j++) {
        const range1 = timeRanges[i];
        const range2 = timeRanges[j];
        
        if ((range1.start < range2.end && range1.end > range2.start) ||
            (range2.start < range1.end && range2.end > range1.start)) {
          errors.push(`Gün ${day} için çalışma saatleri çakışıyor: ${periods[i].startTime}-${periods[i].endTime} ve ${periods[j].startTime}-${periods[j].endTime}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Çalışma saati verilerinin temel validasyonu
 * @param data Çalışma saati verisi
 * @returns Hata mesajı (sorun yoksa null)
 */
export function validateWorkingHourData(data: any): string | null {
  // Zorunlu alan kontrolü
  if (data.dayOfWeek === undefined || data.startTime === undefined || data.endTime === undefined) {
    return 'Gün, başlangıç ve bitiş saati bilgileri gerekli';
  }

  // Gün değeri geçerli mi?
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    return `Geçersiz gün değeri: ${data.dayOfWeek}. Gün değeri 0-6 arasında olmalıdır (0: Pazar, 6: Cumartesi)`;
  }

  // Zaman formatı geçerli mi?
  if (!isValidTimeFormat(data.startTime)) {
    return `Geçersiz başlangıç saati formatı: ${data.startTime}. Format HH:MM şeklinde olmalıdır`;
  }

  if (!isValidTimeFormat(data.endTime)) {
    return `Geçersiz bitiş saati formatı: ${data.endTime}. Format HH:MM şeklinde olmalıdır`;
  }

  // Başlangıç zamanı bitiş zamanından önce mi?
  if (!isValidTimeRange(data.startTime, data.endTime)) {
    return `Başlangıç saati (${data.startTime}) bitiş saatinden (${data.endTime}) önce olmalıdır`;
  }

  return null;
}
