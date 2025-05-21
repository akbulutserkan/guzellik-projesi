'use client';

import { Permission } from '@prisma/client';
import { useStaffData } from './useStaffData';
import { useStaffPermissions } from './useStaffPermissions';
import { useStaffWorkingHours } from './useStaffWorkingHours';

interface UseStaffManagementProps {
  initialStaff?: any[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

/**
 * Personel yönetimi ana hook'u
 * Alt hook'ları birleştirerek tek bir API arayüzü sunar
 */
export function useStaffManagement({
  initialStaff = [],
  autoFetch = true,
  showToasts = true
}: UseStaffManagementProps = {}) {
  // Alt hook'ları kullan
  const {
    staff,
    loading,
    error,
    fetchStaff
  } = useStaffData({
    initialStaff,
    autoFetch,
    showToasts
  });
  
  const {
    updatePermissions,
    syncPermissionsWithRole,
    handlePermissionSelection,
    handleTogglePermissionGroup,
    preparePermissionsForUI
  } = useStaffPermissions();
  
  const {
    validateStaffWorkingHours
  } = useStaffWorkingHours();
  
  // Personel izinlerini güncelle ve sonrasında listeyi yenile
  const handleUpdatePermissions = async (
    staffId: string, 
    permissions: Permission[],
    onSuccess?: () => void
  ) => {
    const result = await updatePermissions(staffId, permissions, () => {
      // Başarılı olduğunda listeyi güncelle
      fetchStaff();
      // Callback'i çağır
      if (onSuccess) onSuccess();
    });
    
    return result;
  };

  return {
    // Veri durumu
    staff,
    loading,
    error,
    
    // Veri işlemleri
    fetchStaff,
    
    // İzin işlemleri
    handleUpdatePermissions,
    syncPermissionsWithRole,
    handlePermissionSelection,
    handleTogglePermissionGroup,
    preparePermissionsForUI,
    
    // Çalışma saatleri işlemleri
    validateStaffWorkingHours
  };
}

export default useStaffManagement;