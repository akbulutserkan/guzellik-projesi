/**
 * Hizmet izinlerinin yönetiminden sorumlu hook.
 */
import { usePermissions } from '@/hooks/permissions/usePermissions';
import { useSession } from 'next-auth/react';

/**
 * Hizmet izinleri hook'u
 */
export const useServicePermissions = () => {
  const { data: session } = useSession();
  
  const {
    canViewServices,
    canAddService,
    canEditService,
    canDeleteService,
    canAddServiceCategory,
    canEditServiceCategory,
    canDeleteServiceCategory
  } = usePermissions();
  
  // UI için kullanılan yardımcı izinler
  const canAdd = canAddService;
  const canEdit = canEditService;
  const canDelete = canDeleteService;
  
  // Kategori yönetimi için yetki kontrolü
  const canManageServiceCategories = canAddServiceCategory || canEditServiceCategory || canDeleteServiceCategory;
  
  return {
    // Hizmet izinleri
    canViewServices,
    canAddService,
    canEditService,
    canDeleteService,
    
    // Kategori izinleri
    canAddServiceCategory,
    canEditServiceCategory, 
    canDeleteServiceCategory,
    canManageServiceCategories,
    
    // Genel izin kontrolü fonksiyonları
    canCreateService: canAddService,
    canUpdateService: canEditService,
    
    // UI için kısa izin isimleri
    canView: canViewServices,
    canAdd: canAddService,
    canEdit: canEditService,
    canDelete: canDeleteService,
    
    // Yardımcı fonksiyonlar
    hasAnyServicePermission: canViewServices || canAddService || canEditService || canDeleteService,
    hasAnyCategoryPermission: canManageServiceCategories
  };
};

export default useServicePermissions;