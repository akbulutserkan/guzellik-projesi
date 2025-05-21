'use client'

import React, { useMemo } from 'react';
import moment from 'moment';
import { Staff } from '@/types/appointment';
import { 
  determineTimeSlotType, 
  getTimeSlotStyleByType, 
  TimeSlotType 
} from '@/utils/calendar/formatters';

export interface TimeSlotWrapperProps {
  children: React.ReactNode;
  resource?: string | number;
  value: Date;
  businessHours?: any;
  staff?: Staff[];
}

export const TimeSlotWrapper = ({ children, resource, value, businessHours = {}, staff = [] }: TimeSlotWrapperProps) => {
  // Moment nesnesi oluştur
  const slotTime = moment(value);
  
  // Zaman dilimi tipini ve stilini memoize et - gereksiz yeniden hesaplama önle
  const { slotType, className, style } = useMemo(() => {
    // Zaman dilimi tipini belirle
    const type = determineTimeSlotType(slotTime, businessHours, resource, staff);
    
    // Zaman dilimi tipine göre stil al
    const { className, style } = getTimeSlotStyleByType(type);
    
    // 12-12.45 ve 16-16.45 saatleri için özel stili önlemek için
    // Tüm saatler için beyaz arka plan ayarla
    const updatedStyle = {
      ...style,
      backgroundColor: 'rgba(255, 255, 255, 0.5)'
    };
    
    return { slotType: type, className, style: updatedStyle };
  }, [slotTime, businessHours, resource, staff]);
  
  // Personel çalışma dışı saatleri için özel görünüm
  if (slotType === TimeSlotType.STAFF_NON_WORKING) {
    return (
      <div className={className} style={style} data-testid="staff-non-working-slot">
        {/* Siyah bir overlay ile tüm çizgileri gizle */}
        <div 
          className="absolute inset-[-2px] bg-black z-10" 
          aria-label="Personel çalışma saati dışı"
        />
        
        {/* Çizgi kapayıcılar - daha temiz CSS */}
        <div className="absolute top-[-1px] left-[-5px] right-[-5px] h-[2px] bg-black z-15" />
        <div className="absolute bottom-[-1px] left-[-5px] right-[-5px] h-[2px] bg-black z-15" />
        <div className="absolute top-[-2px] bottom-[-2px] left-[-1px] w-[2px] bg-black z-15" />
        <div className="absolute top-[-2px] bottom-[-2px] right-[-1px] w-[2px] bg-black z-15" />
        
        {children}
      </div>
    );
  }

  // Normal hücreler için standart görünüm
  return (
    <div 
      className={className} 
      style={style} 
      data-testid={`time-slot-${slotType}`}
      data-time={slotTime.format('HH:mm')}
    >
      {children}
    </div>
  );
};

TimeSlotWrapper.displayName = 'TimeSlotWrapper';