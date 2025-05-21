/**
 * Müşteri CRUD işlemleri
 * Tüm iş mantığı ve veritabanı işlemleri bu servis tarafından gerçekleştirilir.
 * Client tarafındaki customerService.ts ile çalışır.
 * 
 * @see /src/services/customerService.ts Client tarafı müşteri servisi
 */
import { prisma } from '@/lib/prisma';
import {
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerFilterOptions,
  CustomerWithAppointments,
  ServiceResponse
} from './types';

/**
 * Tüm müşterileri getirme
 * @param filters Filtreleme seçenekleri
 * @returns Müşteri listesi
 */
export async function getCustomersFromDb(filters: CustomerFilterOptions = {}): Promise<ServiceResponse<Customer[]>> {
  try {
    console.log('[customer-db-service] getCustomersFromDb çağrıldı, filtreler:', filters);
    
    // Direkt veritabanı işlemi - daha güvenilir yaklaşım
    const whereClause: any = { deleted: false };
    
    // Ad, email ve telefon filtresi varsa ekle
    if (filters.name && typeof filters.name === 'object' && filters.name.contains) {
      whereClause.name = { contains: filters.name.contains, mode: 'insensitive' };
    }
    
    if (filters.email && typeof filters.email === 'object' && filters.email.contains) {
      whereClause.email = { contains: filters.email.contains, mode: 'insensitive' };
    }
    
    if (filters.phone && typeof filters.phone === 'object' && filters.phone.contains) {
      whereClause.phone = { contains: filters.phone.contains, mode: 'insensitive' };
    }
    
    // Silinen kayıtları da gösterme isteği varsa where koşulunu kaldır
    if (filters.includeDeleted) {
      delete whereClause.deleted;
    }
    
    console.log('[customer-db-service] Oluşturulan sorgu kriterleri:', JSON.stringify(whereClause, null, 2));
    
    // Veritabanından müşterileri getir
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`[customer-db-service] ${customers.length} müşteri bulundu`);
    
    return { success: true, data: customers };
  } catch (error) {
    console.error('[customer-db-service] Müşteriler alınırken hata oluştu:', error);
    return { success: false, error: 'Müşteriler alınamadı' };
  }
}

/**
 * ID'ye göre müşteri detayı getirme
 * @param id Müşteri ID'si
 * @returns Müşteri detayı
 */
export async function getCustomerByIdFromDb(id: string): Promise<ServiceResponse<CustomerWithAppointments>> {
  try {
    console.log(`[customer-db-service] getCustomerByIdFromDb çağrıldı, id: ${id}`);
    
    // Veritabanından müşteri detayını getir
    const customer = await prisma.customer.findUnique({
      where: {
        id,
        deleted: false
      },
      include: {
        // İlişkili verileri de getir
        appointments: {
          include: {
            service: true,
            staff: true
          },
          orderBy: {
            startTime: 'desc'
          }
        },
        // Diğer ilişkili veriler - varsa ekleyin
        // productSales: true,
        // packageSales: true,
      }
    });
    
    if (!customer) {
      console.error(`[customer-db-service] ID'si ${id} olan müşteri bulunamadı`);
      return { success: false, error: 'Müşteri bulunamadı' };
    }
    
    console.log(`[customer-db-service] ID'si ${id} olan müşteri bulundu`);
    return { success: true, data: customer };
  } catch (error) {
    console.error(`[customer-db-service] ID'si ${id} olan müşteri getirilirken hata:`, error);
    return { success: false, error: 'Müşteri detayı alınamadı' };
  }
}

/**
 * Yeni müşteri oluşturma
 * @param customerData Müşteri bilgileri
 * @returns Oluşturulan müşteri
 */
/**
 * Yeni müşteri oluşturma
 * @param customerData Müşteri bilgileri
 * @returns Oluşturulan müşteri yanıtı
 */
export async function createCustomerInDb(customerData: CustomerCreateInput): Promise<ServiceResponse<Customer>> {
  try {
    console.log('[customer-db-service] createCustomerInDb çağrıldı, veriler:', customerData);
    
    // Girdi doğrulama
    if (!customerData.name || customerData.name.trim() === '') {
      return { success: false, error: 'Müşteri adı gereklidir' };
    }
    
    // Yeni müşteri oluştur
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        notes: customerData.notes || null
      }
    });
    
    console.log('[customer-db-service] Müşteri başarıyla oluşturuldu, id:', customer.id);
    return { success: true, data: customer };
  } catch (error) {
    console.error('[customer-db-service] Müşteri oluşturulurken hata oluştu:', error);
    return { success: false, error: 'Müşteri oluşturulamadı' };
  }
}

/**
 * Müşteri bilgilerini güncelleme
 * @param id Müşteri ID'si
 * @param customerData Güncellenecek bilgiler
 * @returns Güncellenen müşteri
 */
/**
 * Müşteri bilgilerini güncelleme
 * @param id Müşteri ID'si
 * @param customerData Güncellenecek bilgiler
 * @returns Güncellenen müşteri yanıtı
 */
export async function updateCustomerInDb(
  id: string, 
  customerData: CustomerUpdateInput
): Promise<ServiceResponse<Customer>> {
  try {
    console.log('[customer-db-service] updateCustomerInDb çağrıldı, id:', id, 'veriler:', customerData);
    
    // Müşterinin var olup olmadığını kontrol et
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });
    
    if (!existingCustomer) {
      console.error('[customer-db-service] Güncellenecek müşteri bulunamadı, id:', id);
      return { success: false, error: 'Güncellenecek müşteri bulunamadı' };
    }
    
    // Girdi doğrulama
    if (customerData.name !== undefined && customerData.name.trim() === '') {
      return { success: false, error: 'Müşteri adı boş olamaz' };
    }
    
    // Müşteriyi güncelle
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: customerData
    });
    
    console.log('[customer-db-service] Müşteri başarıyla güncellendi, id:', id);
    return { success: true, data: updatedCustomer };
  } catch (error) {
    console.error('[customer-db-service] Müşteri güncellenirken hata oluştu:', error);
    return { success: false, error: 'Müşteri güncellenemedi' };
  }
}

/**
 * Müşteri silme (soft delete)
 * @param id Müşteri ID'si
 * @returns İşlem sonucu
 */
export async function deleteCustomerFromDb(id: string): Promise<ServiceResponse<Customer>> {
  try {
    console.log(`[customer-db-service] deleteCustomerFromDb çağrıldı, id: ${id}`);
    
    // Doğrudan veritabanı işlemi - soft delete olarak işaretle
    const customer = await prisma.customer.update({
      where: { id },
      data: { 
        deleted: true 
      }
    });
    
    console.log(`[customer-db-service] Müşteri başarıyla silindi (soft delete), id: ${id}`);
    return { success: true, data: customer };
  } catch (error) {
    console.error('[customer-db-service] Müşteri silinirken hata oluştu:', error);
    return { success: false, error: 'Müşteri silinemedi' };
  }
}
