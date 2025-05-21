'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ViewMode } from '@/types/calendar';

// Dinamik olarak CalendarClient bileşenini yükle
const CalendarClient = dynamic(
  () => import('@/components/Calendar/CalendarClient'),
  { ssr: false, loading: () => <CalendarLoading /> }
);

// Yükleme bileşeni
const CalendarLoading = () => (
  <div className="flex-1 h-full w-full flex items-center justify-center">
    <div className="animate-pulse text-gray-500">
      <svg 
        className="w-12 h-12" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke="currentColor" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M5 5h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2zm0 4h14M8 3v4m8-4v4"
        />
      </svg>
      <p className="mt-2">Takvim yükleniyor...</p>
    </div>
  </div>
);

/**
 * Takvim Ana Sayfası
 * URL parametrelerine göre takvim başlangıç durumunu yapılandırır
 */
export default function CalendarPage() {
  const searchParams = useSearchParams();
  
  // URL parametrelerinden başlangıç durumunu al
  const initialViewParam = searchParams?.get('view');
  const initialDateParam = searchParams?.get('date');
  const staffIdParam = searchParams?.get('staffId');
  const customerIdParam = searchParams?.get('customerId');
  
  // Görünüm modu parametresi doğrulama
  let initialView: ViewMode | undefined;
  if (initialViewParam) {
    switch (initialViewParam.toLowerCase()) {
      case 'day':
        initialView = ViewMode.DAY;
        break;
      case 'week':
        initialView = ViewMode.WEEK;
        break;
      case 'month':
        initialView = ViewMode.MONTH;
        break;
      case 'agenda':
        initialView = ViewMode.AGENDA;
        break;
      default:
        break;
    }
  }
  
  // Tarih parametresi doğrulama
  let initialDate: Date | undefined;
  if (initialDateParam) {
    const parsedDate = new Date(initialDateParam);
    if (!isNaN(parsedDate.getTime())) {
      initialDate = parsedDate;
    }
  }
  
  // Filtre parametreleri
  const initialFilters = {};
  if (staffIdParam) {
    initialFilters['staffId'] = staffIdParam;
  }
  if (customerIdParam) {
    initialFilters['customerId'] = customerIdParam;
  }
  
  // CalendarClient'a konfigürasyon opsiyonlarını gönder
  return (
    <div className="flex-1 h-full w-full overflow-hidden bg-white">
      <Suspense fallback={<CalendarLoading />}>
        <CalendarClient
          options={{
            initialDate,
            initialView,
            defaultFilters: initialFilters,
            forceInitialLoad: true
          }}
        />
      </Suspense>
    </div>
  );
}