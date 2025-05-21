"use client";

import { useState, useEffect } from "react";
import { Permission } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { useStaffManagement } from "@/hooks/staff/useStaffManagement";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/utils/staff/permissions";
import { updateStaffPermissions } from "@/services/staffService";

interface PermissionsModalProps {
  staff: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (staffId: string, permissions: Permission[]) => Promise<void>;
}

// İzin grupları ve etiketleri utils/staff/permissions.ts dosyasından import edildi

export function PermissionsModal({
  staff,
  open,
  onOpenChange,
  onSave,
}: PermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<Permission>
  >(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Hook kullanımı - personel yönetim işlevlerini içerir
  const { 
    handlePermissionSelection, 
    handleTogglePermissionGroup,
    preparePermissionsForUI 
  } = useStaffManagement();

  useEffect(() => {
    if (staff?.permissions) {
      // Gerçek izinlerden UI için gerekli tüm izinleri (gerçek+sanal) oluştur
      const allPermissions = new Set(preparePermissionsForUI(staff.permissions));
      setSelectedPermissions(allPermissions);
    }
  }, [staff, preparePermissionsForUI]);

  const handleTogglePermission = (permission: Permission) => {
    // Merkezi izin yönetimi hook'unu kullanarak izinleri güncelle
    handlePermissionSelection(
      permission,
      Array.from(selectedPermissions),
      (updatedPermissions) => setSelectedPermissions(new Set(updatedPermissions as Permission[]))
    );
  };

  const handleToggleGroup = (permissions: readonly Permission[]) => {
    // Merkezi izin yönetimi hook'unu kullanarak grup izinlerini güncelle
    handleTogglePermissionGroup(
      permissions as Permission[],
      Array.from(selectedPermissions),
      (updatedPermissions) => setSelectedPermissions(new Set(updatedPermissions as Permission[]))
    );
  };

  // İzinleri güncelleme - merkezileştirilmiş staffService fonksiyonu ile
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // staffService'den updateStaffPermissionsService fonksiyonu ile izinleri güncelle
      await updateStaffPermissions(
        staff.id, 
        Array.from(selectedPermissions) as Permission[]
      );
      
      // Callback'i çağır (tablo güncellemesi için)
      await onSave(staff.id, Array.from(selectedPermissions) as Permission[]);
      
      onOpenChange(false);
      toast({
        title: "Başarılı",
        description: "Yetkiler başarıyla güncellendi",
        duration: 3000, 
      });
    } catch (error) {
      console.error("Yetki güncelleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Yetkiler güncellenirken bir hata oluştu",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{staff?.name} - Yetki Yönetimi</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto pr-4">
          {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
            <div key={group} className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={permissions.every((p) =>
                    selectedPermissions.has(p as Permission)
                  )}
                  onChange={() =>
                    handleToggleGroup(permissions as unknown as Permission[])
                  }
                  className="rounded border-gray-300"
                />
                <h3 className="font-semibold">{group}</h3>
              </div>

              <div className="ml-6 space-y-2">
                {permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(
                        permission as Permission
                      )}
                      onChange={() =>
                        handleTogglePermission(permission as Permission)
                      }
                      className="rounded border-gray-300"
                    />
                    <span>{PERMISSION_LABELS[permission as Permission]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
