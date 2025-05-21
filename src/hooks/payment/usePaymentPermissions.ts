'use client';

import { usePermissions } from '@/hooks/permissions/usePermissions';

export interface UsePaymentPermissionsResult {
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * Tahsilat izinlerini yöneten hook
 */
export const usePaymentPermissions = (): UsePaymentPermissionsResult => {
  // usePermissions hook'unu çağır
  const permissions = usePermissions();
  
  // Mevcut izinleri al
  const canViewPayments = permissions.canViewPayments;
  const canEditPayments = permissions.canEditPayments;
  const canDeletePayments = permissions.canDeletePayments;
  
  // canAddPayments, canEditPayments ile aynı olsun (ekleme izni yoksa düzenleme de olmasın)
  const canAddPayments = canEditPayments;
  
  return {
    permissions: {
      canView: canViewPayments,
      canAdd: canAddPayments,
      canEdit: canEditPayments,
      canDelete: canDeletePayments
    }
  };
};
