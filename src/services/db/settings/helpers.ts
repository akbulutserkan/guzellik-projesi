/**
 * Ayarlar (Settings) modülü için yardımcı fonksiyonlar
 */

/**
 * Gün ismine göre numara döndürür (0: Pazar, 6: Cumartesi)
 * @param day Gün ismi (sunday, monday, ...)
 * @returns Gün numarası
 */
export function getDayNumber(day: string): number {
  const days: {[key: string]: number} = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  return days[day.toLowerCase()] ?? 0;
}

/**
 * Gün numarasına göre isim döndürür
 * @param dayNumber Gün numarası (0: Pazar, 6: Cumartesi)
 * @returns Gün ismi
 */
export function getDayName(dayNumber: number): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber] || 'sunday';
}

/**
 * Veritabanından gelen çalışma günlerini frontend için formatlar
 * @param businessDays Veritabanından gelen çalışma günleri
 * @returns Frontend için formatlanmış çalışma günleri
 */
export function formatBusinessDaysForFrontend(businessDays: any[]) {
  return businessDays.reduce((acc: any, day) => {
    const dayName = getDayName(day.dayOfWeek);
    acc[dayName] = {
      enabled: day.isWorkingDay,
      start: day.startTime || '',
      end: day.endTime || ''
    };
    return acc;
  }, {} as any);
}

/**
 * Çalışma saati formatını doğrular (HH:MM)
 * @param time Zaman değeri
 * @returns Format doğru ise true, değilse false
 */
export function validateTimeFormat(time: string): boolean {
  // Boş değere izin ver
  if (!time) return true;
  
  // HH:MM formatını kontrol et
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * Ayarları anahtar-değer formatında düzenler
 * @param settings Veritabanından gelen ayarlar
 * @returns Anahtar-değer formatında ayarlar
 */
export function formatSettingsToKeyValue(settings: any[]) {
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as any);
}
