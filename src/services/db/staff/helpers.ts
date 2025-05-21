/**
 * Personel (Staff) modülü için yardımcı fonksiyonlar
 */
import { formatNameCapitalize } from '@/utils/staff/formatters';
import bcrypt from 'bcrypt';

/**
 * Personel ismini formatla (standart formatlamayı uygular)
 * @param name İsim
 * @returns Formatlanmış isim
 */
export function formatStaffName(name: string): string {
  return formatNameCapitalize(name);
}

/**
 * Şifreyi hashle
 * @param plainPassword Hash'lenmemiş şifre
 * @returns Hash'lenmiş şifre
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, 10);
}

/**
 * Personel verilerini doğrula (oluşturma işlemi için)
 * @param data Personel verileri
 * @returns Hata mesajı (hata yoksa null)
 */
export function validateStaffData(data: any): string | null {
  // Zorunlu alanların kontrolü
  if (!data.name || !data.phone || !data.accountType || !data.username || !data.password) {
    return 'İsim, telefon, kullanıcı adı, şifre ve hesap tipi zorunludur';
  }
  
  // Diğer validasyon kuralları (isteğe bağlı)
  // ...
  
  return null;
}

/**
 * Personel verilerini doğrula (güncelleme işlemi için)
 * @param data Personel verileri
 * @returns Hata mesajı (hata yoksa null)
 */
export function validateStaffUpdateData(data: any): string | null {
  // Güncelleme işlemi için özel validasyon kuralları
  // ...
  
  return null;
}

/**
 * Hassas bilgileri personel verisinden çıkar
 * @param staff Personel verisi
 * @returns Hassas bilgileri çıkarılmış personel verisi
 */
export function sanitizeStaffData<T extends { password?: string }>(staff: T): Omit<T, 'password'> {
  // Password'ü ve diğer hassas bilgileri çıkar
  const { password, ...sanitizedStaff } = staff;
  return sanitizedStaff;
}
