/**
 * Appointment service types
 */
import { Appointment, Customer, Staff, Service, BusinessDay, Payment } from '@prisma/client';

// Tip tanımlamaları
export type AppointmentWithRelations = Appointment & {
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'email'>;
  staff?: Pick<Staff, 'id' | 'name'>;
  service?: Pick<Service, 'id' | 'name' | 'duration' | 'price'>;
};

export type FormattedAppointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  staffId: string;
  customerId: string;
  serviceId: string;
  status: string;
  attendance?: string | null;
  amount?: number | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'email'>;
  staff?: Pick<Staff, 'id' | 'name'>;
  service?: Pick<Service, 'id' | 'name' | 'duration' | 'price'>;
  _allAppointments?: FormattedAppointment[];
};

export type CalendarData = {
  staff: {
    id: string;
    name: string;
    workingHours?: any;
    showInCalendar?: boolean;
    serviceGender?: string;
  }[];
  appointments: FormattedAppointment[];
};

export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type WorkingHoursType = {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
};

// İş günleri için tip tanımı
export type BusinessHours = {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
};
