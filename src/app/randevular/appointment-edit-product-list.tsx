
"use client";

import { useMemo, useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import type { SaleLine } from "./appointment-edit-dialog";
import type { Personel } from "../personeller/actions";
import { Product as SaleableProduct } from "../urun-satislar/actions";
import { getProductDetailsAction } from "../urunler/actions";

interface AppointmentEditProductListProps {
  saleLines: SaleLine[];
  setSaleLines: React.Dispatch<React.SetStateAction<SaleLine[]>>;
  products: SaleableProduct[];
  personnelList: Personel[];
  isSubmitting: boolean;
  isDeleting: boolean;
}

export function AppointmentEditProductList({
  saleLines,
  setSaleLines,
  products,
  personnelList,
  isSubmitting,
  isDeleting,
}: AppointmentEditProductListProps) {
  
  const productOptions = useMemo(() => 
    products.map(p => ({ value: p.id, label: `${p.name} (Stok: ${p.stock})`})), 
  [products]);

  const personnelOptions = useMemo(() => personnelList.map(p => ({ value: p.id, label: p.fullName })), [personnelList]);

  const updateSaleLine = (index: number, field: keyof Omit<SaleLine, 'id' | 'productDetails' | 'name'>, value: string | number) => {
    const newLines = [...saleLines];
    const lineToUpdate = newLines[index];
    if (!lineToUpdate) return;
  
    (lineToUpdate as any)[field] = value;
  
    if (field === 'productId') {
      getProductDetailsAction(value as string).then(details => {
        setSaleLines(prevLines => {
          const updatedLines = [...prevLines];
          const currentLine = updatedLines[index];
          if (currentLine) {
            currentLine.productDetails = details;
            const selectedProduct = products.find(p => p.id === value);
            currentLine.name = selectedProduct?.name || "";
            if (details) {
              currentLine.quantity = 1;
              currentLine.totalAmount = details.sellingPrice;
            } else {
              currentLine.totalAmount = 0;
            }
          }
          return updatedLines;
        });
      });
    } else if (field === 'quantity' && lineToUpdate.productDetails) {
      const quantity = Number(value) || 0;
      lineToUpdate.totalAmount = quantity * lineToUpdate.productDetails.sellingPrice;
    }
  
    setSaleLines(newLines);
  };

  const removeSaleLine = (index: number) => {
    const updatedLines = saleLines.filter((_, i) => i !== index);
    setSaleLines(updatedLines);
  };

  return (
    <div className="space-y-2">
      {saleLines.map((line, index) => (
        <div key={line.id} className="p-1 border rounded-md mt-2">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-6">
              <Combobox
                options={productOptions}
                value={line.productId}
                onChange={(value) => updateSaleLine(index, 'productId', value)}
                placeholder="Ürün seçin..."
                searchPlaceholder="Ürün ara..."
                disabled={isSubmitting || isDeleting}
              />
            </div>
            <div className="col-span-2">
              <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-card h-10">
                <Input
                  type="number"
                  value={line.quantity}
                  onChange={(e) => updateSaleLine(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                  disabled={isSubmitting || isDeleting || !line.productId}
                  min="1"
                  max={line.productDetails?.stock}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground pointer-events-none">
                  Adet
                </span>
              </div>
            </div>
            <div className="col-span-3">
              <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-card h-10">
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  value={line.totalAmount}
                  onChange={(e) => updateSaleLine(index, 'totalAmount', parseFloat(e.target.value) || 0)}
                  placeholder="Tutar"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-8"
                  step="0.01"
                  min="0"
                  required
                  disabled={isSubmitting || isDeleting || !line.productId}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                  ₺
                </span>
              </div>
            </div>
            <div className="col-span-1 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" disabled={isSubmitting || isDeleting}>
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bu Ürün Satışını Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem geri alınamaz. Bu ürün satışı randevudan kaldırılacaktır.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeSaleLine(index)}>Evet, Sil</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <Combobox
            options={personnelOptions}
            value={line.personnelId}
            onChange={(value) => updateSaleLine(index, 'personnelId', value)}
            placeholder="Satışı yapan personeli seçin..."
            searchPlaceholder="Personel ara..."
            disabled={isSubmitting || isDeleting || !line.productId}
          />
        </div>
      ))}
    </div>
  );
}
