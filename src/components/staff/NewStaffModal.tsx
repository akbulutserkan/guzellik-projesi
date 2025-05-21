/**
 * Yeni Personel Ekleme Modalı
 */
"use client";

import { useState, useEffect } from 'react';
import PhoneInput from '../PhoneInput';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { callMcpApi } from "@/lib/mcp/helpers";
import { getStaff } from "@/services/staffService";
import { useStaffManagement } from "@/hooks/staff/useStaffManagement";
import { formatPhoneNumber, formatNameCapitalize } from "@/utils/staff/formatters";
import { validateWorkingHours, createStaff } from "@/services/staffService";
import { Service, getServices } from "@/services/serviceService";

interface NewStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}



interface GroupedServices {
  [categoryId: string]: {
    id: string;
    name: string;
    services: Service[];
  };
}

const DAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
];

const HOURS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", 
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
].map(time => ({ value: time, label: time }));

export default function NewStaffModal({ open, onOpenChange, onSuccess }: NewStaffModalProps) {
  // Modal kontrolleri
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isStaffSelectOpen, setIsStaffSelectOpen] = useState(false);
  
  // Form ve veri yönetimi
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    password: string;
    accountType: string;
    serviceGender: string;
    showInCalendar: boolean;
    services: string[];
    workingHours: Array<{
      day: number;
      isWorking: boolean;
      startTime: string;
      endTime: string;
    }>;
  }>({
    name: '',
    phone: '',
    password: '',
    accountType: 'staff',
    serviceGender: 'unisex',
    showInCalendar: true,
    services: [],
    workingHours: []
  });
  
  // Hizmet ve kategori state'leri
  const [services, setServices] = useState<Service[]>([]);
  const [groupedServices, setGroupedServices] = useState<GroupedServices>({});
  const [otherStaff, setOtherStaff] = useState<any[]>([]);
  
  // Durum state'leri
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  
  // Staff management hook kullan
  const { validateStaffWorkingHours } = useStaffManagement();
  
  // Telefon numarasının geçerli olup olmadığını kontrol et
  const handlePhoneChange = (value: string, isValid: boolean) => {
    console.log('Telefon değişti:', value, isValid);
    setFormData({ ...formData, phone: value });
    setIsPhoneValid(isValid);
  };
  
  // Hesap tipi değiştiğinde izinleri otomatik ayarla
  const handleAccountTypeChange = async (type: string) => {
    setFormData({ ...formData, accountType: type });
    
    // Bu kısım izinleri default olarak ayarlamak için 
    // şu anda izinleri form verisiyle saklamadığımız için kullanmıyoruz
    // Daha sonra izinleri formData'da saklarsak kullanılabilir
  };

  // Personel hizmetleri getiren fonksiyon
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Merkezi servis modülünü kullanarak hizmetleri al
        console.log('[NewStaffModal] Hizmetler getiriliyor...');
        
        const servicesData = await getServices();
        
        console.log('[NewStaffModal] Hizmetler alındı:', servicesData?.length || 0);
        
        if (Array.isArray(servicesData) && servicesData.length > 0) {
          setServices(servicesData);

          // Hizmetleri kategorilere göre grupla
          const grouped: GroupedServices = {};
          
          // Varsayılan olarak kategorisiz/diğer hizmetler grubu oluşturma
          // Kategorisiz grup OLMAYACAK - müşteri belirttiğine göre tüm hizmetlerin bir kategorisi var
          
          // Hizmetleri gruplandır - tüm hizmetlerin bir kategorisi olduğunu varsay
          servicesData.forEach((service) => {
            // Önce bir servis örneğini inceleyerek veri yapısını anlayalım (debug için)
            if (service === servicesData[0]) {
              console.log('[NewStaffModal] Hizmet veri yapısı örneği:', JSON.stringify(service, null, 2));
            }
            
            // Kategori bilgisini doğru yoldan çek (iç içe veya düz format için)
            const categoryId = service.category?.id || service.categoryId;
            const categoryName = service.category?.name || service.categoryName;
            
            // Kategorisi olmayan hizmetleri atla (müşteri belirttiğine göre bu durum olmayacak)
            if (!categoryId || !categoryName) {
              console.warn('Kategorisi olmayan hizmet atlanıyor:', service.name || service.id);
              return;
            }
            
            if (!grouped[categoryId]) {
              grouped[categoryId] = {
                id: categoryId,
                name: categoryName,
                services: []
              };
            }
            grouped[categoryId].services.push(service);
          });

          // Gruplandırma işlemi tamamlandıktan sonra boş kategorileri kaldır
          Object.keys(grouped).forEach(categoryId => {
            if (grouped[categoryId].services.length === 0) {
              console.log(`Boş kategori kaldırılıyor: ${grouped[categoryId].name}`);
              delete grouped[categoryId];
            }
          });
          
          // Debug - Sonuç olarak oluşan kategorileri göster
          console.log('[NewStaffModal] Sonuç kategoriler:', 
            Object.keys(grouped).map(key => `${grouped[key].name} (${grouped[key].services.length} hizmet)`).join(', '));
          
          console.log('[NewStaffModal] Gruplandırılmış hizmetler:', 
            Object.keys(grouped).length, 'kategori');
          
          setGroupedServices(grouped);
        } else {
          console.warn('[NewStaffModal] Hizmet verisi boş veya dizi değil');
        }
      } catch (error) {
        console.error('[NewStaffModal] Hizmet verileri alınırken hata:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: error instanceof Error ? error.message : "Hizmet listesi alınırken bir hata oluştu"
        });
      }
    };
    
    if (open) {
      fetchServices();
    }
  }, [open]);
  
  // Modal açıldığında form verilerini sıfırla
  useEffect(() => {
    if (open) {
      // Modal açıldığında formu sıfırla
      setFormData({
        name: '',
        phone: '',
        password: '',
        accountType: 'staff',
        serviceGender: 'unisex',
        showInCalendar: true,
        services: [],
        workingHours: []
      });
      setIsServicesOpen(false);
      setIsWorkingHoursOpen(false);
      setError("");
      console.log('Form sıfırlandı');
    }
  }, [open]);

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    console.log(`Hizmet seçimi değiştiriliyor: ${serviceId}, seçili: ${checked}`);
    setFormData(prevFormData => {
      const selectedServices = [...prevFormData.services];
      if (checked) {
        if (!selectedServices.includes(serviceId)) {
          selectedServices.push(serviceId);
        }
      } else {
        const index = selectedServices.indexOf(serviceId);
        if (index !== -1) {
          selectedServices.splice(index, 1);
        }
      }
      console.log('Güncellenen hizmet listesi:', selectedServices);
      return {
        ...prevFormData,
        services: selectedServices
      };
    });
  };

  const handleDayChange = (dayIndex: number, changes: Partial<{
    isWorking: boolean;
    startTime: string;
    endTime: string;
  }>) => {
    console.log(`Gün değiştiriliyor: ${dayIndex}`, changes);
    setFormData(prev => {
      const existingHours = [...prev.workingHours];
      const dayHourIndex = existingHours.findIndex(h => h.day === dayIndex);

      if (dayHourIndex === -1) {
        // Yeni bir gün ekliyoruz
        existingHours.push({
          day: dayIndex,
          dayOfWeek: dayIndex, // Backend için dayOfWeek ekle
          isWorking: changes.isWorking ?? true,
          startTime: changes.startTime ?? "09:00",
          endTime: changes.endTime ?? "19:00"
        });
      } else {
        // Mevcut günü güncelliyoruz
        existingHours[dayHourIndex] = {
          ...existingHours[dayHourIndex],
          dayOfWeek: dayIndex, // Backend için dayOfWeek güncelle
          ...changes
        };
      }

      console.log('Güncellenen çalışma saatleri:', existingHours);
      return {
        ...prev,
        workingHours: existingHours
      };
    });
  };
  
  // Çalışma saatlerini API ile doğrula
  const validateWorkingHoursData = async () => {
    // Çalışma saati yoksa doğrulama gerekmez
    if (!formData.workingHours.length || !formData.workingHours.some(h => h.isWorking)) {
      return true;
    }
    
    try {
      // Çalışma saatlerini doğru formata dönüştür
      const formattedHours = formData.workingHours.map(hour => ({
        ...hour,
        dayOfWeek: hour.day || hour.dayOfWeek // Backend için dayOfWeek alanını ekleyelim
      }));
      
      // Backend API ile çalışma saatlerini doğrulat
      const result = await validateStaffWorkingHours(formattedHours);
      
      if (!result.valid) {
        setError(result.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Çalışma saati doğrulama hatası:', error);
      setError('Geçersiz çalışma saati formatı');
      return false;
    }
  };

  const validateForm = () => {
    // Sunucu hatasını görmek için tüm form verilerini konsola yazdıralım
    console.log('Doğrulanıyor:', formData);
    
    if (!formData.name || formData.name.trim() === '') {
      setError("Lütfen personel adını girin");
      return false;
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      setError("Lütfen telefon numarası girin");
      return false;
    }
    
    if (!isPhoneValid) {
      setError("Lütfen geçerli bir telefon numarası girin");
      return false;
    }
    
    if (!formData.password || formData.password.trim() === '') {
      setError("Lütfen şifre girin");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Frontend'de temel form doğrulaması yap
      if (!validateForm()) {
        setLoading(false);
        return; // Doğrulama başarısızsa işlemi durdur
      }
      
      // Çalışma saatlerini doğrula
      const isWorkingHoursValid = await validateWorkingHoursData();
      if (!isWorkingHoursValid) {
        setLoading(false);
        return;
      }
      
      // İsmi formatla
      const formattedName = formatNameCapitalize(formData.name);
      
      // Çalışma saatlerini doğru formata dönüştür
      const formattedWorkingHours = formData.workingHours.map(hour => ({
        ...hour,
        dayOfWeek: hour.day || hour.dayOfWeek // Backend için dayOfWeek alanını ekleyelim
      }));
      
      // Form verilerini API'nin beklediği formata çevir
      const staffData = {
        ...formData,
        name: formattedName,
        workingHours: formattedWorkingHours,
        // Adı kullanıcı adı olarak da kullan
        username: formData.name.toLowerCase().replace(/\s+/g, '.'),
        // Önemli: Telefon numarasını API'nin beklediği biçimde düzenle
        phone: formatPhoneNumber(formData.phone),
        // UserRole enum için büyük harfe çevir
        accountType: formData.accountType.toUpperCase(),
        // serviceGender enum için büyük harfe çevir
        serviceGender: formData.serviceGender.toUpperCase()
      };
      
      console.log('Gönderilen form verisi:', staffData);
      
      // Merkezi staffService modülünü kullanarak personel oluştur
      await createStaff(staffData);
      
      onSuccess();
      onOpenChange(false); // Başarılı kayıttan sonra modalı kapat
    } catch (error) {
      console.error('Personel oluşturma hatası:', error);
      setError(error instanceof Error ? error.message : "Personel oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherStaff = async () => {
    try {
      // Merkezi modülü kullanarak personel listesini al
      const staffData = await getStaff(false);
      
      // Personel verisini ayarla
      setOtherStaff(staffData);
    } catch (error) {
      console.error('Personel listesi alınırken hata:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Personel listesi alınırken bir hata oluştu"
      });
    }
  };

  const handleCopyServices = async (selectedStaffId: string) => {
    try {
      // MCP aracı ile personel detayını al
      const result = await callMcpApi('get-staff-by-id', { id: selectedStaffId });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Personel bilgisi alınamadı');
      }
      
      const staffData = result.data;
      
      // Seçili personelin hizmetlerini mevcut forma kopyala
      setFormData(prev => ({
        ...prev,
        services: staffData.services.map((s: any) => s.id)
      }));
      setIsStaffSelectOpen(false);
    } catch (error) {
      console.error('Hizmetler kopyalanırken hata:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hizmetler kopyalanırken bir hata oluştu"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 bg-white rounded-lg shadow-lg flex flex-col max-h-[90vh]" hideCloseButton={true}>
        <div className="fixed top-0 left-0 right-0 bg-white px-6 py-4 border-b z-10 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Yeni Personel Ekle
          </DialogTitle>
        </div>
        
        <div className="overflow-y-auto px-6 py-4 mt-14 mb-20">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-[6px]">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Personel adı */}
            <div className="space-y-2">
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  placeholder="Personel Adı"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                />
              </div>
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <PhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>
            </div>
            
            {/* Şifre */}
            <div className="space-y-2">
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  type="password"
                  placeholder="Şifre"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                />
              </div>
            </div>

            {/* Hesap Tipi */}
            <div className="space-y-2">
              <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => handleAccountTypeChange(value)}
                >
                  <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                    <SelectValue placeholder="Hesap Tipi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="staff">Personel</SelectItem>
                    <SelectItem value="manager">Yönetici</SelectItem>
                    <SelectItem value="cashier">Veznedar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hizmet Verdiği Cinsiyet */}
            <div className="space-y-2">
              <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={formData.serviceGender}
                  onValueChange={(value) => setFormData({ ...formData, serviceGender: value })}
                >
                  <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                    <SelectValue placeholder="Hizmet Verdiği Cinsiyet" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="women">Kadınlar</SelectItem>
                    <SelectItem value="men">Erkekler</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Takvimde görünme seçeneği */}
            <div className="flex items-center space-x-2 p-3 rounded-[6px] bg-white border border-gray-200">
              <Checkbox
                id="calendar"
                checked={formData.showInCalendar}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, showInCalendar: checked as boolean })
                }
                className="text-blue-500 focus:ring-blue-500 focus:ring-offset-1"
              />
              <Label htmlFor="calendar" className="text-sm text-gray-700 font-medium">
                Takvimde görünsün mü?
              </Label>
            </div>

            {/* Verdiği Hizmetler Bölümü */}
            <Collapsible
              open={isServicesOpen}
              onOpenChange={setIsServicesOpen}
              className="border border-gray-200 rounded-[6px] overflow-hidden"
            >
              <CollapsibleTrigger className="flex justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-[6px] font-medium">
                <div className="flex items-center gap-2">
                  <span>Verdiği Hizmetler</span>
                  {formData.services.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {formData.services.length} seçili
                    </span>
                  )}
                </div>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`}>
                  <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white rounded-b-[6px] border-t border-gray-200">
                <div className="space-y-4">
                  {Object.values(groupedServices).map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900">
                          {category.name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {category.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center space-x-2 p-2 rounded-[6px] hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={formData.services.includes(service.id)}
                              onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                              className="text-blue-600 focus:ring-blue-600 rounded-[4px]"
                            />
                            <Label
                              htmlFor={`service-${service.id}`}
                              className="flex-1 flex items-center justify-between text-sm text-gray-700"
                            >
                              <span>{service.name}</span>
                              <span className="text-gray-600 font-medium">{service.price} ₺</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full mt-4 text-sm font-medium rounded-[6px] border-gray-200 hover:bg-gray-50"
                    onClick={() => {
                      fetchOtherStaff();
                      setIsStaffSelectOpen(true);
                    }}
                  >
                    Başka Personelden Kopyala
                  </Button>

                  {/* Personel Seçme Modalı */}
                  <Dialog open={isStaffSelectOpen} onOpenChange={setIsStaffSelectOpen}>
                    <DialogContent className="sm:max-w-[400px] p-0 max-h-[85vh] bg-white rounded-lg shadow-lg" hideCloseButton={true}>
                      <DialogHeader className="px-6 py-4 bg-white border-b sticky top-0 z-10">
                        <DialogTitle className="text-lg font-semibold text-gray-800">
                          Personel Seçin
                        </DialogTitle>
                      </DialogHeader>
                      <div className="px-6 py-4 overflow-y-auto bg-white">
                        <div className="space-y-2">
                          {otherStaff.map((staff) => (
                            <div
                              key={staff.id}
                              className="flex items-center justify-between p-3 rounded-[6px] hover:bg-gray-50 cursor-pointer border border-gray-200 hover:border-gray-300 transition-all"
                              onClick={() => handleCopyServices(staff.id)}
                            >
                              <div>
                                <p className="font-medium">{staff.name}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                                Kopyala
                              </Button>
                            </div>
                          ))}
                          {otherStaff.length === 0 && (
                            <p className="text-center text-gray-500 py-4">
                              Henüz başka personel bulunmuyor
                            </p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Çalışma Saatleri Bölümü */}
            <Collapsible
              open={isWorkingHoursOpen}
              onOpenChange={setIsWorkingHoursOpen}
              className="border border-gray-200 rounded-[6px] overflow-hidden"
            >
              <CollapsibleTrigger className="flex justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-[6px] font-medium">
                <div className="flex items-center gap-2">
                  <span>Çalışma Saatleri</span>
                  {formData.workingHours.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {formData.workingHours.filter(h => h.isWorking).length} gün
                    </span>
                  )}
                </div>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isWorkingHoursOpen ? 'rotate-180' : ''}`}>
                  <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white rounded-b-[6px] border-t border-gray-200">
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                  {DAYS.map((day) => {
                    const dayHours = formData.workingHours.find(h => h.day === day.value) || {
                      day: day.value,
                      isWorking: false,
                      startTime: '09:00',
                      endTime: '19:00'
                    };
                    return (
                      <div key={day.value} className="flex items-center gap-2 p-2 rounded-[6px] border border-gray-200">
                        <div className="w-24 shrink-0">
                          <Label className="font-medium">{day.label}</Label>
                        </div>

                        <Switch
                          checked={dayHours.isWorking}
                          onCheckedChange={(checked) =>
                            handleDayChange(day.value, { isWorking: checked })
                          }
                        />

                        {dayHours.isWorking && (
                          <div className="flex items-center gap-2 ml-auto">
                            <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white">
                              <Select
                                value={dayHours.startTime}
                                onValueChange={(time) => handleDayChange(day.value, { startTime: time })}
                              >
                                <SelectTrigger className="w-28 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {HOURS.map((hour) => (
                                    <SelectItem key={hour.value} value={hour.value}>
                                      {hour.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <span className="text-gray-500">-</span>

                            <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white">
                              <Select
                                value={dayHours.endTime}
                                onValueChange={(time) => handleDayChange(day.value, { endTime: time })}
                              >
                                <SelectTrigger className="w-28 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {HOURS.map((hour) => (
                                    hour.value && (
                                      <SelectItem key={hour.value} value={hour.value}>
                                        {hour.label}
                                      </SelectItem>
                                    )
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
        
        {/* Kaydet butonu - En altta sabit */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t z-10 rounded-b-lg">
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#204937] hover:bg-[#183b2d] text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                İşleniyor...
              </>
            ) : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}