
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, type ReactNode, useEffect, useMemo } from "react";
import { performAddProductAction, performUpdateProductAction, type Product } from "./actions";

interface ProductDialogProps {
  children: ReactNode;
  product?: Product;
  onSuccess?: () => void;
}

export function ProductDialog({ children, product, onSuccess }: ProductDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = product !== undefined;

  const [name, setName] = useState(product?.name || "");
  const [notes, setNotes] = useState(product?.notes || "");

  useEffect(() => {
    if (open) {
      setName(product?.name || "");
      setNotes(product?.notes || "");
    }
  }, [open, product]);

  const isDirty = useMemo(() => {
    if (!isEditMode) return true; // Add mode is always "dirty"
    return name !== product?.name || notes !== product?.notes;
  }, [name, notes, product, isEditMode]);


  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    if(isEditMode) {
        formData.append('id', product.id);
    }
    
    const action = isEditMode ? performUpdateProductAction : performAddProductAction;

    try {
      const result = await action(formData);

      if (result.success) {
        toast({
          title: isEditMode ? "Ürün Güncellendi" : "Ürün Eklendi",
          description: result.message,
        });
        onSuccess?.();
        setOpen(false);
      } else {
        toast({
          title: "Hata",
          description: result.message || "Bir hata oluştu.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Beklenmedik bir sunucu hatası oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">{isEditMode ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
        <DialogDescription className="sr-only">{isEditMode ? 'Ürün bilgilerini güncelleyin.' : 'Yeni bir ürün eklemek için formu doldurun.'}</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                     <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ürün Adı"
                            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring h-10">
                         <Input
                            id="notes"
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notlar..."
                            className="w-full h-full border-0 bg-card focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 pr-3 text-sm placeholder:text-muted-foreground font-bold text-destructive"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yeni Ürünü Ekle")}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
