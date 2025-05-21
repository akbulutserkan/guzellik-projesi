/**
 * Personel (Staff) modülü için tip tanımlamaları
 */
import { Permission, Staff, UserRole, Service, WorkingHour, BusinessHours, WorkingDayException, Appointment, Customer } from '@prisma/client';

// Temel personel tipi ve ilişkileri
export type StaffWithServices = Staff & {
  services?: Service[];
};

// Personel oluşturma/güncelleme için girdi tipi
export type StaffCreateInput = {
  username: string;
  password: string;
  name: string;
  phone: string;
  email?: string | null;
  accountType: UserRole;
  serviceGender?: string;
  position?: string | null;
  permissions?: Permission[];
  showInCalendar?: boolean;
  workingHours?: WorkingHour[];
  services?: string[];
};

export type StaffUpdateInput = Partial<Omit<StaffCreateInput, 'username'>> & {
  isActive?: boolean;
};

// Personel çalışma saatleri/takvim için tip tanımlamaları
export type StaffSchedule = {
  staff: {
    id: string;
    name: string;
  };
  workingHours: any[];
  businessHours: BusinessHoursInfo[];
  exceptions: WorkingDayException[];
  staffSchedule: any[];
};

export type BusinessHoursInfo = {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
};

export type StaffAvailability = {
  staff: {
    id: string;
    name: string;
  };
  workingHours: any[];
  businessHours: BusinessHours[];
  appointments: (Appointment & {
    customer: Customer;
    service: Service;
  })[];
  exceptions: WorkingDayException[];
  date: string;
};

// Servis yanıt tipi
export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Personel listesi yanıt tipi
export type StaffListResponse = {
  activeStaff: StaffWithServices[];
  allStaff: StaffWithServices[];
};
