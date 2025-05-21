"use client";

import { useState } from 'react';
import { DialogWithoutPrevent, DialogWithoutPreventContent } from '@/components/ui/dialog-without-prevent';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { usePackageManagement } from '@/hooks/package';

interface DeletePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
}

export default function DeletePackageModal({ isOpen, onClose, packageId, packageName }: DeletePackageModalProps) {
  const [loading, setLoading] = useState(false);
  const { operations: { handleDeletePackage } } = usePackageManagement();
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      console.log("[PAKET-SİLME] DeletePackageModal: Silme işlemi başlatılıyor. PackageId:", packageId);
      
      // Windows tarayıcı onayını atlayarak doğrudan paket silme işlemini yap
      // Paketi akıllı silme sistemiyle sil - ilişki yoksa hard delete, varsa soft delete
      const result = await handleDeletePackage(packageId, true); // true parametresi Windows onayını atlamak için
      console.log("[PAKET-SİLME] DeletePackageModal: Silme işlemi sonucu:", result);
      
      if (result) {
        console.log("[PAKET-SİLME] DeletePackageModal: Silme işlemi başarılı");
        toast({
          title: "Başarılı",
          description: "Paket başarıyla kaldırıldı",
        });
        onClose();
      } else {
        console.log("[PAKET-SİLME] DeletePackageModal: Silme işlemi başarısız");
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Paket silinirken bir hata oluştu",
        });
      }
    } catch (error) {
      console.error("[PAKET-SİLME] DeletePackageModal: Silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Paket silinirken bir hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWithoutPrevent 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogWithoutPreventContent className="px-8 py-6 bg-white rounded-lg shadow-2xl border-0 max-w-md mx-auto">
        <div className="py-4 text-center">
          <span className="font-medium">{packageName}</span> paketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </div>
        <Button 
          onClick={handleConfirmDelete}
          className="bg-red-500 hover:bg-red-600 w-full mx-auto mt-6 shadow-md hover:shadow-lg"
          disabled={loading}
        >
          {loading ? "Siliniyor..." : "Sil"}
        </Button>
      </DialogWithoutPreventContent>
    </DialogWithoutPrevent>
  );
}