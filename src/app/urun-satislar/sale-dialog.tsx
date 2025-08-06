
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
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { performRecordSaleAction, type Product } from "./actions";
import { getProductDetailsAction } from "../urunler/actions";
import type { Customer } from "../musteriler/actions";
import type { Personel } from "../personeller/actions";
import { formatPhoneNumber } from "@/lib/utils";

interface SaleDialogProps {
  children: ReactNode;
  products: Product[];
  customers: Customer[];
  personel: Personel[];
  onSuccess?: () => void;
}

export function SaleDialog({ children, products, customers, personel, onSuccess }: SaleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [productDetails, setProductDetails] = useState<{ stock: number, sellingPrice: number } | null>(null);

  const customerOptions = customers.map(c => ({ value: c.id, label: `${c.fullName} (${formatPhoneNumber(c.phone)})` }));
  const personnelOptions = personel.map(p => ({ value: p.id, label: p.fullName }));
  const productOptions = products
    .filter(p => p.stock > 0)
    .map(p => ({ value: p.id, label: `${p.name} (Stok: ${p.stock})`}));


  useEffect(() => {
    const fetchProductDetails = async () => {
        if (selectedProductId) {
            const details = await getProductDetailsAction(selectedProductId);
            setProductDetails(details);
        } else {
            setProductDetails(null);
        }
    };
    fetchProductDetails();
  }, [selectedProductId]);

  useEffect(() => {
    if (productDetails) {
      setTotalAmount(productDetails.sellingPrice * quantity);
    } else {
      setTotalAmount(0);
    }
  }, [quantity, productDetails]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("productId", selectedProductId);
    formData.set("customerId", selectedCustomerId);
    formData.set("personnelId", selectedPersonnelId);
    
    try {
      const result = await performRecordSaleAction(formData);

      if (result.success) {
        toast({
          title: "Satış Kaydedildi",
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
  
  const resetDialog = () => {
    setSelectedProductId("");
    setSelectedCustomerId("");
    setSelectedPersonnelId("");
    setQuantity(1);
    setTotalAmount(0);
    setProductDetails(null);
    setIsSubmitting(false);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
        resetDialog();
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Yeni Ürün Satışı</DialogTitle>
        <DialogDescription className="sr-only">Yeni bir ürün satışı kaydetmek için formu doldurun.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                     <div className="space-y-2">
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
                    <div className="space-y-2">
                         <Combobox
                            options={productOptions}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                            placeholder="Ürün seçin veya arayın..."
                            searchPlaceholder="Ürün ara..."
                            noResultsText="Ürün bulunamadı."
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    placeholder="Miktar"
                                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                                    required
                                    disabled={isSubmitting || !selectedProductId}
                                    min="1"
                                    max={productDetails?.stock}
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                                    Adet
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                 <Input
                                    id="totalAmount"
                                    name="totalAmount"
                                    type="number"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                                    placeholder="Toplam Tutar"
                                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                                    step="0.01"
                                    min="0"
                                    required
                                    disabled={isSubmitting || !selectedProductId}
                                />
                                 <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                                ₺
                                </span>
                            </div>
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
                <Button type="submit" disabled={isSubmitting || !selectedProductId || !selectedPersonnelId || !selectedCustomerId} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Kaydediliyor..." : "Yeni Ürün Satışını Kaydet"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
