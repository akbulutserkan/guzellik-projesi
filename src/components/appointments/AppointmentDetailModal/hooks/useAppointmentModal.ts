import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getLatestAppointmentEndTime } from '../services/api';
import { calculateTotalPrice } from '../utils/paymentUtils';

/**
 * Main hook for managing appointment modal state with performance optimizations
 */
interface UseAppointmentModalProps {
  appointment: any;
  allAppointments: any[];
  onUpdate: () => Promise<void>;
  open?: boolean;
}

// Create a lightweight Storage Helper with caching
const StorageHelper = {
  cache: new Map<string, any>(),
  
  get: (key: string) => {
    // Check cache first
    if (StorageHelper.cache.has(key)) {
      return StorageHelper.cache.get(key);
    }
    
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Save to cache for future reads
        StorageHelper.cache.set(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Error reading from storage:', e);
    }
    return null;
  },
  
  set: (key: string, value: any) => {
    try {
      // Update cache first
      StorageHelper.cache.set(key, value);
      
      // Then update localStorage
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to storage:', e);
      return false;
    }
  }
};

  // Yeni eklenen global event bus (önemli - yeni randevular eklendiğinde modalları güncellemek için)
export const AppointmentEventBus = {
  listeners: new Map(),

  subscribe: (id: string, callback: (data: any) => void) => {
    AppointmentEventBus.listeners.set(id, callback);
    return () => AppointmentEventBus.listeners.delete(id);
  },

  publish: (eventName: string, data: any) => {
    if (!data) {
      console.warn('AppointmentEventBus: Null veya undefined data ile publish çağrıldı');
      return;
    }
    
    try {
      AppointmentEventBus.listeners.forEach((callback) => {
        callback({ event: eventName, data });
      });
    } catch (err) {
      console.error('AppointmentEventBus publish hatası:', err);
    }
  }
};

// Helper to fetch product sales for a customer
async function fetchProductSalesForCustomer(customerId: string | undefined): Promise<any[]> {
  if (!customerId) return [];
  
  try {
    console.log(`Fetching product sales for customer ID: ${customerId}`);
    const response = await fetch(`/api/product-sales?customerId=${customerId}&includeStaff=true`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Product sales API error (${response.status}):`, errorText);
      return [];
    }
    
    const data = await response.json();
    console.log(`Successfully retrieved ${data.length} product sales for customer`);
    return data;
  } catch (error) {
    console.error('Error fetching product sales:', error);
  }
  
  return [];
}

export default function useAppointmentModal({
  appointment,
  allAppointments = [],
  onUpdate,
  open
}: UseAppointmentModalProps) {
  // Use lazy initializers for state to prevent unnecessary work
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoShowConfirm, setShowNoShowConfirm] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('unspecified');
  
  // useStates with functional initializers to avoid unnecessary calculations
  const [paymentAmount, setPaymentAmount] = useState(() => 
    appointment?.service?.price ? appointment.service.price.toString() : '');
  
  const [customPrice, setCustomPrice] = useState(() => 
    appointment?.service?.price ? appointment.service.price.toString() : '');
  
  // Optimize boolean state toggles to minimize renders
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  
  // Use refs for values that don't need to trigger renders when changed
  const refreshKeyRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Force refresh using a controlled pattern to minimize renders
  const forceRefresh = useCallback(() => {
    console.log('🔴 useAppointmentModal - forceRefresh çağrıldı');
    refreshKeyRef.current += 1;
    queueMicrotask(() => {
      setRefreshKey(refreshKeyRef.current);
    });
  }, []);
  
  // Editing appointment ID
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  
  // Date and time states - no need for excessive renders on changes
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentStartTime, setAppointmentStartTime] = useState<string>('');
  const [appointmentEndTime, setAppointmentEndTime] = useState<string>('');
  
  // Modal content area reference
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Immutable data goes in refs
  const appointmentRef = useRef(appointment);
  
  // Note editing states - group related states
  const [notes, setNotes] = useState(() => appointment?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [originalNotes, setOriginalNotes] = useState(() => appointment?.notes || '');
  
  // Flag to prevent modal closing during updates
  const isUpdatingRef = useRef(false);

  // Local appointment list state - memoize for performance
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);
  
  // Product sales state
  const [productSales, setProductSales] = useState<any[]>([]);

  // New service modal state
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  
  // Cache key for this appointment
  const cacheKey = useMemo(() => 
    appointment?.id ? `appointment_${appointment.id}` : null, 
    [appointment?.id]
  );

  // Update local appointment list with memoization to prevent unnecessary rerenders
  // Filter appointments by the selected appointment's date
  useEffect(() => {
    if (allAppointments && allAppointments.length > 0 && appointment) {
      console.log('🔴 UseEffect [allAppointments, appointment] tetiklendi - localAppointments güncellenecek');
      console.log('🔴 PAYLOAD - allAppointments uzunluğu:', allAppointments.length);
      
      // Get the selected appointment's date
      const selectedDate = appointment.start ? new Date(appointment.start) : null;
      
      if (selectedDate) {
        // Normalize the date by removing time part
        const normalizedSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        // Filter appointments by the same date
        const sameDay = allAppointments.filter(apt => {
          if (!apt.start) return false;
          
          const aptDate = new Date(apt.start);
          const normalizedAptDate = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
          
          return normalizedSelectedDate.getTime() === normalizedAptDate.getTime();
        });
        
        // Sort appointments by time - earliest first
        const sortedAppointments = sameDay.sort((a, b) => {
          const startTimeA = a.start ? new Date(a.start).getTime() : 0;
          const startTimeB = b.start ? new Date(b.start).getTime() : 0;
          return startTimeA - startTimeB;
        });
        
        console.log('🔴 Aynı günde bulunan randevu sayısı:', sortedAppointments.length); 
        console.log('🔴 Aynı günde bulunan randevular:', JSON.stringify(sortedAppointments.map(a => ({id: a.id, title: a.title || a.service?.name}))));
        
        // Update local appointments with filtered list
        setLocalAppointments([...sortedAppointments]);
      } else {
        // If we can't determine the date, sort all appointments by time
        const sortedAppointments = [...allAppointments].sort((a, b) => {
          const startTimeA = a.start ? new Date(a.start).getTime() : 0;
          const startTimeB = b.start ? new Date(b.start).getTime() : 0;
          return startTimeA - startTimeB;
        });
        setLocalAppointments(sortedAppointments);
        
        console.log('🔴 Tarih belirlenemedi, tüm randevular sıralandı:', sortedAppointments.length);
      }
    }
    
    // Fetch product sales when appointments change
    if (appointment?.customerId) {
      fetchProductSalesForCustomer(appointment.customerId)
        .then(sales => setProductSales(sales));
    }
  }, [allAppointments, appointment]);
  
// Event listener for new appointment additions and product sales updates
  useEffect(() => {
    // IMPORTANT: Event bus dinlemesi tamamen kaldırıldı - çift ekleme sorununu önlemek için
    // Artık sadece ürün güncellemelerini dinleyeceğiz
    // NOT: randevu ekleme artık event bus yerine doğrudan onUpdate ile yapılıyor
    
    // Sadece ürün satışlarını dinle
    if (open && attendanceStatus === 'showed' && appointment?.customerId) {
      const updateProductTotals = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.customerId === appointment.customerId) {
          console.log('Ürün satışı güncellendi, toplamı hesaplıyorum');
          // Ürün satışlarını getir ve toplamı güncelle
          const fetchAndUpdateTotal = async () => {
            try {
              console.log(`Ürün satışları getiriliyor. Müşteri ID: ${appointment.customerId}`);
              const response = await fetch(`/api/product-sales?customerId=${appointment.customerId}&includeStaff=true`);
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`Ürün satışları API hatası (${response.status}):`, errorText);
                return;
              }
              
              const productSales = await response.json();
              console.log(`Başarıyla ${productSales.length} ürün satışı getirildi`);
              
              // Ürün satışlarının yapısını log'a yazdır (inceleme için)
              if (productSales.length > 0) {
                console.log('Ürün satışları örnek yapısı:', productSales[0]);
              }
              
              // Hizmetler ve ürünleri beraber hesaplayarak toplamı güncelle
              const totalPrice = calculateTotalPrice(localAppointments, productSales);
              console.log('Toplam tutar:', totalPrice, 'Randevular:', localAppointments.length, 'Ürünler:', productSales.length);
              setCustomPrice(totalPrice.toString());
              setPaymentAmount(totalPrice.toString());
              forceRefresh();
            } catch (error) {
              console.error('Ürün satışlarını getirme hatası:', error);
            }
          };
          
          fetchAndUpdateTotal();
        }
      };
      
      // 'product_sale_updated' olayını dinle
      document.addEventListener('product_sale_updated', updateProductTotals as EventListener);
      
      return () => {
        document.removeEventListener('product_sale_updated', updateProductTotals as EventListener);
      };
    }
    
    return () => {};
  }, [open, attendanceStatus, appointment?.customerId, localAppointments, setCustomPrice, setPaymentAmount, forceRefresh]);
  
  // Find the end time of the latest appointment for the customer - memoized
  const findLatestAppointmentEndTime = useCallback(() => {
    console.log('🔴 useAppointmentModal - findLatestAppointmentEndTime çağrıldı');
    return getLatestAppointmentEndTime(appointment, localAppointments);
  }, [appointment, localAppointments]);

  // Handle appointment deletion with memoization
  const handleAppointmentDeleted = useCallback(async (deletedAppointmentId: string) => {
    console.log('🔴 useAppointmentModal - handleAppointmentDeleted çağrıldı, ID:', deletedAppointmentId);
    // First, remove appointment from local list
    setLocalAppointments(prevAppointments => 
      prevAppointments.filter(apt => apt.id !== deletedAppointmentId)
    );
    
    // If main appointment was deleted or no appointments left, close modal
    if (deletedAppointmentId === appointment?.id) {
      // Close modal immediately to improve perceived performance
      handleOpenChange(false);
    }
    
    // Update calendar data in background
    onUpdate();
  }, [appointment?.id, onUpdate]);

  // Calculate total price - memoized
  const calculateTotal = useCallback(() => {
    console.log('🔴 useAppointmentModal - calculateTotal çağrıldı');
    return calculateTotalPrice(allAppointments, productSales);
  }, [allAppointments, productSales]);
  
  // Add new service with memoization - THIS IS REPLACED IN THE MAIN COMPONENT
  const addNewService = useCallback((e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // This is a placeholder now - the actual implementation is in AppointmentDetailModal.tsx
    // Prevent default action and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Logic moved to AppointmentDetailModal.tsx
    console.log('This function is replaced in main component');
  }, []);

  // Handle modal open state change - memoized
  const handleOpenChange = useCallback((isOpen: boolean) => {
    console.log('🔴 useAppointmentModal - handleOpenChange çağrıldı, isOpen:', isOpen);
    // If update in progress and modal is closing, prevent it
    if (!isOpen && isUpdatingRef.current) {
      return;
    }
    
    // If modal is closing, perform cleanup
    if (!isOpen) {
      // Call onUpdate to refresh main calendar view
      if (typeof onUpdate === 'function') {
        // Use setTimeout with 0 to defer execution to next event loop tick
        setTimeout(() => {
          onUpdate();
        }, 0);
      }
      
      // Reset states
      setAttendanceStatus('unspecified');
      setPaymentAmount(appointment?.service?.price ? appointment.service.price.toString() : '');
      setShowPaymentSection(false);
      setCustomPrice(appointment?.service?.price ? appointment.service.price.toString() : '');
      setIsEditingNotes(false);
      setNotes(appointment?.notes || '');
      setOriginalNotes(appointment?.notes || '');
      
      // Reset modal states efficiently
      if (showEditModal || showNewServiceModal) {
        queueMicrotask(() => {
          setShowEditModal(false);
          setShowNewServiceModal(false);
        });
      }
    }
  }, [appointment, onUpdate, showEditModal, showNewServiceModal]);

  // Handle price change - memoized
  const handlePriceChange = useCallback((value: string) => {
    console.log('🔴 useAppointmentModal - handlePriceChange çağrıldı, yeni değer:', value);
    setCustomPrice(value);
    setPaymentAmount(value);
  }, []);

  // Handle attendance status change - memoized
  const handleStatusChange = useCallback(async (value?: string) => {
    console.log('🔴 useAppointmentModal - handleStatusChange çağrıldı, durum:', value);
    // Eğer değer belirtilmemişse varsayılan olarak 'unspecified' kullan
    const statusValue = value || 'unspecified';
    setAttendanceStatus(statusValue);
    
    if (statusValue === 'showed') {
      // Fetch the latest product sales when status changes to showed
      if (appointment?.customerId) {
        try {
          // Doğrudan API çağrısı yaparak en son verileri al
          console.log(`Geldi butonuna tıklanınca ürün satışları getiriliyor. Müşteri ID: ${appointment.customerId}`);
          const response = await fetch(`/api/product-sales?customerId=${appointment.customerId}&includeStaff=true`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ürün satışları API hatası (${response.status}):`, errorText);
            // Hata durumunda toplamı hizmet fiyatlarına göre hesapla
            const totalPrice = calculateTotalPrice(allAppointments, []);
            setCustomPrice(totalPrice.toString());
            setPaymentAmount(totalPrice.toString());
            return;
          }
          
          const latestProductSales = await response.json();
          setProductSales(latestProductSales);
          console.log(`Geldi butonuna tıklanınca ${latestProductSales.length} ürün satışı getirildi`);

          // Ürün satışları ve hizmetlerin toplamını hesapla
          const totalPrice = calculateTotalPrice(allAppointments, latestProductSales);
          console.log('Hesaplanan toplam tutar:', totalPrice, 'Randevular:', allAppointments.length, 'Ürünler:', latestProductSales.length);
          
          // Update price states with the total
          setCustomPrice(totalPrice.toString());
          setPaymentAmount(totalPrice.toString());
        } catch (error) {
          console.error('Ürün satışlarını getirme hatası:', error);
          // Hata durumunda toplamı hizmet fiyatlarına göre hesapla
          const totalPrice = calculateTotalPrice(allAppointments, []);
          setCustomPrice(totalPrice.toString());
          setPaymentAmount(totalPrice.toString());
        }
      } else {
        // Müşteri ID yoksa sadece hizmetleri hesapla
        const totalPrice = calculateTotalPrice(allAppointments, []);
        setCustomPrice(totalPrice.toString());
        setPaymentAmount(totalPrice.toString());
      }
      
      // Show payment section
      setShowPaymentSection(true);
    } else if (statusValue === 'unspecified') {
      // Hide payment section
      setShowPaymentSection(false);
    }
  }, [appointment?.customerId, allAppointments]);

  // Optimized effect for loading appointment data
  useEffect(() => {
    if (open && appointment) {
      // STEP 1: Load minimal data from props for immediate display
      appointmentRef.current = {...appointment};
      
      // Use a worker or a microtask to avoid blocking the main thread
      queueMicrotask(() => {
        // STEP 2: Load from cache for instant display
        let hasLoadedFromCache = false;
        
        if (cacheKey) {
          try {
            const cachedData = StorageHelper.get(cacheKey);
            
            if (cachedData) {
              if (cachedData.notes !== undefined) {
                setNotes(cachedData.notes || '');
                setOriginalNotes(cachedData.notes || '');
                hasLoadedFromCache = true;
              }
              
              if (cachedData.service?.price) {
                setCustomPrice(cachedData.service.price.toString());
                setPaymentAmount(cachedData.service.price.toString());
                hasLoadedFromCache = true;
              }
            }
          } catch (e) {
            console.error('Error using cache for initial load:', e);
          }
        }
        
        // STEP 3: Load from props if cache didn't work
        if (!hasLoadedFromCache) {
          if (appointment?.service?.price) {
            setCustomPrice(appointment.service.price.toString());
            setPaymentAmount(appointment.service.price.toString());
          }
          
          if (appointment?.notes !== undefined) {
            setNotes(appointment.notes || '');
            setOriginalNotes(appointment.notes || '');
          }
        }
        
        // STEP 4: Process date/time data in a non-blocking way
        setTimeout(() => {
          if (appointment) {
            if (appointment.start) {
              const startDate = new Date(appointment.start);
              setAppointmentDate(startDate.toISOString().split('T')[0]);
              setAppointmentStartTime(
                `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
              );
            }
            
            if (appointment.end) {
              const endDate = new Date(appointment.end);
              setAppointmentEndTime(
                `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
              );
            }
            
            // Update cache if we have an appointment
            if (cacheKey) {
              StorageHelper.set(cacheKey, {
                id: appointment.id,
                notes: appointment.notes || '',
                service: appointment.service
              });
            }
          }
        }, 100);
      });
    }
  }, [open, appointment, cacheKey]);
  
  // Remove focus when modal opens
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        // Remove focus from active element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
    }
  }, [open]);

  // Force update function - for refreshing UI
  const forceUpdate = useCallback(() => {
    console.log('🔴 useAppointmentModal - forceUpdate çağrıldı');
    refreshKeyRef.current += 1;
    setRefreshKey(refreshKeyRef.current);
  }, []);

  // Return memoized state and functions
  return {
    loading,
    setLoading,
    showCancelConfirm,
    setShowCancelConfirm,
    showEditModal,
    setShowEditModal,
    showNoShowConfirm,
    setShowNoShowConfirm,
    attendanceStatus,
    setAttendanceStatus,
    paymentAmount,
    setPaymentAmount,
    customPrice,
    setCustomPrice,
    showPaymentSection,
    refreshKey,
    forceRefresh,
    editingAppointmentId,
    setEditingAppointmentId,
    appointmentDate,
    setAppointmentDate,
    appointmentStartTime,
    setAppointmentStartTime,
    appointmentEndTime,
    setAppointmentEndTime,
    modalContentRef,
    appointmentRef,
    notes,
    setNotes,
    isEditingNotes,
    setIsEditingNotes,
    originalNotes,
    setOriginalNotes,
    isUpdatingRef,
    localAppointments,
    setLocalAppointments, // setLocalAppointments fonksiyonunu dışarı açıyoruz
    productSales,
    setProductSales,
    showNewServiceModal,
    setShowNewServiceModal,
    findLatestAppointmentEndTime,
    handleAppointmentDeleted,
    handleOpenChange,
    handlePriceChange,
    handleStatusChange,
    addNewService,
    forceUpdate
  };
}