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
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { getPersonelAction, type Personel } from "./actions";
import { getServicesAction, getCategoriesAction, type Service, type Category } from "../hizmetler/actions";
import { PersonelDialog } from "./personel-dialog";
import { DeletePersonelDialog } from "./delete-personel-dialog";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/utils";


type ServicesByCategory = Record<string, Category & { services: Service[] }>;

export default function PersonellerPage() {
  const [allPersonel, setAllPersonel] = useState<Personel[]>([]);
  const [filteredPersonel, setFilteredPersonel] = useState<Personel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const servicesByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
        acc[category.id] = {
            ...category,
            services: services.filter(s => s.categoryId === category.id)
        };
        return acc;
    }, {} as ServicesByCategory);
  }, [categories, services]);

  const fetchData = useCallback(async () => {
      setIsLoading(true);
      const [personelList, serviceList, categoryList] = await Promise.all([
          getPersonelAction(),
          getServicesAction(),
          getCategoriesAction()
      ]);
      setAllPersonel(personelList);
      setFilteredPersonel(personelList);
      setServices(serviceList);
      setCategories(categoryList);
      setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setFilteredPersonel(allPersonel);
      return;
    }
    const lowercasedFilter = searchTerm.toLocaleLowerCase('tr-TR');
    const filtered = allPersonel.filter((personel) =>
      personel.fullName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter)
    );
    setFilteredPersonel(filtered);
  }, [searchTerm, allPersonel]);


  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Personeller
        </h1>
        <div className="flex-1 max-w-sm">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Personel ara (en az 3 harf)..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
        <PersonelDialog servicesByCategory={servicesByCategory} onSuccess={fetchData}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Personel Ekle
          </Button>
        </PersonelDialog>
      </div>

      <div className="rounded-lg border shadow-sm bg-muted/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>AD SOYAD</TableHead>
              <TableHead>STATÜ</TableHead>
              <TableHead>TELEFON</TableHead>
              <TableHead className="text-right w-[100px]">İŞLEMLER</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
            ) : filteredPersonel.length > 0 ? (
              filteredPersonel.map((personel) => (
                <TableRow key={personel.id} className="hover:bg-muted/60">
                  <TableCell className="font-medium">{personel.fullName}</TableCell>
                  <TableCell><Badge variant="secondary">{personel.status}</Badge></TableCell>
                  <TableCell>{formatPhoneNumber(personel.phone)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <PersonelDialog personel={personel} servicesByCategory={servicesByCategory} onSuccess={fetchData}>
                          <button className="text-yellow-600 hover:text-yellow-900" title="Düzenle">
                              <Edit className="h-4 w-4" />
                          </button>
                      </PersonelDialog>
                      <DeletePersonelDialog personelId={personel.id} onSuccess={fetchData}>
                         <button className="text-red-600 hover:text-red-900" title="Sil">
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </DeletePersonelDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Henüz personel eklenmemiş veya arama kriterlerine uygun personel bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
