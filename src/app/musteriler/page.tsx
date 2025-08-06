
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
import { PlusCircle, Edit, Trash2, Search, Eye } from "lucide-react";
import { getCustomersAction, type Customer } from "./actions";
import { CustomerDialog } from "./customer-dialog";
import { DeleteCustomerDialog } from "./delete-customer-dialog";
import { CustomerDetailDialog } from "./customer-detail-dialog";
import { useState, useEffect, useCallback } from "react";
import { formatPhoneNumber } from "@/lib/utils";

export default function MusterilerPage() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    const customers = await getCustomersAction();
    setAllCustomers(customers);
    setFilteredCustomers(customers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const lowercasedFilter = searchTerm.toLocaleLowerCase('tr-TR');
    const filtered = allCustomers.filter((customer) =>
      customer.fullName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, allCustomers]);


  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Müşteriler
        </h1>
        <div className="flex-1 max-w-sm">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Müşteri ara (en az 3 harf)..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
        <CustomerDialog onSuccess={fetchCustomers}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Müşteri Ekle
          </Button>
        </CustomerDialog>
      </div>

      <div className="rounded-lg border shadow-sm bg-muted/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>AD SOYAD</TableHead>
              <TableHead>TELEFON</TableHead>
              <TableHead>NOTLAR</TableHead>
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
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/60">
                  <TableCell>
                    <Button variant="ghost" size="icon" title="Müşteri Detaylarını Görüntüle" onClick={() => setSelectedCustomer(customer)}>
                        <Eye className="h-5 w-5 text-blue-500" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{customer.fullName}</TableCell>
                  <TableCell>{formatPhoneNumber(customer.phone)}</TableCell>
                  <TableCell>{customer.notes}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <CustomerDialog customer={customer} onSuccess={fetchCustomers}>
                          <button className="text-yellow-600 hover:text-yellow-900" title="Düzenle">
                              <Edit className="h-4 w-4" />
                          </button>
                      </CustomerDialog>
                      <DeleteCustomerDialog customerId={customer.id} onSuccess={fetchCustomers}>
                         <button className="text-red-600 hover:text-red-900" title="Sil">
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </DeleteCustomerDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                   {searchTerm ? 'Arama kriterlerine uygun müşteri bulunamadı.' : 'Henüz müşteri eklenmemiş.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedCustomer && (
        <CustomerDetailDialog
            isOpen={!!selectedCustomer}
            onOpenChange={(open) => !open && setSelectedCustomer(null)}
            customer={selectedCustomer}
        />
      )}
    </>
  );
}
