/**
 * Müşteri (Customer) modülü için tip tanımlamaları
 */
import { Customer as PrismaCustomer, Appointment, Service, Staff } from '@prisma/client';

// Temel müşteri tipi
export type Customer = PrismaCustomer;

// Müşteri oluşturma/güncelleme için girdi tipi
export type CustomerCreateInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>;
export type CustomerUpdateInput = Partial<CustomerCreateInput>;

// Müşteri filtreleme için girdi tipi
export type CustomerFilterOptions = {
  name?: { contains: string };
  email?: { contains: string };
  phone?: { contains: string };
  includeDeleted?: boolean;
};

// Müşteri detayı için genişletilmiş tip
export type CustomerWithAppointments = Customer & {
  appointments: (Appointment & {
    service: Service;
    staff: Staff;
  })[];
};

// Servis yanıt tipi
export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
