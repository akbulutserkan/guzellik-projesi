
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, type ReactNode, useEffect, useMemo } from "react";
import { updateCategoryAction, type Category } from "./actions";

interface CategoryEditDialogProps {
  children: ReactNode;
  category: Category;
}

export function CategoryEditDialog({ children, category }: CategoryEditDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(category.name);

  useEffect(() => {
    if (open) {
      setName(category.name);
    }
  }, [open, category.name]);

  const isDirty = useMemo(() => name !== category.name, [name, category.name]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.append('id', category.id);
    
    try {
      const result = await updateCategoryAction(formData);

      if (result.success) {
        toast({
          title: "Kategori Güncellendi",
          description: result.message,
        });
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
      <DialogContent className="sm:max-w-md bg-card p-0 rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Kategoriyi Düzenle</DialogTitle>
        <DialogDescription className="sr-only">Kategori adını güncelleyin.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="px-6 pb-8 pt-8 space-y-4">
                <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                    <Input
                        id="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Kategori Adı"
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full"
                        required
                        disabled={isSubmitting}
                    />
                </div>
            </div>
             <DialogFooter className="px-6 py-4 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
