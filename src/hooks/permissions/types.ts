// hooks/permissions/types.ts
import { Permission } from "@prisma/client";

/**
 * İzin kontrolü sonucu
 */
export interface PermissionResult {
  // Ürün Yetkileri
  canViewProducts: boolean;
  canAddProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;

  // Ürün Satışları Yetkileri
  canViewProductSales: boolean;
  canAddProductSales: boolean;
  canEditProductSales: boolean;
  canDeleteProductSales: boolean;

  // Hizmet Yetkileri
  canViewServices: boolean;
  canAddServiceCategory: boolean;
  canEditServiceCategory: boolean;
  canDeleteServiceCategory: boolean;
  canAddService: boolean;
  canEditService: boolean;
  canDeleteService: boolean;
  canBulkUpdatePrices: boolean;
  canViewPriceHistory: boolean;

  // Personel Yetkileri
  canViewStaff: boolean;
  canEditStaff: boolean;
  canDeleteStaff: boolean;

  // Müşteri Yetkileri
  canViewCustomers: boolean;
  canAddCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;

  // Randevu Yetkileri
  canViewAppointments: boolean;
  canEditAppointments: boolean;
  canDeleteAppointments: boolean;

  // Paket Yetkileri
  canViewPackages: boolean;
  canAddPackages: boolean;
  canEditPackages: boolean;
  canDeletePackages: boolean;
  
  // Paket Satışları Yetkileri
  canViewPackageSales: boolean;
  canAddPackageSales: boolean;
  canEditPackageSales: boolean;
  canDeletePackageSales: boolean;

  // Ödeme Yetkileri
  canViewPayments: boolean;
  canEditPayments: boolean;
  canDeletePayments: boolean;

  // Genel helpers
  hasPermission: (permission: Permission) => boolean;
  isAdmin: boolean;
}
