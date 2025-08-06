
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getServicesAction, getCategoriesAction, type Service, type Category } from "./actions";
import { CategoryDialog } from "./category-dialog";
import { ServiceDialog } from "./service-dialog";
import { CategoryList } from "./category-list";


export default async function HizmetlerPage() {
  const services = await getServicesAction();
  const categories = await getCategoriesAction();

  const servicesByCategory = categories.reduce((acc, category) => {
    acc[category.id] = {
      ...category,
      services: services.filter(s => s.categoryId === category.id)
    };
    return acc;
  }, {} as Record<string, Category & { services: Service[] }>);


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">
          Hizmetler
        </h1>
        <div className="flex gap-2">
            <CategoryDialog>
                 <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Kategori Ekle
                </Button>
            </CategoryDialog>
            <ServiceDialog categories={categories}>
                <Button disabled={categories.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Hizmet Ekle
                </Button>
            </ServiceDialog>
        </div>
      </div>
        {categories.length === 0 ? (
             <div className="rounded-lg border shadow-sm bg-muted/40 flex items-center justify-center h-48">
                <p className="text-center text-muted-foreground">
                    Başlamak için lütfen önce bir kategori ekleyin.
                </p>
            </div>
        ) : (
             <CategoryList servicesByCategory={servicesByCategory} categories={categories} />
        )}
    </>
  );
}

