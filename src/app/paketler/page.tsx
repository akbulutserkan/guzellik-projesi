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
import { PlusCircle, Edit, Trash2, Check, X } from "lucide-react";
import { getGroupedPackagesAction, performUpdatePackageAction, type PackagesByCategory, type Package } from "./actions";
import { getServicesAction, getCategoriesAction, type Service, type Category } from "../hizmetler/actions";
import { DeletePackageDialog } from "./delete-package-dialog";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AddPackageDialog } from "./add-package-dialog";


type ServicesByCategory = Record<string, Category & { services: Service[] }>;

export default function PaketlerPage() {
  const [packagesByCategory, setPackagesByCategory] = useState<PackagesByCategory>({});
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<{ price: string; sessionCount: string }>({ price: '', sessionCount: '' });
  const { toast } = useToast();

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
    const [groupedPackages, serviceList, categoryList] = await Promise.all([
      getGroupedPackagesAction(),
      getServicesAction(),
      getCategoriesAction()
    ]);
    setPackagesByCategory(groupedPackages);
    setServices(serviceList);
    setCategories(categoryList);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditClick = (pkg: Package) => {
    setEditingPackageId(pkg.id);
    setEditedData({
      price: String(pkg.price),
      sessionCount: String(pkg.sessionCount)
    });
  };

  const handleCancelClick = () => {
    setEditingPackageId(null);
  };

  const handleSaveClick = async (packageId: string) => {
    const formData = new FormData();
    formData.append('id', packageId);
    formData.append('price', editedData.price);
    formData.append('sessionCount', editedData.sessionCount);

    const result = await performUpdatePackageAction(formData);

    if (result.success) {
      toast({
        title: "Başarılı",
        description: result.message,
      });
      setEditingPackageId(null);
      fetchData(); // Veriyi yenile
    } else {
      toast({
        title: "Hata",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const hasAnyPackage = Object.values(packagesByCategory).some(cat => cat.packages.length > 0);
  const hasAnyService = services.length > 0;

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Paketler
        </h1>
        <AddPackageDialog servicesByCategory={servicesByCategory} onSuccess={fetchData}>
          <Button disabled={!hasAnyService}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Paket Oluştur
          </Button>
        </AddPackageDialog>
      </div>
      
      {!hasAnyService && !isLoading && (
         <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48 mb-6">
            <p className="text-center text-muted-foreground">
                Paket oluşturabilmek için önce <a href="/hizmetler" className="text-primary underline">hizmetler sayfasından</a> bir hizmet eklemelisiniz.
            </p>
        </div>
      )}

      {hasAnyService && !hasAnyPackage && !isLoading && (
        <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48 mb-6">
            <p className="text-center text-muted-foreground">
                Henüz paket oluşturulmamış.
            </p>
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48 mb-6">
            <p className="text-center text-muted-foreground">
                Yükleniyor...
            </p>
        </div>
      )}

      {!isLoading && hasAnyPackage && (
          <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(packagesByCategory).find(k => packagesByCategory[k].packages.length > 0)}>
              {Object.values(packagesByCategory).filter(cat => cat.packages.length > 0).map((category) => (
                  <AccordionItem value={category.id} key={category.id}>
                      <AccordionTrigger className="text-lg font-semibold uppercase px-4 hover:no-underline bg-muted/60 rounded-t-lg border-b data-[state=open]:rounded-b-none">
                          <div className="flex items-center gap-4 w-full">
                              <span>{category.name} PAKETLERİ ({category.packages.length})</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                           <div className="rounded-b-lg border-x border-b shadow-sm bg-muted/40">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead>PAKET ADI</TableHead>
                                    <TableHead>FİYAT</TableHead>
                                    <TableHead>SEANS SAYISI</TableHead>
                                    <TableHead className="text-right w-[100px]"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {category.packages.map((pkg) => (
                                      <TableRow key={pkg.id} className="hover:bg-muted/60">
                                        <TableCell className="font-medium">{pkg.name}</TableCell>
                                        <TableCell>
                                          {editingPackageId === pkg.id ? (
                                            <Input
                                              type="number"
                                              value={editedData.price}
                                              onChange={(e) => setEditedData({ ...editedData, price: e.target.value })}
                                              className="h-8 w-24"
                                            />
                                          ) : (
                                            formatCurrency(pkg.price)
                                          )}
                                        </TableCell>
                                        <TableCell>
                                           {editingPackageId === pkg.id ? (
                                            <Input
                                              type="number"
                                              value={editedData.sessionCount}
                                              onChange={(e) => setEditedData({ ...editedData, sessionCount: e.target.value })}
                                              className="h-8 w-24"
                                            />
                                          ) : (
                                            pkg.sessionCount
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                           <div className="flex justify-end gap-2">
                                              {editingPackageId === pkg.id ? (
                                                <>
                                                  <Button variant="ghost" size="icon" onClick={() => handleSaveClick(pkg.id)} title="Kaydet">
                                                    <Check className="h-4 w-4 text-green-600" />
                                                  </Button>
                                                  <Button variant="ghost" size="icon" onClick={handleCancelClick} title="İptal">
                                                    <X className="h-4 w-4 text-red-600" />
                                                  </Button>
                                                </>
                                              ) : (
                                                <>
                                                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(pkg)} title="Düzenle">
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <DeletePackageDialog packageId={pkg.id} onSuccess={fetchData}>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Sil">
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </DeletePackageDialog>
                                                </>
                                              )}
                                            </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                          </div>
                      </AccordionContent>
                  </AccordionItem>
              ))}
          </Accordion>
      )}
    </>
  );
}
