
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, type ReactNode } from "react";
import { getStockEntriesAction, type Product, type StockEntry } from "./actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { StockEntryEditDialog } from "./stock-entry-edit-dialog";
import { StockEntryDeleteDialog } from "./stock-entry-delete-dialog";
import { formatCurrency } from "@/lib/utils";

interface StockHistoryDialogProps {
  children: ReactNode;
  product: Product;
  onProductUpdate?: () => void;
}

export function StockHistoryDialog({ children, product, onProductUpdate }: StockHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    const entries = await getStockEntriesAction(product.id);
    setHistory(entries);
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, product.id]);

  const handleSuccess = () => {
    fetchHistory(); // Stok geçmişi listesini yenile
    onProductUpdate?.(); // Ana ürün listesini (toplam stok vb.) yenile
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Stok Geçmişi: {product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.name} ürününe ait tüm stok giriş ve çıkış geçmişi.</DialogDescription>
        <div className="flex-grow overflow-y-auto px-6 py-8">
          <div className="rounded-lg border shadow-sm bg-muted/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ALIM TARİHİ</TableHead>
                  <TableHead>ALIŞ FİYATI</TableHead>
                  <TableHead>SATIŞ FİYATI</TableHead>
                  <TableHead>ALINAN ADET</TableHead>
                  <TableHead className="text-right w-[100px]">İŞLEMLER</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : history.length > 0 ? (
                  history.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/60">
                      <TableCell>
                        {format(entry.purchaseDate, "dd MMMM yyyy", { locale: tr })}
                      </TableCell>
                      <TableCell>{formatCurrency(entry.purchasePrice)}</TableCell>
                      <TableCell>{formatCurrency(entry.sellingPrice)}</TableCell>
                      <TableCell>{entry.initialQuantity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <StockEntryEditDialog 
                             product={product} 
                             stockEntry={entry} 
                             onSuccess={handleSuccess}
                           >
                            <Button variant="ghost" size="icon" title="Düzenle">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </StockEntryEditDialog>
                          <StockEntryDeleteDialog 
                            productId={product.id} 
                            stockEntryId={entry.id}
                            onSuccess={handleSuccess}
                          >
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Sil">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </StockEntryDeleteDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Bu ürün için stok geçmişi bulunmuyor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
