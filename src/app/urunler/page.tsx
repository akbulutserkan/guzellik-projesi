
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, PackagePlus, History, Search } from "lucide-react";
import { getProductsAction, type Product } from "./actions";
import { ProductDialog } from "./product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import { AddStockDialog } from "./add-stock-dialog";
import { StockHistoryDialog } from "./stock-history-dialog";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export default function UrunlerPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    const products = await getProductsAction();
    setAllProducts(products);
    // Eğer arama terimi yoksa tüm ürünleri göster
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      // Arama terimi varsa filtrelemeyi yeniden uygula
      const lowercasedFilter = searchTerm.toLocaleLowerCase('tr-TR');
      const filtered = products.filter((product) =>
        product.name.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
        (product.notes && product.notes.toLocaleLowerCase('tr-TR').includes(lowercasedFilter))
      );
      setFilteredProducts(filtered);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setFilteredProducts(allProducts);
      return;
    }
    const lowercasedFilter = searchTerm.toLocaleLowerCase('tr-TR');
    const filtered = allProducts.filter((product) =>
      product.name.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
      (product.notes && product.notes.toLocaleLowerCase('tr-TR').includes(lowercasedFilter))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, allProducts]);


  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Ürünler
        </h1>
        <div className="flex-1 max-w-sm">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı veya notlarda ara..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
        <ProductDialog onSuccess={fetchProducts}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Ürün Ekle
          </Button>
        </ProductDialog>
      </div>

      <div className="rounded-lg border shadow-sm bg-muted/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ÜRÜN ADI</TableHead>
              <TableHead>GÜNCEL SATIŞ FİYATI</TableHead>
              <TableHead>STOK</TableHead>
              <TableHead>NOTLAR</TableHead>
              <TableHead className="text-right w-[150px]">İŞLEMLER</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/60">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {typeof product.latestSellingPrice === 'number' 
                      ? formatCurrency(product.latestSellingPrice) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                   <TableCell>{product.notes}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <StockHistoryDialog product={product} onProductUpdate={fetchProducts}>
                        <Button variant="ghost" size="icon" title="Stok Geçmişi">
                           <History className="h-4 w-4 text-blue-600" />
                        </Button>
                      </StockHistoryDialog>
                       <AddStockDialog product={product} onSuccess={fetchProducts}>
                        <Button variant="ghost" size="icon" title="Stok Ekle">
                           <PackagePlus className="h-4 w-4 text-green-600" />
                        </Button>
                      </AddStockDialog>
                      <ProductDialog product={product} onSuccess={fetchProducts}>
                        <Button variant="ghost" size="icon" title="Düzenle">
                           <Edit className="h-4 w-4" />
                        </Button>
                      </ProductDialog>
                      <DeleteProductDialog productId={product.id} onSuccess={fetchProducts}>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Sil">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </DeleteProductDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                   Arama kriterlerine uygun ürün bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
