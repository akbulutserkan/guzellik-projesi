'use client';

import { usePermissions } from '@/hooks/permissions/usePermissions';

export interface UsePackageSalePermissionsResult {
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * Paket satışı izinlerini yöneten hook
 */
export const usePackageSalePermissions = (): UsePackageSalePermissionsResult => {
  const { 
    canViewPackageSales, 
    canAddPackageSales, 
    canEditPackageSales, 
    canDeletePackageSales 
  } = usePermissions();
  
  return {
    permissions: {
      canView: canViewPackageSales,
      canAdd: canAddPackageSales,
      canEdit: canEditPackageSales,
      canDelete: canDeletePackageSales
    }
  };
};
