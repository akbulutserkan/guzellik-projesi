
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <Card className="w-full max-w-2xl p-8 shadow-2xl">
        <CardHeader>
          <div className="flex justify-center items-center mb-4">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Güzellik Merkezi Yönetim Sistemine Hoş Geldiniz</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground mt-4">
            Randevuları yönetmek, müşteri takibi yapmak ve işletmenizin verimliliğini artırmak için sol menüdeki seçenekleri kullanabilirsiniz.
          </p>
          <p className="text-muted-foreground mt-2">
            Başlamak için <a href="/takvim" className="text-primary font-semibold underline hover:text-primary/80">Takvim</a>'e gidin veya yeni bir <a href="/musteriler" className="text-primary font-semibold underline hover:text-primary/80">Müşteri</a> ekleyin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
