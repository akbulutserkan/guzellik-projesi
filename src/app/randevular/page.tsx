
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";


export default async function RandevularPage() {
  // Bu sayfa artık sadece takvime yönlendirme yapacak.
  // Gerçek randevu listesi daha sonra eklenebilir.
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">
          Randevu Yönetimi
        </h1>
        <Button asChild>
            <Link href="/takvim">
                <PlusCircle className="mr-2 h-4 w-4" />
                Takvimde Yeni Randevu Ekle
            </Link>
        </Button>
      </div>
      <div className="rounded-lg border shadow-sm bg-muted/40 p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold mb-4">Randevu Takvimi</h2>
         <p className="text-muted-foreground mb-6 max-w-md">
            Tüm randevuları görmek, yönetmek ve yeni randevular oluşturmak için lütfen interaktif takvim sayfamızı kullanın.
        </p>
        <Button asChild size="lg">
            <Link href="/takvim">
                Takvime Git
            </Link>
        </Button>
      </div>
    </>
  );
}
