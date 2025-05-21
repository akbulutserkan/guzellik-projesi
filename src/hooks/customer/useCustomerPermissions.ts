'use client';

import { usePermission } from '@/lib/auth';

export interface UseCustomerPermissionsResult {
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * Müşteri izinleri hook'u
 */
export const useCustomerPermissions = (): UseCustomerPermissionsResult => {
  // İzinleri kontrol et
  const canView = usePermission('VIEW_CUSTOMERS');
  const canAdd = usePermission('ADD_CUSTOMERS');
  const canEdit = usePermission('EDIT_CUSTOMERS');
  const canDelete = usePermission('DELETE_CUSTOMERS');
  
  // İzinleri objesi
  const permissions = {
    canView,
    canAdd,
    canEdit,
    canDelete
  };

  return {
    permissions
  };
};
