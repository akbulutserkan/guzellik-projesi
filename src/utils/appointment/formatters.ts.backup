'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Appointment utilities and formatters
 */

export interface Appointment {
  id: string;
  customerId?: string;
  customer?: {
    id?: string;
    name: string;
    phone?: string;
  };
  staffId?: string;
  resourceId?: string;
  staff?: {
    id?: string;
    name: string;
  };
  serviceId?: string;
  service?: {
    id?: string;
    name: string;
    price?: number;
    duration?: number;
  };
  startTime: string;
  endTime?: string;
  start?: string; // Calendar format
  end?: string;  // Calendar format
  status: string;
  notes?: string;
  title?: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export type AttendanceStatus = 'unspecified' | 'showed' | 'noshow';

/**
 * Format date in dd MMMM yyyy format
 */
export const formatDate = (date: string | Date): string => {
  try {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMMM yyyy', { locale: tr });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Format date and time in dd MMMM yyyy HH:mm format
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMMM yyyy HH:mm', { locale: tr });
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return '';
  }
};

/**
 * Format time only in HH:mm format
 */
export const formatTime = (date: string | Date): string => {
  try {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'HH:mm', { locale: tr });
  } catch (error) {
    console.error('Time formatting error:', error);
    return '';
  }
};

/**
 * Group appointments by date
 */
export const groupAppointmentsByDate = (appointments: Appointment[]): { [key: string]: Appointment[] } => {
  const grouped: { [key: string]: Appointment[] } = {};
  
  if (!appointments || !Array.isArray(appointments)) {
    return grouped;
  }
  
  appointments.forEach(appointment => {
    if (!appointment || !appointment.startTime) return;
    
    // Use date as key (without time)
    const dateKey = format(new Date(appointment.startTime), 'yyyy-MM-dd');
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(appointment);
  });
  
  return grouped;
};

/**
 * Get status color class for UI
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    case 'NO_SHOW':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get human-readable status text
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Beklemede';
    case 'CONFIRMED':
      return 'Onaylandı';
    case 'CANCELLED':
      return 'İptal Edildi';
    case 'COMPLETED':
      return 'Tamamlandı';
    case 'NO_SHOW':
      return 'Gelmedi';
    default:
      return status;
  }
};

/**
 * Map attendance status to appointment status
 */
export const mapAttendanceToStatus = (attendanceStatus: AttendanceStatus): AppointmentStatus => {
  switch (attendanceStatus) {
    case 'showed':
      return 'COMPLETED';
    case 'noshow':
      return 'NO_SHOW';
    default:
      return 'PENDING';
  }
};

/**
 * Map appointment status to attendance status
 */
export const mapStatusToAttendance = (status: AppointmentStatus): AttendanceStatus => {
  switch (status) {
    case 'COMPLETED':
      return 'showed';
    case 'NO_SHOW':
      return 'noshow';
    default:
      return 'unspecified';
  }
};

/**
 * Calculate appointment statistics
 */
export const calculateAppointmentStats = (appointments: Appointment[]) => {
  // Filter out invalid appointments
  const validAppointments = Array.isArray(appointments) 
    ? appointments.filter(apt => apt && apt.status) 
    : [];

  return {
    total: validAppointments.length,
    noShow: validAppointments.filter(a => a.status === 'NO_SHOW').length,
    completed: validAppointments.filter(a => a.status === 'COMPLETED').length,
    active: validAppointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length,
  };
};

/**
 * Validate appointment data
 */
export const validateAppointmentData = (data: any): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!data.customerId) {
    errors.customerId = 'Müşteri seçilmelidir';
  }
  
  if (!data.staffId) {
    errors.staffId = 'Personel seçilmelidir';
  }
  
  if (!data.serviceId) {
    errors.serviceId = 'Hizmet seçilmelidir';
  }
  
  if (!data.startTime) {
    errors.startTime = 'Başlangıç saati gereklidir';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ----- Takvim formatlamaları -----

/**
 * Tek bir randevuyu takvim görünümü için formatlar
 * API'den gelen verileri takvim için uygun formata dönüştürür
 */
export const formatAppointmentForCalendar = (appointment: any): Appointment => {
  if (!appointment) {
    console.warn('formatAppointmentForCalendar: appointment nesnesi geçersiz', appointment);
    return null as unknown as Appointment;
  }
  
  return {
    ...appointment,
    id: appointment.id,
    title: appointment.customer?.name 
      ? `${appointment.customer.name} - ${appointment.service?.name || 'Hizmet yok'}` 
      : 'Müşteri yok',
    start: appointment.startTime || appointment.start,
    end: appointment.endTime || appointment.end,
    resourceId: appointment.staffId || appointment.resourceId,
    status: appointment.status || 'PENDING',
    // Takvim için gerekli diğer özellikler
    staffId: appointment.staffId || appointment.resourceId || (appointment.staff?.id || ''),
    serviceId: appointment.serviceId || (appointment.service?.id || ''),
    customerId: appointment.customerId || (appointment.customer?.id || '')
  };
};

/**
 * Randevu listesini takvim görünümü için formatlar
 * API'den gelen randevu listesini takvim için uygun formata dönüştürür
 */
export const formatAppointmentsForCalendar = (appointments: any[]): Appointment[] => {
  if (!Array.isArray(appointments)) {
    // Eğer dizi değilse, boş dizi döndür
    console.warn('formatAppointmentsForCalendar: appointments bir dizi değil', appointments);
    return [];
  }
  
  return appointments
    .filter(apt => apt && (apt.startTime || apt.start) && (apt.endTime || apt.end))
    .map(formatAppointmentForCalendar);
};

/**
 * Takvim görünümü için olay stilini format eder
 * Randevu durumuna göre uygun stil sınıflarını döndürür
 */
export const formatEventStyle = (event: Appointment) => {
  if (!event) return {};
  
  let backgroundColor = '#3174ad';
  let borderColor = '#265985';
  let color = '#fff';
  
  switch (event.status) {
    case 'PENDING':
      backgroundColor = '#FCD34D';  // yellow-300
      borderColor = '#D97706';      // amber-600
      color = '#000';
      break;
    case 'CONFIRMED':
      backgroundColor = '#34D399';  // emerald-400
      borderColor = '#059669';      // emerald-600
      color = '#000';
      break;
    case 'CANCELLED':
      backgroundColor = '#F87171';  // red-400
      borderColor = '#DC2626';      // red-600
      color = '#fff';
      break;
    case 'COMPLETED':
      backgroundColor = '#60A5FA';  // blue-400
      borderColor = '#2563EB';      // blue-600
      color = '#fff';
      break;
    case 'NO_SHOW':
      backgroundColor = '#A78BFA';  // violet-400
      borderColor = '#7C3AED';      // violet-600
      color = '#fff';
      break;
  }
  
  return {
    className: `appointment-${event.status.toLowerCase()}`,
    style: {
      backgroundColor,
      borderColor,
      color,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '3px',
      padding: '2px 5px',
      fontWeight: 500
    }
  };
};

/**
 * Takvim görünümü için randevu çakışma kontrolü yapar
 * Başka bir randevu ile çakışma olup olmadığını kontrol eder
 */
export const checkAppointmentConflict = (
  appointment: Appointment, 
  existingAppointments: Appointment[]
): boolean => {
  if (!appointment || !Array.isArray(existingAppointments)) return false;
  
  const start = new Date(appointment.startTime || appointment.start);
  const end = new Date(appointment.endTime || appointment.end);
  
  // Kendisi hariç diğer randevularla çakışma kontrolü
  return existingAppointments.some(existing => {
    if (existing.id === appointment.id) return false;
    if (existing.staffId !== appointment.staffId) return false;
    
    const existingStart = new Date(existing.startTime || existing.start);
    const existingEnd = new Date(existing.endTime || existing.end);
    
    return (
      (start >= existingStart && start < existingEnd) ||
      (end > existingStart && end <= existingEnd) ||
      (start <= existingStart && end >= existingEnd)
    );
  });
};