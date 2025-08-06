
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
import { performUpdateStockEntryAction, type Product, type StockEntry } from "./actions";
import { SingleDatePicker } from "@/components/ui/single-date-picker";


interface StockEntryEditDialogProps {
  children: ReactNode;
  product: Product;
  stockEntry: StockEntry;
  onSuccess?: () => void;
}

export function StockEntryEditDialog({ children, product, stockEntry, onSuccess }: StockEntryEditDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(stockEntry.purchaseDate);


  useEffect(() => {
    if (open) {
      setPurchaseDate(stockEntry.purchaseDate);
    }
  }, [open, stockEntry.purchaseDate]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.append('productId', product.id);
    formData.append('stockEntryId', stockEntry.id);
    if (purchaseDate) {
        formData.set('purchaseDate', purchaseDate.toISOString());
    } else {
        toast({ title: "Hata", description: "Lütfen alım tarihi seçin.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const result = await performUpdateStockEntryAction(formData);

      if (result.success) {
        toast({
          title: "Stok Güncellendi",
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
        <DialogTitle className="sr-only">Stok Girişini Düzenle</DialogTitle>
        <DialogDescription className="sr-only">{product.name} ürünü için stok girişini düzenleyin.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                        <Input
                        id="purchasePrice"
                        name="purchasePrice"
                        type="number"
                        defaultValue={stockEntry.purchasePrice}
                        placeholder="Alış Fiyatı"
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
                            id="sellingPrice"
                            name="sellingPrice"
                            type="number"
                            defaultValue={stockEntry.sellingPrice}
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
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            defaultValue={stockEntry.initialQuantity}
                            placeholder="Adet"
                            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                            required
                            disabled={isSubmitting}
                            step="1"
                            min="0"
                        />
                         <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                            adet
                        </span>
                    </div>
                    <SingleDatePicker date={purchaseDate} onDateChange={setPurchaseDate} disabled={isSubmitting} />
                </div>
            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Güncelleniyor..." : "Stok Girişini Kaydet"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    
