'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ApiService } from '@/services/api';

interface StaffSelectorProps {
  appointment: any;
  forceUpdate: (value: any) => void;
  refreshCalendarInBackground: () => void;
  toast: any;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

export default function StaffSelector({
  appointment,
  forceUpdate,
  refreshCalendarInBackground,
  toast,
  setLoading,
  loading
}: StaffSelectorProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  // Personel listesini getir
  const fetchStaffList = async () => {
    try {
      // Merkezi API sistemi üzerinden personel listesini getir
      const result = await ApiService.staff.getList();
      
      if (result.success && result.data) {
        // activeStaff'i kullan - sadece aktif personelleri göster
        setStaffList(result.data.activeStaff || []);
      } else {
        console.warn('Personel listesi alınamadı:', result.error);
        setStaffList([]);
        throw new Error(result.error || 'Personel listesi getirilemedi');
      }
    } catch (error) {
      console.error('Personel listesi getirme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Personel listesi getirilemedi.'
      });
    }
  };

  const toggleStaffDropdown = () => {
    if (!isStaffDropdownOpen) {
      fetchStaffList();
    }
    setIsStaffDropdownOpen(!isStaffDropdownOpen);
  };

  const selectStaffMember = async (staff: any) => {
    try {
      setLoading(true);
      
      // API Service kullanarak randevuyu güncelle
      const payload = { staffId: staff.id };
      
      // Önce ApiService'ten randevu güncelleme fonksiyonunu kontrol edelim
      if (ApiService.appointments && ApiService.appointments.update) {
        const result = await ApiService.appointments.update(appointment.id, payload);
        
        if (!result.success) {
          throw new Error(result.error || 'Personel güncellenemedi');
        }
        
        // Randevu verisini güncelle
        if (appointment) {
          appointment.staff = result.data?.staff || staff;
          appointment.staffId = staff.id;
          
          // UI'yi yeniden render et
          forceUpdate({});
        }
      } else {
        // ApiService'te ilgili metod yoksa doğrudan endpoint'e istek yap
        const response = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Personel güncellenemedi');
        }
        
        // API yanıtını al
        const updatedData = await response.json();
        
        // Doğrudan appointment nesnesini güncelle
        if (appointment) {
          appointment.staff = updatedData.staff || staff;
          appointment.staffId = staff.id;
          
          // UI'yi yeniden render et
          forceUpdate({});
        }
      }
      
      toast({
        title: 'Başarılı',
        description: 'Personel güncellendi'
      });
      
      // Dropdown'u kapat
      setIsStaffDropdownOpen(false);
      
      // Arka planda takvimi güncelle, modal kapanmadan
      refreshCalendarInBackground();
    } catch (error) {
      console.error('Personel güncelleme hatası:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Personel güncellenirken bir hata oluştu.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-44 bg-gray-50 p-3 rounded-xl">
      <div className="relative">
        <button 
          onClick={toggleStaffDropdown}
          className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-xl"
        >
          <span>{appointment.staff?.name || 'Personel'}</span>
          <svg className="ml-1 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isStaffDropdownOpen && (
          <div className="absolute right-0 mt-1 w-full bg-white border rounded-xl shadow-lg z-20">
            {staffList.length > 0 ? staffList.map(staff => (
              <div 
                key={staff.id}
                className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                onClick={() => selectStaffMember(staff)}
              >
                {staff.name}
              </div>
            )) : (
              <div className="p-2 text-gray-500">Yükleniyor...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
