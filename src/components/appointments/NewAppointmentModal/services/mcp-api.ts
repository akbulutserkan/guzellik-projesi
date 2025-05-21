/**
 * MCP API entegrasyonu ile hizmet ve randevu API fonksiyonları
 */

import { fetchServicesMcp } from '@/lib/mcp/services';
import { callMcpApi } from '@/lib/mcp/helpers';

// MCP API üzerinden tüm hizmetleri getir
export const fetchServicesMcpWrapper = async () => {
  try {
    console.log('fetchServicesMcpWrapper çağrıldı');
    
    // Doğrudan fetch ile API çağrısı yapalım
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'get-services',
          arguments: { includeDeleted: false }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Hizmet API yanıtı:', result);

    // API yanıt format kontrolü
    if (!result.success) {
      console.error('API yanıtında success:false', result.error);
      return [];
    }

    // Veri yapısını kontrol et
    let services = [];

    // 1. Veri doğrudan bir dizi olabilir
    if (Array.isArray(result.data)) {
      console.log(`API data doğrudan dizi formatı: ${result.data.length} hizmet`);
      services = result.data;
    }
    // 2. data.services şeklinde bir yapı olabilir
    else if (result.data && result.data.services && Array.isArray(result.data.services)) {
      console.log(`API data.services formatı: ${result.data.services.length} hizmet`);
      services = result.data.services;
    }
    // 3. data.allServices şeklinde bir yapı olabilir
    else if (result.data && result.data.allServices && Array.isArray(result.data.allServices)) {
      console.log(`API data.allServices formatı: ${result.data.allServices.length} hizmet`);
      services = result.data.allServices;
    }
    // 4. data.activeServices şeklinde bir yapı olabilir
    else if (result.data && result.data.activeServices && Array.isArray(result.data.activeServices)) {
      console.log(`API data.activeServices formatı: ${result.data.activeServices.length} hizmet`);
      services = result.data.activeServices;
    }
    // 5. content formatında olabilir
    else if (result.content && Array.isArray(result.content) && result.content.length > 0) {
      try {
        const contentData = JSON.parse(result.content[0].text);
        if (Array.isArray(contentData)) {
          console.log(`API content formatı: ${contentData.length} hizmet`);
          services = contentData;
        }
      } catch (e) {
        console.error('Content JSON ayrıştırma hatası:', e);
      }
    }
    // 6. Hiçbir duruma uymuyorsa, veri yapısını logla ve boş dizi döndür
    else {
      console.error('API yanıtı beklenmeyen bir format içeriyor:', result);
      if (result.data) {
        console.log('API yanıtı data içeriği:', result.data);
        console.log('Data tipi:', typeof result.data);
        if (typeof result.data === 'object') {
          console.log('Data alanları:', Object.keys(result.data).join(', '));
        }
      }
    }

    console.log(`Bulunan toplam hizmet sayısı: ${services.length}`);
    if (services.length > 0) {
      console.log('İlk hizmet örneği:', services[0]);
    }

    return services;
  } catch (err) {
    console.error("MCP hizmet veri getirme hatası:", err);
    throw new Error("Hizmet listesi alınamadı");
  }
};

// MCP API üzerinden tüm müşterileri getir
export const fetchCustomersMcpWrapper = async () => {
  try {
    // Doğrudan sunucu tarafı fonksiyonu yerine API çağrısı kullan
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'get-customers',
          arguments: { includeDeleted: false }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error("API yanıtında success:false", result.error);
      return [];
    }
    
    return result.data || [];
  } catch (err) {
    console.error("MCP müşteri veri getirme hatası:", err);
    throw new Error("Müşteri listesi alınamadı");
  }
};

// MCP API üzerinden müşteri detaylarını getir
export const fetchCustomerDetailsMcpWrapper = async (customerId: string) => {
  try {
    // Doğrudan sunucu tarafı fonksiyonu yerine API çağrısı kullan
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'get-customer-by-id',
          arguments: { id: customerId }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || "Müşteri bilgisi alınamadı");
    }
    
    return result.data;
  } catch (err) {
    console.error("MCP müşteri detay getirme hatası:", err);
    throw new Error("Müşteri bilgisi alınamadı");
  }
};

// MCP API üzerinden tüm personeli getir - merkezi API yapısına uygun olarak güncellendi
export const fetchStaffMcpWrapper = async () => {
  try {
    console.log('[MCP API] ApiService.staff.getAll ile personel verisi getiriliyor');
    
    // ApiService'i dinamik olarak import et
    const { ApiService } = await import('@/services/api');
    
    // Merkezi API yapısını kullan
    const result = await ApiService.staff.getAll(false);
    console.log('[MCP API] ApiService.staff.getAll yanıtı:', result);

    if (!result.success) {
      console.error("[MCP API] Personel API yanıtında success:false", result.error);
      return [];
    }

    // Veri formatını kontrol et
    if (!result.data) {
      console.error("[MCP API] Personel API yanıtında data yok", result);
      return [];
    }

    // API yanıtında data bir nesne içinde (activeStaff ve allStaff) gelebilir
    if (result.data.activeStaff && Array.isArray(result.data.activeStaff)) {
      console.log(`[MCP API] activeStaff formatı: ${result.data.activeStaff.length} personel`);
      return result.data.activeStaff;
    }
    
    // Veya data nesnesinde allStaff olabilir
    if (result.data.allStaff && Array.isArray(result.data.allStaff)) {
      console.log(`[MCP API] allStaff formatı: ${result.data.allStaff.length} personel`);
      // Aktif personel filtrelemesi yapılacaksa burada yapılabilir
      return result.data.allStaff.filter(s => s.isActive !== false);
    }

    // Data doğrudan bir dizi olabilir
    if (Array.isArray(result.data)) {
      console.log(`[MCP API] data dizi formatı: ${result.data.length} personel`);
      // Personelleri filtrele
      const activeStaff = result.data.filter(s => s.isActive !== false);
      console.log(`[MCP API] Aktif personel: ${activeStaff.length}`);
      return activeStaff;
    }

    console.error("[MCP API] Personel API yanıtındaki data beklenmeyen formatta", result.data);
    return [];
  } catch (err) {
    console.error("[MCP API] Personel getirme hatası:", err);
    
    // Hata durumunda boş liste döndür
    console.log("[MCP API] Hata nedeniyle boş personel listesi döndürülüyor");
    return [];
  }
};

// MCP API üzerinden personel detaylarını getir - merkezi API yapısına uygun olarak güncellendi
export const fetchStaffDetailsMcpWrapper = async (staffId: string) => {
  try {
    console.log("[MCP API] ApiService.staff.getById ile personel detayları getiriliyor, id:", staffId);
    
    // ApiService'i dinamik olarak import et
    const { ApiService } = await import('@/services/api');
    
    // Merkezi API yapısını kullan
    const result = await ApiService.staff.getById(staffId);
    console.log("[MCP API] ApiService.staff.getById yanıtı:", result);
    
    if (!result.success) {
      console.error("[MCP API] Personel detay yanıtında success:false", result.error);
      throw new Error(result.error || "Personel bilgisi alınamadı");
    }
    
    return result;
  } catch (err) {
    console.error("[MCP API] Personel detay getirme hatası:", err);
    throw new Error("Personel bilgisi alınamadı");
  }
};

// MCP API üzerinden personel hizmetlerini getir - merkezi API yapısına uygun olarak güncellendi
export const fetchStaffServicesMcp = async (staffId: string, allServices: any[]) => {
  try {
    console.log(`[MCP API] Personel hizmetleri getiriliyor: ${staffId}`);
    
    if (!staffId) {
      console.log('[MCP API] Personel ID yok, hizmet listesi temizleniyor');
      return [];
    }
    
    if (!Array.isArray(allServices) || allServices.length === 0) {
      console.log('[MCP API] allServices yok veya boş, yine de personel hizmetlerini getirmeyi deneyeceğiz');
    }
    
    console.log('[MCP API] ApiService.staff.getServices ile personel hizmetleri alınıyor...');
    
    // ApiService'i dinamik olarak import et
    const { ApiService } = await import('@/services/api');
    
    // Merkezi API yöntemiyle personel hizmetlerini al
    const staffServices = await ApiService.staff.getServices(staffId, allServices);
    console.log(`[MCP API] ApiService.staff.getServices yanıtı: ${staffServices.length} hizmet`);
    
    // Hizmet bulunamadıysa ve allServices varsa, tüm hizmetleri döndür
    if (staffServices.length === 0 && Array.isArray(allServices) && allServices.length > 0) {
      console.log('[MCP API] Personel için hizmet bulunamadı, tüm hizmetler döndürülüyor');
      return allServices;
    }
    
    return staffServices;
  } catch (err) {
    console.error("[MCP API] Personel hizmetleri getirme hatası:", err);
    
    // Hata durumunda, eğer allServices varsa onu döndür
    if (Array.isArray(allServices) && allServices.length > 0) {
      console.log('[MCP API] Hata nedeniyle tüm hizmetler döndürülüyor:', allServices.length);
      return allServices;
    }
    
    return [];
  }
};

// Basitleştirilmiş dışa aktarımlar - artık sadece MCP kullanıyoruz
export const getServices = fetchServicesMcpWrapper;
export const getCustomers = fetchCustomersMcpWrapper;
export const getCustomerDetails = fetchCustomerDetailsMcpWrapper;
export const getStaff = fetchStaffMcpWrapper;
export const getStaffDetails = fetchStaffDetailsMcpWrapper;