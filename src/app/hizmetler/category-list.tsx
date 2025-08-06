
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { Service, Category } from "./actions";
import { ServiceDialog } from "./service-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { CategoryEditDialog } from "./category-edit-dialog";
import { CategoryDeleteDialog } from "./category-delete-dialog";
import { formatCurrency } from "@/lib/utils";


interface CategoryListProps {
    servicesByCategory: Record<string, Category & { services: Service[] }>;
    categories: Category[];
}

export function CategoryList({ servicesByCategory, categories }: CategoryListProps) {
    const defaultActive = categories.length > 0 ? categories[0].id : undefined;

    return (
        <Accordion type="single" collapsible className="w-full" defaultValue={defaultActive}>
            {Object.values(servicesByCategory).map((category) => (
               <AccordionItem value={category.id} key={category.id}>
                    <div className="flex items-center w-full bg-muted/60 rounded-t-lg border-b data-[state=open]:rounded-b-none">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline flex-1 py-4 px-4">
                           <span className="uppercase">{category.name} ({category.services.length})</span>
                        </AccordionTrigger>
                        <div className="flex items-center gap-2 pr-4" onClick={(e) => e.stopPropagation()}>
                            <CategoryEditDialog category={category}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-transparent" title="Kategoriyi Düzenle">
                                    <Edit className="h-4 w-4 text-yellow-600" />
                                </Button>
                            </CategoryEditDialog>
                            <CategoryDeleteDialog categoryId={category.id}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-transparent" title="Kategoriyi Sil">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </CategoryDeleteDialog>
                        </div>
                   </div>
                   <AccordionContent className="p-0">
                        <div className="rounded-b-lg border-x border-b shadow-sm bg-muted/40">
                           <Table>
                           <TableHeader>
                               <TableRow className="hover:bg-transparent">
                               <TableHead>HİZMET ADI</TableHead>
                               <TableHead>FİYAT</TableHead>
                               <TableHead>SÜRE (Dakika)</TableHead>
                               <TableHead className="text-right w-[100px]"></TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {category.services.length > 0 ? (
                               category.services.map((service) => (
                                   <TableRow key={service.id} className="hover:bg-muted/80">
                                   <TableCell className="font-medium">{service.name}</TableCell>
                                   <TableCell>{formatCurrency(service.price)}</TableCell>
                                   <TableCell>{service.duration}</TableCell>
                                   <TableCell className="text-right">
                                       <div className="flex justify-end gap-2">
                                       <ServiceDialog service={service} categories={categories}>
                                           <Button variant="ghost" size="icon" title="Düzenle">
                                               <Edit className="h-4 w-4" />
                                           </Button>
                                       </ServiceDialog>
                                       <DeleteServiceDialog serviceId={service.id}>
                                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Sil">
                                               <Trash2 className="h-4 w-4" />
                                           </Button>
                                       </DeleteServiceDialog>
                                       </div>
                                   </TableCell>
                                   </TableRow>
                               ))
                               ) : (
                               <TableRow>
                                   <TableCell colSpan={4} className="h-24 text-center">
                                   Bu kategoride henüz hizmet eklenmemiş.
                                   </TableCell>
                               </TableRow>
                               )}
                           </TableBody>
                           </Table>
                       </div>
                   </AccordionContent>
               </AccordionItem>
            ))}
       </Accordion>
    )
}
