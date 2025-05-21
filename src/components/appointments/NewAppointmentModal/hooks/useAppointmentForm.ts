// Form management hook for appointment creation/editing with performance optimizations

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatDateForInput } from '../utils/timeSlotUtils';
import { getCachedData } from '../services/dataPreloader';
import {
  fetchCustomers,
  fetchServices,
  fetchCustomerDetails,
} from '../services/api';
// Staff işlemleri için merkezi API mimarisi (ApiService) kullanılıyor

interface FormData {
  customerId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  notes: string;
}

interface Customer {
  id: string;
  name: string;
  // Add other customer properties if needed
}

interface Service {
  id: string;
  name: string;
  // Add other service properties if needed
}

interface Staff {
  id: string;
  name: string;
  isActive?: boolean;  // isActive özelliğini ekledik
  // Add other staff properties if needed
}

interface UseAppointmentFormProps {
  open: boolean;
  initialDate?: Date;
  initialStaffId?: string;
  appointment?: any;
  defaultCustomerId?: string;
  defaultStartTime?: string;
}

export const useAppointmentForm = ({
  open,
  initialDate,
  initialStaffId,
  appointment,
  defaultCustomerId,
  defaultStartTime
}: UseAppointmentFormProps) => {
  // Erken başlatma ve yükleme takibi için ref'ler
  const initialLoadDoneRef = useRef(false);
  const earlyLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form verileri ve UI state'leri
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isWorkingHoursValid, setIsWorkingHoursValid] = useState(true);
  const [showWorkingHoursWarning, setShowWorkingHoursWarning] = useState(false);

  // Arama state'leri - performans için değişiklikleri geciktirme
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  // Form verisi - başlangıç değerlerini memoize et
  const memoizedInitialFormData = useMemo(() => ({
    customerId: defaultCustomerId || "",
    serviceId: "",
    staffId: initialStaffId || "",
    startTime: "",
    notes: "",
  }), [defaultCustomerId, initialStaffId]);

  const [formData, setFormData] = useState<FormData>(memoizedInitialFormData);

  // Modal açıldığında veri yükleme
  useEffect(() => {
    if (open) {
      // Modal açıldığında hemen veri yüklemeyi başlat
      loadInitialData(false, true); // silent=false, forceStaffUpdate=true

      // Personel ID tanımlanmışsa log yap
      if (initialStaffId) {
        console.log("useAppointmentForm: Modal açıldı, initialStaffId:", initialStaffId);

        // Form verisini güncelle
        setFormData(prev => ({
          ...prev,
          staffId: initialStaffId
        }));
      }

      // Hata mesajını temizle
      setError("");
    }
  }, [open, initialStaffId, setFormData]);

  // Sayfa yüklendikten sonra arka planda verileri yükle
  useEffect(() => {
    // Modal açılmadan önce veri yüklemeyi başlat
    if (!initialLoadDoneRef.current && typeof window !== 'undefined') {
      // Çok kısa bir gecikme ile veri yüklemeyi başlat
      earlyLoadTimeoutRef.current = setTimeout(() => {
        loadInitialData(true); // silent=true, loading göstergesi olmadan yükle
        initialLoadDoneRef.current = true;
      }, 500);
    }

    return () => {
      if (earlyLoadTimeoutRef.current) {
        clearTimeout(earlyLoadTimeoutRef.current);
      }
    };
  }, []);

  // Form verilerini modal açıldığında ayarla
  useEffect(() => {
    if (open) {
      // Düzenleme veya yeni oluşturma durumuna göre form verilerini ayarla
      if (appointment) {
        // Mevcut randevuyu düzenleme
        setFormData({
          customerId: appointment.customerId || "",
          serviceId: appointment.serviceId || "",
          staffId: appointment.staffId || appointment.resourceId || "",
          startTime: appointment.start ? new Date(appointment.start).toISOString().slice(0, 16) : "",
          notes: appointment.notes || "",
        });

        // Müşteri arama alanını doldur
        if (appointment.customer?.name) {
          setCustomerSearch(appointment.customer.name);
        }
      } else {
        // Yeni randevu oluşturma
        let startDateTime;

        if (defaultStartTime) {
          // Başlangıç zamanı verilmişse onu kullan
          startDateTime = new Date(defaultStartTime);
        } else {
          // Yoksa belirtilen tarihi veya şimdiki zamanı kullan
          startDateTime = initialDate ? new Date(initialDate) : new Date();
        }

        // Form verilerini ayarla
        setFormData({
          customerId: defaultCustomerId || "",
          serviceId: "",
          staffId: initialStaffId || "",
          startTime: formatDateForInput(startDateTime),
          notes: "",
        });
      }

      // Hata mesajını temizle
      setError("");

      // Arama alanlarını temizle
      if (!appointment && !defaultCustomerId) {
        setCustomerSearch("");
      }

      // Varsayılan müşteri ID'si varsa müşteri detaylarını yükle
      if (defaultCustomerId && !appointment) {
        loadCustomerDetails(defaultCustomerId);
      }

      // İlk verileri yükle (zaten yüklenmediyse)
      if (!initialLoadDoneRef.current) {
        loadInitialData();
        initialLoadDoneRef.current = true;
      }
    }
  }, [open, appointment, defaultCustomerId, defaultStartTime, initialDate, initialStaffId]);

  // Personel ID değiştiğinde personelin sunduğu hizmetleri yükle
  useEffect(() => {
    if (formData.staffId) {
      loadStaffServices(formData.staffId);
    } else {
      setAvailableServices([]);
    }
  }, [formData.staffId, allServices]);

  // Müşteri araması filtreleme
  useEffect(() => {
    // Gecikme ile aramaları uygula (performans için)
    const debounceTimeout = setTimeout(() => {
      if (customerSearch) {
        const filtered = customers.filter((customer) =>
          customer.name.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setFilteredCustomers(filtered as Customer[]);
      } else {
        setFilteredCustomers([]);
      }
    }, 120); // 120ms gecikme ile filtrele

    return () => clearTimeout(debounceTimeout);
  }, [customerSearch, customers]);

  // Hizmet araması filtreleme
  useEffect(() => {
    // Gecikme ile aramaları uygula (performans için)
    const debounceTimeout = setTimeout(() => {
      // Önce availableServices'in bir dizi olduğundan emin ol
      if (!Array.isArray(availableServices)) {
        console.error("HATA: availableServices bir dizi değil:", availableServices);
        setFilteredServices([]);
        return;
      }

      if (serviceSearch && availableServices.length > 0) {
        try {
          const filtered = availableServices.filter((service) =>
            service && service.name && service.name.toLowerCase().includes(serviceSearch.toLowerCase())
          );
          setFilteredServices(filtered);
        } catch (err) {
          console.error("Hizmet filtreleme hatası:", err);
          setFilteredServices(availableServices); // Hata durumunda tüm hizmetleri göster
        }
      } else {
        setFilteredServices(availableServices);
      }
    }, 120); // 120ms gecikme ile filtrele

    return () => clearTimeout(debounceTimeout);
  }, [serviceSearch, availableServices]);

  // İlk verileri yükle - merkezi API mimarisini kullanma güncellemesi yapıldı
  const loadInitialData = async (silent = false, forceStaffUpdate = false) => {
    try {
      if (!silent) setLoading(true);

      console.log("loadInitialData: Veriler yükleniyor... (forceStaffUpdate=", forceStaffUpdate, ")");

      // ApiService'i dinamik olarak import et (Bu import zaten doğruydu)
      const { ApiService } = await import('@/services/api');

      // Personel verilerini merkezi API'den getir
      let staffPromise;
      if (forceStaffUpdate) {
        console.log("loadInitialData: Doğrudan ApiService.staff.getAll çağrılıyor (force update)");
        staffPromise = ApiService.staff.getAll(false);
      } else {
        console.log("loadInitialData: Önbellekten getCachedData ile personel getiriliyor");
        staffPromise = getCachedData('staff_list', async () => ApiService.staff.getAll(false));
      }

      // Önbellekten paralel veri yükleme - diğer API'ler için mevcut fonksiyonları kullan
      const [staffResult, customersData, servicesData] = await Promise.all([
        staffPromise,
        getCachedData('customers_list', fetchCustomers),
        getCachedData('services_list', fetchServices)
      ]);

      console.log("loadInitialData: Staff result debug:", staffResult);

      // Personel verilerini API yanıtından çıkar
      let staffList: Staff[] = [];

      if (staffResult.success && staffResult.data) {
        // API yanıt formatlarını kontrol et
        if (staffResult.data.activeStaff && Array.isArray(staffResult.data.activeStaff)) {
          staffList = staffResult.data.activeStaff as Staff[];
        } else if (staffResult.data.allStaff && Array.isArray(staffResult.data.allStaff)) {
          // Tip güvenliği için as Staff[] dönüşümü kullan
          const typedAllStaff = staffResult.data.allStaff as Staff[];
          staffList = typedAllStaff.filter(s => s.isActive !== false);
        } else if (Array.isArray(staffResult.data)) {
          // Tip güvenliği için as Staff[] dönüşümü kullan
          const typedStaffData = staffResult.data as Staff[];
          staffList = typedStaffData.filter(s => s.isActive !== false);
        }
      }

      console.log("loadInitialData: Personel verisi alındı, format kontrol ediliyor:", {
        success: staffResult.success,
        isArray: Array.isArray(staffList),
        length: staffList.length
      });

      // Eğer personel listesi boşsa, tekrar getirmeyi dene
      if (staffList.length === 0 || forceStaffUpdate) {
        console.log("loadInitialData: Personel listesi boş veya güncelleme zorunlu, tekrar getiriliyor...");
        const refreshResult = await ApiService.staff.getAll(false);

        if (refreshResult.success && refreshResult.data) {
          if (refreshResult.data.activeStaff && Array.isArray(refreshResult.data.activeStaff)) {
            staffList = refreshResult.data.activeStaff as Staff[];
          } else if (refreshResult.data.allStaff && Array.isArray(refreshResult.data.allStaff)) {
            // Tip güvenliği için filter işlevinde tip dönüşümü kullan
            const typedAllStaff = refreshResult.data.allStaff as Staff[];
            staffList = typedAllStaff.filter(s => s.isActive !== false);
          } else if (Array.isArray(refreshResult.data)) {
            // Tip güvenliği için filter işlevinde tip dönüşümü kullan
            const typedStaffData = refreshResult.data as Staff[];
            staffList = typedStaffData.filter(s => s.isActive !== false);
          }
        }
      }

      console.log(`loadInitialData: Son personel listesi uzunluğu: ${staffList.length}`);
      if (staffList.length > 0) {
        // Tip dönüşümü (type casting) ile staffList'i Staff[] olarak belirt
        const typedStaffList = staffList as Staff[];
        console.log("loadInitialData: Personel listesi:",
          typedStaffList.map(s => `${s.name} (${s.id})`).join(', ')
        );
      }

      // Durum güncellemelerini toplu yap
      setStaff(staffList as Staff[]);
      setCustomers(customersData as Customer[]);
      setAllServices(servicesData as Service[]);

      // Başlangıçta personel seçili değilse, otomatik seç
      const staffId = initialStaffId || appointment?.staffId || "";
      // Tip dönüşümü yaparak staffList'i Staff[] olarak kullan
      const typedStaffList = staffList as Staff[];
      if (staffId && typedStaffList.some(s => s.id === staffId)) {
        console.log("loadInitialData: Personel otomatik seçildi:", staffId);
        setFormData(prev => ({ ...prev, staffId }));
      } else if (staffId) {
        console.log("loadInitialData: Belirtilen staffId listede bulunamadı:", staffId);
        console.log("loadInitialData: Mevcut personel ID'leri:", typedStaffList.map(s => s.id));
      }
    } catch (err) {
      console.error("loadInitialData hatası:", err);
      if (!silent) setError("Veri yüklenirken bir hata oluştu");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Müşteri detaylarını yükle
  const loadCustomerDetails = async (customerId: string) => {
    try {
      const customer = await getCachedData(
        `customer_${customerId}`,
        () => fetchCustomerDetails(customerId)
      );

      // Müşteri bilgilerini form durumuna ekle
      if (customer?.name) {
        setCustomerSearch(customer.name);
      }
    } catch (err) {
      console.error("Müşteri bilgisi alınırken hata:", err);
      setError("Müşteri bilgisi alınamadı");
    }
  };

  // Personel hizmetlerini yükle - merkezi API mimarisine uygun hale getirildi
  const loadStaffServices = async (staffId: string) => {
    try {
      console.log(`loadStaffServices çağrılıyor - staffId: ${staffId}`);

      // allServices'in bir dizi olup olmadığını kontrol et
      if (!Array.isArray(allServices)) {
        console.error("HATA: allServices bir dizi değil:", allServices);
        setAvailableServices([]);
        setFilteredServices([]);
        setError("Hizmetler yüklenemedi, lütfen sayfayı yenileyin");
        return;
      }

      console.log(`allServices sayısı: ${allServices.length}`);

      // ApiService'i dinamik olarak import et (BU SATIR DÜZELTİLDİ)
      const { ApiService } = await import('@/services/api');

      // Önce fonksiyon içinde direkt servis çağrımı yap - merkezi API kullanarak
      let services: Service[] = [];
      try {
        console.log(`Merkezi API için staffService.getStaffServices çağrılıyor, staffId: ${staffId}`);
        const { getStaffServices } = await import('@/services/staffService');
        const serviceResults = await getStaffServices(staffId, allServices);
        
        // Convert any[] to Service[]
        services = Array.isArray(serviceResults) ? serviceResults.map(service => ({
          id: service.id || '',
          name: service.name || ''
        })) : [];

        // services zaten Service[] tipinde olduğu için ek kontrol gerekmez

        console.log(`Personel hizmetleri yüklendi: ${services.length} hizmet bulundu`);
      } catch (serviceError) {
        console.error("Personel hizmetleri alınırken hata:", serviceError);
        // Hata durumunda tüm hizmetleri kullan
        console.log("Hata nedeniyle tüm hizmetleri kullanıyoruz");
        services = allServices || [];
      }

      // Hizmet listesi boşsa ve allServices doluysa, tüm hizmetleri kullan
      if (services.length === 0 && allServices.length > 0) {
        console.log("Personel için hizmet bulunamadı, tüm hizmetleri kullanıyoruz");
        services = [...allServices];
      }

      // Veri doğrulama: services içindeki öğelerin geçerli hizmet nesneleri olduğundan emin ol
      const validServices = services.filter(service => {
        if (!service || typeof service !== 'object' || !service.id) {
          console.warn('Geçersiz hizmet nesnesi filtrelendi:', service);
          return false;
        }
        return true;
      });

      if (validServices.length !== services.length) {
        console.log(`${services.length - validServices.length} geçersiz hizmet filtreden geçirildi`);
      }

      // Verileri ayarla - doğru tiplerle ayarladığımızdan emin olalım
      setAvailableServices(validServices as Service[]);
      setFilteredServices(validServices as Service[]); // Başlangıçta tüm hizmetleri göster

      // Seçili hizmeti korumaya çalış
      if (formData.serviceId) {
        try {
          const serviceExists = validServices.some((service) => service.id === formData.serviceId);
          if (!serviceExists) {
            // Seçili hizmet bulunamadıysa, hizmet listesinde varsa bile yeniden seçilmesini isteme
            if (appointment?.serviceId === formData.serviceId) {
              console.log(`Düzenleme modunda seçili hizmet (${formData.serviceId}) korunuyor`);
            } else {
              console.log(`Seçili hizmet (${formData.serviceId}) personelin hizmetleri arasında değil, sıfırlanıyor`);
              setFormData((prev) => ({ ...prev, serviceId: "" }));
            }
          }
        } catch (filterError) {
          console.error("Hizmet filtrelerken hata:", filterError);
          // Hata durumunda service ID'yi koruyun
        }
      }
    } catch (err) {
      console.error("Personel hizmetleri yüklenirken genel hata:", err);

      // Hata durumunda mevcut tüm hizmetleri gösterelim
      if (Array.isArray(allServices) && allServices.length > 0) {
        // Veri doğrulama eklendi
        const validAllServices = allServices.filter(service => {
          return service && typeof service === 'object' && service.id;
        });

        setAvailableServices(validAllServices as Service[]);
        setFilteredServices(validAllServices as Service[]);
        console.log(`Hata nedeniyle mümkün olan ${validAllServices.length} hizmet gösteriliyor`);
      } else {
        setAvailableServices([]);
        setFilteredServices([]);
      }
    }
  };

  // Müşteri seçim işleyicisi
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setFormData((prev) => ({ ...prev, customerId: customer.id }));
    setCustomerSearch(customer.name);
    setFilteredCustomers([]);
  }, []);

  // Hizmet seçim işleyicisi - önceki service ID kontrolü eklendi
  const handleServiceSelect = useCallback((service: Service) => {
    console.log('useAppointmentForm: handleServiceSelect called with service', service.name, 'ID', service.id);

    // Aynı serviceId seçiliyse gereksiz state güncellemesi yapma
    setFormData((prev) => {
      console.log('useAppointmentForm: Current formData serviceId:', prev.serviceId);

      if (prev.serviceId === service.id) {
        // Zaten aynı hizmet seçili, güncelleme yapma
        console.log('useAppointmentForm: Same service already selected, not updating state');
        return prev;
      }

      // Farklı bir hizmet seçilmiş, güncelle
      console.log('useAppointmentForm: Updating formData with new serviceId:', service.id);
      return { ...prev, serviceId: service.id };
    });

    // Hizmet seçimi sonrası input içeriğini hizmet adı ile doldur
    setServiceSearch(service.name);

    // ÖNEMLİ: Hizmet seçimi sonrası filtrelenmiş hizmet listesini temizle
    setFilteredServices([]);
  }, []);

  // Hizmet arama alanına odaklanıldığında tüm hizmetleri göster
  const handleServiceInputFocus = useCallback(() => {
    if (formData.staffId && availableServices.length > 0) {
      setFilteredServices(availableServices);
      // Boş string yerine küçük bir içerik ekleyerek hizmet listesinin görüntülenmesini sağla
      setServiceSearch(" ");

      // Kısa bir süre sonra input içeriğini temizle ama hizmetler görüntülenmeye devam etsin
      setTimeout(() => {
        setServiceSearch("");
      }, 100);
    }
  }, [formData.staffId, availableServices]);

  // Formu sıfırla
  const resetForm = useCallback(() => {
    setFormData({
      customerId: "",
      serviceId: "",
      staffId: "",
      startTime: "",
      notes: "",
    });
    setCustomerSearch("");
    setServiceSearch("");
    setShowWorkingHoursWarning(false);
    setIsWorkingHoursValid(true);
  }, []);

  // Form doğrulama
  const validateForm = useCallback(() => {
    if (!formData.customerId) {
      setError("Lütfen bir müşteri seçin");
      return false;
    }
    if (!formData.staffId) {
      setError("Lütfen bir personel seçin");
      return false;
    }
    if (!formData.serviceId) {
      setError("Lütfen bir hizmet seçin");
      return false;
    }
    if (!formData.startTime) {
      setError("Lütfen bir randevu zamanı seçin");
      return false;
    }
    return true;
  }, [formData.customerId, formData.staffId, formData.serviceId, formData.startTime]);

  return {
    loading,
    setLoading,
    error,
    setError,
    staff,
    availableServices,
    customers,
    allServices,
    customerSearch,
    setCustomerSearch,
    filteredCustomers,
    serviceSearch,
    setServiceSearch,
    filteredServices,
    formData,
    setFormData,
    isWorkingHoursValid,
    setIsWorkingHoursValid,
    showWorkingHoursWarning,
    setShowWorkingHoursWarning,
    handleCustomerSelect,
    handleServiceSelect,
    handleServiceInputFocus,
    resetForm,
    validateForm
  };
};