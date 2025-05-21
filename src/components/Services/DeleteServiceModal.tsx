"use client";

import { useState } from 'react';
import { DialogWithoutPrevent, DialogWithoutPreventContent } from '@/components/ui/dialog-without-prevent';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useServiceManagement } from '@/hooks/service';

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
}

export default function DeleteServiceModal({ isOpen, onClose, serviceId, serviceName }: DeleteServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const { handleDeleteService } = useServiceManagement();
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      console.log("[SİLME-DETAY] DeleteServiceModal: Silme işlemi başlatılıyor. ServiceId:", serviceId);
      
      // Servisi akılll silme sistemiyle sil - ilişki yoksa hard delete, varsa soft delete
      const result = await handleDeleteService(serviceId);
      console.log("[SİLME-DETAY] DeleteServiceModal: Silme işlemi sonucu:", result);
      
      if (result) {
        console.log("[SİLME-DETAY] DeleteServiceModal: Silme işlemi başarılı");
        toast({
          title: "Başarılı",
          description: "Hizmet başarıyla kaldırıldı",
        });
        onClose();
      } else {
        console.log("[SİLME-DETAY] DeleteServiceModal: Silme işlemi başarısız");
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hizmet silinirken bir hata oluştu",
        });
      }
    } catch (error) {
      console.error("[SİLME-DETAY] DeleteServiceModal: Silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hizmet silinirken bir hata oluştu",
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
          <span className="font-medium">{serviceName}</span> hizmetini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
