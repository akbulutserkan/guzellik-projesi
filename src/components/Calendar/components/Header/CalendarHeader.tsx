'use client';

import { FC } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { ViewMode } from '@/hooks/useCalendarManagement';

interface CalendarHeaderProps {
  currentDate: Date;
  currentView: ViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: ViewMode) => void;
}

export const CalendarHeader: FC<CalendarHeaderProps> = ({
  currentDate,
  currentView,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}) => {
  // Format date for display based on view
  const getFormattedDate = () => {
    let dateFormat;
    
    switch (currentView) {
      case ViewMode.DAY:
        // "13 Mart Perşembe" formatı
        dateFormat = 'd MMMM EEEE';
        break;
      case ViewMode.WEEK:
        // "13-19 Mart 2023" hafta aralığı formatı
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Pazar günü başlangıç
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // Aynı ay içindeyse: "13-19 Mart 2023"
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return `${format(startOfWeek, 'd', { locale: tr })}-${format(endOfWeek, 'd MMMM yyyy', { locale: tr })}`;
        }
        // Farklı aylardaysa: "28 Şubat - 6 Mart 2023"
        return `${format(startOfWeek, 'd MMMM', { locale: tr })} - ${format(endOfWeek, 'd MMMM yyyy', { locale: tr })}`;
      case ViewMode.MONTH:
        // "Mart 2023" formatı
        dateFormat = 'MMMM yyyy';
        break;
      case ViewMode.AGENDA:
        // "Mart-Nisan 2023" formatı 
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7);
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + 14);
        
        // Aynı yıl içindeyse ve farklı aylarsa: "Mart-Nisan 2023"
        if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() !== endDate.getMonth()) {
          return `${format(startDate, 'MMMM', { locale: tr })}-${format(endDate, 'MMMM yyyy', { locale: tr })}`;
        }
        // Farklı yıllardaysa: "Aralık 2022 - Ocak 2023"
        if (startDate.getFullYear() !== endDate.getFullYear()) {
          return `${format(startDate, 'MMMM yyyy', { locale: tr })} - ${format(endDate, 'MMMM yyyy', { locale: tr })}`;
        }
        // Aynı aysa: "Mart 2023"
        return format(currentDate, 'MMMM yyyy', { locale: tr });
      default:
        dateFormat = 'd MMMM yyyy';
        break;
    }
    
    const formattedDate = format(currentDate, dateFormat, { locale: tr });
    
    // Capitalize first letter of each word
    return formattedDate
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex justify-between items-center mb-4 px-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevious}
          className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 active:bg-gray-100 transition-colors"
          aria-label="Önceki"
        >
          <ChevronLeft size={16} />
        </button>
        
        <button
          onClick={onNext}
          className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 active:bg-gray-100 transition-colors"
          aria-label="Sonraki"
        >
          <ChevronRight size={16} />
        </button>
        
        <button
          onClick={onToday}
          className="ml-2 px-3 py-1 text-xs font-medium bg-secondary/30 rounded border border-secondary/20 hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
          aria-label="Bugün"
        >
          Bugün
        </button>
      </div>
      
      <div className="flex items-center rounded-full px-4 py-1.5 bg-gray-100">
        <CalendarIcon size={16} className="mr-2 text-gray-600" />
        <span className="text-sm font-medium">{getFormattedDate()}</span>
      </div>
      
      <div className="flex space-x-1 border border-gray-200 rounded-full overflow-hidden shadow-sm">
        <button
          onClick={() => onViewChange(ViewMode.DAY)}
          className={`text-xs px-3 py-1.5 ${currentView === ViewMode.DAY ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'} transition-colors`}
        >
          Gün
        </button>
        <button
          onClick={() => onViewChange(ViewMode.WEEK)}
          className={`text-xs px-3 py-1.5 ${currentView === ViewMode.WEEK ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'} transition-colors`}
        >
          Hafta
        </button>
        <button
          onClick={() => onViewChange(ViewMode.MONTH)}
          className={`text-xs px-3 py-1.5 ${currentView === ViewMode.MONTH ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'} transition-colors`}
        >
          Ay
        </button>
      </div>
    </div>
  );
};
