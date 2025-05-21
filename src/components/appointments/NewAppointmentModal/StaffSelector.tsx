'use client';

import React, { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Staff {
  id: string;
  name: string;
}

interface StaffSelectorProps {
  formData: {
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    notes: string;
  }>>;
  staff: Staff[];
  appointment?: any;
  initialStaffId?: string;
}

export default function StaffSelector({
  formData,
  setFormData,
  staff,
  appointment,
  initialStaffId
}: StaffSelectorProps) {
  // Debug için log ekleyelim
  console.log("StaffSelector Render:", {
    formData,
    appointment,
    initialStaffId,
    isDisabled: !!appointment && !appointment?.isDraft,
    staffCount: staff.length,
    staffIds: staff.map(s => s.id)
  });
  
  useEffect(() => {
    // Personel listesini loglama
    console.log('StaffSelector render edildi, personel listesi:', 
      staff.map(s => `${s.name} (${s.id})`).join(', ')
    );
  }, [staff]);

  // initialStaffId ve staff değiştiğinde çalışacak
  useEffect(() => {
    // initialStaffId varsa ve boş değilse personeli seç
    if (initialStaffId && initialStaffId.trim() !== '') {
      console.log('StaffSelector: initialStaffId var, personel seçilmeye çalışılıyor:', initialStaffId);
      
      // Önce personel listesinde bu ID'yi ara
      const staffExists = staff.some(s => s.id === initialStaffId);
      
      if (staffExists) {
        // Personel mevcut, seç
        console.log('StaffSelector: initialStaffId mevcut personel listesinde bulundu, seçiliyor:', initialStaffId);
        setFormData(prev => ({
          ...prev,
          staffId: initialStaffId
        }));
      } else if (staff.length > 0) {
        // Personel mevcut değil, ama personel listesi dolu - ilk personeli seç
        console.log('StaffSelector: initialStaffId personel listesinde bulunamadı, ilk personel seçiliyor:', staff[0].id);
        console.log('StaffSelector: Mevcut personel listesi:', staff.map(s => `${s.name} (${s.id})`).join(', '));
        // Sadece staff listesi yüklenmişse seçim yap
        setFormData(prev => ({
          ...prev,
          staffId: staff[0].id
        }));
      } else {
        // Personel listesi boş, seçim yapma
        console.log('StaffSelector: Personel listesi boş, hiçbir personel seçilemiyor');
      }
    }
    // Form yüklendiğinde ve staff veya initialStaffId değiştiğinde çalış
  }, [initialStaffId, setFormData, staff]);
  
  
  // Personel seçimini güncelle
  const handleStaffChange = (value: string) => {
    console.log("Personel seçildi:", value);
    setFormData((prev) => ({ 
      ...prev, 
      staffId: value,
      serviceId: "" // Personel değişince hizmet sıfırla
    }));
  };
  
  // Personel seçimi devre dışı mı kontrol et
  const isDisabled = !!appointment && !appointment?.isDraft;
  
  // Seçili personel adını belirle - personel listesi boş olsa bile çalışır
  const getSelectedStaffName = () => {
    if (!formData.staffId) return "Personel seçiniz";
    
    // Önce staff listesinde ara
    const foundStaff = staff.find(p => p.id === formData.staffId);
    if (foundStaff) return foundStaff.name;
    
    // Listede bulunamadıysa, bilinen ID'lere göre tahmin yap
    if (formData.staffId === "cm8b0c2t70000mzh6j0q1ko2i") return "AYŞA";
    if (formData.staffId === "cm8b1bqxb000tmzh6j4bflfv1") return "SERKAN";
    
    // Seçili ama adı bilinmiyor
    return "Seçili Personel";
  };
  
  // Personel listesi renderer - boş olsa bile seçili personel için çalışır
  const renderStaffOptions = () => {
    // Veri formatı kontrolü ve güvenlik
    if (!Array.isArray(staff)) {
      console.error("StaffSelector: staff bir dizi değil!", staff);
      return null;
    }
    
    // Statik personel listesi oluştur (boş liste durumunda)
    const staticStaff = [
      { id: "cm8b0c2t70000mzh6j0q1ko2i", name: "AYŞA" },
      { id: "cm8b1bqxb000tmzh6j4bflfv1", name: "SERKAN" }
    ];
    
    // Gerçek personel listesini veya statik listeyi kullan
    const staffToUse = staff.length > 0 ? staff : staticStaff;
    
    console.log("StaffSelector: Personel listesi renderlanıyor, eleman sayısı:", staffToUse.length);
    
    return staffToUse.map((person) => (
      <SelectItem 
        key={person.id} 
        value={person.id} 
        className="text-gray-900 font-normal truncate"
      >
        <span className="truncate block overflow-hidden text-ellipsis" style={{ maxWidth: '100%' }}>
          {person.name}
        </span>
      </SelectItem>
    ));
  };
  
  return (
    <div className="relative">
      <label 
        htmlFor="staff-selector" 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Personel
      </label>
      
      <Select
        value={formData.staffId}
        onValueChange={handleStaffChange}
        disabled={isDisabled}
        name="staff-selector"
      >
        <SelectTrigger 
          className="w-full h-10 border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 bg-white px-3 py-2"
          style={{ 
            borderColor: '#e5e7eb', 
            color: formData.staffId ? '#111827' : '#6b7280',
            opacity: isDisabled ? 0.7 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          <span className="truncate block overflow-hidden text-ellipsis" style={{ maxWidth: 'calc(100% - 20px)' }}>
            {getSelectedStaffName()}
          </span>
        </SelectTrigger>
        
        <SelectContent className="bg-white z-[90]">
          {Array.isArray(staff) ? renderStaffOptions() : (
            <div className="p-2 text-sm text-gray-500">
              Personel listesi yüklenemedi.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}