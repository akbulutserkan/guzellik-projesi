"use client";

import { useState } from 'react';
import { DialogWithoutPrevent, DialogWithoutPreventContent } from '@/components/ui/dialog-without-prevent';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useServiceManagement } from '@/hooks/service';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  serviceCount: number;
}

export default function DeleteCategoryModal({ isOpen, onClose, categoryId, categoryName, serviceCount }: DeleteCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const { deleteCategory } = useServiceManagement();
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      console.log(`Kategori silme işlemi başlatılıyor: ${categoryId} - ${categoryName}`);
      
      const result = await deleteCategory(categoryId);
      console.log('Kategori silme sonucu:', result);
      
      if (result) {
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla silindi",
        });
        onClose();
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kategori silinirken bir hata oluştu",
        });
      }
    } catch (error) {
      console.error("Kategori silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori silinirken bir hata oluştu",
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
          <span className="font-medium">{categoryName}</span> kategorisini silmek istediğinize emin misiniz?
          {serviceCount > 0 ? (
            <p className="mt-2 text-red-500">
              Bu kategoriye ait {serviceCount} hizmet bulunmaktadır. Önce bu hizmetleri silmelisiniz.
            </p>
          ) : (
            <p className="mt-2">
              Bu işlem geri alınamaz.
            </p>
          )}
        </div>
        <Button 
          onClick={handleConfirmDelete}
          className="bg-red-500 hover:bg-red-600 w-full mx-auto mt-6 shadow-md hover:shadow-lg"
          disabled={loading || serviceCount > 0}
        >
          {loading ? "Siliniyor..." : "Sil"}
        </Button>
      </DialogWithoutPreventContent>
    </DialogWithoutPrevent>
  );
}
