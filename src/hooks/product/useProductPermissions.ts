'use client';

import { useMemo } from 'react';
import { usePermissions } from '@/hooks/permissions/usePermissions';

export interface UseProductPermissionsResult {
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * Ürün izinlerini yöneten hook
 */
export const useProductPermissions = (): UseProductPermissionsResult => {
  const {
    canViewProducts,
    canAddProducts,
    canEditProducts,
    canDeleteProducts
  } = usePermissions();
  
  // Yetkileri yönet
  const permissions = useMemo(() => ({
    canView: canViewProducts,
    canAdd: canAddProducts,
    canEdit: canEditProducts,
    canDelete: canDeleteProducts
  }), [canViewProducts, canAddProducts, canEditProducts, canDeleteProducts]);

  return {
    permissions
  };
};
