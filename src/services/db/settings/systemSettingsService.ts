/**
 * Sistem ayarları servisi
 */
import { prisma } from '@/lib/prisma';
import { SystemSettings, ServiceResponse } from './types';
import { formatSettingsToKeyValue } from './helpers';

/**
 * Sistem ayarlarını getir
 * @returns Anahtar-değer formatında sistem ayarları
 */
export async function getSystemSettingsFromDb(): Promise<ServiceResponse<SystemSettings>> {
  try {
    console.log('[settings-db-service] getSystemSettingsFromDb çağrıldı');
    
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          not: 'business_hours' // Çalışma saatleri bu API ile alınmıyor
        }
      }
    });

    // Ayarları anahtar-değer formatında düzenle
    const formattedSettings = formatSettingsToKeyValue(settings);

    console.log('[settings-db-service] Sistem ayarları başarıyla alındı');
    
    return {
      success: true,
      data: formattedSettings
    };
  } catch (error) {
    console.error('[settings-db-service] Sistem ayarları alınırken hata:', error);
    return {
      success: false,
      error: 'Sistem ayarları alınamadı'
    };
  }
}

/**
 * Sistem ayarlarını güncelle
 * @param data Anahtar-değer formatında güncellenecek ayarlar
 * @returns Güncellenmiş ayarlar
 */
export async function updateSystemSettingsInDb(data: SystemSettings): Promise<ServiceResponse<SystemSettings>> {
  try {
    console.log('[settings-db-service] updateSystemSettingsInDb çağrıldı, data:', data);
    
    // Veri validasyonu
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'Geçersiz veri formatı'
      };
    }

    // Her ayar için veritabanı güncellemesi
    const updates = Object.entries(data).map(([key, value]) => {
      return prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });

    // İşlemleri bir transaction içinde gerçekleştir
    await prisma.$transaction(updates);

    // Güncel verileri getir
    const updatedSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: Object.keys(data)
        }
      }
    });

    // Sonuç verisini formatla
    const formattedSettings = formatSettingsToKeyValue(updatedSettings);

    console.log('[settings-db-service] Sistem ayarları başarıyla güncellendi');
    
    return {
      success: true,
      data: formattedSettings
    };
  } catch (error) {
    console.error('[settings-db-service] Sistem ayarları güncellenirken hata:', error);
    return {
      success: false,
      error: 'Sistem ayarları güncellenemedi'
    };
  }
}

/**
 * Belirli bir ayarı getir
 * @param key Ayar anahtarı
 * @returns Ayar değeri
 */
export async function getSettingByKeyFromDb(key: string): Promise<ServiceResponse<string>> {
  try {
    console.log(`[settings-db-service] getSettingByKeyFromDb çağrıldı, key: ${key}`);
    
    const setting = await prisma.settings.findUnique({
      where: { key }
    });

    if (!setting) {
      return {
        success: false,
        error: `'${key}' anahtarlı ayar bulunamadı`
      };
    }

    console.log(`[settings-db-service] '${key}' anahtarlı ayar başarıyla alındı`);
    
    return {
      success: true,
      data: setting.value
    };
  } catch (error) {
    console.error(`[settings-db-service] '${key}' anahtarlı ayar alınırken hata:`, error);
    return {
      success: false,
      error: 'Ayar alınamadı'
    };
  }
}

/**
 * Belirli bir ayarı güncelle
 * @param key Ayar anahtarı
 * @param value Ayar değeri
 * @returns Güncellenmiş ayar
 */
export async function updateSettingByKeyFromDb(key: string, value: string): Promise<ServiceResponse<{ key: string, value: string }>> {
  try {
    console.log(`[settings-db-service] updateSettingByKeyFromDb çağrıldı, key: ${key}, value: ${value}`);
    
    const updatedSetting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    console.log(`[settings-db-service] '${key}' anahtarlı ayar başarıyla güncellendi`);
    
    return {
      success: true,
      data: {
        key: updatedSetting.key,
        value: updatedSetting.value
      }
    };
  } catch (error) {
    console.error(`[settings-db-service] '${key}' anahtarlı ayar güncellenirken hata:`, error);
    return {
      success: false,
      error: 'Ayar güncellenemedi'
    };
  }
}
