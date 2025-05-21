'use client'

import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ViewMode } from '@/types/calendar';

export interface ResponsiveToolbarProps {
  isMobile: boolean;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void;
  onView: (view: ViewMode) => void;
  date: Date;
  view: ViewMode;
  navigateToToday?: () => void;
  navigateNext?: () => void;
  navigatePrevious?: () => void;
}

// Views için sabitler
export const Views = {
  MONTH: 'month' as View,
  WEEK: 'week' as View,
  WORK_WEEK: 'work_week' as View,
  DAY: 'day' as View,
  AGENDA: 'agenda' as View
};

export const ResponsiveToolbar = React.memo(({ 
  isMobile, 
  onNavigate, 
  onView, 
  date, 
  view,
  navigateToToday, 
  navigateNext, 
  navigatePrevious 
}: ResponsiveToolbarProps) => {
  // State for showing date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for current picker date (to keep it in sync)
  const [pickerDate, setPickerDate] = useState(date);
  
  // Update pickerDate when the prop date changes
  useEffect(() => {
    setPickerDate(date);
  }, [date]);
  
  // Format date to show day name: "13 Mart Perşembe"
  const formattedDate = format(date, 'd MMMM EEEE', { locale: tr });
  
  // Capitalize first letter of each word
  const capitalizedDate = formattedDate
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  // Handle date selection in DatePicker
  const handleDateSelect = (newDate: Date) => {
    // Close the DatePicker first
    setShowDatePicker(false);
    
    // Navigate to the selected date - IMPORTANT: we need to use 'DATE' action
    // React-Big-Calendar expects this specific format
    onNavigate('DATE', newDate);
  };
    
  // Click outside handler to close the date picker
  React.useEffect(() => {
    if (showDatePicker) {
      const handleClickOutside = (event: MouseEvent) => {
        // Check if the click is outside the date picker and its button
        const target = event.target as HTMLElement;
        if (!target.closest('.datepicker-container') && !target.closest('.date-button')) {
          setShowDatePicker(false);
        }
      };

      // Add the event listener
      document.addEventListener('mousedown', handleClickOutside);

      // Remove the event listener on cleanup
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDatePicker]);
    
  return (
  <div className="rbc-toolbar-custom">
    <div className="left-buttons">
      <button 
        onClick={() => navigatePrevious ? navigatePrevious() : onNavigate('PREV')}
        className="flex items-center justify-center w-8 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg bg-white hover:bg-gray-50 text-gray-800 p-0"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        aria-label="Önceki"
      >
        <div className="flex items-center justify-center">
          <ChevronLeft size={16} />
        </div>
      </button>
      
      <div className="relative">
        <button 
          className="date-button flex items-center justify-center w-48 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg bg-white hover:bg-gray-50 text-gray-800 p-0 mx-2"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
          onClick={() => setShowDatePicker(!showDatePicker)}
          aria-label="Tarih seç"
        >
          <div className="flex items-center justify-center gap-2">
            <CalendarIcon size={14} />
            <span>{capitalizedDate}</span>
          </div>
        </button>

        {showDatePicker && (
          <div className="datepicker-container absolute z-50 top-10 left-1/2 transform -translate-x-1/2 bg-white p-1 rounded-md shadow-lg">
            <DatePicker
              selected={pickerDate}
              onChange={handleDateSelect}
              inline
              locale="tr"
              dateFormat="d MMMM yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperPlacement="bottom"
              open={true}
            />
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigateNext ? navigateNext() : onNavigate('NEXT')}
        className="flex items-center justify-center w-8 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg bg-white hover:bg-gray-50 text-gray-800 p-0"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        aria-label="Sonraki"
      >
        <div className="flex items-center justify-center">
          <ChevronRight size={16} />
        </div>
      </button>
      
      <button 
        className="flex items-center justify-center w-16 h-8 rounded-full shadow-md border-0 transition-all hover:shadow-lg bg-white hover:bg-gray-50 text-gray-800 p-0 ml-2"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        onClick={() => navigateToToday ? navigateToToday() : onNavigate('TODAY')}
        aria-label="Bugün"
      >
        <div className="flex items-center justify-center">
          Bugün
        </div>
      </button>
    </div>

    <div className="view-buttons">
      <div className="flex space-x-1">
        <button 
          onClick={() => onView(ViewMode.DAY)}
          className={`flex items-center justify-center min-w-[65px] h-8 rounded-l-full ${view === ViewMode.DAY ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-md border-0 py-0 px-3`}
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        >
          Gün
        </button>
        <button 
          onClick={() => onView(ViewMode.WEEK)}
          className={`flex items-center justify-center min-w-[65px] h-8 ${view === ViewMode.WEEK ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-md border-0 py-0 px-3`}
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        >
          Hafta
        </button>
        <button 
          onClick={() => onView(ViewMode.MONTH)}
          className={`flex items-center justify-center min-w-[65px] h-8 ${view === ViewMode.MONTH ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-md border-0 py-0 px-3`}
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        >
          Ay
        </button>
        <button 
          onClick={() => onView(ViewMode.AGENDA)}
          className={`flex items-center justify-center min-w-[65px] h-8 rounded-r-full ${view === ViewMode.AGENDA ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-md border-0 py-0 px-3`}
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        >
          <BarChart3 size={16} className="mr-1" />
          Liste
        </button>
      </div>
    </div>
  </div>
);
});

ResponsiveToolbar.displayName = 'ResponsiveToolbar';