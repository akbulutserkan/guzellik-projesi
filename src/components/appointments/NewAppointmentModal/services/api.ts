// API service functions for the appointment modal
import { 
  getServices, 
  getStaff, 
  getCustomers, 
  getCustomerDetails,
  fetchStaffServicesMcp
} from './mcp-api';

// Tüm servisler artık MCP API'ye yönlendiriliyor
export const fetchStaff = getStaff;
export const fetchCustomers = getCustomers;
export const fetchServices = getServices;
export const fetchCustomerDetails = getCustomerDetails;
export const fetchStaffServices = fetchStaffServicesMcp;

// Check working hours - MCP API ile
export const checkWorkingHours = async (staffId: string, date: string) => {
  try {
    if (!staffId || !date) return true; // Don't check if no data
    
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split('T')[0];
    const dayOfWeek = dateObj.getDay(); // 0: Sunday, 1: Monday...
    
    // MCP API ile çalışma saatlerini kontrol et
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'get-staff-schedule',
          arguments: {
            staffId: staffId,
            date: formattedDate
          }
        }
      }),
    });

    if (!response.ok) throw new Error('Çalışma saatleri alınamadı');
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Çalışma saatleri bilgisi alınamadı');
    }
    
    const data = result.data;
    console.log('MCP API çalışma saatleri:', data);
    
    // Check exception days
    if (data.exceptions && data.exceptions.length > 0) {
      const exception = data.exceptions[0];
      if (!exception.isWorkingDay) {
        console.log('Bu gün tatil olarak işaretlenmiş');
        return false;
      }
    }
    
    // Check business working hours
    const businessDay = data.businessHours.find((day: any) => day.dayOfWeek === dayOfWeek);
    if (!businessDay || !businessDay.isWorkingDay) {
      console.log('İşyeri bugün kapalı');
      return false;
    }
    
    // Check staff working hours
    if (data.staffSchedule) {
      const staffDay = data.staffSchedule.find((day: any) => {
        // day veya dayOfWeek alanı kullanabilir
        return (day.day === dayOfWeek || day.dayOfWeek === dayOfWeek);
      });
      
      // isWorkingDay veya isWorking alanı kontrol edilmeli
      const isPersonnelWorking = staffDay ? 
                               (staffDay.isWorkingDay !== undefined ? 
                                staffDay.isWorkingDay : 
                                staffDay.isWorking) : 
                               false;
      
      if (!staffDay || isPersonnelWorking === false) {
        console.log('Personel bugün çalışmıyor');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Çalışma saatleri kontrol edilirken hata:', error);
    return true; // Hata durumunda geçişe izin ver
  }
};

// Get availability data for staff - MCP API ile
export const fetchAvailability = async (staffId: string, date: Date) => {
  try {
    // Get date in YYYY-MM-DD format
    const formattedDate = date.toISOString().split('T')[0];
    
    // MCP API ile uygunluk verilerini getir
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'get-staff-availability',
          arguments: {
            staffId: staffId,
            date: formattedDate
          }
        }
      }),
    });
    
    if (!response.ok) {
      console.error(`API yanıtı hatalı (HTTP ${response.status}):`, await response.text().catch(() => 'İçerik okunamadı'));
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Personel uygunluk bilgisi alınamadı');
    }
    
    return result.data;
  } catch (error) {
    console.error('Personel uygunluk bilgisi alınırken hata:', error);
    throw error;
  }
};

// Son başarılı istek verileri ve zaman izleme - çift kayıt önleme için
let lastCustomerServiceRequests: Map<string, {timestamp: number, data: any}> = new Map();
const REQUEST_COOLDOWN_MS = 5000; // 5 saniye soğuma süresi

// Daha güçlü çift kayıt önleme fonksiyonu - müşteri ve hizmet bazında kontrol yapar
function checkDuplicateRequest(data: any): {isDuplicate: boolean, cachedData: any | null} {
  try {
    // Kritik alanları al
    const customerId = data.customerId;
    const serviceId = data.serviceId;
    const staffId = data.staffId;
    
    if (!customerId || !serviceId || !staffId) {
      return { isDuplicate: false, cachedData: null };
    }
    
    // Anahtar oluştur - müşteri ve hizmet bazlı tekilleştirme
    const requestKey = `${customerId}_${serviceId}_${staffId}`;
    const currentTime = Date.now();
    
    // Yakın zamanda aynı müşteri ve hizmete dair istek var mı?
    const lastRequest = lastCustomerServiceRequests.get(requestKey);
    
    if (lastRequest && (currentTime - lastRequest.timestamp) < REQUEST_COOLDOWN_MS) {
      console.log(`Çift API çağrısı tespit edildi! Müşteri: ${customerId}, Hizmet: ${serviceId}`);
      console.log(`Son istek zamanı: ${new Date(lastRequest.timestamp).toISOString()}, şimdiki zaman: ${new Date(currentTime).toISOString()}`);
      console.log(`Geçen süre: ${currentTime - lastRequest.timestamp}ms`);
      return { 
        isDuplicate: true, 
        cachedData: lastRequest.data 
      };
    }
    
    return { isDuplicate: false, cachedData: null };
  } catch (err) {
    console.error('Duplicate check error:', err);
    return { isDuplicate: false, cachedData: null };
  }
}

// Create a new appointment - MCP API ile
export const createAppointment = async (appointmentData: any) => {
  const currentTime = Date.now();
  
  console.log('DETAYLI LOG: createAppointment (MCP) çağrıldı, gönderilen veriler:', 
  `Müşteri: ${appointmentData.customerId} | Hizmet: ${appointmentData.serviceId} | Personel: ${appointmentData.staffId} | Tarih: ${appointmentData.startTime}`);

  // Çift istek kontrolü - daha güçlü yeni sistem
  const { isDuplicate, cachedData } = checkDuplicateRequest(appointmentData);
  
  if (isDuplicate && cachedData) {
    console.log('DETAYLI LOG - API Çağrısı Engellendi: Son 5 saniye içinde aynı müşteri ve hizmet için istek zaten yapıldı');
    console.log('DETAYLI LOG - Cache veri döndürülüyor:', cachedData);
    return cachedData;
  }

  console.log('MCP API Çağrısı: create-appointment - gönderilen veriler:', JSON.stringify(appointmentData));
  
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            name: 'create-appointment',
            arguments: appointmentData
          }
        }),
      });
      
      // HATA AYIKLAMA: Yanıt detaylarını loglayalım
      console.log(`API yanıt durumu: ${response.status} ${response.statusText}`);
      
      // HTTP yanıt durumu hatası kontrolü
      if (!response.ok) {
        // Hata yanıtını detaylı şekilde logla
        const errorText = await response.text().catch(() => 'İçerik okunamadı');
        console.error(`API yanıtı hatalı (HTTP ${response.status}):", ${errorText}`);
        throw new Error(`API call failed with status: ${response.status}`);
      }
    
      let result;
      try {
        const responseText = await response.text();
        console.log('API yanıt metni:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('API yanıtı JSON olarak ayrıştırılamadı:', parseError);
          console.error('Raw yanıt:', responseText);
          throw new Error('API yanıtı JSON olarak ayrıştırılamadı: ' + parseError.message);
        }
      } catch (textError) {
        console.error('API yanıt metni okunamadı:', textError);
        throw new Error('API yanıtı okunamadı: ' + textError.message);
      }

    // İki farklı API yanıt formatını işleyebilme
    // Senaryo 1: { success: true, data: {...} } formatı
    // Senaryo 2: { content: [{type: 'text', text: '...'}] } formatı
    if (!result) {
      console.error('API yanıtı boş veya geçersiz');
        throw new Error('API yanıtı geçersiz format');
      }

      if (!result.success) {
        console.error('API Başarısız yanıt:', result);
        throw new Error(result.error || 'Randevu oluşturulamadı');
      }
      
      // Veri formatını kontrol et ve dönüştür
      let appointmentResult;
      
      if (result.data) {
        appointmentResult = result.data;
        console.log('data formatı kullanıldı'); 
      } else if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
        try {
          appointmentResult = JSON.parse(result.content[0].text);
          console.log('content.text formatı kullanıldı'); 
        } catch (err) {
          console.error('content.text JSON ayrıştırma hatası:', err);
          throw new Error('API yanıtı geçersiz format');
        }
      } else {
        console.error('Desteklenmeyen API yanıt formatı:', result);
        throw new Error('API yanıtı desteklenmeyen format');
      }
      
      console.log('Randevu başarıyla oluşturuldu, sonuç:', appointmentResult);
    
    // Başarılı isteği kaydet
    const requestKey = `${appointmentData.customerId}_${appointmentData.serviceId}_${appointmentData.staffId}`;
    lastCustomerServiceRequests.set(requestKey, {
      data: appointmentResult,
      timestamp: currentTime
    });
    
    console.log(`Yeni randevu kaydı cache'e eklendi. Anahtar: ${requestKey}`);
    console.log('Cache durum:', Array.from(lastCustomerServiceRequests.keys()));
    
    return appointmentResult;
  } catch (error) {
    console.error('MCP Randevu oluşturma hatası:', error);
    throw error;
  }
};

// Update an existing appointment - MCP API ile
export const updateAppointment = async (appointmentId: string, appointmentData: any) => {
  try {
    console.log('MCP API Çağrısı: update-appointment - gönderilen veriler:', JSON.stringify({ id: appointmentId, ...appointmentData }));

    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'update-appointment',
          arguments: {
            id: appointmentId,
            ...appointmentData
          }
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Randevu güncellenemedi');
    }
    
    return result.data;
  } catch (error) {
    console.error('MCP Randevu güncelleme hatası:', error);
    throw error;
  }
};