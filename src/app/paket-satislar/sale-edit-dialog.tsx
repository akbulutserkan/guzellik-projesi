
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { performUpdatePackageSaleAction, type PackageSale } from "./actions";
import type { Customer } from "../musteriler/actions";
import type { Personel } from "../personeller/actions";
import type { Package } from "../paketler/actions";
import { formatPhoneNumber } from "@/lib/utils";
import { SingleDatePicker } from "@/components/ui/single-date-picker";

interface SaleEditDialogProps {
  children?: ReactNode; // Make children optional as it's not used when opening programmatically
  sale: PackageSale;
  customers: Customer[];
  personel: Personel[];
  packages: Package[];
  onSuccess?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleEditDialog({ 
    sale, 
    customers, 
    personel, 
    packages,
    onSuccess, 
    isOpen, 
    onOpenChange 
}: SaleEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedPackageId, setSelectedPackageId] = useState(sale.packageId);
  const [selectedCustomerId, setSelectedCustomerId] = useState(sale.customerId);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState(sale.personnelId);
  const [price, setPrice] = useState(sale.price);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date(sale.saleDate));


  useEffect(() => {
    if (isOpen) {
      setSelectedPackageId(sale.packageId);
      setSelectedCustomerId(sale.customerId);
      setSelectedPersonnelId(sale.personnelId);
      setPrice(sale.price);
      setSaleDate(new Date(sale.saleDate));
    }
  }, [isOpen, sale]);
  
  // Sadece paket değiştiğinde fiyatı otomatik güncelle
  useEffect(() => {
    if (selectedPackageId !== sale.packageId) {
      const selectedPkg = packages.find(p => p.id === selectedPackageId);
      setPrice(selectedPkg?.price || 0);
    }
  }, [selectedPackageId, packages, sale.packageId]);

  const isDirty = useMemo(() => {
    const originalSaleDate = new Date(sale.saleDate).toISOString().split('T')[0];
    const newSaleDate = saleDate ? new Date(saleDate).toISOString().split('T')[0] : '';
    
    return (
      selectedPackageId !== sale.packageId ||
      selectedCustomerId !== sale.customerId ||
      selectedPersonnelId !== sale.personnelId ||
      price !== sale.price ||
      originalSaleDate !== newSaleDate
    );
  }, [selectedPackageId, selectedCustomerId, selectedPersonnelId, price, saleDate, sale]);


  const customerOptions = customers.map(c => ({ value: c.id, label: `${c.fullName} (${formatPhoneNumber(c.phone)})` }));
  const personnelOptions = personel.map(p => ({ value: p.id, label: p.fullName }));
  const packageOptions = packages.map(p => ({ value: p.id, label: p.name }));

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.append("id", sale.id);
    formData.set("packageId", selectedPackageId);
    formData.set("customerId", selectedCustomerId);
    formData.set("personnelId", selectedPersonnelId);
    if (saleDate) {
        formData.set("saleDate", saleDate.toISOString());
    }
    
    try {
      const result = await performUpdatePackageSaleAction(formData);

      if (result.success) {
        toast({
          title: "Paket Satışı Güncellendi",
          description: result.message,
        });
        onSuccess?.();
        onOpenChange(false);
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Paket Satışını Düzenle</DialogTitle>
        <DialogDescription className="sr-only">Paket satışı bilgilerini güncelleyin.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Combobox
                                options={customerOptions}
                                value={selectedCustomerId}
                                onChange={setSelectedCustomerId}
                                placeholder="Müşteri seçin..."
                                searchPlaceholder="Müşteri ara..."
                                noResultsText="Müşteri bulunamadı."
                                disabled={isSubmitting}
                            />
                        </div>
                         <SingleDatePicker date={saleDate} onDateChange={setSaleDate} disabled={isSubmitting} />
                    </div>
                     <div className="space-y-2">
                        <Combobox
                            options={packageOptions}
                            value={selectedPackageId}
                            onChange={setSelectedPackageId}
                            placeholder="Paket seçin..."
                            searchPlaceholder="Paket ara..."
                            noResultsText="Paket bulunamadı."
                            disabled={isSubmitting}
                        />
                    </div>
                     <div className="space-y-2">
                        <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                            id="price"
                            name="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            placeholder="Satış Fiyatı"
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
                        <Combobox
                            options={personnelOptions}
                            value={selectedPersonnelId}
                            onChange={setSelectedPersonnelId}
                            placeholder="Satışı yapan personeli seçin..."
                            searchPlaceholder="Personel ara..."
                            noResultsText="Personel bulunamadı."
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    
