

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
import { PlusCircle, Trash2, Search, Edit, Wallet } from "lucide-react";
import { getAllDataForPackageSalesPageAction, type PackageSalesPageData, type PackageSale } from "./actions";
import { SaleDialog } from "./sale-dialog";
import { DeleteSaleDialog } from "./delete-sale-dialog";
import { SaleEditDialog } from "./sale-edit-dialog";
import { useState, useEffect } from "react";
import { format, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { RecordPaymentDialog } from "./record-payment-dialog";


export default function PaketSatislarPage() {
  const [data, setData] = useState<PackageSalesPageData>({ sales: [], packages: [], customers: [], personel: [] });
  const [filteredSales, setFilteredSales] = useState<PackageSale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSale, setEditingSale] = useState<PackageSale | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const pageData = await getAllDataForPackageSalesPageAction();
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
        const isTextMatch = searchTerm.length < 2 ? true : 
            sale.packageName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
            sale.customerName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
            sale.personnelName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter);

        const isDateMatch = (() => {
            if (!dateRange || (!dateRange.from && !dateRange.to)) {
                return true;
            }
            const saleDate = new Date(sale.saleDate);
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;

            if (from && to) return saleDate >= from && saleDate <= to;
            if (from) return saleDate >= from;
            if (to) return saleDate <= to;
            return true;
        })();
        
        return isTextMatch && isDateMatch;
    });

    setFilteredSales(filtered);
  }, [searchTerm, dateRange, data.sales]);

  const handleSuccess = () => {
    fetchData();
    setEditingSale(null);
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Paket Satışları
        </h1>
        <div className="flex flex-wrap items-center gap-2">
           <DateRangePicker date={dateRange} onDateChange={setDateRange} />
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Paket, müşteri, personel ara..."
                className="pl-9 h-10 rounded-md shadow-md w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <SaleDialog 
              packages={data.packages} 
              customers={data.customers} 
              personel={data.personel}
              onSuccess={fetchData}
            >
              <Button disabled={data.packages.length === 0 || data.customers.length === 0 || data.personel.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Paket Satışı Ekle
              </Button>
            </SaleDialog>
        </div>
      </div>

       {(data.packages.length === 0 || data.customers.length === 0 || data.personel.length === 0) && !isLoading && (
         <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48 mb-6">
            <p className="text-center text-muted-foreground">
                Paket satışı yapabilmek için önce sistemde kayıtlı <a href="/paketler" className="text-primary underline">paket</a>, <a href="/musteriler" className="text-primary underline">müşteri</a> ve <a href="/personeller" className="text-primary underline">personel</a> olmalıdır.
            </p>
        </div>
      )}
      
      <div className="rounded-lg border shadow-sm bg-muted/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>PAKET ADI</TableHead>
              <TableHead>MÜŞTERİ</TableHead>
              <TableHead>PERSONEL</TableHead>
              <TableHead>TUTAR</TableHead>
              <TableHead>ÖDENEN</TableHead>
              <TableHead>KALAN</TableHead>
              <TableHead>SATIŞ TARİHİ</TableHead>
              <TableHead>SEANS/KULLANIM</TableHead>
              <TableHead className="text-right w-[140px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/60">
                  <TableCell className="font-medium">{sale.packageName}</TableCell>
                  <TableCell>
                    <div>{sale.customerName}</div>
                    <div className="text-xs text-muted-foreground">{formatPhoneNumber(sale.customerPhone)}</div>
                  </TableCell>
                  <TableCell>{sale.personnelName}</TableCell>
                  <TableCell>{formatCurrency(sale.price)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">{formatCurrency(sale.paidAmount)}</TableCell>
                  <TableCell className="text-red-600 font-semibold">{formatCurrency(sale.remainingAmount)}</TableCell>
                  <TableCell>{format(sale.saleDate, 'dd MMM yyyy', { locale: tr })}</TableCell>
                  <TableCell>
                     <Badge variant={sale.usedSessionsCount === sale.totalSessionsCount ? "destructive" : "secondary"}>
                        {sale.usedSessionsCount} / {sale.totalSessionsCount}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       {sale.remainingAmount > 0 && (
                          <RecordPaymentDialog sale={sale} onSuccess={fetchData}>
                            <Button variant="ghost" size="icon" title="Ödeme Al">
                                <Wallet className="h-4 w-4 text-green-600" />
                            </Button>
                          </RecordPaymentDialog>
                       )}
                      <Button variant="ghost" size="icon" title="Düzenle" onClick={() => setEditingSale(sale)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteSaleDialog saleId={sale.id} onSuccess={fetchData}>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Satışı İptal Et">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </DeleteSaleDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Satış kaydı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingSale && (
        <SaleEditDialog
          sale={editingSale}
          customers={data.customers}
          personel={data.personel}
          packages={data.packages}
          onSuccess={handleSuccess}
          isOpen={!!editingSale}
          onOpenChange={(open) => !open && setEditingSale(null)}
        />
      )}
    </>
  );
}
