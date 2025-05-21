'use client';

import { useCallback } from 'react';
import { Permission } from '@prisma/client';
import { useToast } from '@/components/ui/use-toast';
import { preparePermissionsForUI } from '@/utils/staff/permissions';
import { updateStaffPermissions } from '@/services/staffService';

export function useStaffPermissions() {
  const { toast } = useToast();

  // Frontend kısmında İzinleri güncelle
  const updatePermissions = useCallback(async (
    staffId: string, 
    permissions: Permission[],
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) => {
    try {
      // API servisi ile izinleri güncelle
      await updateStaffPermissions(staffId, permissions);
      
      toast({
        title: 'Başarılı',
        description: 'İzinler başarıyla güncellendi'
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('İzin güncelleme hatası:', error);
      
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'İzinler güncellenirken bir hata oluştu'
      });
      
      if (onError) {
        onError(error);
      }
      
      return false;
    }
  }, [toast]);

  // Rol değişikliğinde izinleri güncelleme işlevi
  const handleAccountTypeChange = useCallback((role: string, currentPermissions: Permission[]) => {
    // ADMIN rolü tüm izinlere sahiptir
    if (role === 'ADMIN') {
      // Tüm izinler - burada sadece basit bir örnek
      return {
        valid: true,
        permissions: Object.values(Permission),
        message: 'Yönetici rolü tüm izinlere sahiptir'
      };
    }
    
    // STAFF rolü için temel izinler
    if (role === 'STAFF') {
      const basePermissions = [
        Permission.VIEW_APPOINTMENTS,
        Permission.VIEW_CUSTOMERS,
        Permission.VIEW_SERVICES
      ];
      
      return {
        valid: true,
        permissions: basePermissions,
        message: 'Personel rolü temel izinlere sahiptir'
      };
    }
    
    // Diğer roller için mevcut izinleri koru
    return {
      valid: true,
      permissions: currentPermissions,
      message: ''
    };
  }, []);
  
  // İzinleri rol değişikliğiyle uyumlu hale getir
  const syncPermissionsWithRole = useCallback((
    role: string,
    currentPermissions: Permission[],
    onPermissionsChange: (permissions: Permission[]) => void
  ) => {
    const result = handleAccountTypeChange(role, currentPermissions);
    
    if (result.valid) {
      onPermissionsChange(result.permissions);
    } else {
      toast({
        variant: 'destructive',
        title: 'İzin Uyumsuzluğu',
        description: result.message
      });
    }
  }, [toast, handleAccountTypeChange]);
  
  /**
   * İzinleri doğrulayalım
   */
  const validatePermissions = useCallback((permissions: Permission[]) => {
    if (!permissions || !Array.isArray(permissions)) {
      return {
        valid: false,
        message: 'Geçersiz izin formatı'
      };
    }
    
    // Ekleme/düzenleme izinleri için görüntüleme izninin var olup olmadığını kontrol et
    const viewPermissionMap = {
      ADD_PRODUCTS: "VIEW_PRODUCTS",
      EDIT_PRODUCTS: "VIEW_PRODUCTS",
      // Diğer izin eşleştirmeleri buraya eklenebilir
    };
    
    // Tümünü kontrol et
    let valid = true;
    let message = '';
    
    // Basit bir örnek doğrulama
    Object.entries(viewPermissionMap).forEach(([perm, requiredPerm]) => {
      if (
        permissions.includes(perm as Permission) && 
        !permissions.includes(requiredPerm as Permission)
      ) {
        valid = false;
        message = `${perm} izni için ${requiredPerm} izni gereklidir`;
      }
    });
    
    return { valid, message };
  }, []);


  // İzin seçimini işle - gerçek ve sanal izinleri düzgün işler
  const handlePermissionSelection = useCallback((
    permission: Permission,
    currentPermissions: Permission[],
    onPermissionsChange: (permissions: Permission[]) => void
  ) => {
    const permSet = new Set(currentPermissions);
    
    // İzin eşleştirmeleri (sanal --> gerçek)
    const virtualToRealMappings = {
      'VIEW_PACKAGE_PAYMENTS': 'VIEW_PAYMENTS',
      'EDIT_PACKAGE_PAYMENTS': 'EDIT_PAYMENTS',
      'DELETE_PACKAGE_PAYMENTS': 'DELETE_PAYMENTS',
      'VIEW_PRODUCT_PAYMENTS': 'VIEW_PAYMENTS',
      'EDIT_PRODUCT_PAYMENTS': 'EDIT_PAYMENTS',
      'DELETE_PRODUCT_PAYMENTS': 'DELETE_PAYMENTS'
    };
    
    // Bir izin sanal mı?
    const isVirtualPermission = permission in virtualToRealMappings;
    
    // İzini ekle veya çıkar
    if (permSet.has(permission)) {
      permSet.delete(permission);
      
      // Sanal izinse ve kaldırılıyorsa, karşılık gelen gerçek izni de kontrol et
      if (isVirtualPermission) {
        const realPermission = virtualToRealMappings[permission as keyof typeof virtualToRealMappings] as Permission;
        
        // Diğer sanal izinleri kontrol et - eğer tüm sanal izinler kaldırıldıysa gerçek izni de kaldır
        const shouldRemoveRealPermission = Object.entries(virtualToRealMappings)
          .filter(([vPerm, rPerm]) => rPerm === realPermission) // İlgili gerçek izinle ilişkili tüm sanal izinler
          .every(([vPerm]) => !permSet.has(vPerm as Permission)); // Hiçbiri seçili değilse
          
        if (shouldRemoveRealPermission) {
          permSet.delete(realPermission);
        }
      }
    } else {
      permSet.add(permission);
      
      // Sanal izinse ve ekleniyorsa, karşılık gelen gerçek izni de ekle
      if (isVirtualPermission) {
        const realPermission = virtualToRealMappings[permission as keyof typeof virtualToRealMappings] as Permission;
        permSet.add(realPermission);
      }
    }
    
    // Bağımlı izinleri kontrol et ve ekle
    const viewPermissionMap = {
      ADD_PRODUCTS: "VIEW_PRODUCTS",
      EDIT_PRODUCTS: "VIEW_PRODUCTS",
      DELETE_PRODUCTS: "VIEW_PRODUCTS",
      ADD_PRODUCT_SALES: "VIEW_PRODUCT_SALES",
      EDIT_PRODUCT_SALES: "VIEW_PRODUCT_SALES",
      DELETE_PRODUCT_SALES: "VIEW_PRODUCT_SALES",
      // Paket yetkileri için görüntüleme zorunluluğu
      ADD_PACKAGE_SALES: "VIEW_PACKAGE_SALES",
      EDIT_PACKAGE_SALES: "VIEW_PACKAGE_SALES",
      DELETE_PACKAGE_SALES: "VIEW_PACKAGE_SALES",
      // Ödeme izinleri
      EDIT_PACKAGE_PAYMENTS: "VIEW_PACKAGE_PAYMENTS",
      DELETE_PACKAGE_PAYMENTS: "VIEW_PACKAGE_PAYMENTS",
      EDIT_PRODUCT_PAYMENTS: "VIEW_PRODUCT_PAYMENTS",
      DELETE_PRODUCT_PAYMENTS: "VIEW_PRODUCT_PAYMENTS",
      // Diğer modüller için benzer eşleştirmeleri ekleyin
      ADD_SERVICES: "VIEW_SERVICES",
      EDIT_SERVICES: "VIEW_SERVICES",
      DELETE_SERVICES: "VIEW_SERVICES",
      ADD_SERVICE_CATEGORY: "VIEW_SERVICES",
      EDIT_SERVICE_CATEGORY: "VIEW_SERVICES",
      DELETE_SERVICE_CATEGORY: "VIEW_SERVICES",

      ADD_PACKAGES: "VIEW_PACKAGES",
      EDIT_PACKAGES: "VIEW_PACKAGES",
      DELETE_PACKAGES: "VIEW_PACKAGES",

      EDIT_APPOINTMENTS: "VIEW_APPOINTMENTS",
      DELETE_APPOINTMENTS: "VIEW_APPOINTMENTS",
      CANCEL_APPOINTMENTS: "VIEW_APPOINTMENTS",

      EDIT_CUSTOMERS: "VIEW_CUSTOMERS",
      DELETE_CUSTOMERS: "VIEW_CUSTOMERS",

      EDIT_STAFF: "VIEW_STAFF",
      DELETE_STAFF: "VIEW_STAFF",
    } as const;
    
    // Yeni eklenen izin görüntüleme gerektiriyorsa, görüntüleme iznini de ekle
    if (permission in viewPermissionMap && permSet.has(permission)) {
      permSet.add(
        viewPermissionMap[
          permission as keyof typeof viewPermissionMap
        ] as Permission
      );
    }
    
    onPermissionsChange(Array.from(permSet));
  }, []);

  // Gruba göre tüm izinleri ekle/kaldır
  const handleTogglePermissionGroup = useCallback((
    permissions: Permission[],
    currentPermissions: Permission[],
    onPermissionsChange: (permissions: Permission[]) => void
  ) => {
    const permSet = new Set(currentPermissions);
    const allSelected = permissions.every((p) => permSet.has(p));
    
    // İzin eşleştirmeleri (sanal --> gerçek)
    const virtualToRealMappings = {
      'VIEW_PACKAGE_PAYMENTS': 'VIEW_PAYMENTS',
      'EDIT_PACKAGE_PAYMENTS': 'EDIT_PAYMENTS',
      'DELETE_PACKAGE_PAYMENTS': 'DELETE_PAYMENTS',
      'VIEW_PRODUCT_PAYMENTS': 'VIEW_PAYMENTS',
      'EDIT_PRODUCT_PAYMENTS': 'EDIT_PAYMENTS',
      'DELETE_PRODUCT_PAYMENTS': 'DELETE_PAYMENTS'
    };
    
    // İzin grubunu toplu olarak değiştir
    permissions.forEach(permission => {
      if (allSelected) {
        permSet.delete(permission);
        
        // Sanal izin kaldırılıyorsa, gerçek izinleri kontrol et
        if (permission in virtualToRealMappings) {
          const realPermission = virtualToRealMappings[permission as keyof typeof virtualToRealMappings] as Permission;
          
          // Bu sanal izinle ilişkili tüm gerçek izinlerin kalıp kalmayacağını belirle
          const otherVirtualPermsForRealPerm = Object.entries(virtualToRealMappings)
            .filter(([vPerm, rPerm]) => rPerm === realPermission && vPerm !== permission)
            .map(([vPerm]) => vPerm as Permission);
          
          const shouldKeepRealPerm = otherVirtualPermsForRealPerm.some(vPerm => permSet.has(vPerm));
          
          if (!shouldKeepRealPerm) {
            permSet.delete(realPermission);
          }
        }
      } else {
        permSet.add(permission);
        
        // Sanal izin eklendiyse, gerçek izni de ekle
        if (permission in virtualToRealMappings) {
          const realPermission = virtualToRealMappings[permission as keyof typeof virtualToRealMappings] as Permission;
          permSet.add(realPermission);
        }
      }
    });
    
    onPermissionsChange(Array.from(permSet));
  }, []);

  return {
    updatePermissions,
    syncPermissionsWithRole,
    handlePermissionSelection,
    handleTogglePermissionGroup,
    preparePermissionsForUI
  };
}

export default useStaffPermissions;