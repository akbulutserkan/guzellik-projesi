
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, type ReactNode, useEffect, useMemo } from "react";
import { performAddCustomerAction, performUpdateCustomerAction, type Customer } from "./actions";

interface CustomerDialogProps {
  children: ReactNode;
  customer?: Customer;
  onSuccess?: (newCustomer?: Customer) => void;
  initialName?: string;
}

export function CustomerDialog({ 
  children, 
  customer, 
  onSuccess, 
  initialName,
}: CustomerDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = customer !== undefined;

  const [fullName, setFullName] = useState(customer?.fullName || initialName || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [notes, setNotes] = useState(customer?.notes || "");

  useEffect(() => {
    if (open) {
      setFullName(customer?.fullName || initialName || "");
      setPhone(customer?.phone || "");
      setNotes(customer?.notes || "");
    }
  }, [open, customer, initialName]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    let cleanedValue = rawValue.replace(/\D/g, '');
    
    if (cleanedValue.startsWith('90')) {
        cleanedValue = cleanedValue.substring(2);
    } else if (cleanedValue.startsWith('0')) {
        cleanedValue = cleanedValue.substring(1);
    }

    const finalValue = cleanedValue.substring(0, 10);

    setPhone(finalValue);
  };
  
  const isPhoneValid = useMemo(() => {
    return /^[5]\d{9}$/.test(phone);
  }, [phone]);

  const isDirty = useMemo(() => {
    if (!isEditMode) return true;
    return (
      fullName !== customer?.fullName ||
      phone !== customer?.phone ||
      notes !== customer?.notes
    );
  }, [fullName, phone, notes, customer, isEditMode]);


  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set('phone', phone);
    
    if(isEditMode) {
        formData.append('id', customer.id);
        const action = performUpdateCustomerAction;
         try {
            const result = await action(formData);
            if (result.success) {
                toast({
                title: "Müşteri Güncellendi",
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
            setIsSubmitting(false);
        }
    } else {
        const action = performAddCustomerAction;
        try {
            const result = await action(formData);
            if (result.success) {
                toast({
                title: "Müşteri Eklendi",
                description: result.message,
                });
                onSuccess?.(result.newCustomer);
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
            setIsSubmitting(false);
        }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">{isEditMode ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</DialogTitle>
        <DialogDescription className="sr-only">{isEditMode ? 'Müşteri bilgilerini güncelleyin.' : 'Yeni bir müşteri eklemek için formu doldurun.'}</DialogDescription>
        <form onSubmit={handleFormSubmit}>
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                                id="fullName"
                                name="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ad Soyad"
                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                            <Input
                                id="phone"
                                name="phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="Telefon Numarası (5XX XXX XX XX)"
                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring h-10">
                             <Input
                                id="notes"
                                name="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notlar..."
                                className="w-full h-full border-0 bg-card focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 pr-3 text-sm placeholder:text-muted-foreground font-bold text-destructive"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            </div>
             <DialogFooter className="px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" disabled={isSubmitting || !isPhoneValid || !isDirty} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yeni Müşteriyi Ekle")}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
