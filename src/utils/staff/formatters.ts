

/**
 * Türkçe telefon numarasını formatlar
 * Ör: 5301234567 -> (530) 123 45 67
 */
export function formatPhoneNumber(phone: string): string {
  // Sadece rakamları al
  const cleaned = phone.replace(/\D/g, '');
  
  // Başında 0 varsa kaldır
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  
  // 10 rakam değilse, olduğu gibi döndür
  if (withoutLeadingZero.length !== 10) {
    return phone;
  }
  
  // Formatlı telefon numarası: (5XX) XXX XX XX
  return `(${withoutLeadingZero.slice(0, 3)}) ${withoutLeadingZero.slice(3, 6)} ${withoutLeadingZero.slice(6, 8)} ${withoutLeadingZero.slice(8, 10)}`;
}

// --------------------------------------

/**
 * Çalışma saatlerini server formatına dönüştürür.
 * Frontend'de 'day' alanı kullanılırken, backend'de 'dayOfWeek' alanı beklendiğinden,
 * bu dönüşümü sağlar.
 */
export function formatWorkingHoursForServer(workingHours: any[]): any[] {
  if (!workingHours || !Array.isArray(workingHours)) {
    return [];
  }
  
  return workingHours.map(hour => ({
    dayOfWeek: hour.day || hour.dayOfWeek, // day alanını dayOfWeek olarak aktar
    day: hour.day || hour.dayOfWeek, // Geriye dönük uyumluluk için day alanını da koru
    isWorking: hour.isWorking,
    startTime: hour.startTime,
    endTime: hour.endTime
  }));
}

// --------------------------------------

/**
 * İsmi formatlama işlemi
 * Her kelimenin ilk harfi büyük, diğerleri küçük yapılır
 */
export function formatNameCapitalize(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --------------------------------------

/**
 * Personel hesap tipini formatlar
 */
export function formatAccountType(accountType: string): string {
  if (!accountType) return '';
  
  const accountTypeLabels: Record<string, string> = {
    'ADMIN': 'Admin',
    'MANAGER': 'Yönetici',
    'STAFF': 'Personel',
    'CASHIER': 'Kasiyer'
  };
  
  return accountTypeLabels[accountType.toUpperCase()] || accountType;
}

// --------------------------------------

/**
 * Hizmet verilen cinsiyet bilgisini formatlar
 */
export function formatServiceGender(gender: string): string {
  if (!gender) return 'Hepsi';
  
  const genderLabels: Record<string, string> = {
    'WOMEN': 'Kadın',
    'MEN': 'Erkek',
    'UNISEX': 'Hepsi'
  };
  
  return genderLabels[gender.toUpperCase()] || gender;
}

// --------------------------------------

/**
 * Çalışma saatleri formatları
 */
export function formatDayOfWeek(day: number): string {
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  return days[day - 1] || `Gün ${day}`;
}

// --------------------------------------

/**
 * Saat formatlar
 */
export function formatTimeForDisplay(time: string): string {
  // Saat string formatında, ör: "09:00:00"
  if (!time) return '';
  
  // İlk iki noktaya kadar al (saat:dakika)
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  
  return time;
}

// --------------------------------------

/**
 * Kullanıcı arayüzü için çalışma saatlerini döndürür
 */
export function formatWorkingHoursForDisplay(workingHours: any[]): string {
  if (!workingHours || !Array.isArray(workingHours) || workingHours.length === 0) {
    return 'Çalışma saati yok';
  }
  
  // Günleri sırala (Pazartesi=1, Salı=2, ...)
  const sortedHours = [...workingHours].sort((a, b) => {
    const dayA = a.dayOfWeek || a.day; 
    const dayB = b.dayOfWeek || b.day;
    return dayA - dayB;
  });
  
  // Gün ve saatleri formatla
  return sortedHours.map(hours => {
    const dayValue = hours.dayOfWeek || hours.day;
    const day = formatDayOfWeek(dayValue);
    const start = formatTimeForDisplay(hours.startTime);
    const end = formatTimeForDisplay(hours.endTime);
    
    return `${day}: ${start} - ${end}`;
  }).join(', ');
}
