'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import { useBusinessHours } from '@/hooks';
import DatePicker from 'react-datepicker';
import React, { forwardRef } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Özel input bileşenleri
const DateCustomInput = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void; label: string }
>(({ value, onClick, label }, ref) => (
  <button
    className="text-sm px-3 py-2 rounded-[8px] cursor-pointer w-full text-center bg-white border-0 shadow-md hover:shadow-lg transition-all"
    style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
    onClick={onClick}
    ref={ref}
    type="button"
  >
    {label || value}
  </button>
));

DateCustomInput.displayName = 'DateCustomInput';

const TimeCustomInput = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void; label: string }
>(({ value, onClick, label }, ref) => (
  <button
    className="text-sm px-3 py-2 rounded-[8px] cursor-pointer w-full text-center bg-white border-0 shadow-md hover:shadow-lg transition-all"
    style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
    onClick={onClick}
    ref={ref}
    type="button"
  >
    {label || value}
  </button>
));

TimeCustomInput.displayName = 'TimeCustomInput';

interface ModalHeaderProps {
  appointment: any;
  appointmentDate: string;
  setAppointmentDate: (date: string) => void;
  appointmentStartTime: string;
  setAppointmentStartTime: (time: string) => void;
  appointmentEndTime: string; 
  setAppointmentEndTime: (time: string) => void;
  toast: any;
  forceUpdate: (value: any) => void;
  forceRefresh: () => void;
  onUpdate: () => Promise<void>;
  addNewService: () => void;
  loading: boolean;
}

export default function ModalHeader({
  appointment,
  appointmentDate,
  setAppointmentDate,
  appointmentStartTime,
  setAppointmentStartTime,
  appointmentEndTime,
  setAppointmentEndTime,
  toast,
  forceUpdate,
  forceRefresh,
  onUpdate,
  addNewService,
  loading
}: ModalHeaderProps) {
  const [isSavingDateTime, setIsSavingDateTime] = useState(false);
  
  // Business hours hook'unu kullan
  const { isWorkingHour } = useBusinessHours({
    useCaching: true,
    updateInterval: 5 * 60 * 1000
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        {/* Müşteri bilgileri sol tarafta */}
        <div className="flex items-center space-x-2 w-1/3">
          <p className="text-base font-medium text-gray-800">
            {appointment?.customer?.name || 'İsimsiz Müşteri'}
          </p>
          <span className="text-gray-400">-</span>
          <p className="text-sm text-gray-500">
            {appointment?.customer?.phone || 'Telefon yok'}
          </p>
        </div>

        {/* Tarih ve Saat Seçimi - ORTA KISIMDA */}
        <div className="flex items-center justify-center space-x-3 w-1/3">
          {/* Tarih seçici - React DatePicker */}
          <div className="relative">
            <DatePicker
              selected={null}
              customInput={<DateCustomInput label={appointmentDate} />}
              onChange={async (date: Date | null) => {
                if (!date) return;
                
                const newDate = date.toISOString().split('T')[0];
                setAppointmentDate(newDate);
                
                // Appointment null ise (yeni hizmet ekleme modu) işlem yapma
                if (!appointment) {
                  console.log('Yeni hizmet ekleme modunda tarih değişikliği yapıldı, ancak güncelleme gerekmez');
                  return;
                }
                
                // Otomatik kaydetme işlemi
                try {
                  setIsSavingDateTime(true);
                  
                  // Tarih bilgisinden yeni başlangıç ve bitiş zamanları oluştur
                  const [year, month, day] = newDate.split('-');
                  
                  // Mevcut saatleri koru
                  const existingStart = new Date(appointment.start || new Date());
                  const existingEnd = new Date(appointment.end || new Date(existingStart.getTime() + 60 * 60 * 1000));
                  const durationMinutes = (existingEnd.getTime() - existingStart.getTime()) / (1000 * 60);
                  
                  // Yeni başlangıç tarihi oluştur
                  const startDate = new Date(existingStart);
                  startDate.setFullYear(Number(year), Number(month) - 1, Number(day));
                  
                  // Yeni bitiş tarihi oluştur
                  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
                  
                  // Çalışma saati kontrolü yap
                  if (!isWorkingHour(startDate)) {
                    throw new Error('Seçilen zaman dilimi çalışma saatleri dışında');
                  }
                  
                  // API'ye gönderilecek veriyi hazırla (sürükle-bırak ile aynı formatta)
                  const updatedAppointment = {
                    startTime: moment(startDate).format('YYYY-MM-DDTHH:mm:ss'),
                    endTime: moment(endDate).format('YYYY-MM-DDTHH:mm:ss'),
                    staffId: appointment?.staffId || appointment?.resourceId // ResourceId'yi de kontrol et
                  };
                  
                  console.log('Tarih güncellenirken kullanılan personel ID:', appointment?.staffId || appointment?.resourceId);
                  
                  // API'ye güncelleme isteği gönder
                  const response = await fetch(`/api/appointments/${appointment.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedAppointment),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Randevu tarihi güncellenemedi');
                  }
                  
                  // Doğrudan appointment nesnesini güncelle
                  if (appointment) {
                    appointment.start = startDate.toISOString();
                    appointment.end = endDate.toISOString();
                  }
                  
                  // Başarılı güncelleme - toast bildirimi
                  toast({
                    title: 'Başarılı',
                    description: 'Randevu tarihi güncellendi'
                  });
                  
                  // UI'yi yeniden render et
                  forceUpdate({});
                  forceRefresh();
                  
                  // Takvimi güncelle
                  if (typeof onUpdate === 'function') {
                    await onUpdate();
                  }
                  
                } catch (error) {
                  console.error('Randevu tarih güncelleme hatası:', error);
                  
                  // Hata durumunda toast bildirimi
                  toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: 'Randevu tarihi güncellenirken bir hata oluştu.'
                  });
                  
                  // Hata durumunda takvim verilerini yeniden çek
                  if (typeof onUpdate === 'function') {
                    await onUpdate();
                  }
                  
                  // Hata durumunda orijinal değere geri dön
                  if (appointment?.start) {
                    setAppointmentDate(new Date(appointment.start).toISOString().split('T')[0]);
                  }
                } finally {
                  setIsSavingDateTime(false);
                }
              }}
              className="text-sm px-2 py-1 border rounded cursor-pointer w-full"
              dateFormat="yyyy-MM-dd"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
          
          {/* Saat seçici - React DatePicker */}
          <div className="relative">
            <DatePicker
              selected={appointmentStartTime ? new Date(`2000-01-01T${appointmentStartTime}:00`) : null}
              customInput={<TimeCustomInput label={appointmentStartTime || "Saat Seç"} />}
              onChange={async (date: Date | null) => {
                if (!date) return;
                
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const newStartTime = `${hours}:${minutes}`;
                setAppointmentStartTime(newStartTime);
                
                // Appointment null ise (yeni hizmet ekleme modu) işlem yapma
                if (!appointment) {
                  console.log('Yeni hizmet ekleme modunda saat değişikliği yapıldı, ancak güncelleme gerekmez');
                  return;
                }
                
                // Otomatik kaydetme işlemi
                try {
                  setIsSavingDateTime(true);
                  
                  // Saat bilgisinden yeni başlangıç ve bitiş zamanları oluştur
                  const [startHour, startMinute] = newStartTime.split(':');
                  
                  // Mevcut tarihi al
                  const startDate = new Date(appointment.start || new Date());
                  startDate.setHours(Number(startHour), Number(startMinute));
                  
                  // Randevu süresi (dakika olarak)
                  const existingStart = new Date(appointment.start || new Date());
                  const existingEnd = new Date(appointment.end || new Date(existingStart.getTime() + 60 * 60 * 1000));
                  const durationMinutes = (existingEnd.getTime() - existingStart.getTime()) / (1000 * 60);
                  
                  // Yeni bitiş zamanı hesapla
                  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
                  
                  // Çalışma saati kontrolü yap
                  if (!isWorkingHour(startDate)) {
                    throw new Error('Seçilen zaman dilimi çalışma saatleri dışında');
                  }
                  
                  // API'ye gönderilecek veriyi hazırla (sürükle-bırak ile aynı formatta)
                  const updatedAppointment = {
                    startTime: moment(startDate).format('YYYY-MM-DDTHH:mm:ss'),
                    endTime: moment(endDate).format('YYYY-MM-DDTHH:mm:ss'),
                    staffId: appointment?.staffId || appointment?.resourceId // ResourceId'yi de kontrol et
                  };
                  
                  console.log('Saat güncellenirken kullanılan personel ID:', appointment?.staffId || appointment?.resourceId);
                  
                  // API'ye güncelleme isteği gönder
                  const response = await fetch(`/api/appointments/${appointment.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedAppointment),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Randevu zamanı güncellenemedi');
                  }
                  
                  // Doğrudan appointment nesnesini güncelle
                  if (appointment) {
                    appointment.start = startDate.toISOString();
                    appointment.end = endDate.toISOString();
                  }
                  
                  // Bitiş saatini güncelle
                  setAppointmentEndTime(format(endDate, 'HH:mm'));
                  
                  // Başarılı güncelleme - toast bildirimi
                  toast({
                    title: 'Başarılı',
                    description: 'Randevu saati güncellendi'
                  });
                  
                  // UI'yi yeniden render et
                  forceUpdate({});
                  forceRefresh();
                  
                  // Takvimi güncelle
                  if (typeof onUpdate === 'function') {
                    await onUpdate();
                  }
                  
                } catch (error) {
                  console.error('Randevu güncelleme hatası:', error);
                  
                  // Hata durumunda toast bildirimi
                  toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: 'Randevu saati güncellenirken bir hata oluştu.'
                  });
                  
                  // Hata durumunda takvim verilerini yeniden çek
                  if (typeof onUpdate === 'function') {
                    await onUpdate();
                  }
                  
                  // Hata durumunda orijinal değere geri dön
                  if (appointment?.start) {
                    setAppointmentStartTime(format(new Date(appointment.start), 'HH:mm'));
                  }
                } finally {
                  setIsSavingDateTime(false);
                }
              }}
              className="text-sm px-2 py-1 border rounded cursor-pointer w-full"
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={5}
              timeCaption="Saat"
              dateFormat="HH:mm"
              timeFormat="HH:mm"
            />
          </div>
        </div>
        
        {/* Yeni Ürün ve Hizmet Butonları - SAĞ TARAFTA */}
        <div className="flex items-center justify-end space-x-2 w-1/3">
          <button
            className="bg-white text-pink-500 border-0 rounded-[8px] px-3 py-2 flex items-center justify-center hover:shadow-lg transition-all focus:outline-none"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            onClick={() => {
              const event = new CustomEvent('product_sale_modal_open_requested');
              document.dispatchEvent(event);
            }}
            disabled={loading}
          >
            <PlusCircle className="mr-1 h-4 w-4" /> +Ürün
          </button>
          <button
            className="bg-white text-blue-500 border-0 rounded-[8px] px-3 py-2 flex items-center justify-center hover:shadow-lg transition-all focus:outline-none"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            onClick={(e) => {
              if (e.defaultPrevented) return;
              e.preventDefault();
              e.stopPropagation();
              addNewService();
            }}
            disabled={loading}
          >
            <PlusCircle className="mr-1 h-4 w-4" /> +Hizmet
          </button>
        </div>
      </div>
    </div>
  );
}