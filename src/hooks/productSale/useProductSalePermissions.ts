'use client';

import { useCallback } from 'react';
import { usePermissions } from '@/hooks/permissions/usePermissions';

export interface UseProductSalePermissionsResult {
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  checkPermission: (action: 'view' | 'add' | 'edit' | 'delete') => boolean;
}

/**
 * Ürün satışı yetkilendirmelerini yöneten hook
 */
export const useProductSalePermissions = (): UseProductSalePermissionsResult => {
  // Ana izinler hook'u
  const {
    canViewProductSales,
    canAddProductSales,
    canEditProductSales,
    canDeleteProductSales,
  } = usePermissions();
  
  // Yetki kontrolü
  const checkPermission = useCallback((action: 'view' | 'add' | 'edit' | 'delete'): boolean => {
    switch (action) {
      case 'view':
        return canViewProductSales;
      case 'add':
        return canAddProductSales;
      case 'edit':
        return canEditProductSales;
      case 'delete':
        return canDeleteProductSales;
      default:
        return false;
    }
  }, [canViewProductSales, canAddProductSales, canEditProductSales, canDeleteProductSales]);
  
  return {
    permissions: {
      canView: canViewProductSales,
      canAdd: canAddProductSales,
      canEdit: canEditProductSales,
      canDelete: canDeleteProductSales
    },
    checkPermission
  };
};
