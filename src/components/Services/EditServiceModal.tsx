"use client";

import { useState, useEffect } from 'react';
import { DialogWithoutPrevent, DialogWithoutPreventContent } from '@/components/ui/dialog-without-prevent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceManagement } from '@/hooks/service';
import { useToast } from '@/components/ui/use-toast';
import { isValidServiceName, isValidPrice, isValidServiceDuration } from '@/utils/service/formatters';

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
}

export default function EditServiceModal({ isOpen, onClose, serviceId }: EditServiceModalProps) {
  // Durum
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Hook'u kullan
  const {
    categories,
    loading,
    serviceFormData,
    selectedService,
    handleServiceFormChange,
    handleUpdateService,
    fetchServiceDetails,
    fetchServices,
    fetchCategories
  } = useServiceManagement();
  
  // Hizmet detaylarını getir
  useEffect(() => {
    if (isOpen && serviceId) {
      fetchServiceDetails(serviceId);
    }
  }, [isOpen, serviceId, fetchServiceDetails]);
  
  // Form alanlarını güncelle
  const updateField = (field: string, value: any) => {
    // Hatayı temizle
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
    
    // Değeri güncelle
    handleServiceFormChange(field, value);
  };
  
  // Form doğrulama
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!isValidServiceName(serviceFormData.name)) {
      newErrors.name = 'Hizmet adı en az 2 karakter olmalıdır';
    }
    
    if (!isValidPrice(serviceFormData.price)) {
      newErrors.price = 'Geçerli bir fiyat girmelisiniz';
    }
    
    if (!isValidServiceDuration(serviceFormData.duration)) {
      newErrors.duration = 'Geçerli bir süre girmelisiniz (0-480 dk arası)';
    }
    
    if (!serviceFormData.categoryId) {
      newErrors.categoryId = 'Kategori seçmelisiniz';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Kaydet
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    console.log('Hizmet güncelleniyor, ID:', serviceId);
    const result = await handleUpdateService(serviceId);
    
    if (result) {
      console.log('Hizmet güncelleme başarılı, sonuç:', result);
      // Başarılı güncelleme mesajı göster
      toast({
        title: "Başarılı",
        description: "Hizmet başarıyla güncellendi"
      });
      
      // Modal kapatılınca services sayfasının updateCounter'ı 
      // artacak ve bu da verilerin yenilenmesini tetikleyecek
      // Sayfa yenilenmeden güncellenmiş veriler gösterilecek
      onClose();
    }
  };
  
  return (
    <DialogWithoutPrevent 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogWithoutPreventContent className="sm:max-w-[500px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Input
              id="name"
              value={serviceFormData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Hizmet adı"
              className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Select
              value={serviceFormData.categoryId}
              onValueChange={(value) => updateField('categoryId', value)}
            >
              <SelectTrigger className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <SelectValue placeholder="Kategori Seç" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 relative">
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={serviceFormData.price}
                onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all pr-8"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                placeholder="Fiyat"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₺</div>
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>
            
            <div className="grid gap-2 relative">
              <Input
                id="duration"
                type="number"
                min="0"
                max="480"
                step="5"
                value={serviceFormData.duration}
                onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
                className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all pr-10"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                placeholder="Süre"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">dk</div>
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
              )}
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogWithoutPreventContent>
    </DialogWithoutPrevent>
  );
}
