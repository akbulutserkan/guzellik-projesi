
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
import { useState, type FormEvent, type ReactNode } from "react";
import { addCategoryAction } from "./actions";

interface CategoryDialogProps {
  children: ReactNode;
}

export function CategoryDialog({ children }: CategoryDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await addCategoryAction(formData);

      if (result.success) {
        toast({
          title: "Kategori Eklendi",
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
        <DialogTitle className="sr-only">Yeni Kategori Ekle</DialogTitle>
        <DialogDescription className="sr-only">Hizmetlerinizi gruplamak için yeni bir kategori oluşturun.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="px-6 pb-8 pt-8 space-y-4">
                <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                    <Input
                        id="name"
                        name="name"
                        placeholder="Yeni Kategori Adı"
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full"
                        required
                        disabled={isSubmitting}
                    />
                </div>
            </div>
             <DialogFooter className="px-6 py-4 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Ekleniyor..." : "Yeni Kategoriyi Ekle"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
