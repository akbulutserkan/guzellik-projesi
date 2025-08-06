
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
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Search } from "lucide-react";
import { getAllDataForSalesPageAction, type SalesPageData, type Sale } from "./actions";
import { SaleDialog } from "./sale-dialog";
import { DeleteSaleDialog } from "./delete-sale-dialog";
import { useState, useEffect, useMemo } from "react";
import { format, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";


export default function UrunSatislarPage() {
  const [data, setData] = useState<SalesPageData>({ sales: [], products: [], customers: [], personel: [] });
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
   const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const pageData = await getAllDataForSalesPageAction();
    setData(pageData);
    setFilteredSales(pageData.sales);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLocaleLowerCase('tr-TR');
    
    const filtered = data.sales.filter((sale) => {
        const isTextMatch = searchTerm.length < 3 ? true : 
            sale.productName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
            (sale.customerName && sale.customerName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter)) ||
            (sale.personnelName && sale.personnelName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter));

        const isDateMatch = (() => {
            if (!dateRange || (!dateRange.from && !dateRange.to)) {
                return true; // No date filter applied
            }
            const saleDate = new Date(sale.saleDate);
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;

            if (from && to) {
                return saleDate >= from && saleDate <= to;
            }
            if (from) {
                return saleDate >= from;
            }
            if (to) {
                return saleDate <= to;
            }
            return true;
        })();
        
        return isTextMatch && isDateMatch;
    });

    setFilteredSales(filtered);
  }, [searchTerm, dateRange, data.sales]);

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Ürün Satışları
        </h1>
        <div className="flex flex-wrap items-center gap-2">
           <DateRangePicker date={dateRange} onDateChange={setDateRange} />
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün, müşteri veya personel ara..."
                className="pl-9 h-10 rounded-md shadow-md w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <SaleDialog 
              products={data.products} 
              customers={data.customers} 
              personel={data.personel}
              onSuccess={fetchData}
            >
              <Button disabled={data.products.length === 0 || data.personel.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Satış Ekle
              </Button>
            </SaleDialog>
        </div>
      </div>

       {data.products.length === 0 && !isLoading && (
         <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48 mb-6">
            <p className="text-center text-muted-foreground">
                Satış yapabilmek için önce <a href="/urunler" className="text-primary underline">ürünler sayfasından</a> bir ürün eklemelisiniz.
            </p>
        </div>
      )}
      
      {data.personel.length === 0 && data.products.length > 0 && !isLoading && (
         <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48 mb-6">
            <p className="text-center text-muted-foreground">
                Satış yapabilmek için önce <a href="/personeller" className="text-primary underline">personeller sayfasından</a> bir personel eklemelisiniz.
            </p>
        </div>
      )}


      <div className="rounded-lg border shadow-sm bg-muted/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ÜRÜN ADI</TableHead>
              <TableHead>MİKTAR</TableHead>
              <TableHead>TOPLAM TUTAR</TableHead>
              <TableHead>MÜŞTERİ</TableHead>
              <TableHead>PERSONEL</TableHead>
              <TableHead>SATIŞ TARİHİ</TableHead>
              <TableHead className="text-right w-[100px]">İŞLEMLER</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/60">
                  <TableCell className="font-medium">{sale.productName}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                  <TableCell>{sale.customerName || "-"}</TableCell>
                  <TableCell>{sale.personnelName || "-"}</TableCell>
                  <TableCell>{format(sale.saleDate, 'dd MMMM yyyy, HH:mm', { locale: tr })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DeleteSaleDialog saleId={sale.id} onSuccess={fetchData}>
                         <button className="text-red-600 hover:text-red-900" title="Satışı İptal Et">
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </DeleteSaleDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Satış kaydı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
