/**
 * Hizmet (Service) modülü tip tanımlamaları
 */
import { Service, ServiceCategory } from '@prisma/client';

// Temel tip tanımlamaları
export interface ServiceFilterOptions {
  categoryId?: string;
  isActive?: boolean;
  searchQuery?: string;
  includeDeleted?: boolean;
}

export interface ServiceCreateInput {
  name: string;
  price: number;
  duration: number;
  categoryId: string;
  isActive?: boolean;
}

export interface ServiceUpdateInput {
  name?: string;
  price?: number;
  duration?: number;
  categoryId?: string;
  isActive?: boolean;
}

// Genişletilmiş tip tanımlamaları
export type ServiceWithCategory = Service & {
  category?: Pick<ServiceCategory, 'id' | 'name'>;
  categoryName?: string;
};

export type ServiceCategoryWithCount = ServiceCategory & {
  serviceCount?: number;
};

export type ServiceCategoryWithServices = ServiceCategory & {
  services?: ServiceWithCategory[];
};

// Servis yanıt tipi
export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
