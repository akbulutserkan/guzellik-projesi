"use client";

import { useState, useEffect, useCallback } from "react";
import { callMcpApi } from '@/lib/mcp/helpers';

interface UseAppointmentEditingProps {
  appointment: any;
  updateTotalAmount?: (newPrice: number) => void;
  forceRefresh: () => void;
  setEditingAppointmentId: (id: string | null) => void;
  toast: any;
}

export const useAppointmentEditing = ({
  appointment,
  updateTotalAmount,
  forceRefresh,
  setEditingAppointmentId,
  toast,
}: UseAppointmentEditingProps) => {
  const [loading, setLoading] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState(
    appointment?.service?.price ? appointment.service.price.toString() : ""
  );
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Dropdown durumu değişikliklerini izleyen useEffect
  useEffect(() => {
    // Dropdown durumu değiştiğinde custom event yayınla
    const isAnyDropdownOpen = isServiceDropdownOpen || isStaffDropdownOpen || isEditingPrice;
    
    // Custom event oluştur ve yayınla
    const dropdownEvent = new CustomEvent('appointmentDropdownToggled', {
      detail: { isOpen: isAnyDropdownOpen }
    });
    document.dispatchEvent(dropdownEvent);
    
  }, [isServiceDropdownOpen, isStaffDropdownOpen, isEditingPrice]);

  // Düzenleme modundan çıkmak için 
  const exitEditingMode = useCallback(() => {
    setIsEditingMode(false);
    setEditingAppointmentId(null);
    setIsServiceDropdownOpen(false);
    setIsStaffDropdownOpen(false);
    setIsEditingPrice(false);
  }, [setEditingAppointmentId]);

  // Fiyat değiştirme işlemi - MCP API ile
  const handlePriceChange = useCallback(
    async (newPrice: string) => {
      // Fiyat değişmemişse, API'ye gerek olmadan kapat
      if (newPrice === (appointment?.service?.price?.toString() || "")) {
        setIsEditingPrice(false);
        exitEditingMode();
        return;
      }

      setCustomPrice(newPrice);
      try {
        const price = parseFloat(newPrice);
        if (isNaN(price)) return;

        console.log("MCP API ile fiyat güncelleniyor:", price, "Randevu ID:", appointment.id);

        // callMcpApi yardımcı fonksiyonunu kullan
        const result = await callMcpApi('update-appointment', { 
          id: appointment.id,
          // serviceId olmadığı için doğrudan fiyat güncellemesi yapamıyoruz
          // Bu durumda fiyatı sadece UI'da göstereceğiz
          notes: `Fiyat guncellendi: ${price} TL` 
        }, {
          showToast: false // Özel toast kullandığımız için
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Fiyat güncellenemedi');
        }

        toast({
          title: "Başarılı",
          description: "Fiyat güncellendi",
        });

        // Yerel state'te fiyatı güncelleyelim
        if (appointment?.service) {
          appointment.service.price = price;
        }

        // Toplam tutarı güncelle - eğer fonksiyon geçildiyse
        if (updateTotalAmount) {
          updateTotalAmount(price);
        }

        exitEditingMode();
        
        // SADECE forceRefresh çağır, onUpdate çağırma!
        forceRefresh();
        
        // Zorla ödeme bölümünü yenileme eventi tetikle
        const updateEvent = new CustomEvent('force_payment_refresh', { 
          detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(updateEvent);
      } catch (error) {
        console.error("Fiyat güncelleme hatası:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Fiyat güncellenirken bir hata oluştu.",
        });
      } finally {
        setIsEditingPrice(false);
      }
    },
    [appointment, toast, updateTotalAmount, forceRefresh, exitEditingMode]
  );

  // Personele özel hizmetleri getir - MCP API entegrasyonu ile
  const fetchServices = useCallback(async () => {
    try {
      // Önce personelin ID'sini al
      const staffId = appointment?.staffId || appointment?.staff?.id;
      console.log(`Personele özel hizmetler getiriliyor, personel ID: ${staffId}`);
      
      if (!staffId) {
        console.warn('Personel ID bulunamadı, tüm hizmetler listeleniyor');
        // Tüm hizmetleri getir - MCP API kullanarak
        const result = await callMcpApi('get-services', { includeDeleted: false }, {
          showToast: false
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Hizmetler getirilemedi');
        }
        
        let allServices = [];
        
        if (result.data) {
          allServices = result.data;
        } else if (result.content && result.content[0]?.text) {
          try {
            allServices = JSON.parse(result.content[0].text);
          } catch (e) {
            console.error('JSON parse hatası:', e);
          }
        }
        
        setServices(allServices);
        console.log(`Tüm hizmetlerden ${allServices.length} hizmet yüklendi`);
        return;
      }
      
      // Personele özel hizmetleri getir
      console.log('MCP API ile personel hizmetleri getiriliyor');
      
      // Önce personel bilgilerini al (özellikle hizmetler listesini) - MCP API kullanarak
      const staffResult = await callMcpApi('get-staff-by-id', { id: staffId }, {
        showToast: false
      });
      
      if (!staffResult.success) {
        throw new Error(staffResult.error || 'Personel bilgisi alınamadı');
      }
      
      let staffData = null;
      
      // Yanıt içinde data var mı?
      if (staffResult.success && staffResult.data) {
        staffData = staffResult.data;
      } 
      // Ya da content içinde JSON olabilir
      else if (staffResult.content && staffResult.content[0]?.text) {
        try {
          staffData = JSON.parse(staffResult.content[0].text);
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      if (!staffData) {
        console.warn('Personel verisi bulunamadı, tüm hizmetlere geçiliyor');
        
        // API'den tüm hizmetleri getir ve bunları göster - MCP API kullanarak
        const allServicesResult = await callMcpApi('get-services', { includeDeleted: false }, {
          showToast: false
        });
        
        let allServices = [];
        
        if (allServicesResult.data) {
          allServices = allServicesResult.data;
        } else if (allServicesResult.content && allServicesResult.content[0]?.text) {
          try {
            allServices = JSON.parse(allServicesResult.content[0].text);
          } catch (e) {
            console.error('JSON parse hatası:', e);
          }
        }
        
        setServices(allServices);
        console.log(`Tüm hizmetlerden ${allServices.length} hizmet yüklendi`);
        return;
      }
      
      // Personel hizmetlerini al
      const staffServices = staffData.services || [];
      console.log(`Personelin ${staffServices.length} hizmeti var:`, staffServices);
      
      // Eğer personel hizmetleri boşsa, tüm hizmetleri getir
      if (staffServices.length === 0) {
        console.log('Personelin hizmeti bulunamadı, tüm hizmetlere geçiliyor');
        
        // Tüm hizmetleri getir - MCP API kullanarak
        const allServicesResult = await callMcpApi('get-services', { includeDeleted: false }, {
          showToast: false
        });
        
        let allServices = [];
        
        if (allServicesResult.data) {
          allServices = allServicesResult.data;
        } else if (allServicesResult.content && allServicesResult.content[0]?.text) {
          try {
            allServices = JSON.parse(allServicesResult.content[0].text);
          } catch (e) {
            console.error('JSON parse hatası:', e);
          }
        }
        
        setServices(allServices);
        console.log(`Tüm hizmetlerden ${allServices.length} hizmet yüklendi`);
        return;
      }
      
      // Personel hizmetlerinin detaylı bilgilerini al
      // Bunun için tüm hizmetleri getirip, personelin hizmetleriyle eşleştireceğiz - MCP API kullanarak
      const servicesResult = await callMcpApi('get-services', { includeDeleted: false }, {
        showToast: false
      });
      
      let allServices = [];
      
      if (servicesResult.data) {
        allServices = servicesResult.data;
      } else if (servicesResult.content && servicesResult.content[0]?.text) {
        try {
          allServices = JSON.parse(servicesResult.content[0].text);
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      // Personelin hizmetlerini genişletilmiş bilgilerle zenginleştir
      const enrichedServices = staffServices.map((service: any) => {
        const fullService = allServices.find((s: any) => s.id === service.id);
        return fullService || service;
      });
      
      console.log(`Personel için zenginleştirilmiş ${enrichedServices.length} hizmet yüklendi`);
      setServices(enrichedServices);
      
      // Yeni veriyi önbelleğe al
      try {
        localStorage.setItem(`staff_services_${staffId}`, JSON.stringify(enrichedServices));
      } catch (e) {
        console.error('Hizmetleri önbelleğe alma hatası:', e);
      }
    } catch (error) {
      console.error("Hizmetleri getirme hatası:", error);
      
      // Önce personele özel önbellekten yüklemeyi dene
      const staffId = appointment?.staffId || appointment?.staff?.id;
      if (staffId) {
        const cachedStaffServices = localStorage.getItem(`staff_services_${staffId}`);
        if (cachedStaffServices) {
          try {
            const parsedServices = JSON.parse(cachedStaffServices);
            if (Array.isArray(parsedServices) && parsedServices.length > 0) {
              console.log(`Personele özel önbellekten ${parsedServices.length} hizmet kullanılıyor`);
              setServices(parsedServices);
              return; // Başarıyla yüklendi
            }
          } catch (e) {
            console.error('Personele özel önbellekten yükleme hatası:', e);
          }
        }
      }
      
      // Genel önbellekten yüklemeyi dene
      const cachedServices = localStorage.getItem('all_services');
      if (cachedServices) {
        try {
          const parsedServices = JSON.parse(cachedServices);
          if (Array.isArray(parsedServices) && parsedServices.length > 0) {
            console.log(`Önbellekten ${parsedServices.length} hizmet kullanılıyor`);
            setServices(parsedServices);
          }
        } catch (e) {
          console.error('Önbellekten hizmet yükleme hatası:', e);
        }
      }
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hizmetler getirilemedi.",
      });
    }
  }, [appointment, toast]);

  // Personel listesini getir - MCP API entegrasyonu ile
  const fetchStaffList = useCallback(async () => {
    try {
      // Önce önbellekten yükle
      const cachedStaff = localStorage.getItem('all_staff');
      if (cachedStaff) {
        try {
          const parsedStaff = JSON.parse(cachedStaff);
          if (Array.isArray(parsedStaff) && parsedStaff.length > 0) {
            console.log(`Önbellekten ${parsedStaff.length} personel kullanılıyor`);
            setStaffList(parsedStaff);
            return; // Önbellek başarılıysa API çağrısı yapmaya gerek yok
          }
        } catch (e) {
          console.error('Önbellekten personel yükleme hatası:', e);
        }
      }

      // Zaten yüklenmiş personel listesi varsa tekrar yükleme
      if (staffList.length > 0) {
        return;
      }

      console.log('MCP API üzerinden personel listesi getiriliyor...');
      const result = await callMcpApi('get-staff', { includeInactive: false }, {
        showToast: false
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Personel listesi getirilemedi');
      }
      
      // Veri yapısını analiz et
      let staffData = [];
      
      // Yanıt içinde data var mı?
      if (result.data?.activeStaff) {
        staffData = result.data.activeStaff;
        console.log(`MCP API activeStaff'ten ${staffData.length} personel yüklendi`);
      } 
      else if (result.data) {
        staffData = result.data;
        console.log(`MCP API data'dan ${staffData.length} personel yüklendi`);
      }
      // Ya da content içinde JSON olabilir
      else if (result.content && result.content[0]?.text) {
        try {
          const parsedContent = JSON.parse(result.content[0].text);
          // Aktif personeli al
          if (parsedContent.activeStaff) {
            staffData = parsedContent.activeStaff;
          } else {
            staffData = parsedContent;
          }
          console.log(`MCP API content'ten ${staffData.length} personel yüklendi`);
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      setStaffList(staffData);
      console.log(`${staffData.length} personel alındı ve state güncellendi`);
      
      // Yeni veriyi önbelleğe al
      try {
        localStorage.setItem('all_staff', JSON.stringify(staffData));
      } catch (e) {
        console.error('Personeli önbelleğe alma hatası:', e);
      }
    } catch (error) {
      console.error("Personel listesi getirme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel listesi getirilemedi.",
      });
    }
  }, [staffList.length, toast]);

  // Servis dropdown kontrolü
  const toggleServiceDropdown = useCallback(() => {
    // Eğer dropdown zaten açıksa ve kapatılıyorsa, düzenleme modunu iptal et
    if (isServiceDropdownOpen) {
      setIsServiceDropdownOpen(false);
      exitEditingMode();
      return;
    }
    
    // Dropdown açılıyorsa
    if (!isServiceDropdownOpen) {
      fetchServices();
    }
    
    setIsServiceDropdownOpen(true);
    setIsStaffDropdownOpen(false); // Diğer dropdown'u kapat
  }, [isServiceDropdownOpen, exitEditingMode, fetchServices]);

  // Personel dropdown kontrolü
  const toggleStaffDropdown = useCallback(() => {
    // Eğer dropdown zaten açıksa ve kapatılıyorsa, düzenleme modunu iptal et
    if (isStaffDropdownOpen) {
      setIsStaffDropdownOpen(false);
      exitEditingMode();
      return;
    }

    if (!isStaffDropdownOpen) {
      fetchStaffList();
    }
    
    setIsStaffDropdownOpen(true);
    setIsServiceDropdownOpen(false); // Diğer dropdown'u kapat
  }, [isStaffDropdownOpen, exitEditingMode, fetchStaffList]);

  // Hizmet seçme işlemi - MCP API ile
  const selectService = useCallback(async (service: any) => {
    try {
      setLoading(true);
      console.log("MCP API ile hizmet güncelleniyor:", service.name, "ID:", service.id);

      const result = await callMcpApi('update-appointment', { 
        id: appointment.id,
        serviceId: service.id 
      }, {
        showToast: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Hizmet güncellenemedi');
      }

      toast({
        title: "Başarılı",
        description: "Hizmet güncellendi",
      });

      // Fiyat alanını hizmet fiyatıyla güncelle
      if (service.price) {
        setCustomPrice(service.price.toString());
      }

      // Dropdown'u kapat
      setIsServiceDropdownOpen(false);

      // Lokal olarak appointment nesnesini güncelle
      appointment.service = service;
      appointment.serviceId = service.id;

      exitEditingMode();

      // Modal içeriğini yenile
      forceRefresh();
      
      // Zorla ödeme bölümünü yenileme eventi tetikle
      const updateEvent = new CustomEvent('force_payment_refresh', { 
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(updateEvent);
    } catch (error) {
      console.error("Hizmet güncelleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hizmet güncellenirken bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }, [appointment, toast, forceRefresh, exitEditingMode]);

  // Personel seçme işlemi - MCP API ile
  const selectStaffMember = useCallback(async (staff: any) => {
    try {
      setLoading(true);
      console.log("MCP API ile personel güncelleniyor:", staff.name, "ID:", staff.id);

      const result = await callMcpApi('update-appointment', { 
        id: appointment.id,
        staffId: staff.id 
      }, {
        showToast: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Personel güncellenemedi');
      }

      toast({
        title: "Başarılı",
        description: "Personel güncellendi",
      });

      // Dropdown'u kapat
      setIsStaffDropdownOpen(false);

      // Appointment nesnesini lokal olarak güncelle
      appointment.staff = staff;
      appointment.staffId = staff.id;

      exitEditingMode();

      // Modal içeriğini yenile
      forceRefresh();
      
      // Zorla ödeme bölümünü yenileme eventi tetikle
      const updateEvent = new CustomEvent('force_payment_refresh', { 
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(updateEvent);
    } catch (error) {
      console.error("Personel güncelleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel güncellenirken bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }, [appointment, toast, forceRefresh, exitEditingMode]);

  return {
    // State
    loading, setLoading,
    isEditingMode, setIsEditingMode,
    isEditingPrice, setIsEditingPrice,
    customPrice, setCustomPrice,
    isServiceDropdownOpen, setIsServiceDropdownOpen,
    isStaffDropdownOpen, setIsStaffDropdownOpen,
    searchTerm, setSearchTerm,
    services, staffList,
    
    // Methods
    exitEditingMode,
    handlePriceChange,
    fetchServices,
    fetchStaffList,
    toggleServiceDropdown,
    toggleStaffDropdown,
    selectService,
    selectStaffMember
  };
};
