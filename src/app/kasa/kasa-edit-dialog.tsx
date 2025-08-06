
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, type ReactNode, useMemo, useEffect } from "react";
import { performFullUpdateKasaAction, type PaymentMethod, type EnrichedPaymentTransaction } from "./actions";
import { getSalesForAppointmentGroupAction } from "../randevular/actions";
import type { Customer } from "../musteriler/actions";
import type { Personel } from "../personeller/actions";
import type { Service } from "../hizmetler/actions";
import type { Package } from "../paketler/actions";
import { SingleDatePicker } from "@/components/ui/single-date-picker";
import { PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import type { CalendarEvent } from "../takvim/page";
import { Separator } from "@/components/ui/separator";
import { Product as SaleableProduct, Sale } from "../urun-satislar/actions";
import { getProductDetailsAction } from "../urunler/actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


interface ServiceLine {
    id: string; 
    personnelId: string;
    serviceId: string;
    price: string;
    name: string; 
}

interface SaleLine {
    id: number;
    productId: string;
    quantity: number;
    totalAmount: number;
    personnelId: string;
    productDetails?: { stock: number; sellingPrice: number } | null;
    name: string;
}

interface KasaEditDialogProps {
  transaction: EnrichedPaymentTransaction;
  allAppointments: CalendarEvent[];
  customers: Customer[];
  personnelList: Personel[];
  services: Service[];
  packages: Package[];
  products: SaleableProduct[];
  onSuccess?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KasaEditDialog({ 
    transaction, 
    allAppointments,
    customers, 
    personnelList, 
    services, 
    packages, 
    products,
    onSuccess, 
    isOpen, 
    onOpenChange, 
}: KasaEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");


  const [initialState, setInitialState] = useState<{
    serviceLines: ServiceLine[];
    saleLines: Sale[];
    dateTime: string;
    notes: string;
    paymentMethod: PaymentMethod | "";
  } | null>(null);

  const personnelOptions = useMemo(() => personnelList.map(p => ({ value: p.id, label: p.fullName })), [personnelList]);
  const serviceAndPackageOptions = useMemo(() => {
    const serviceOpts = services.map(s => ({ value: s.id, label: `Hizmet: ${s.name}`, price: s.price }));
    const packageOpts = packages.map(p => ({ value: p.id, label: `Paket: ${p.name}`, price: p.price }));
    return [...serviceOpts, ...packageOpts];
  }, [services, packages]);

  const productOptions = useMemo(() => 
    products.map(p => ({ value: p.id, label: `${p.name} (Stok: ${p.stock})`})), 
  [products]);

  // Populate form when dialog opens
  useEffect(() => {
    const initializeDialog = async () => {
        if (isOpen && transaction) {
            const dayAppointments = allAppointments
                .filter(a => a.groupId === transaction.appointmentGroupId)
                .sort((a, b) => a.start.getTime() - b.start.getTime());

            if (dayAppointments.length > 0) {
                const firstAppointment = dayAppointments[0];
                const initialDate = firstAppointment.start;
                const initialTime = format(initialDate, "HH:mm");
                const fullInitialDateTime = new Date(`${format(initialDate, "yyyy-MM-dd")}T${initialTime}`);
                
                // Set current state
                setSelectedCustomerId(firstAppointment.customerId);
                setDate(initialDate);
                setStartTime(initialTime);
                setNotes(firstAppointment.notes || "");
                setPaymentMethod(transaction.paymentMethod);
                
                const initialServices = dayAppointments.map((app) => ({
                    id: app.id,
                    personnelId: app.personnelId,
                    serviceId: app.serviceId,
                    price: String(app.price),
                    name: app.serviceName,
                }));
                setServiceLines(initialServices);
                
                const salesForDay = await getSalesForAppointmentGroupAction([transaction.appointmentGroupId]);
                const initialSales = salesForDay.map((sale: Sale, index: number) => ({
                    id: Date.now() + index,
                    productId: sale.productId,
                    quantity: sale.quantity,
                    totalAmount: sale.totalAmount,
                    personnelId: sale.personnelId || "",
                    productDetails: { stock: products.find(p=>p.id === sale.productId)?.stock || 0, sellingPrice: sale.totalAmount / sale.quantity },
                    name: sale.productName,
                }));
                setSaleLines(initialSales);

                 // Set initial state for dirty check
                setInitialState({
                    serviceLines: JSON.parse(JSON.stringify(initialServices)),
                    saleLines: JSON.parse(JSON.stringify(initialSales)),
                    dateTime: fullInitialDateTime.toISOString(),
                    notes: firstAppointment.notes || "",
                    paymentMethod: transaction.paymentMethod
                });
            }
        } else {
          setInitialState(null);
        }
    };
    initializeDialog();
  }, [isOpen, transaction, allAppointments, products]);


  // Service Line Handlers
  const addServiceLine = () => setServiceLines([...serviceLines, { id: `new_${Date.now()}`, personnelId: "", serviceId: "", price: "", name: "" }]);
  
  const updateServiceLine = (index: number, field: keyof Omit<ServiceLine, 'id' | 'name'>, value: string) => {
    const newLines = [...serviceLines];
    const line = newLines[index];
    if (field === 'serviceId') {
        const selectedOption = serviceAndPackageOptions.find(opt => opt.value === value);
        line.price = selectedOption ? String(selectedOption.price) : "";
        line.name = selectedOption?.label || "";
    }
    (line as any)[field] = value;
    setServiceLines(newLines);
  };
  const removeServiceLine = (index: number) => setServiceLines(serviceLines.filter((_, i) => i !== index));

  // Sale Line Handlers
  const addSaleLine = () => setSaleLines([...saleLines, { id: Date.now(), productId: "", quantity: 1, totalAmount: 0, personnelId: "", productDetails: null, name: "" }]);
  
  const updateSaleLine = (index: number, field: keyof Omit<SaleLine, 'id' | 'productDetails' | 'name'>, value: string | number) => {
    const newLines = [...saleLines];
    const lineToUpdate = newLines[index];
    if (!lineToUpdate) return;
  
    (lineToUpdate as any)[field] = value;
  
    if (field === 'productId') {
      getProductDetailsAction(value as string).then(details => {
        setSaleLines(prevLines => {
          const updatedLines = [...prevLines];
          const currentLine = updatedLines[index];
          if (currentLine) {
            currentLine.productDetails = details;
            const selectedProduct = products.find(p => p.id === value);
            currentLine.name = selectedProduct?.name || "";
            if (details) {
              currentLine.quantity = 1;
              currentLine.totalAmount = details.sellingPrice;
            } else {
              currentLine.totalAmount = 0;
            }
          }
          return updatedLines;
        });
      });
    } else if (field === 'quantity' && lineToUpdate.productDetails) {
      const quantity = Number(value) || 0;
      lineToUpdate.totalAmount = quantity * lineToUpdate.productDetails.sellingPrice;
    }
  
    setSaleLines(newLines);
  };

  const removeSaleLine = (index: number) => setSaleLines(saleLines.filter((_, i) => i !== index));

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("transactionId", transaction.id);
    formData.append("groupId", transaction.appointmentGroupId);
    formData.append("customerId", selectedCustomerId);
    
    if (date && startTime) {
      const dateString = format(date, "yyyy-MM-dd");
      const fullDate = new Date(`${dateString}T${startTime}`);
      formData.append("dateTime", fullDate.toISOString());
    }
    
    formData.append("notes", notes);
    formData.append("paymentMethod", paymentMethod as PaymentMethod);
    
    serviceLines.forEach(line => {
        if(line.personnelId && line.serviceId && line.price){
            formData.append("personnelIds", line.personnelId);
            formData.append("serviceOrPackageIds", line.serviceId);
            formData.append("prices", line.price);
        }
    });
    
    saleLines.forEach(line => {
        if (line.productId && line.quantity > 0 && line.personnelId) {
            formData.append("soldProductIds", line.productId);
            formData.append("soldQuantities", String(line.quantity));
            formData.append("soldTotalAmounts", String(line.totalAmount));
            formData.append("soldPersonnelIds", line.personnelId);
        }
    });
    
    try {
      const result = await performFullUpdateKasaAction(formData);

      if (result.success) {
        toast({ title: "Başarılı", description: result.message });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast({ title: "Hata", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Beklenmedik bir sunucu hatası oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => {
      const servicesValid = serviceLines.length > 0 && serviceLines.every(line => line.personnelId && line.serviceId && line.price);
      const salesValid = saleLines.every(line => line.productId && line.quantity > 0 && line.personnelId && line.quantity <= (line.productDetails?.stock || 0));
      return selectedCustomerId && servicesValid && salesValid && paymentMethod;
  }, [selectedCustomerId, serviceLines, saleLines, paymentMethod]);

  const isDirty = useMemo(() => {
    if (!initialState) return false;

    const currentDateTime = date && startTime ? new Date(`${format(date, "yyyy-MM-dd")}T${startTime}`).toISOString() : "";
    
    const servicesChanged = JSON.stringify(serviceLines.map(({id, ...rest}) => rest)) !== JSON.stringify(initialState.serviceLines.map(({id, ...rest}) => rest));
    
    const saleValues = saleLines.map(({ productId, quantity, totalAmount, personnelId }) => ({ productId, quantity, totalAmount, personnelId }));
    const initialSaleValues = initialState.saleLines.map(({ productId, quantity, totalAmount, personnelId }) => ({ productId, quantity, totalAmount, personnelId }));
    const salesChanged = JSON.stringify(saleValues) !== JSON.stringify(initialSaleValues);

    const dateTimeChanged = currentDateTime !== initialState.dateTime;
    const notesChanged = notes !== initialState.notes;
    const paymentMethodChanged = paymentMethod !== initialState.paymentMethod;

    return servicesChanged || salesChanged || dateTimeChanged || notesChanged || paymentMethodChanged;
  }, [serviceLines, saleLines, date, startTime, notes, paymentMethod, initialState]);


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card p-0 flex flex-col max-h-[90vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Kasa Hareketini Düzenle</DialogTitle>
        <DialogDescription className="sr-only">Ödeme, randevu ve ürün satış detaylarını düzenleyin.</DialogDescription>
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-grow min-h-0">
            <div className="flex-grow overflow-y-auto px-6 pt-6 pb-6 space-y-4">
                
                <div className="space-y-3">
                  {serviceLines.map((line, index) => (
                      <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                              <Combobox options={personnelOptions} value={line.personnelId} onChange={(value) => updateServiceLine(index, 'personnelId', value)} placeholder="Personel seçin..." searchPlaceholder="Personel ara..." disabled={isSubmitting} />
                          </div>
                          <div className="col-span-4">
                              <Combobox options={serviceAndPackageOptions} value={line.serviceId} onChange={(value) => updateServiceLine(index, 'serviceId', value)} placeholder="Hizmet veya Paket..." searchPlaceholder="Hizmet/Paket ara..." disabled={isSubmitting || !line.personnelId}/>
                          </div>
                          <div className="col-span-3">
                              <div className="relative flex items-center h-10">
                                  <Input
                                      type="number"
                                      value={line.price}
                                      onChange={(e) => updateServiceLine(index, 'price', e.target.value)}
                                      placeholder="Fiyat"
                                      className="h-10 w-full rounded-md shadow-md pl-2 pr-6"
                                      required
                                      disabled={isSubmitting || !line.serviceId}
                                      step="0.01"
                                      min="0"
                                  />
                                  <span className="absolute inset-y-0 right-1.5 flex items-center text-xs text-muted-foreground pointer-events-none">₺</span>
                              </div>
                          </div>
                           <div className="col-span-1 flex justify-end">
                              {serviceLines.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeServiceLine(index)} className="text-destructive hover:text-destructive h-8 w-8" disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                              )}
                          </div>
                      </div>
                  ))}
                </div>
                
                 <Button type="button" variant="outline" size="sm" onClick={addServiceLine} className="w-full" disabled={isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Hizmet Ekle
                </Button>
                
                <Separator />
                
                <div className="space-y-3">
                    {saleLines.map((line, index) => (
                        <div key={line.id} className="space-y-2 p-2 border rounded-md">
                            <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-6">
                                    <Combobox options={productOptions} value={line.productId} onChange={(value) => updateSaleLine(index, 'productId', value)} placeholder="Ürün seçin..." searchPlaceholder="Ürün ara..." disabled={isSubmitting}/>
                                </div>
                                <div className="col-span-2">
                                    <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                        <Input type="number" value={line.quantity} onChange={(e) => updateSaleLine(index, 'quantity', parseInt(e.target.value) || 1)} className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-12" disabled={isSubmitting || !line.productId} min="1" max={line.productDetails?.stock}/>
                                        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground pointer-events-none">Adet</span>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                                        <Input id="totalAmount" name="totalAmount" type="number" value={line.totalAmount} onChange={(e) => updateSaleLine(index, 'totalAmount', parseFloat(e.target.value) || 0)} placeholder="Tutar" className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full pr-8" step="0.01" min="0" required disabled={isSubmitting || !line.productId} />
                                        <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">₺</span>
                                    </div>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSaleLine(index)} className="text-destructive hover:text-destructive h-8 w-8" disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                             <Combobox 
                                options={personnelOptions} 
                                value={line.personnelId} 
                                onChange={(value) => updateSaleLine(index, 'personnelId', value)} 
                                placeholder="Satışı yapan personeli seçin..." 
                                searchPlaceholder="Personel ara..." 
                                disabled={isSubmitting || !line.productId}
                            />
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addSaleLine} className="w-full" disabled={isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Ürün Satışı Ekle
                    </Button>
                </div>
                 
                <Separator />
                
                 <div className="grid grid-cols-2 gap-4">
                    <SingleDatePicker date={date} onDateChange={setDate} disabled={isSubmitting} />
                    <div className="flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring bg-card h-10">
                        <Input id="startTime" name="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg pl-2 h-full" disabled={isSubmitting} step="900" />
                    </div>
                </div>
                <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring h-10">
                    <Input id="notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notlar..." className="w-full h-full border-0 bg-card focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 pr-3 text-sm placeholder:text-muted-foreground font-bold text-destructive" disabled={isSubmitting} />
                </div>
                
                 <div>
                    <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid grid-cols-3 gap-4 pt-4"
                    disabled={isSubmitting}
                    >
                    <div>
                        <RadioGroupItem value="Nakit" id="nakit" className="peer sr-only" />
                        <Label
                        htmlFor="nakit"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                        Nakit
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="Kart" id="kart" className="peer sr-only" />
                        <Label
                        htmlFor="kart"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                        Kart
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="Havale/EFT" id="havale" className="peer sr-only" />
                        <Label
                        htmlFor="havale"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                        Havale/EFT
                        </Label>
                    </div>
                    </RadioGroup>
                </div>

            </div>
            <DialogFooter className="p-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid || !isDirty}>
                    {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
