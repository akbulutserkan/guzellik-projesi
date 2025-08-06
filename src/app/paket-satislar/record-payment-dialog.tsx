
"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, type ReactNode, useEffect, useMemo } from "react";
import { type PackageSale, updateAndRecordPackagePaymentsAction } from "./actions";
import { type PaymentTransaction, getPaymentsForPackageAction, type PaymentMethod } from "../kasa/actions";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, User, Package as PackageIcon } from "lucide-react";
import { deletePaymentTransactionAction } from "../kasa/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription as AlertDescription,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle as AlertTitle,
} from "@/components/ui/alert-dialog";
import { SingleDatePicker } from "@/components/ui/single-date-picker";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


interface PaymentLine {
  id: string;
  amount: string;
  date: Date;
  method: PaymentMethod;
}

interface RecordPaymentDialogProps {
  children: ReactNode;
  sale: PackageSale;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({ children, sale, onSuccess }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pastPayments, setPastPayments] = useState<PaymentLine[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState<Date | undefined>(new Date());
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);


  const fetchPayments = async () => {
      if (sale.id) {
          setIsLoading(true);
          const payments = await getPaymentsForPackageAction(sale.id);
          
          const formattedPayments = payments
            .map(p => ({
              id: p.id,
              amount: String(p.grandTotalAmount),
              date: p.paymentDate,
              method: p.paymentMethod,
          }));
          
          setPastPayments(formattedPayments);
          setIsLoading(false);
      }
  };

  useEffect(() => {
    if (open) {
      fetchPayments();
      setNewPaymentAmount("");
      setNewPaymentDate(new Date());
      setNewPaymentMethod(null);
    }
  }, [open, sale.id]);

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    
    if (hasNewPayment && !newPaymentMethod) {
        toast({ title: "Hata", description: "Lütfen yeni ödeme için bir yöntem seçin.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const updatedPayments = pastPayments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        date: p.date,
    }));
    
    const newPayment = (newPaymentAmount && parseFloat(newPaymentAmount) > 0 && newPaymentMethod) ? {
        amount: parseFloat(newPaymentAmount),
        date: newPaymentDate || new Date(),
        method: newPaymentMethod,
    } : null;

    try {
        const result = await updateAndRecordPackagePaymentsAction(
            sale.id,
            { id: sale.customerId, fullName: sale.customerName },
            updatedPayments,
            newPayment,
            sale.price
        );

        if (result.success) {
            toast({ title: "Başarılı", description: result.message });
            onSuccess?.();
            setOpen(false);
        } else {
            toast({ title: "Hata", description: result.message, variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Hata", description: "Beklenmedik bir sunucu hatası oluştu.", variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsSubmitting(true);
    const result = await deletePaymentTransactionAction(paymentToDelete);
    if (result.success) {
        toast({ title: "Başarılı", description: "Ödeme başarıyla silindi." });
        setPastPayments(prev => prev.filter(p => p.id !== paymentToDelete));
        onSuccess?.();
        await fetchPayments(); // Re-fetch to get latest data
    } else {
        toast({ title: "Hata", description: result.message, variant: "destructive" });
    }
    setPaymentToDelete(null);
    setIsSubmitting(false);
  }

  const handlePastPaymentChange = (index: number, field: 'amount' | 'date', value: string | Date | undefined) => {
    const newPayments = [...pastPayments];
    const payment = newPayments[index];
    
    if (field === 'amount') {
        payment.amount = value as string;
    } else if (field === 'date' && value instanceof Date) {
        payment.date = value;
    }

    setPastPayments(newPayments);
  }
  
  const totalPaid = useMemo(() => {
    const pastPaid = pastPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const newPaid = parseFloat(newPaymentAmount) || 0;
    return pastPaid + newPaid;
  }, [pastPayments, newPaymentAmount]);

  const finalRemaining = sale.price - totalPaid;
  const hasNewPayment = newPaymentAmount && parseFloat(newPaymentAmount) > 0;

  const isSaveDisabled = useMemo(() => {
    if (isSubmitting || isLoading) return true;
    if (hasNewPayment && !newPaymentMethod) return true;
    return false;
  }, [isSubmitting, isLoading, hasNewPayment, newPaymentMethod]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogHeader className="p-6 pb-2 border-b">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5 text-primary"/> 
                <span>{sale.customerName} - {formatPhoneNumber(sale.customerPhone)}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <PackageIcon className="h-4 w-4"/> 
                <span>{sale.packageName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 text-center">
                <div>
                    <p className="text-xs text-muted-foreground">TOPLAM TUTAR</p>
                    <p className="text-xl font-bold">{formatCurrency(sale.price)}</p>
                </div>
                 <div>
                    <p className="text-xs text-muted-foreground">KALAN TUTAR</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(finalRemaining)}</p>
                </div>
            </div>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
             <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                     <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                        <Input
                            type="number"
                            placeholder="Yeni ödeme tutarı"
                            value={newPaymentAmount}
                            onChange={(e) => setNewPaymentAmount(e.target.value)}
                            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12 w-24"
                            disabled={isSubmitting}
                            step="0.01"
                            min="0.01"
                            max={sale.price - pastPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                        ₺
                        </span>
                    </div>
                    <SingleDatePicker date={newPaymentDate} onDateChange={setNewPaymentDate} disabled={isSubmitting} className="w-auto flex-grow" />
                </div>
                {hasNewPayment && (
                <RadioGroup
                    value={newPaymentMethod ?? ""}
                    onValueChange={(value) => setNewPaymentMethod(value as PaymentMethod)}
                    className="grid grid-cols-3 gap-2"
                    disabled={isSubmitting}
                >
                    <div><RadioGroupItem value="Kart" id="kart" className="peer sr-only" /><Label htmlFor="kart" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Kart</Label></div>
                    <div><RadioGroupItem value="Nakit" id="nakit" className="peer sr-only" /><Label htmlFor="nakit" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Nakit</Label></div>
                    <div><RadioGroupItem value="Havale/EFT" id="havale" className="peer sr-only" /><Label htmlFor="havale" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Havale/EFT</Label></div>
                </RadioGroup>
                )}
            </div>
        </div>
        
        <Separator />
        
        <ScrollArea className="h-52">
            <div className="space-y-4 py-4 px-4">
                {isLoading ? (
                    <p className="text-center py-4 text-sm text-muted-foreground">Geçmiş ödemeler yükleniyor...</p>
                ) : pastPayments.length === 0 ? (
                    <p className="text-sm text-center py-4 text-muted-foreground">Geçmiş ödeme bulunmuyor.</p>
                ) : (
                    <div className="space-y-2">
                        {pastPayments.map((p, index) => (
                             <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                                 <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                    <Input
                                        type="number"
                                        value={p.amount}
                                        onChange={(e) => handlePastPaymentChange(index, 'amount', e.target.value)}
                                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12 w-24"
                                        disabled={isSubmitting}
                                        step="0.01"
                                    />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">₺</span>
                                </div>
                                <SingleDatePicker date={p.date} onDateChange={(d) => handlePastPaymentChange(index, 'date', d)} disabled={isSubmitting} className="w-auto flex-grow" />
                                <Badge variant="secondary" className="h-9 w-[90px] justify-center text-xs">{p.method}</Badge>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPaymentToDelete(p.id)} disabled={isSubmitting}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t bg-secondary rounded-b-xl">
                <Button type="button" onClick={handleFormSubmit} disabled={isSaveDisabled} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
        <AlertContent>
            <AlertHeader>
                <AlertTitle>Bu Ödemeyi Silmek İstediğinize Emin misiniz?</AlertTitle>
                <AlertDescription>
                    Bu işlem geri alınamaz. Bu ödeme kaydını silecek ve paket borcunu yeniden hesaplayacaktır.
                </AlertDescription>
            </AlertHeader>
            <AlertFooter>
                <AlertDialogCancel disabled={isSubmitting}>Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayment} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                    {isSubmitting ? "Siliniyor..." : "Evet, Sil"}
                </AlertDialogAction>
            </AlertFooter>
        </AlertContent>
    </AlertDialog>
    </Dialog>
  );
}

    