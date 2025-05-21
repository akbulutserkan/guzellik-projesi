"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useServiceManagement } from '@/hooks/service';
import { isValidServiceName, isValidPrice, isValidServiceDuration } from '@/utils/service/formatters';

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewServiceModal({ isOpen, onClose }: NewServiceModalProps) {
  // Durum
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Hook'u kullan
  const {
    categories,
    loading,
    serviceFormData,
    handleServiceFormChange,
    handleCreateService
  } = useServiceManagement();
  
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
    
    const result = await handleCreateService();
    
    if (result) {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Hizmet Adı</Label>
            <Input
              id="name"
              value={serviceFormData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Örn: Saç Kesimi"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="categoryId">Kategori</Label>
            <Select
              value={serviceFormData.categoryId}
              onValueChange={(value) => updateField('categoryId', value)}
            >
              <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
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
            <div className="grid gap-2">
              <Label htmlFor="price">Fiyat (TL)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={serviceFormData.price}
                onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Süre (Dakika)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                max="480"
                step="5"
                value={serviceFormData.duration}
                onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
                className={errors.duration ? 'border-red-500' : ''}
              />
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
              )}
            </div>
          </div>
          

          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isActive"
              checked={serviceFormData.isActive}
              onCheckedChange={(checked) => updateField('isActive', checked)}
            />
            <Label htmlFor="isActive" className="font-normal">Aktif Hizmet</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
