'use client';

import { useMemo } from 'react';
import { usePermissions } from '@/hooks/permissions/usePermissions';

export interface UsePackagePermissionsResult {
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * Paket izinlerini yöneten hook
 */
export const usePackagePermissions = (): UsePackagePermissionsResult => {
  const {
    canViewPackages,
    canAddPackages,
    canEditPackages,
    canDeletePackages
  } = usePermissions();
  
  // Yetkilendirme durumlarını tek bir nesnede topla
  const permissions = useMemo(() => ({
    canView: canViewPackages,
    canAdd: canAddPackages,
    canEdit: canEditPackages,
    canDelete: canDeletePackages
  }), [canViewPackages, canAddPackages, canEditPackages, canDeletePackages]);

  return {
    permissions
  };
};
