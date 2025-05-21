/**
 * Servisler için ortak yardımcı fonksiyonlar
 * Tekrarlanan operasyonları basitleştirmek için kullanılır
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from './logger';
import { errorResponse, ServiceResponse, successResponse } from '@/types/serviceResponse';

// Servis operasyonları için merkezi logger
const logger = createLogger('service-utils');

/**
 * Filtreleme seçeneklerini standart bir formata dönüştürür
 * @param filters Ham filtre nesnesi
 * @param options Dönüştürme seçenekleri
 * @returns Standartlaştırılmış filtre nesnesi
 */
export function normalizeFilters(
  filters: Record<string, any> = {},
  options: {
    stringSearchFields?: string[];
    booleanFields?: string[];
    dateRangeFields?: string[];
    numberRangeFields?: string[];
    excludeFields?: string[];
  } = {}
): Record<string, any> {
  const {
    stringSearchFields = [],
    booleanFields = [],
    dateRangeFields = [],
    numberRangeFields = [],
    excludeFields = []
  } = options;
  
  const normalizedFilters: Record<string, any> = {};
  
  // Tüm filtreleri işle
  for (const [key, value] of Object.entries(filters)) {
    // Hariç tutulacak alanları atla
    if (excludeFields.includes(key)) {
      continue;
    }
    
    // undefined veya null değerleri atla
    if (value === undefined || value === null) {
      continue;
    }
    
    // String arama alanlarını işle (contains)
    if (stringSearchFields.includes(key) && typeof value === 'string' && value.trim() !== '') {
      normalizedFilters[key] = { contains: value.trim(), mode: 'insensitive' };
      continue;
    }
    
    // Boolean alanlarını işle
    if (booleanFields.includes(key)) {
      normalizedFilters[key] = Boolean(value);
      continue;
    }
    
    // Tarih aralığı alanlarını işle
    if (dateRangeFields.includes(key) && typeof value === 'object') {
      const dateRange: Record<string, any> = {};
      
      if (value.start) {
        dateRange.gte = new Date(value.start);
      }
      
      if (value.end) {
        dateRange.lte = new Date(value.end);
      }
      
      if (Object.keys(dateRange).length > 0) {
        normalizedFilters[key] = dateRange;
      }
      
      continue;
    }
    
    // Sayısal aralık alanlarını işle
    if (numberRangeFields.includes(key) && typeof value === 'object') {
      const numberRange: Record<string, any> = {};
      
      if (value.min !== undefined && value.min !== null) {
        numberRange.gte = Number(value.min);
      }
      
      if (value.max !== undefined && value.max !== null) {
        numberRange.lte = Number(value.max);
      }
      
      if (Object.keys(numberRange).length > 0) {
        normalizedFilters[key] = numberRange;
      }
      
      continue;
    }
    
    // Diğer değerleri olduğu gibi aktar
    normalizedFilters[key] = value;
  }
  
  return normalizedFilters;
}

/**
 * Standart CRUD işlemlerini kolaylaştırıcı yardımcı fonksiyon
 * @param model Prisma model adı
 * @returns Model için CRUD işlemleri
 */
export function createCrudService<T extends Record<string, any>>(model: string) {
  // İlgili Prisma modelini seç
  const prismaModel = (prisma as any)[model];
  
  if (!prismaModel) {
    throw new Error(`${model} adında bir Prisma modeli bulunamadı`);
  }
  
  /**
   * Tüm kayıtları getir
   * @param options Sorgu seçenekleri
   * @returns Kayıt listesi
   */
  async function getAll(
    options: {
      where?: Record<string, any>;
      include?: Record<string, any>;
      orderBy?: Record<string, any> | Array<Record<string, any>>;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<ServiceResponse<T[]>> {
    try {
      logger.info(`${model} - getAll çağrıldı`, options);
      
      const records = await prismaModel.findMany(options);
      
      logger.info(`${model} - ${records.length} kayıt bulundu`);
      return successResponse(records);
    } catch (error) {
      logger.error(`${model} - getAll işlemi sırasında hata:`, error);
      return errorResponse(`${model} kayıtları alınamadı`);
    }
  }
  
  /**
   * ID'ye göre kayıt getir
   * @param id Kayıt ID'si
   * @param include İlişkili kayıtları dahil etme seçenekleri
   * @returns Bulunan kayıt
   */
  async function getById(
    id: string,
    include?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      logger.info(`${model} - getById çağrıldı, id: ${id}`);
      
      const record = await prismaModel.findUnique({
        where: { id },
        include
      });
      
      if (!record) {
        logger.warn(`${model} - id: ${id} olan kayıt bulunamadı`);
        return errorResponse(`${model} kaydı bulunamadı`);
      }
      
      logger.info(`${model} - id: ${id} olan kayıt bulundu`);
      return successResponse(record);
    } catch (error) {
      logger.error(`${model} - getById işlemi sırasında hata:`, error);
      return errorResponse(`${model} kaydı alınamadı`);
    }
  }
  
  /**
   * Yeni kayıt oluştur
   * @param data Oluşturulacak kayıt verileri
   * @param include İlişkili kayıtları dahil etme seçenekleri
   * @returns Oluşturulan kayıt
   */
  async function create(
    data: Record<string, any>,
    include?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      logger.info(`${model} - create çağrıldı`, { ...data, password: data.password ? '[GIZLI]' : undefined });
      
      const record = await prismaModel.create({
        data,
        include
      });
      
      logger.info(`${model} - Yeni kayıt oluşturuldu, id: ${record.id}`);
      return successResponse(record);
    } catch (error) {
      logger.error(`${model} - create işlemi sırasında hata:`, error);
      return errorResponse(`${model} kaydı oluşturulamadı`);
    }
  }
  
  /**
   * Kayıt güncelle
   * @param id Güncellenecek kayıt ID'si
   * @param data Güncellenecek veriler
   * @param include İlişkili kayıtları dahil etme seçenekleri
   * @returns Güncellenen kayıt
   */
  async function update(
    id: string,
    data: Record<string, any>,
    include?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      logger.info(`${model} - update çağrıldı, id: ${id}`, { ...data, password: data.password ? '[GIZLI]' : undefined });
      
      // Kaydın var olup olmadığını kontrol et
      const existingRecord = await prismaModel.findUnique({
        where: { id }
      });
      
      if (!existingRecord) {
        logger.warn(`${model} - Güncellenecek kayıt bulunamadı, id: ${id}`);
        return errorResponse(`Güncellenecek ${model} kaydı bulunamadı`);
      }
      
      const record = await prismaModel.update({
        where: { id },
        data,
        include
      });
      
      logger.info(`${model} - Kayıt güncellendi, id: ${id}`);
      return successResponse(record);
    } catch (error) {
      logger.error(`${model} - update işlemi sırasında hata:`, error);
      return errorResponse(`${model} kaydı güncellenemedi`);
    }
  }
  
  /**
   * Kayıt sil
   * @param id Silinecek kayıt ID'si
   * @returns İşlem sonucu
   */
  async function remove(id: string): Promise<ServiceResponse<T>> {
    try {
      logger.info(`${model} - remove çağrıldı, id: ${id}`);
      
      // Kaydın var olup olmadığını kontrol et
      const existingRecord = await prismaModel.findUnique({
        where: { id }
      });
      
      if (!existingRecord) {
        logger.warn(`${model} - Silinecek kayıt bulunamadı, id: ${id}`);
        return errorResponse(`Silinecek ${model} kaydı bulunamadı`);
      }
      
      // Soft delete varsa kullan, yoksa gerçekten sil
      let record;
      
      if ('isDeleted' in existingRecord) {
        record = await prismaModel.update({
          where: { id },
          data: { isDeleted: true }
        });
        logger.info(`${model} - Kayıt soft delete yapıldı, id: ${id}`);
      } else if ('deletedAt' in existingRecord) {
        record = await prismaModel.update({
          where: { id },
          data: { deletedAt: new Date() }
        });
        logger.info(`${model} - Kayıt soft delete yapıldı (deletedAt), id: ${id}`);
      } else {
        record = await prismaModel.delete({
          where: { id }
        });
        logger.info(`${model} - Kayıt silindi, id: ${id}`);
      }
      
      return successResponse(record);
    } catch (error) {
      logger.error(`${model} - remove işlemi sırasında hata:`, error);
      return errorResponse(`${model} kaydı silinemedi`);
    }
  }
  
  // CRUD servisini döndür
  return {
    getAll,
    getById,
    create,
    update,
    remove
  };
}
