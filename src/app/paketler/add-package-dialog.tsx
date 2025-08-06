
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
import { useState, type FormEvent, type ReactNode, useEffect } from "react";
import { performAddPackageAction } from "./actions";
import type { Service, Category } from "../hizmetler/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type ServicesByCategory = Record<string, Category & { services: Service[] }>;

interface AddPackageDialogProps {
  children: ReactNode;
  servicesByCategory: ServicesByCategory;
  onSuccess?: () => void;
}

export function AddPackageDialog({ children, servicesByCategory, onSuccess }: AddPackageDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleServiceToggle = (serviceId: string, categoryId: string) => {
    const currentCategory = selectedServices.length > 0
      ? servicesByCategory[Object.keys(servicesByCategory).find(catId => servicesByCategory[catId].services.some(s => s.id === selectedServices[0])) as string]?.id
      : null;

    if (currentCategory && currentCategory !== categoryId) {
      toast({
        title: "Uyarı",
        description: "Paketler sadece aynı kategori içindeki hizmetlerden oluşturulabilir.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };


  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.delete('serviceIds');
    selectedServices.forEach(id => formData.append('serviceIds', id));
    
    try {
      const result = await performAddPackageAction(formData);

      if (result.success) {
        toast({
          title: "Paket Oluşturuldu",
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
  
   useEffect(() => {
    if (open) {
      setSelectedServices([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Yeni Paket Oluştur</DialogTitle>
        <DialogDescription className="sr-only">Pakete dahil edilecek hizmetleri, seans sayısını ve fiyatı belirleyerek yeni bir paket oluşturun.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                            id="price"
                            name="price"
                            type="number"
                            placeholder="Paket Fiyatı"
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
                         <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                            id="sessionCount"
                            name="sessionCount"
                            type="number"
                            defaultValue={1}
                            placeholder="Seans Sayısı"
                            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-20"
                            required
                            disabled={isSubmitting}
                            min="1"
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                            Seans
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Pakete Dahil Hizmetler (Sadece bir kategoriden seçim yapabilirsiniz)</Label>
                    <ScrollArea className="h-64 w-full rounded-md border p-4 shadow-inner">
                         <Accordion type="multiple" className="w-full">
                            {Object.values(servicesByCategory).filter(cat => cat.services.length > 0).map((category) => (
                                <AccordionItem value={category.id} key={category.id}>
                                    <AccordionTrigger className="hover:no-underline">{category.name} ({category.services.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2 pt-2">
                                            {category.services.map(service => (
                                                 <div key={service.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50">
                                                    <Checkbox
                                                        id={`service-${service.id}`}
                                                        checked={selectedServices.includes(service.id)}
                                                        onCheckedChange={() => handleServiceToggle(service.id, category.id)}
                                                        disabled={isSubmitting}
                                                    />
                                                    <label
                                                        htmlFor={`service-${service.id}`}
                                                        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {service.name}
                                                        <span className="text-muted-foreground ml-2">({service.duration} dk - {formatCurrency(service.price)})</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </ScrollArea>
                </div>

            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || selectedServices.length === 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Oluşturuluyor..." : "Yeni Paketi Oluştur"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
