'use client';

import { useToast } from '@/components/ui/use-toast';

interface ServiceSelectorProps {
  appointment: any;
  forceUpdate: (value: any) => void;
  refreshCalendarInBackground: () => void;
  toast: any;
  setLoading: (loading: boolean) => void;
  loading: boolean;
  isServiceListOpen: boolean;
  setIsServiceListOpen: (isOpen: boolean) => void;
  serviceSearch: string;
  setServiceSearch: (search: string) => void;
  services: any[];
  setServices: (services: any[]) => void;
  filteredServices: any[];
  setFilteredServices: (services: any[]) => void;
  setCustomPrice: (price: string) => void;
  setPaymentAmount: (amount: string) => void;
}

export default function ServiceSelector({
  appointment,
  forceUpdate,
  refreshCalendarInBackground,
  toast,
  setLoading,
  loading,
  isServiceListOpen,
  setIsServiceListOpen,
  serviceSearch,
  setServiceSearch,
  services,
  setServices,
  filteredServices,
  setFilteredServices,
  setCustomPrice,
  setPaymentAmount
}: ServiceSelectorProps) {

  const fetchServices = async () => {
    try {
      // MCP API'sini kullanarak hizmetleri çek
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            name: 'get-services',
            arguments: {}
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Hizmetler getirilemedi');
      }
      
      const result = await response.json();
      let servicesData = [];
      
      // Yanıt formatına göre veriyi çıkar
      if (result.success && result.data) {
        servicesData = result.data;
      } else if (result.content && result.content[0]?.text) {
        try {
          servicesData = JSON.parse(result.content[0].text);
        } catch (e) {
          console.error('JSON parse hatası:', e);
          throw new Error('Hizmet verisi işlenemedi');
        }
      }
      
      if (typeof setServices === 'function') {
        setServices(servicesData);
      }
      if (typeof setFilteredServices === 'function') {
        setFilteredServices(servicesData);
      }
    } catch (error) {
      console.error('Hizmetleri getirme hatası:', error);
      if (typeof toast === 'function') {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Hizmetler getirilemedi.'
        });
      }
    }
  };

  const toggleServiceList = () => {
    if (typeof setIsServiceListOpen === 'function') {
      setIsServiceListOpen(!isServiceListOpen);
      if (!isServiceListOpen) {
        fetchServices();
      } else {
        // Servis listesi kapanırken modalı yenile
        setTimeout(() => {
          if (typeof forceUpdate === 'function') {
            forceUpdate({});
          }
        }, 100);
      }
    }
  };

  const filterServices = (search: string) => {
    if (typeof setServiceSearch === 'function') {
      setServiceSearch(search);
    }
    
    if (!search.trim()) {
      if (typeof setFilteredServices === 'function') {
        setFilteredServices(services);
      }
      return;
    }
    
    const filtered = services.filter(service => 
      service.name.toLowerCase().includes(search.toLowerCase())
    );
    
    if (typeof setFilteredServices === 'function') {
      setFilteredServices(filtered);
    }
  };

  const selectService = async (service: any) => {
    try {
      if (typeof setLoading !== 'function') {
        console.error('setLoading is not a function');
        return;
      }
      
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id }),
      });
      if (!response.ok) {
        throw new Error('Hizmet güncellenemedi');
      }
      
      // API yanıtını al
      const updatedData = await response.json();
      
      // Doğrudan appointment nesnesini güncelle
      if (appointment) {
        // Hizmet bilgilerini güncelle
        appointment.service = updatedData.service || service;
        appointment.serviceId = service.id;
        
        // Fiyat alanını hizmet fiyatıyla güncelle
        if (service.price) {
          console.log('Hizmet seçimi sonrası fiyat güncelleniyor:', service.price);
          if (typeof setCustomPrice === 'function') {
            setCustomPrice(service.price.toString());
          }
          if (typeof setPaymentAmount === 'function') {
            setPaymentAmount(service.price.toString());
          }
        }
        
        // UI'yi yeniden render et
        if (typeof forceUpdate === 'function') {
          forceUpdate({});
        }
      }
      
      if (typeof toast === 'function') {
        toast({
          title: 'Başarılı',
          description: 'Hizmet güncellendi'
        });
      }
      
      // Dropdown'u kapat
      if (typeof setIsServiceListOpen === 'function') {
        setIsServiceListOpen(false);
      }
      if (typeof setServiceSearch === 'function') {
        setServiceSearch('');
      }
      
      // Arka planda takvimi güncelle ve modalı tamamen yenile
      if (typeof refreshCalendarInBackground === 'function') {
        await refreshCalendarInBackground();
        
        // Güncelleme sonrası tüm modalı yenilemek için bir olay tetikle
        const updateEvent = new CustomEvent('service_updated', {
          detail: { appointmentId: appointment.id, serviceId: service.id }
        });
        document.dispatchEvent(updateEvent);
        
        // Modalı zorla yeniden render et
        setTimeout(() => {
          if (typeof forceUpdate === 'function') {
            forceUpdate({}); // İlk yenileme
          }
          
          // Toplam tutarı güncelle
          if (typeof setCustomPrice === 'function' && typeof setPaymentAmount === 'function') {
            // Önce API'den güncel bilgileri al
            fetch(`/api/appointments/${appointment.id.split('_')[0]}?includeServices=true`)
              .then(response => response.json())
              .then(data => {
                console.log('Hizmet eklenince elde edilen veriler:', data);
                // Tüm randevuların toplamını hesapla
                let total = 0;
                if (data._allAppointments && Array.isArray(data._allAppointments)) {
                  data._allAppointments.forEach(apt => {
                    if (apt.service && apt.service.price) {
                      total += parseFloat(apt.service.price);
                    }
                  });
                }
                console.log('Hesaplanan toplam tutar:', total);
                // Toplamı güncelle
                setCustomPrice(total.toString());
                setPaymentAmount(total.toString());
                
                // Yeniden render için refreshKey'i güncelle
                const forceRenderEvent = new CustomEvent('force_payment_refresh', { 
                  detail: { timestamp: Date.now() }
                });
                document.dispatchEvent(forceRenderEvent);
              });
          }
          
          setTimeout(() => {
            if (typeof forceUpdate === 'function') {
              forceUpdate({}); // İkinci yenileme - olası gecikme sorunlarını önlemek için
            }
          }, 150);
        }, 50);
      }
    } catch (error) {
      console.error('Hizmet güncelleme hatası:', error);
      if (typeof toast === 'function') {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Hizmet güncellenirken bir hata oluştu.'
        });
      }
    } finally {
      if (typeof setLoading === 'function') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-3 rounded-xl relative">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-800">
          {appointment.service?.name || 'Belirtilmemiş'}
        </span>
        <button 
          onClick={toggleServiceList} 
          className="text-gray-400 hover:text-blue-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
      {isServiceListOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-xl shadow-lg z-50 p-2 space-y-2">
          <input
            type="text"
            className="w-full p-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            placeholder="Hizmet ara..."
            value={serviceSearch}
            onChange={(e) => filterServices(e.target.value)}
          />
          {filteredServices.length > 0 ? (
            <div className="max-h-40 overflow-y-auto">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex justify-between"
                  onClick={() => {
                    if (typeof selectService === 'function') {
                      selectService(service);
                    }
                  }}
                >
                  <span>{service.name}</span>
                  <span className="text-green-600">{service.price} TL</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Hizmet bulunamadı</p>
          )}
        </div>
      )}
    </div>
  );
}
