'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Service, 
  Category, 
  FormData, 
  PackageModalProps 
} from '@/types/package';
import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { usePackageManagement } from '@/hooks/package';

export default function PackageModal({
  isOpen,
  onClose,
  onSubmit,
  fetchPackages,
  packageData
}: PackageModalProps) {
  // TAMAMEN FARKLI BİR YAKLAŞIM - HOOK SİSTEMİNİ KULLANMAYI BIRAK
  
  // Basit state'ler ile veriyi yönet
  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    sessionCount: '',
    price: '',
    categoryId: '',
    serviceIds: [] as string[], 
    serviceName: ''
  });

  // Servisleri ve kategorileri yerel olarak sakla
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Manuel geçersiz kılma - bir daha asla yapılmayacak istekileri kontrol et
  const hasLoadedData = useRef(false);
  
  // Her hizmet kartı için ayrı input değerlerini tutacak state - useRef kullanarak performans iyileştirmesi
  const serviceInputsRef = useRef<Record<string, { sessionCount: string, price: string }>>({});
  
  // State kontrollü bir get/set fonksiyonu ekle
  const getServiceInputs = () => serviceInputsRef.current;
  const setServiceInput = (serviceId: string, field: 'sessionCount' | 'price', value: string) => {
    serviceInputsRef.current = {
      ...serviceInputsRef.current,
      [serviceId]: {
        ...serviceInputsRef.current[serviceId] || { sessionCount: "1", price: "0" },
        [field]: value
      }
    };
  };

  // Modal kapandığında formu sıfırla
  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      name: '',
      sessionCount: '',
      price: '',
      categoryId: '',
      serviceIds: [] as string[],
      serviceName: ''
    });
    setError('');
    setSuccessMessage('');
    setIsSubmitting(false);
    // Service inputs'u da sıfırla
    serviceInputsRef.current = {};
  }, []);
  
  // Modal kapandığında formu sıfırla
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Düzenleme modunda ise paket verilerini yükle
  useEffect(() => {
    if (packageData && isOpen) {
      // PackageData'dan serviceIds'i kontrol et
      const extractedServiceIds = packageData.packageServices?.map(ps => ps.service.id) || [];
      
      setFormData({
        id: packageData.id || '',
        name: packageData.name || '',
        sessionCount: packageData.sessionCount ? packageData.sessionCount.toString() : '',
        price: packageData.price ? packageData.price.toString() : '',
        categoryId: packageData.category?.id || '',
        serviceIds: extractedServiceIds,
        serviceName: packageData.name || ''
      });
    }
  }, [packageData, isOpen]);

  // SADECE BİR KEZ ve modal açıldığında çalışacak
  useEffect(() => {
    // Eğer modal açık değilse hiçbir şey yapma
    if (!isOpen) return;

    // Eğer daha önce yüklendi ise, tekrar yükleme
    if (hasLoadedData.current) return;
    
    // Yükleme başladı, tekrar yüklemeyi önle
    hasLoadedData.current = true;
    
    // Yükleniyor göstergesi başlat
    setLoading(true);
    console.log('[PACKAGE-MODAL] Veriler tek seferlik yükleniyor');

    // Hizmetleri yükle - tek bir API çağrısı yap
    fetch('/api/services')
      .then(response => response.json())
      .then(result => {
        if (result.success && result.data) {
          // Hizmetleri kaydet
          setServices(result.data);
          console.log(`[PACKAGE-MODAL] ${result.data.length} hizmet yüklendi`);
          
          // Hizmetler için ön input değerlerini ayarla
          const defaultInputs: Record<string, { sessionCount: string, price: string }> = {};
          
          result.data.forEach((service: Service) => {
            defaultInputs[service.id] = {
              sessionCount: "1",
              price: service.price ? service.price.toString() : "0"
            };
          });
          
          // Input değerlerini referansa kaydet
          serviceInputsRef.current = defaultInputs;

          // Servislerin içinde zaten kategori bilgisi var, dolaylı olarak çıkarabiliriz
          const uniqueCategories: Record<string, Category> = {};
          
          result.data.forEach((service: Service) => {
            if (service.category && service.category.id) {
              uniqueCategories[service.category.id] = service.category;
            }
          });
          
          // Kategori dizisine dönüştür
          const extractedCategories = Object.values(uniqueCategories);
          console.log(`[PACKAGE-MODAL] ${extractedCategories.length} kategori çıkarıldı`);
          setCategories(extractedCategories);
        } else {
          console.error('[PACKAGE-MODAL] API yanıtı başarısız:', result);
          setError('Hizmetler yüklenirken bir hata oluştu');
        }
      })
      .catch(error => {
        console.error('[PACKAGE-MODAL] API hatası:', error);
        setError('Hizmetler yüklenirken bir hata oluştu');
      })
      .finally(() => {
        setLoading(false);
      });
    
    // Temizleme fonksiyonu
    return () => {
      if (!isOpen) {
        hasLoadedData.current = false;
      }
    };
  }, [isOpen]);

  // Form gönderimi fonksiyonu
  const handleSubmit = useCallback(async (serviceId: string, sessionCount: string, price: string) => {
    console.log("[PACKAGE-MODAL] handleSubmit çağrıldı, serviceId:", serviceId);
    
    setError('');
    
    // Çift gönderimi engelle
    if (isSubmitting) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Validasyonlar
      const sessionCountValue = sessionCount || "1";
      const priceValue = price || "0";

      if (!sessionCountValue || isNaN(parseInt(sessionCountValue)) || parseInt(sessionCountValue) < 1) {
        setError('Geçerli bir seans sayısı giriniz');
        return;
      }

      if (!priceValue || isNaN(parseFloat(priceValue)) || parseFloat(priceValue) < 0) {
        setError('Geçerli bir fiyat giriniz');
        return;
      }

      const selectedService = services.find(service => service.id === serviceId);
      if (!selectedService) {
        setError('Geçerli bir hizmet seçiniz');
        return;
      }

      // Form verilerini hazırla
      const packageName = `${selectedService.name} Paketi`;
      const sessionCountNum = parseInt(sessionCount);
      const priceNum = parseFloat(price);
      const categoryId = selectedService.category?.id || '';
      const serviceIds = [serviceId];

      // Form verilerini direk o hizmet kartı için hazırla
      const submitData = {
        name: packageName,
        sessionCount: sessionCountNum,
        price: priceNum,
        categoryId: categoryId,
        serviceIds: serviceIds
      };

      try {
        if (typeof onSubmit !== 'function') {
          throw new Error('onSubmit fonksiyonu tanımlı değil');
        }
        
        // Ana bileşene verileri gönder
        const result = await onSubmit(submitData);
        
        // Sadece başarılı olduğunda mesaj göster
        setSuccessMessage('İşlem başarıyla tamamlandı!');
        
      } catch (error) {
        // Hata durumunda modal kalmalı, hatayı göster
        setError(error instanceof Error ? error.message : 'İşlem sırasında bir hata oluştu');
        return;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, services, onSubmit]);

  // Kategorilere göre hizmetleri grupla
  const groupedServices = services.length > 0
    ? services.reduce((acc, service) => {
        if (!service.category) {
          return acc;
        }
        
        const categoryName = service.category.name || 'Kategorisiz';
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(service);
        return acc;
      }, {} as Record<string, Service[]>)
    : {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[700px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto max-h-[90vh] overflow-y-auto" aria-describedby="package-modal-description" aria-labelledby="package-modal-title">
        <h2 id="package-modal-title" className="text-xl font-bold mb-4">
          {packageData ? 'Paket Düzenle' : 'Yeni Paket Oluştur'}
        </h2>
        <p id="package-modal-description" className="sr-only">Bu modal ile paket ekleyebilir veya düzenleyebilirsiniz</p>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {successMessage}
                </div>
              )}

              <div className="space-y-6">
                {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
                  <div key={categoryName}>
                    <h3 className="font-medium text-gray-900 mb-4">{categoryName}</h3>
                    <div className="space-y-4">
                      {(categoryServices as Service[]).map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white shadow-sm" // Kart arka planı ve gölge
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{service.name}</h3>
                            <div className="text-sm text-gray-700">
                              {service.duration || service.durationMinutes || 0} dk - {(service.price || 0).toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                              })}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <input
                              type="number"
                              className="w-28 bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                              placeholder="Seans"
                              min="1"
                              defaultValue={packageData?.sessionCount || ''}
                              onChange={(e) => {
                                // useRef kullanarak optimizasyon - daha az render
                                const value = e.target.value || "1";
                                setServiceInput(service.id, 'sessionCount', value);
                              }}
                            />
                            <input
                              type="number"
                              className="w-28 bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                              placeholder="Fiyat"
                              min="0"
                              step="0.01"
                              defaultValue={packageData?.price || ''}
                              onChange={(e) => {
                                // useRef kullanarak optimizasyon - daha az render
                                const value = e.target.value || "0";
                                setServiceInput(service.id, 'price', value);
                              }}
                            />
                            <button
                              onClick={() => {
                                // Doğrudan o hizmet için girilen değerleri kullan
                                // Girdi yoksa varsayılan geçerli değerler ata
                                const serviceInput = getServiceInputs()[service.id] || { 
                                  sessionCount: "1", // Varsayılan değerler
                                  price: service.price?.toString() || "0" 
                                };
                                
                                // Boş string veya geçersiz değer kontrollerini yap
                                let sessionCount = serviceInput.sessionCount;
                                if (!sessionCount || sessionCount.trim() === "" || isNaN(parseInt(sessionCount))) {
                                  sessionCount = "1";
                                }
                                
                                let price = serviceInput.price;
                                if (!price || price.trim() === "" || isNaN(parseFloat(price))) {
                                  price = service.price?.toString() || "0";
                                }
                                
                                handleSubmit(service.id, sessionCount, price);
                              }}
                              disabled={isSubmitting}
                              className={`px-4 py-2 text-white rounded-lg transition-colors bg-[#204937] hover:bg-[#183b2d] shadow-md hover:shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isSubmitting ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                  İşleniyor...
                                </span>
                              ) : packageData ? 'Güncelle' : 'Oluştur'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedServices).length === 0 && (
                  <p className="text-gray-500 text-center py-2">Henüz hizmet bulunmamaktadır.</p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}