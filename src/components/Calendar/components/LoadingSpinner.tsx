'use client'

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string; 
}

export const LoadingSpinner = ({ message = 'Takvim yükleniyor...' }: LoadingSpinnerProps) => {
  return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <CalendarIcon size={36} className="text-gray-300" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
        </div>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';
