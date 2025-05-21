'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, FileText } from 'lucide-react';
import PhoneInput from "@/components/PhoneInput";
import useCustomerManagement from "@/hooks/customer/useCustomerManagement";

import { Customer } from '@/services/customerService';

interface NewCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (customer: Customer) => void;
}

export default function NewCustomerModal({ 
  open, 
  onOpenChange, 
  onSuccess
}: NewCustomerModalProps) {
  // useCustomerManagement hook'unu kullan
  const {
    formData,
    setFormData,
    formErrors,
    isLoading,
    error,
    isFormValid,
    handleCreateCustomer,
    clearForm,
    handlePhoneChange
  } = useCustomerManagement({ autoFetch: false, showToasts: true });
  
  // Modal açılınca formu temizle
  useEffect(() => {
    if (open) {
      clearForm();
    }
  }, [open, clearForm]);
  
  // Formu gönder
  const handleSubmit = async () => {
    const newCustomer = await handleCreateCustomer();
    
    if (newCustomer) {
      onSuccess(newCustomer);
      onOpenChange(false);
    }
  };
  
  // Form alanlarını güncelle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden" hideCloseButton>
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-center items-center">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Yeni Müşteri Ekle
            </DialogTitle>
          </div>
        </DialogHeader>
        
        {/* Modal üst kısmında hata mesajı */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700">
            {error}
          </div>
        )}
        
        <div className="px-6 py-4 bg-white">
          <div className="space-y-4">
            {/* İsim Soyisim Alanı */}
            <div className="flex flex-col">
              <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                <div className="pl-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder="İsim Soyisim *"
                  value={formData.name}
                  onChange={handleChange}
                  className="flex-1 border-0 focus:ring-0 placeholder:text-gray-500 py-2 pl-2"
                  required
                />
              </div>
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
            
            {/* Telefon Alanı */}
            <div className="flex flex-col">
              <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                <div className="pl-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <PhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  compact={true}
                  placeholder="(5xx) xxx xx xx"
                />
              </div>
              {formErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
              )}
            </div>
            
            {/* E-posta Alanı */}
            <div className="flex flex-col">
              <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                <div className="pl-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="E-posta"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex-1 border-0 focus:ring-0 placeholder:text-gray-500 py-2 pl-2"
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>
            
            {/* Notlar Alanı */}
            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-blue-400 bg-gray-50">
              <div className="pl-3">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <Input
                id="notes"
                name="notes"
                placeholder="Notlar..."
                value={formData.notes}
                onChange={handleChange}
                className="flex-1 border-0 focus:ring-0 placeholder:text-gray-500 py-2 pl-2 bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4 bg-white border-t">
          <Button 
            type="button" 
            disabled={isLoading || !isFormValid}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-lg font-medium rounded-md transition-colors duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <span className="animate-spin mr-2 inline-block h-5 w-5 border-2 border-t-transparent border-white rounded-full"></span>
                Ekleniyor...
              </div>
            ) : (
              'Müşteriyi Ekle'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
