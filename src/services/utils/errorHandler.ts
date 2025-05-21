/**
 * Genel hata işleme fonksiyonları ve yardımcı araçlar
 * Tüm servislerde kullanılabilecek ortak hata işleme mekanizması sunar
 */

import { ServiceResponse } from '@/types/serviceResponse';

/**
 * Hata işleme yardımcı fonksiyonu
 * Hataları yakalar, loglar ve servis yanıtı formatında döner
 * @param errorFn Hata oluşabilecek asenkron işlev
 * @param context Log mesajları için bağlam adı
 * @param errorMessage Hata durumunda kullanıcıya gösterilecek mesaj
 * @returns Servis yanıtı
 */
export async function tryCatchWrapper<T>(
  errorFn: () => Promise<T>,
  context: string,
  errorMessage: string
): Promise<ServiceResponse<T>> {
  try {
    const result = await errorFn();
    return { 
      success: true, 
      data: result 
    };
  } catch (error) {
    console.error(`[${context}] Hata:`, error);
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

/**
 * Belirli kontrolleri yapıp başarısız olduğunda early return sağlayan yardımcı fonksiyon
 * @param condition Kontrol edilecek koşul
 * @param errorMessage Koşul sağlanmazsa dönecek hata mesajı
 * @returns Koşul sağlanmazsa hata yanıtı, sağlanırsa null
 */
export function validateCondition<T>(
  condition: boolean,
  errorMessage: string
): ServiceResponse<T> | null {
  if (!condition) {
    return {
      success: false,
      error: errorMessage
    };
  }
  return null;
}

/**
 * ID'nin geçerli olup olmadığını kontrol eder
 * @param id Kontrol edilecek ID
 * @param errorMessage ID geçersizse dönecek hata mesajı
 * @returns ID geçersizse hata yanıtı, geçerliyse null
 */
export function validateId<T>(
  id: string | null | undefined,
  errorMessage: string = 'Geçerli bir ID belirtilmelidir'
): ServiceResponse<T> | null {
  return validateCondition<T>(
    !!id && typeof id === 'string' && id.trim() !== '',
    errorMessage
  );
}

/**
 * Varlığın bulunup bulunmadığını kontrol eder
 * @param entity Kontrol edilecek varlık
 * @param errorMessage Varlık bulunamazsa dönecek hata mesajı
 * @returns Varlık yoksa hata yanıtı, varsa null
 */
export function validateEntityExists<T>(
  entity: any | null | undefined,
  errorMessage: string = 'Kayıt bulunamadı'
): ServiceResponse<T> | null {
  return validateCondition<T>(
    !!entity,
    errorMessage
  );
}

/**
 * Çoklu doğrulama kontrolleri yapar
 * @param validations Kontrol sonuçları dizisi (null olmayan değerler hatadır)
 * @returns İlk hatayı veya null
 */
export function validateMultiple<T>(
  validations: (ServiceResponse<T> | null)[]
): ServiceResponse<T> | null {
  for (const validation of validations) {
    if (validation !== null) {
      return validation;
    }
  }
  return null;
}

/**
 * Bir değerin belirli bir türde olup olmadığını kontrol eder
 * @param value Kontrol edilecek değer
 * @param type Beklenen tür ('string', 'number', 'boolean', 'object', 'array')
 * @param errorMessage Tür uyuşmazsa dönecek hata mesajı
 * @returns Tür uyuşmazsa hata yanıtı, uyuşursa null
 */
export function validateType<T>(
  value: any,
  type: 'string' | 'number' | 'boolean' | 'object' | 'array',
  errorMessage: string
): ServiceResponse<T> | null {
  let isValid = false;
  
  switch (type) {
    case 'string':
      isValid = typeof value === 'string';
      break;
    case 'number':
      isValid = typeof value === 'number' && !isNaN(value);
      break;
    case 'boolean':
      isValid = typeof value === 'boolean';
      break;
    case 'object':
      isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
      break;
    case 'array':
      isValid = Array.isArray(value);
      break;
  }
  
  return validateCondition<T>(isValid, errorMessage);
}

/**
 * Sayısal değer kontrolü yapar
 * @param value Kontrol edilecek değer
 * @param options Kontrol seçenekleri (min, max, integer)
 * @param errorMessage Geçersizse dönecek hata mesajı
 * @returns Geçersizse hata yanıtı, geçerliyse null
 */
export function validateNumber<T>(
  value: any,
  options: { min?: number; max?: number; integer?: boolean } = {},
  errorMessage: string
): ServiceResponse<T> | null {
  // Sayı kontrolü
  const numberCheck = validateType<T>(value, 'number', errorMessage);
  if (numberCheck) return numberCheck;
  
  const { min, max, integer } = options;
  
  // Min değer kontrolü
  if (min !== undefined && value < min) {
    return { success: false, error: errorMessage };
  }
  
  // Max değer kontrolü
  if (max !== undefined && value > max) {
    return { success: false, error: errorMessage };
  }
  
  // Tam sayı kontrolü
  if (integer && !Number.isInteger(value)) {
    return { success: false, error: errorMessage };
  }
  
  return null;
}

/**
 * String değer kontrolü yapar
 * @param value Kontrol edilecek değer
 * @param options Kontrol seçenekleri (minLength, maxLength, pattern)
 * @param errorMessage Geçersizse dönecek hata mesajı
 * @returns Geçersizse hata yanıtı, geçerliyse null
 */
export function validateString<T>(
  value: any,
  options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {},
  errorMessage: string
): ServiceResponse<T> | null {
  // String kontrolü
  const stringCheck = validateType<T>(value, 'string', errorMessage);
  if (stringCheck) return stringCheck;
  
  const { minLength, maxLength, pattern } = options;
  
  // Min uzunluk kontrolü
  if (minLength !== undefined && value.length < minLength) {
    return { success: false, error: errorMessage };
  }
  
  // Max uzunluk kontrolü
  if (maxLength !== undefined && value.length > maxLength) {
    return { success: false, error: errorMessage };
  }
  
  // Desen kontrolü
  if (pattern && !pattern.test(value)) {
    return { success: false, error: errorMessage };
  }
  
  return null;
}
