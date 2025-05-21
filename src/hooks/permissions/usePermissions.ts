// hooks/permissions/usePermissions.ts
import { useSession } from "next-auth/react";
import { Permission } from "@prisma/client";
import { PermissionResult } from "./types";

/**
 * Kullanıcı izinlerini kontrol etmek için hook
 */
export const usePermissions = (): PermissionResult => {
  const { data: session } = useSession();
  
  const userPermissions = (session?.user?.permissions as Permission[]) || [];
  const isAdmin = session?.user?.role === "ADMIN";

  const hasPermission = (permission: Permission): boolean => {
    const hasAccess = isAdmin || userPermissions.includes(permission);
    return hasAccess;
  };

  return {
    // Ürün Yetkileri
    canViewProducts: hasPermission(Permission.VIEW_PRODUCTS),
    canAddProducts: hasPermission(Permission.ADD_PRODUCTS),
    canEditProducts: hasPermission(Permission.EDIT_PRODUCTS),
    canDeleteProducts: hasPermission(Permission.DELETE_PRODUCTS),

    // Ürün Satışları Yetkileri
    canViewProductSales: hasPermission(Permission.VIEW_PRODUCT_SALES),
    canAddProductSales: hasPermission(Permission.ADD_PRODUCT_SALES),
    canEditProductSales: hasPermission(Permission.EDIT_PRODUCT_SALES),
    canDeleteProductSales: hasPermission(Permission.DELETE_PRODUCT_SALES),

    // Hizmet Yetkileri
    canViewServices: hasPermission(Permission.VIEW_SERVICES),
    canAddServiceCategory: hasPermission(Permission.ADD_SERVICE_CATEGORY),
    canEditServiceCategory: hasPermission(Permission.EDIT_SERVICE_CATEGORY),
    canDeleteServiceCategory: hasPermission(Permission.DELETE_SERVICE_CATEGORY),
    canAddService: hasPermission(Permission.ADD_SERVICE),
    canEditService: hasPermission(Permission.EDIT_SERVICE),
    canDeleteService: hasPermission(Permission.DELETE_SERVICE),
    canBulkUpdatePrices: hasPermission(Permission.BULK_UPDATE_PRICES),
    canViewPriceHistory: hasPermission(Permission.VIEW_PRICE_HISTORY),

    // Personel Yetkileri
    canViewStaff: hasPermission(Permission.VIEW_STAFF),
    canEditStaff: hasPermission(Permission.EDIT_STAFF),
    canDeleteStaff: hasPermission(Permission.DELETE_STAFF),

    // Müşteri Yetkileri
    canViewCustomers: hasPermission(Permission.VIEW_CUSTOMERS),
    canAddCustomers: hasPermission(Permission.ADD_CUSTOMERS),
    canEditCustomers: hasPermission(Permission.EDIT_CUSTOMERS),
    canDeleteCustomers: hasPermission(Permission.DELETE_CUSTOMERS),

    // Randevu Yetkileri
    canViewAppointments: hasPermission(Permission.VIEW_APPOINTMENTS),
    canEditAppointments: hasPermission(Permission.EDIT_APPOINTMENTS),
    canDeleteAppointments: hasPermission(Permission.DELETE_APPOINTMENTS),

    // Paket Yetkileri
    canViewPackages: hasPermission(Permission.VIEW_PACKAGES),
    canAddPackages: hasPermission(Permission.ADD_PACKAGES),
    canEditPackages: hasPermission(Permission.EDIT_PACKAGES),
    canDeletePackages: hasPermission(Permission.DELETE_PACKAGES),
    
    // Paket Satışları Yetkileri
    canViewPackageSales: hasPermission(Permission.VIEW_PACKAGE_SALES),
    canAddPackageSales: hasPermission(Permission.ADD_PACKAGE_SALES),
    canEditPackageSales: hasPermission(Permission.EDIT_PACKAGE_SALES),
    canDeletePackageSales: hasPermission(Permission.DELETE_PACKAGE_SALES),

    // Ödeme Yetkileri
    canViewPayments: hasPermission(Permission.VIEW_PAYMENTS),
    canEditPayments: hasPermission(Permission.EDIT_PAYMENTS),
    canDeletePayments: hasPermission(Permission.DELETE_PAYMENTS),

    // Genel helpers
    hasPermission,
    isAdmin,
  };
};
