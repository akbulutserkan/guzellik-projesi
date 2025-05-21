'use client';

import { Input } from "@/components/ui/input";
import { useRef, useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface ServiceSelectorProps {
  serviceSearch: string;
  setServiceSearch: (value: string) => void;
  formData: {
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  filteredServices: Service[];
  handleServiceSelect: (service: Service) => void;
  handleServiceInputFocus: () => void;
  availableServices: Service[];
}

export default function ServiceSelector({
  serviceSearch,
  setServiceSearch,
  formData,
  setFormData,
  filteredServices,
  handleServiceSelect,
  handleServiceInputFocus,
  availableServices
}: ServiceSelectorProps) {
  // Input alanına referans ekleyelim
  const serviceInputRef = useRef<HTMLInputElement>(null);
  
  // Input odaklandığında ve odak kaybettiğinde durum takibi
  const [inputFocused, setInputFocused] = useState(false);

  // Bir hizmet seçildikten sonra listeyi gizlemek için isFocused state'i kullan
  const handleInputFocus = () => {
    // Input odak durumunu güncelle
    setInputFocused(true);
    // Hizmet listesi gösterimini tetikle
    handleServiceInputFocus();
  };

  // Input alanı odak kaybettiğinde çağrılan fonksiyon
  const handleInputBlur = () => {
    // Kısa bir süre sonra filtrelenmiş listeyi temizle
    // Bunun kısa gecikmeli olması, kullanıcıya
    // liste üzerindeki öğelere tıklaması için zaman tanır
    setTimeout(() => {
      setInputFocused(false);
    }, 200);
  };
  
  // Debug için hizmet verilerini logla
  useEffect(() => {
    if (formData.staffId) {
      console.log('ServiceSelector: Personel ID değişti, mevcut hizmetler:', {
        count: Array.isArray(availableServices) ? availableServices.length : 'dizi değil',
        isArray: Array.isArray(availableServices),
        firstItems: Array.isArray(availableServices) && availableServices.length > 0 
          ? availableServices.slice(0, 2).map(s => `${s.name} (${s.id})`) 
          : 'Yok'
      });
    }
  }, [formData.staffId, availableServices]);
  
  // Bileşen yüklenince input alanına odaklan - özellikle defaultCustomerId varsa
  useEffect(() => {
    // Eğer defaultCustomerId varsa (randevu düzenleme modalından Hizmet ekle yapıldığında)
    // ve personel zaten seçiliyse input alanına odaklan
    if (formData.staffId && serviceInputRef.current && formData.customerId) {
      // Kısa bir süre bekleyerek diğer modal işlemlerinin tamamlanmasını sağla
      setTimeout(() => {
        // Rastgele zamanlı problem yüzünden odaklanma işlemini birkaç kez deniyoruz
        // Bu yöntem, modal açılış animasyonlarının tamamlanmasını beklemek için de faydalıdır
        try {
          serviceInputRef.current?.focus();
          console.log('Servis input alanına odaklanıldı');
          // Odaklanma sonrası handleServiceInputFocus işlevini manuel olarak çağır
          handleServiceInputFocus();
        } catch (err) {
          console.error('Odaklanma sırasında hata:', err);
        }
      }, 300);
      
      // İkinci bir odaklanma daha dene (DOM'un tam olarak hazır olmasını sağlamak için)
      setTimeout(() => {
        try {
          serviceInputRef.current?.focus();
          console.log('Servis input alanına tekrar odaklanıldı');
          // Tekrar handleServiceInputFocus işlevini çağır
          handleServiceInputFocus();
        } catch (err) {
          // Sessizce hatayı yut 
        }
      }, 500);
    }
  }, [formData.staffId, formData.customerId, serviceInputRef.current, handleServiceInputFocus]);
  
  return (
    <div className="relative">
      <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 bg-white">
        <Input
          ref={serviceInputRef}
          type="text"
          placeholder={formData.staffId ? "Hizmet ara..." : "Önce personel seçiniz"}
          value={serviceSearch}
          onChange={(e) => {
            setServiceSearch(e.target.value);
            // Kullanıcı bir şeyler yazmaya başladığında serviceId'yi hemen sıfırlama
            // Bunun yerine filtreleme işlemini uygulamasına izin ver
            if (formData.serviceId && e.target.value.length > 2) {
              setFormData((prev) => ({ ...prev, serviceId: "" }));
            }
          }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={!formData.staffId} // Staff must be selected first
          className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] ${!formData.staffId ? 'opacity-70 cursor-not-allowed' : ''} ${formData.serviceId ? "text-gray-900" : "text-gray-500"}`}
        />
      </div>
      
      {/* Filtrelenmiş hizmetleri göster, ama sadece input odaklandığında */}
      {inputFocused && Array.isArray(filteredServices) && filteredServices.length > 0 && (
        <div className="fixed z-50 mt-1 w-auto min-w-[500px] bg-white border rounded-[6px] shadow-xl overflow-y-auto" style={{ maxHeight: '250px' }}>
          {filteredServices.map((service) => {
            // Geçersiz hizmet nesnelerini kontrol et
            if (!service || typeof service !== 'object' || !service.id) {
              console.warn('Geçersiz hizmet nesnesi bulundu:', service);
              return null;
            }
            
            // Hizmet adı ve süresi için güvenli değerler koy
            const serviceName = service.name || 'Bilinmeyen Hizmet';
            const serviceDuration = service.duration || '?';
            const servicePrice = typeof service.price === 'number' ? service.price : 0;
            
            return (
              <div
                key={service.id}
                className={`p-4 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex justify-between items-center ${formData.serviceId === service.id ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}
                onClick={() => {
                  try {
                    // Önce mevcut serviceId'yi kontrol et, sadece boşsa veya farklıysa güncelle
                    if (!formData.serviceId || formData.serviceId !== service.id) {
                      console.log('ServiceSelector: Selecting service', serviceName, 'with ID', service.id, 'previous ID was', formData.serviceId);
                      handleServiceSelect(service);
                    } else {
                      console.log('ServiceSelector: Service already selected, ignoring click', serviceName, 'ID', service.id);
                    }
                    
                    // ÖNEMLİ: Seçimden sonra input'a odaklanma - liste görünümünü kapat
                    serviceInputRef.current?.blur();
                    // Hemen filtrelenmiş hizmet listesini temizle
                    setInputFocused(false);
                  } catch (err) {
                    console.error('Hizmet seçiminde hata:', err);
                  }
                }}
              >
                <div>
                  <span className="font-medium text-gray-900">{serviceName}</span>
                  <span className="ml-2 text-sm text-gray-500">({serviceDuration} dk)</span>
                </div>
                <span className="font-medium text-green-600">{servicePrice} TL</span>
              </div>
            );
          })}
        </div>
      )}
      
      {formData.staffId && (!Array.isArray(availableServices) || availableServices.length === 0) && (
        <p className="text-amber-600 text-sm mt-1 px-1">
          Bu personel için tanımlanmış hizmet bulunamadı. Lütfen önce personel ayarlarından hizmet tanımlayınız.
        </p>
      )}
    </div>
  );
}