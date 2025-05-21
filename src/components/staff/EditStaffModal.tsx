/**
 * Personel Düzenleme Modalı
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { callMcpApi } from "@/lib/mcp/helpers";
import { formatWorkingHoursForServer } from "@/utils/staff/formatters";
import { Service, getServices } from "@/services/serviceService";

interface EditStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  staff: any;
}

  // Interface değişimi: Serviste tanımlanan Service tipini kullanıyoruz
  // Lokal interface'i kaldırıyoruz
  // interface Service {
  //   id: string;
  //   name: string;
  //   price: number;
  //   duration: number;
  //   category: {
  //     id: string;
  //     name: string;
  //   };
  // }

interface CategoryWithServices {
  id: string;
  name: string;
  services: Service[] | any[];
}

interface GroupedServices {
  [categoryId: string]: CategoryWithServices;
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

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export default function EditStaffModal({ open, onOpenChange, onSuccess, staff }: EditStaffModalProps) {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    accountType: string;
    serviceGender: string;
    showInCalendar: boolean;
    services: string[];
    workingHours: Array<{
      day: number;
      dayOfWeek?: number; // Eski verilerde dayOfWeek kullanılıyor olabilir
      isWorking: boolean;
      startTime: string;
      endTime: string;
    }>;
  }>({
    name: '',
    phone: '',
    accountType: 'staff',
    serviceGender: 'unisex',
    showInCalendar: true,
    services: [],
    workingHours: []
  });
  const [services, setServices] = useState<Service[]>([]);
  const [groupedServices, setGroupedServices] = useState<Record<string, CategoryWithServices>>({});
  const [isStaffSelectOpen, setIsStaffSelectOpen] = useState(false);
  const [otherStaff, setOtherStaff] = useState<any[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // MCP aracı ile hizmetleri al
        const result = await callMcpApi('get-services', {});
        
        console.log('MCP get-services sonucu:', result);
        
        // API'nin döndüğü yanıt yapısı farklı olabilir
        // Content içinde text olarak JSON dönebilir
        let servicesData = [];
        
        // Yanıt formatına göre veriyi çıkart
        if (result.success && result.data) {
          // Direkt data varsa kullan
          servicesData = result.data;
        } else if (result.content && result.content[0]?.text) {
          // Content içinde text olarak JSON olabilir
          try {
            servicesData = JSON.parse(result.content[0].text);
          } catch (e) {
            console.error('JSON parse hatası:', e);
          }
        } else if (result.content && Array.isArray(result.content)) {
          // Content direkt veri olabilir
          servicesData = result.content;
        }
        
        console.log('Servis verisi:', servicesData);
        
        if (Array.isArray(servicesData) && servicesData.length > 0) {
          processServices(servicesData);
        } else {
          console.warn('Servis verisi boş veya dizi değil:', servicesData);
        }
      } catch (error) {
        console.error('Hizmet verileri alınırken hata:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hizmet listesi alınırken bir hata oluştu"
        });
      }
    };
    
    // Hizmetleri grup halinde işle
    const processServices = (data: any[]) => {
      // Önce servisleri hafızaya al
      setServices(data as Service[]);

      // Servis kategorileri kontrol ederek grupla
      const grouped: Record<string, CategoryWithServices> = {};
      
      // Tüm hizmetlerin kategorisi var, direkt olarak doğru kategorilere ekleyelim
      data.forEach((service) => {
        // Önce bir servis örneğini inceleyerek veri yapısını anlayalım (debug için)
        if (service === data[0]) {
          console.log('Hizmet veri yapısı örneği:', JSON.stringify(service, null, 2));
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
          } as CategoryWithServices;
        }
        
        grouped[categoryId].services.push(service);
      });
      
      // Boş kategorileri kaldır, ancak 'Diğer Hizmetler' kategorisini sadece içinde servis varsa göster
      Object.keys(grouped).forEach(categoryId => {
        if (grouped[categoryId].services.length === 0) {
          console.log(`Boş kategori kaldırılıyor: ${grouped[categoryId].name}`);
          delete grouped[categoryId];
        }
      });
      
      // Debug - Sonuç olarak oluşan kategorileri göster
      console.log('[EditStaffModal] Sonuç kategoriler:', 
        Object.keys(grouped).map(key => `${grouped[key].name} (${grouped[key].services.length} hizmet)`).join(', '));
        
      setGroupedServices(grouped);
    };
    
    fetchServices();
  }, []);

  // Personel verilerini form'a yükle
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        phone: staff.phone || '',
        accountType: staff.accountType || 'staff',
        serviceGender: staff.serviceGender || 'unisex',
        showInCalendar: staff.showInCalendar ?? true,
        services: staff.services?.map((s: any) => s.id) || [], 
        workingHours: staff.workingHours || []
      });
    }
  }, [staff]);

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    console.log(`[EditStaffModal] Servis değişimi: ${serviceId}, seçildi: ${checked}`);
    console.log('[EditStaffModal] Mevcut seçili hizmetler:', formData.services);
    
    setFormData(prevFormData => {
      const selectedServices = new Set(prevFormData.services);
      if (checked) {
        selectedServices.add(serviceId);
      } else {
        selectedServices.delete(serviceId);
      }
      
      const newServices = Array.from(selectedServices);
      console.log('[EditStaffModal] Güncellenen seçili hizmetler:', newServices);
      
      return {
        ...prevFormData,
        services: newServices
      };
    });
  };

  const handleDayChange = (dayIndex: number, changes: Partial<{
    isWorking: boolean;
    startTime: string;
    endTime: string;
  }>) => {
    setFormData(prev => {
      const existingHours = [...prev.workingHours];
      const dayHourIndex = existingHours.findIndex(h => h.day === dayIndex || h.dayOfWeek === dayIndex);

      if (dayHourIndex === -1) {
        existingHours.push({
          day: dayIndex,
          dayOfWeek: dayIndex, // Her zaman iki alanı da kullan
          isWorking: changes.isWorking ?? true,
          startTime: changes.startTime ?? "09:00",
          endTime: changes.endTime ?? "18:00"
        });
      } else {
        existingHours[dayHourIndex] = {
          ...existingHours[dayHourIndex],
          day: dayIndex,
          dayOfWeek: dayIndex, // Her zaman iki alanı da güncelle
          ...changes
        };
      }

      return {
        ...prev,
        workingHours: existingHours
      };
    });
  };

  const handleSubmit = async () => {
    try {
      // Çalışma saatlerinde dayOfWeek alanı olduğundan emin ol
      const updatedWorkingHours = formData.workingHours.map(hour => ({
        ...hour,
        dayOfWeek: hour.day || hour.dayOfWeek
      }));
      
      // Çalışma saatlerini backend formatına dönüştür
      const formattedWorkingHours = formatWorkingHoursForServer(updatedWorkingHours);
        
      const submitData = {
        id: staff.id,
        name: formData.name,
        phone: formData.phone,
        accountType: formData.accountType.toUpperCase(), 
        serviceGender: formData.serviceGender,
        showInCalendar: formData.showInCalendar,
        services: Array.isArray(formData.services) ? formData.services : [],
        workingHours: formattedWorkingHours
      };
  
      console.log('[EditStaffModal] Gönderilecek veri:', submitData);
      console.log('[EditStaffModal] Özellikle seçilen hizmetler:', submitData.services);
  
      // MCP aracı ile personeli güncelle
      const result = await callMcpApi('update-staff', submitData);
  
      if (!result.success) {
        throw new Error(result.error || 'Personel güncellenirken bir hata oluştu');
      }
  
      console.log('[EditStaffModal] Güncelleme başarılı. API yanıtı:', result.data);
      onSuccess();
      onOpenChange(false);
      
      toast({
        title: "Başarılı",
        description: "Personel başarıyla güncellendi",
      });
  
    } catch (error) {
      console.error('[EditStaffModal] Hata detayı:', error);
  
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : 'Personel güncellenirken bir hata oluştu'
      });
    }
  };

  // Diğer personelleri getiren fonksiyon
  const fetchOtherStaff = async () => {
    try {
      // MCP aracı ile personel listesini al
      const result = await callMcpApi('get-staff', { includeInactive: false });
      
      // Yanıtı kontrol et ve doğru formatta çıkar
      let staffData = [];
      if (result.success && result.data) {
        staffData = result.data;
      } else if (result.content && result.content[0]?.text) {
        try {
          staffData = JSON.parse(result.content[0].text);
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      if (Array.isArray(staffData) && staffData.length > 0) {
        // Mevcut personeli listeden çıkar
        const filteredStaff = staffData.filter((s: any) => s.id !== staff.id);
        setOtherStaff(filteredStaff);
      } else {
        console.warn('Personel verisi boş veya dizi değil');
      }
    } catch (error) {
      console.error('Personel listesi alınırken hata:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel listesi alınırken bir hata oluştu"
      });
    }
  };

  // Personel hizmetlerini kopyalama fonksiyonu
  const handleCopyServices = async (selectedStaffId: string) => {
    try {
      // MCP aracı ile personel detayını al
      const result = await callMcpApi('get-staff-by-id', { id: selectedStaffId });
      
      // Yanıtı kontrol et ve doğru formatta çıkar
      let staffData = null;
      if (result.success && result.data) {
        staffData = result.data;
      } else if (result.content && result.content[0]?.text) {
        try {
          staffData = JSON.parse(result.content[0].text);
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      if (staffData && staffData.services) {
        setFormData(prev => ({
          ...prev,
          services: staffData.services?.map((s: any) => s.id) || []
        }));
        setIsStaffSelectOpen(false);
      } else {
        throw new Error('Personel hizmet bilgileri alınamadı');
      }
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
      <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden" hideCloseButton>
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Personel Düzenle
            </DialogTitle>
            <Button 
              variant="ghost" 
              className="w-8 h-8 p-0 rounded-full" 
              onClick={() => onOpenChange(false)}
            >
              <span className="sr-only">Kapat</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 bg-white overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
          <div className="space-y-4">
            {/* İsim */}
            <div className="space-y-2">
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  placeholder="Personel Adı"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                />
              </div>
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  placeholder="Telefon Numarası"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                />
              </div>
            </div>

            {/* Hesap Tipi */}
            <div className="space-y-2">
              <div className="relative border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                >
                  <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                    <SelectValue placeholder="Hesap Tipi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="STAFF" className="text-gray-900 font-normal">Personel</SelectItem>
                    <SelectItem value="MANAGER" className="text-gray-900 font-normal">Yönetici</SelectItem>
                    <SelectItem value="CASHIER" className="text-gray-900 font-normal">Veznedar</SelectItem>
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
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="women" className="text-gray-900 font-normal">Kadınlar</SelectItem>
                    <SelectItem value="men" className="text-gray-900 font-normal">Erkekler</SelectItem>
                    <SelectItem value="unisex" className="text-gray-900 font-normal">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Takvimde Görünsün Switch */}
            <div className="flex items-center justify-between p-4 rounded-[6px] bg-white border border-gray-200">
              <Label htmlFor="calendar" className="text-sm text-gray-700 font-medium">
                Takvimde görünsün mü?
              </Label>
              <Switch
                id="calendar"
                checked={formData.showInCalendar}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, showInCalendar: checked as boolean })
                }
                className="data-[state=checked]:bg-blue-600 h-5 w-10"
              />
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
                  {Object.keys(groupedServices).map((categoryId) => {
                    const category = groupedServices[categoryId];
                    return (
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
                              <span className="text-gray-600 font-medium">{service.price} TL</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })}
                  {/* Başka Personelden Kopyala butonu */}
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
                    const dayHours = formData.workingHours.find(h => h.day === day.value || h.dayOfWeek === day.value) || {
                      day: day.value,
                      dayOfWeek: day.value,
                      isWorking: false,
                      startTime: '09:00',
                      endTime: '18:00'
                    };
                    return(
                    <div key={day.value} className="flex items-center gap-2 p-2 rounded-[6px] border border-gray-100">
                      <div className="w-24 shrink-0">
                        <Label className="font-medium">{day.label}</Label>
                      </div>

                      <Switch
                        checked={dayHours.isWorking}
                        onCheckedChange={(checked) =>
                          handleDayChange(day.value, { isWorking: checked })
                        }
                        className="data-[state=checked]:bg-blue-600 h-5 w-10"
                      />

                      {dayHours.isWorking && (
                        <div className="flex items-center gap-2 ml-auto">
                          <Select
                            value={dayHours.startTime}
                            onValueChange={(time) => handleDayChange(day.value, { startTime: time })}
                          >
                            <SelectTrigger className="w-24 border border-gray-200 h-8 text-sm px-2 py-1 focus-visible:ring-blue-400 rounded-[6px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white max-h-[300px] z-50">
                              {HOURS.map((hour) => (
                                <SelectItem key={hour.value} value={hour.value} className="text-gray-900 font-normal text-sm">
                                  {hour.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-gray-500">-</span>

                          <Select
                            value={dayHours.endTime}
                            onValueChange={(time) => handleDayChange(day.value, { endTime: time })}
                          >
                            <SelectTrigger className="w-24 border border-gray-200 h-8 text-sm px-2 py-1 focus-visible:ring-blue-400 rounded-[6px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white max-h-[300px] z-50">
                              {HOURS.map((hour) => (
                                <SelectItem key={hour.value} value={hour.value} className="text-gray-900 font-normal text-sm">
                                  {hour.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

        <div className="px-6 py-4 bg-white border-t sticky bottom-0 z-10">
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#204937] hover:bg-[#183b2d] text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
          >
            Kaydet
          </Button>
        </div>
      </DialogContent>

      {/* Personel Seçme Modalı */}
      <Dialog open={isStaffSelectOpen} onOpenChange={setIsStaffSelectOpen}>
        <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden" hideCloseButton>
          <div className="px-6 py-4 border-b sticky top-0 z-10 bg-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Personel Seçimi
              </DialogTitle>
              <Button 
                variant="ghost" 
                className="w-8 h-8 p-0 rounded-full" 
                onClick={() => setIsStaffSelectOpen(false)}
              >
                <span className="sr-only">Kapat</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
            <div className="space-y-2">
              {otherStaff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="flex items-center justify-between p-3 rounded-[6px] border border-gray-200 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {staffMember.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCopyServices(staffMember.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] text-sm font-medium transition-colors"
                  >
                    Kopyala
                  </Button>
                </div>
              ))}
              {otherStaff.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Başka personel bulunmuyor
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}