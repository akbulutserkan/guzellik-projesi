
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, type ReactNode } from "react";
import { performDeleteSaleAction } from "./actions";

interface DeleteSaleDialogProps {
  children: ReactNode;
  saleId: string;
  onSuccess?: () => void;
}

export function DeleteSaleDialog({ children, saleId, onSuccess }: DeleteSaleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await performDeleteSaleAction(saleId);
      if (result.success) {
        toast({
          title: "Başarılı",
          description: result.message,
        });
        onSuccess?.();
        setOpen(false);
      } else {
        toast({
          title: "Hata",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Satışı İptal Etmek İstediğinize Emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Bu satış kaydını kalıcı olarak silecek ve ürün stoğunu iade edecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
            {isSubmitting ? "İptal Ediliyor..." : "Evet, İptal Et"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
