import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil, Shield, Trash2 } from "lucide-react"; // Edit yerine Pencil'i import et
import { PermissionsModal } from "./PermissionsModal"; // Doğru import yolu
import { useState } from "react";
import { Staff } from "@prisma/client"; // Tip tanımının olduğu dosya (örnek)
import { toast } from "@/components/ui/use-toast";
import { getStaffById, deleteStaff, updateStaffPermissions } from '@/services/staffService';

// Personel + servislerle genişletilmiş tip
interface StaffWithServices extends Staff {
  services?: any[];
}

interface StaffTableProps {
  data: Staff[]; // Tip any yerine Staff[]
  isLoading: boolean;
  onUpdate: () => Promise<void>;  // onUpdate artık async
  onEdit: (staff: Staff) => void; // Tip any yerine Staff
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function StaffTable({
  data,
  isLoading,
  onUpdate,
  onEdit,
  canEdit,
  canDelete,
}: StaffTableProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffWithServices | null>(null); // Tip any yerine StaffWithServices | null
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="w-full h-48" />;
  }

  const handleEdit = async (staff: Staff) => { // Tip any yerine Staff
    try {
      const result = await getStaffById(staff.id);
      
      console.log('Personel detayı yanıtı:', result);
      
      // API yanıtını kontrol et ve doğru şekilde işle
      let fullStaffData: StaffWithServices | null = null;
      if (result && typeof result === 'object') {
        if (result.success && result.data) {
          // Eğer { success: true, data: {...} } formatında ise
          fullStaffData = result.data;
          console.log('Personel detayı data içerisinde:', fullStaffData);
        } else {
          // Direkt personel verisi olarak döndüyse
          fullStaffData = result;
          console.log('Personel detayı direkt döndü:', fullStaffData);
        }
      }
      
      // Eğer veri yoksa mevcut personel bilgisini kullan
      if (!fullStaffData) {
        console.warn('Detaylı personel verisi alınamadı, mevcut veri kullanılıyor');
        fullStaffData = staff;
      }
      
      // Hizmetleri kontrol et
      if (fullStaffData && fullStaffData.services) {
        console.log('Personelin verdiği hizmetler:', fullStaffData.services);
      } else {
        console.warn('Personel hizmet bilgisi içermiyor');
      }
      
      // fullStaffData bu noktada kesinlikle bir Staff objesi olacak çünkü yoksa yukarıda staff değerini atıyoruz
      onEdit(fullStaffData as Staff);
    } catch (error) {
      console.error("Error fetching staff details:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel bilgileri alınırken bir hata oluştu.",
      });
    }
  };
    
  const handleDelete = async (staffId: string) => {
    try {
      const result = await deleteStaff(staffId);
      if (result.success) {
        await onUpdate(); // onUpdate'in kendisi async olduğu için await kullan
        toast({
          title: "Başarılı",
          description: "Personel başarıyla silindi."
        });
      } else {
        throw new Error(result.error || "Personel silinemedi");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Personel silinirken bir hata oluştu.",
      });
    }
  };

  const handlePermissions = (staff: Staff) => { // Tip any yerine Staff
    setSelectedStaff(staff);
    setPermissionsModalOpen(true);
  };

  const handleSavePermissions = async (
    staffId: string,
    permissions: string[]
  ) => {
    try {
      // Merkezi API ile izinleri güncelle
      const result = await updateStaffPermissions(staffId, permissions);
      
      if (!result.success) {
        throw new Error(result.error || "İzinler güncellenemedi");
      }
      
      // Başarılı işlem
      await onUpdate(); // onUpdate'in kendisi async olduğu için await kullan
      setPermissionsModalOpen(false);
      
      toast({
        title: "Başarılı",
        description: "İzinler başarıyla güncellendi"
      });
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "İzinler güncellenirken bir hata oluştu.",
      });
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="py-3 text-sm font-medium text-gray-700">Ad</TableHead>
            <TableHead className="py-3 text-sm font-medium text-gray-700">Hesap Tipi</TableHead>
            <TableHead className="py-3 text-sm font-medium text-gray-700">Telefon</TableHead>
            <TableHead className="py-3 text-sm font-medium text-gray-700">Hizmet Tipi</TableHead>
            <TableHead className="text-right py-3 text-sm font-medium text-gray-700">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(data) ? data.map((staff) => (
            <TableRow key={staff.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <TableCell className="font-medium py-3">{staff.name}</TableCell>
              <TableCell className="capitalize py-3">
                {getAccountTypeText(staff.accountType)}
              </TableCell>
              <TableCell className="py-3">{staff.phone}</TableCell>
              <TableCell className="capitalize py-3">
                {staff.serviceGender === "women"
                  ? "Kadınlar"
                  : staff.serviceGender === "men"
                  ? "Erkekler"
                  : "Unisex"}
              </TableCell>
              <TableCell className="flex justify-end gap-2 py-3">
                {/* İzinler butonu */}
                <button
                  onClick={() => handlePermissions(staff)}
                  className="text-blue-500 hover:text-blue-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
                  aria-label="İzinleri Düzenle"
                >
                  <Shield className="h-4 w-4" />
                </button>

                {/* Düzenle butonu (yetki kontrolü) */}
               {canEdit && (
                  <button
                    onClick={() => handleEdit(staff)}
                    className="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
                    aria-label="Personel Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {/* Sil butonu (yetki kontrolü) */}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(staff.id)}
                    className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
                    aria-label="Personel Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-gray-500">Personel verisi bulunamadı veya yüklenemedi</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PermissionsModal
        staff={selectedStaff}
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        onSave={handleSavePermissions}
      />
    </>
  );
}

const getAccountTypeText = (accountType: string) => {  //Bu fonksiyonu component dısına taşıdım
  switch (accountType) {
    case "STAFF":
      return "Personel";
    case "MANAGER":
      return "Yönetici";
    case "CASHIER":
      return "Vezne";
    default:
      return accountType;
  }
};