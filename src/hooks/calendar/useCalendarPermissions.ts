'use client';

import { useMemo } from 'react';
import { Permission } from '@prisma/client';
import { usePermissions } from '@/hooks/permissions/usePermissions';

export interface UseCalendarPermissionsResult {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Takvim izinlerini yöneten hook
 */
export const useCalendarPermissions = (): UseCalendarPermissionsResult => {
  const { hasPermission, isAdmin } = usePermissions();
  
  // Yetki kontrolleri
  // ADD_APPOINTMENTS izni olmadığından EDIT_APPOINTMENTS izni kullanıyoruz
  const canCreate = useMemo(() => 
    isAdmin || hasPermission(Permission.EDIT_APPOINTMENTS), 
    [isAdmin, hasPermission]
  );
  
  const canUpdate = useMemo(() => 
    isAdmin || hasPermission(Permission.EDIT_APPOINTMENTS), 
    [isAdmin, hasPermission]
  );
  
  const canDelete = useMemo(() => 
    isAdmin || hasPermission(Permission.DELETE_APPOINTMENTS), 
    [isAdmin, hasPermission]
  );

  return {
    canCreate,
    canUpdate,
    canDelete
  };
};
