'use client';

import { useMemo } from 'react';
import { usePermissions } from '@/hooks/permissions/usePermissions';
import { Permission } from '@prisma/client';

/**
 * Hook for managing appointment permissions
 * Centralizes all permission-related logic for appointments
 */
export const useAppointmentPermissions = () => {
  const { 
    hasPermission, 
    isAdmin,
    canViewAppointments: baseCanViewAppointments, 
    canEditAppointments: baseCanEditAppointments, 
    canDeleteAppointments: baseCanDeleteAppointments 
  } = usePermissions();
  
  // Randevu görüntüleme yetkisi
  const canViewAppointments = useMemo(() => {
    return baseCanViewAppointments;
  }, [baseCanViewAppointments]);
  
  // Randevu ekleme için yetki
  const canAddAppointments = useMemo(() => {
    return isAdmin || hasPermission(Permission.EDIT_APPOINTMENTS);
  }, [isAdmin, hasPermission]);
  
  // Randevu düzenleme yetkisi
  const canEditAppointments = useMemo(() => {
    return baseCanEditAppointments;
  }, [baseCanEditAppointments]);
  
  // Randevu silme yetkisi
  const canDeleteAppointments = useMemo(() => {
    return baseCanDeleteAppointments;
  }, [baseCanDeleteAppointments]);
  
  // Randevu durumunu değiştirme yetkisi
  const canChangeAppointmentStatus = useMemo(() => {
    return isAdmin || hasPermission(Permission.EDIT_APPOINTMENTS);
  }, [isAdmin, hasPermission]);
  
  // Randevu notlarını değiştirme yetkisi
  const canEditAppointmentNotes = useMemo(() => {
    return isAdmin || hasPermission(Permission.EDIT_APPOINTMENTS);
  }, [isAdmin, hasPermission]);
  
  // Tüm yetkileri döndür
  return {
    canViewAppointments,
    canAddAppointments,
    canEditAppointments,
    canDeleteAppointments,
    canChangeAppointmentStatus,
    canEditAppointmentNotes,
    isAdmin
  };
};

export default useAppointmentPermissions;