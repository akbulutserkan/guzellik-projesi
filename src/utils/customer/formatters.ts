'use client';

/**
 * Müşteri veri formatlamaları ve doğrulama işlevleri
 */

/**
 * Telefon numarasını standart formata çevirir
 * @param phone Telefon numarası
 * @returns Formatlanmış telefon numarası
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Sadece rakamları al
  const numbers = phone.replace(/\D/g, '');
  
  // 10 haneli numara kontrolü (Alan kodu olmadan)
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
  }
  
  // 11 haneli numara kontrolü (5XX)
  if (numbers.length === 11 && numbers.startsWith('5')) {
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
  }
  
  // Diğer durumlar için orjinal numarayı döndür
  return phone;
};

/**
 * Müşteri ad soyadını formatlar
 * @param name Müşteri adı
 * @returns Formatlanmış isim
 */
export const formatCustomerName = (name: string): string => {
  if (!name) return '';
  
  // Boşlukları temizle ve her kelimenin ilk harfini büyük yap
  return name
    .trim()
    .split(' ')
    .map(part => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1).toLocaleLowerCase('tr-TR'))
    .join(' ');
};

/**
 * E-posta adresinin geçerli olup olmadığını kontrol eder
 * @param email E-posta adresi
 * @returns Geçerli ise true, değilse false
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // Boş email geçerlidir (zorunlu değil)
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Telefon numarasının geçerli olup olmadığını kontrol eder
 * @param phone Telefon numarası
 * @returns Geçerli ise true, değilse false
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false; // Boş telefon geçersizdir (zorunlu)
  
  // Sadece rakamları al
  const numbers = phone.replace(/\D/g, '');
  
  // 10 veya 11 haneli bir numara olmalı
  return numbers.length >= 10 && numbers.length <= 11;
};

/**
 * Müşteri adının geçerli olup olmadığını kontrol eder
 * @param name Müşteri adı
 * @returns Geçerli ise true, değilse false
 */
export const isValidName = (name: string): boolean => {
  if (!name) return false; // Boş isim geçersizdir (zorunlu)
  
  // İsim en az 3 karakter olmalı ve sayı içermemeli
  return name.trim().length >= 3 && !/\d/.test(name);
};

/**
 * Yeni müşteri için gerekli alanların dolu olup olmadığını kontrol eder
 * @param customer Müşteri verisi
 * @returns Doğrulama hatası varsa hata mesajı, yoksa null
 */
export const validateCustomer = (customer: any): string | null => {
  if (!customer.name || !isValidName(customer.name)) {
    return 'Geçerli bir isim giriniz (en az 3 karakter)';
  }
  
  if (!customer.phone || !isValidPhone(customer.phone)) {
    return 'Geçerli bir telefon numarası giriniz';
  }
  
  if (customer.email && !isValidEmail(customer.email)) {
    return 'Geçerli bir e-posta adresi giriniz';
  }
  
  return null;
};

/**
 * Müşteri verisini görüntüleme formatına çevirir
 * @param customer Ham müşteri verisi
 * @returns Görüntüleme için formatlanmış veri
 */
export const formatCustomerForDisplay = (customer: any): any => {
  if (!customer) return null;
  
  return {
    ...customer,
    name: formatCustomerName(customer.name),
    phone: formatPhoneNumber(customer.phone),
    createdAtFormatted: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('tr-TR') : '',
    updatedAtFormatted: customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString('tr-TR') : ''
  };
};

/**
 * Müşteri verisini API'ye gönderilecek formata çevirir
 * @param customer Ham müşteri verisi
 * @returns API için hazırlanmış veri
 */
export const formatCustomerForApi = (customer: any): any => {
  // Telefon numarasından tüm boşluk ve karakterleri kaldır
  const formattedPhone = customer.phone?.replace(/\D/g, '');
  
  return {
    ...customer,
    name: formatCustomerName(customer.name),
    phone: formattedPhone,
    // API için gereksiz alanları temizle
    createdAtFormatted: undefined,
    updatedAtFormatted: undefined
  };
};

/**
 * Ödeme tipini standart formata çevirir
 * @param type Ödeme tipi
 * @returns Standardize edilmiş ödeme tipi
 */
export const standardizePaymentType = (type: string): string => {
  if (!type) return 'Bilinmiyor';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('kredi') || lowerType.includes('kart') || lowerType.includes('credit')) {
    return 'Kredi Kartı';
  }
  
  if (lowerType.includes('nakit') || lowerType.includes('cash')) {
    return 'Nakit';
  }
  
  if (lowerType.includes('havale') || lowerType.includes('eft') || lowerType.includes('transfer')) {
    return 'Havale/EFT';
  }
  
  return type;
};

/**
 * Ödeme yöntemini standart formata çevirir
 * @param method Ödeme yöntemi
 * @returns Standardize edilmiş ödeme yöntemi
 */
export const standardizePaymentMethod = (method: string): string => {
  if (!method) return 'Ödeme';
  
  return method.charAt(0).toLocaleUpperCase('tr-TR') + method.slice(1).toLocaleLowerCase('tr-TR');
};

/**
 * Randevu durumunu standart formata çevirir
 * @param status Randevu durumu
 * @returns Standardize edilmiş randevu durumu
 */
export const standardizeAppointmentStatus = (status: string): string => {
  if (!status) return 'Bekliyor';
  
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('completed') || lowerStatus.includes('tamamlan')) {
    return 'Tamamlandı';
  }
  
  if (lowerStatus.includes('confirmed') || lowerStatus.includes('onayla')) {
    return 'Onaylandı';
  }
  
  if (lowerStatus.includes('cancelled') || lowerStatus.includes('cancel') || lowerStatus.includes('iptal')) {
    return 'İptal Edildi';
  }
  
  if (lowerStatus.includes('no_show') || lowerStatus.includes('noshow') || lowerStatus.includes('gelme')) {
    return 'Gelmedi';
  }
  
  return 'Bekliyor';
};
