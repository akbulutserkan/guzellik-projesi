
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { performRecordPackageSaleAction } from "./actions";
import type { Customer } from "../musteriler/actions";
import type { Personel } from "../personeller/actions";
import type { Package } from "../paketler/actions";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentMethod } from "../kasa/actions";
import { SingleDatePicker } from "@/components/ui/single-date-picker";


interface SaleDialogProps {
  children: ReactNode;
  packages: Package[];
  customers: Customer[];
  personel: Personel[];
  onSuccess?: () => void;
}

export function SaleDialog({ children, packages, customers, personel, onSuccess }: SaleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [price, setPrice] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());


  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationContent, setConfirmationContent] = useState<React.ReactNode[]>([]);
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormData | null>(null);


  const customerOptions = customers.map(c => ({ value: c.id, label: `${c.fullName} (${formatPhoneNumber(c.phone)})` }));
  const personnelOptions = personel.map(p => ({ value: p.id, label: p.fullName }));
  const packageOptions = packages.map(p => ({ value: p.id, label: `${p.name}`}));

  useEffect(() => {
    if (selectedPackageId) {
        const selectedPkg = packages.find(p => p.id === selectedPackageId);
        const newPrice = selectedPkg?.price || 0;
        setPrice(newPrice);
        setPaidAmount(""); 
    } else {
        setPrice(0);
        setPaidAmount("");
    }
  }, [selectedPackageId, packages]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentFormData = new FormData(event.currentTarget);
    setFormDataToSubmit(currentFormData);

    const selectedPkg = packages.find(p => p.id === selectedPackageId);
    if (!selectedPkg) {
        return;
    }

    const formPrice = parseFloat(currentFormData.get("price") as string || '0');
    const formPaidAmount = currentFormData.get("paidAmount") as string;
    const numericPaidAmount = Number(formPaidAmount.trim() === '' ? '0' : formPaidAmount);
    const remainingAmount = formPrice - numericPaidAmount;

    const warnings: React.ReactNode[] = [];

    // Condition 1: Price has been changed
    if (formPrice !== selectedPkg.price) {
        warnings.push(
            <p key="price-change">Paketin normal satış fiyatı <strong className="font-bold">{formatCurrency(selectedPkg.price)}</strong> iken, bu satış <strong className="font-bold text-destructive">{formatCurrency(formPrice)}</strong> olarak kaydedilecektir.</p>
        );
    }

    // Condition 2: Partial or no payment
    if (remainingAmount > 0) {
        if (numericPaidAmount === 0) {
            warnings.push(
                <p key="no-payment">Bu satıştan hiçbir ücret tahsilatı yapılmayacaktır. Müşterinin <strong className="font-bold text-destructive">{formatCurrency(formPrice)}</strong> borcu olacaktır.</p>
            );
        } else {
            warnings.push(
                <p key="partial-payment">Bu satış sonrası müşterinin <strong className="font-bold text-destructive">{formatCurrency(remainingAmount)}</strong> borcu kalacaktır.</p>
            );
        }
    }
    
    if (warnings.length === 0) {
        await executeSubmit(currentFormData);
    } else {
        setConfirmationContent(warnings);
        setShowConfirmation(true);
    }
  };
  
  const handleConfirmation = () => {
    setShowConfirmation(false);
    if (formDataToSubmit) {
        executeSubmit(formDataToSubmit);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setFormDataToSubmit(null);
  }

  const executeSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    const finalPaidAmount = String(paidAmount).trim() === '' ? '0' : String(paidAmount);
    formData.set("packageId", selectedPackageId);
    formData.set("customerId", selectedCustomerId);
    formData.set("personnelId", selectedPersonnelId);
    formData.set("price", String(price));
    formData.set("paidAmount", finalPaidAmount);
    formData.set("paymentMethod", paymentMethod || "Nakit"); // Default to Nakit if null
    if (saleDate) {
        formData.set("saleDate", saleDate.toISOString());
    }
    
    try {
      const result = await performRecordPackageSaleAction(formData);

      if (result.success) {
        toast({
          title: "Paket Satışı Kaydedildi",
          description: result.message,
        });
        onSuccess?.();
        setOpen(false);
      } else {
        toast({
          title: "Hata",
          description: result.message || "Bir hata oluştu.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Beklenmedik bir sunucu hatası oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(true);
      setFormDataToSubmit(null);
      setConfirmationContent([]);
    }
  }

  const resetDialog = () => {
    setSelectedPackageId("");
    setSelectedCustomerId("");
    setSelectedPersonnelId("");
    setPrice(0);
    setPaidAmount("");
    setPaymentMethod(null);
    setSaleDate(new Date());
    setIsSubmitting(false);
    setFormDataToSubmit(null);
    setShowConfirmation(false);
    setConfirmationContent([]);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
        resetDialog();
    }
    setOpen(isOpen);
  }

  const numericPaidAmount = useMemo(() => Number(String(paidAmount).trim() === '' ? '' : paidAmount), [paidAmount]);

  const isFormValid = useMemo(() => {
    const isPaidAmountValid = !isNaN(numericPaidAmount) && numericPaidAmount >= 0 && numericPaidAmount <= price;
    const isPaymentMethodValid = numericPaidAmount > 0 ? !!paymentMethod : true;
    return selectedPackageId && selectedPersonnelId && selectedCustomerId && isPaidAmountValid && isPaymentMethodValid && saleDate;
  }, [selectedPackageId, selectedPersonnelId, selectedCustomerId, numericPaidAmount, price, paymentMethod, saleDate]);

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Yeni Paket Satışı</DialogTitle>
        <DialogDescription className="sr-only">Yeni bir paket satışı kaydetmek için formu doldurun.</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Combobox
                                options={customerOptions}
                                value={selectedCustomerId}
                                onChange={setSelectedCustomerId}
                                placeholder="Müşteri seçin..."
                                searchPlaceholder="Müşteri ara..."
                                noResultsText="Müşteri bulunamadı."
                                disabled={isSubmitting}
                            />
                        </div>
                        <SingleDatePicker date={saleDate} onDateChange={setSaleDate} disabled={isSubmitting} />
                    </div>
                     <div className="space-y-2">
                        <Combobox
                            options={packageOptions}
                            value={selectedPackageId}
                            onChange={setSelectedPackageId}
                            placeholder="Paket seçin..."
                            searchPlaceholder="Paket ara..."
                            noResultsText="Paket bulunamadı."
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                            id="price"
                            name="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            placeholder="Satış Fiyatı"
                            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                            required
                            disabled={isSubmitting || !selectedPackageId}
                            step="0.01"
                            min="0"
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                            ₺
                            </span>
                        </div>
                         <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                            id="paidAmount"
                            name="paidAmount"
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder="Tahsil edilen tutar"
                            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12"
                            disabled={isSubmitting || !selectedPackageId}
                            step="0.01"
                            min="0"
                            max={price}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                            ₺
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Combobox
                            options={personnelOptions}
                            value={selectedPersonnelId}
                            onChange={setSelectedPersonnelId}
                            placeholder="Satışı yapan personeli seçin..."
                            searchPlaceholder="Personel ara..."
                            noResultsText="Personel bulunamadı."
                            disabled={isSubmitting}
                        />
                    </div>
                    {numericPaidAmount > 0 && (
                        <div className="space-y-2">
                             <RadioGroup
                                value={paymentMethod ?? ""}
                                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                                className="grid grid-cols-3 gap-2"
                                name="paymentMethod"
                                >
                                <div>
                                    <RadioGroupItem value="Kart" id="satis-kart" className="peer sr-only" />
                                    <Label htmlFor="satis-kart" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Kart</Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="Nakit" id="satis-nakit" className="peer sr-only" />
                                    <Label htmlFor="satis-nakit" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Nakit</Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="Havale/EFT" id="satis-havale" className="peer sr-only" />
                                    <Label htmlFor="satis-havale" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Havale/EFT</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                </div>
            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || !isFormValid} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "İşleniyor..." : "Yeni Paket Satışını Kaydet"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertContent>
            <AlertHeader>
                <AlertTitle>Lütfen İşlemi Onaylayın</AlertTitle>
                <AlertDescription asChild>
                   <div className="space-y-2">
                        {confirmationContent}
                   </div>
                </AlertDescription>
            </AlertHeader>
            <AlertFooter>
                <AlertDialogCancel onClick={cancelConfirmation} disabled={isSubmitting}>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmation} disabled={isSubmitting}>
                    {isSubmitting ? "İşleniyor..." : "Evet, Onayla ve Kaydet"}
                </AlertDialogAction>
            </AlertFooter>
        </AlertContent>
    </AlertDialog>
    </>
  );
}

    
