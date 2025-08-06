
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, type ReactNode, useRef, useEffect } from "react";
import { performAddServiceAction, performUpdateServiceAction, type Service, type Category } from "./actions";

interface ServiceDialogProps {
  children: ReactNode;
  service?: Service;
  categories: Category[];
}

export function ServiceDialog({ children, service, categories }: ServiceDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = service !== undefined;
  const [selectedCategoryId, setSelectedCategoryId] = useState(service?.categoryId || "");

  // Form alanlarını temizlemek için ref'ler
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (!open) {
          // Modal kapandığında kategoriyi sıfırla
          setSelectedCategoryId(service?.categoryId || "");
      }
  }, [open, service]);


  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    if(isEditMode) {
        formData.append('id', service.id);
    }
    formData.set("categoryId", selectedCategoryId);
    
    const action = isEditMode ? performUpdateServiceAction : performAddServiceAction;

    try {
      const result = await action(formData);

      if (result.success) {
        toast({
          title: isEditMode ? "Hizmet Güncellendi" : "Hizmet Eklendi",
          description: result.message,
        });

        if (isEditMode) {
            setOpen(false);
        } else {
            // Sadece ekleme modunda formu sıfırla, kategoriyi koru
            if (nameInputRef.current) nameInputRef.current.value = "";
            if (priceInputRef.current) priceInputRef.current.value = "";
            if (durationInputRef.current) durationInputRef.current.value = "";
            nameInputRef.current?.focus();
        }
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
      <DialogContent className="sm:max-w-xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">{isEditMode ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}</DialogTitle>
        <DialogDescription className="sr-only">{isEditMode ? 'Hizmet bilgilerini güncelleyin.' : 'Yeni bir hizmet eklemek için formu doldurun.'}</DialogDescription>
        <form ref={formRef} onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-4">
                <div className="space-y-4">
                     <div className="space-y-2">
                         <Select
                            value={selectedCategoryId}
                            onValueChange={setSelectedCategoryId}
                            required
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="mt-1 h-10 rounded-md shadow-md focus:ring-2 focus:ring-ring bg-card">
                              <SelectValue placeholder="Kategori seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                    </div>
                     <div className="space-y-2">
                        <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                                ref={nameInputRef}
                                id="name"
                                name="name"
                                defaultValue={service?.name}
                                placeholder="Hizmet Adı"
                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                <Input
                                ref={priceInputRef}
                                id="price"
                                name="price"
                                type="number"
                                defaultValue={service?.price}
                                placeholder="Fiyat"
                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                                required
                                disabled={isSubmitting}
                                step="0.01"
                                min="0"
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                                ₺
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                <Input
                                    ref={durationInputRef}
                                    id="duration"
                                    name="duration"
                                    type="number"
                                    defaultValue={service?.duration}
                                    placeholder="Süre"
                                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-20"
                                    required
                                    disabled={isSubmitting}
                                    step="1"
                                    min="1"
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                                    Dakika
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || !selectedCategoryId} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yeni Hizmeti Ekle")}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
