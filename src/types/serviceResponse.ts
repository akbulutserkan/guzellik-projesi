/**
 * Tüm servis yanıtları için ortak arayüz
 * İş mantığı katmanı ile API katmanı arasında tutarlı iletişim sağlar
 */

/**
 * Servis yanıtı tipi
 * @template T Başarılı durumda dönecek veri tipi
 */
export interface ServiceResponse<T = any> {
  /** İşlemin başarılı olup olmadığı */
  success: boolean;
  
  /** Başarılı durumda dönecek veri (isteğe bağlı) */
  data?: T;
  
  /** Başarısız durumda hata mesajı (isteğe bağlı) */
  error?: string;
  
  /** Başarılı durumda opsiyonel bilgilendirme mesajı (isteğe bağlı) */
  message?: string;
  
  /** Ek meta veri (isteğe bağlı) */
  meta?: Record<string, any>;
}

/**
 * Başarılı yanıt oluşturur
 * @param data Dönecek veri
 * @param message Opsiyonel bilgilendirme mesajı
 * @param meta Ek meta veri
 * @returns Başarılı servis yanıtı
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  meta?: Record<string, any>
): ServiceResponse<T> {
  return {
    success: true,
    data,
    message,
    meta
  };
}

/**
 * Başarısız yanıt oluşturur
 * @param error Hata mesajı
 * @param meta Ek meta veri
 * @returns Başarısız servis yanıtı
 */
export function errorResponse<T>(
  error: string = 'Bir hata oluştu',
  meta?: Record<string, any>
): ServiceResponse<T> {
  return {
    success: false,
    error,
    meta
  };
}
