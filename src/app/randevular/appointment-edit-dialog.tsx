
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, useMemo, useEffect, useRef } from "react";
import { 
    performFullUpdateAppointmentAction, 
    performDeleteAppointmentAction, 
    getSalesForAppointmentGroupAction,
    performPaymentAndUseSessionAction
} from "./actions";
import type { Customer } from "../musteriler/actions";
import { CustomerDialog } from "../musteriler/customer-dialog";
import type { Personel } from "../personeller/actions";
import type { Service } from "../hizmetler/actions";
import type { Package } from "../paketler/actions";
import { RotateCw, X, Edit } from "lucide-react";
import { format } from "date-fns";
import type { CalendarEvent } from "../takvim/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription as AlertDescription,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle as AlertTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Product as SaleableProduct, Sale } from "../urun-satislar/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppointmentEditDialogHeader } from "./appointment-edit-dialog-header";
import { AppointmentEditServiceList } from "./appointment-edit-service-list";
import { AppointmentEditProductList } from "./appointment-edit-product-list";
import { formatCurrency } from "@/lib/utils";
import type { Appointment, PaymentMethod } from "./actions";


export interface ServiceLine {
    id: string; 
    personnelId: string;
    serviceId: string;
    price: string;
    name: string; 
    isPackageSession: boolean;
    packageSaleId?: string;
    isNew?: boolean;
}
export interface SaleLine {
    id: number; 
    productId: string;
    quantity: number;
    totalAmount: number;
    personnelId: string;
    productDetails?: { stock: number; sellingPrice: number } | null;
    name: string; 
}
interface AppointmentEditDialogProps {
  appointment: CalendarEvent;
  allAppointments: CalendarEvent[];
  customers: Customer[];
  personnelList: Personel[];
  services: Service[];
  packages: Package[];
  products: SaleableProduct[];
  onFullSuccess?: () => void;
  onPartialSuccess?: (newCustomer?: Customer) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function AppointmentEditDialog({ 
    appointment, 
    allAppointments,
    customers, 
    personnelList, 
    services, 
    packages, 
    products,
    onFullSuccess,
    onPartialSuccess,
    isOpen, 
    onOpenChange, 
}: AppointmentEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  
  // Current state
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  
  const [totalPrice, setTotalPrice] = useState(0);
  
  const [allGroupIds, setAllGroupIds] = useState<string[]>([]);
  const [appointmentsInGroup, setAppointmentsInGroup] = useState<Appointment[]>([]);
  
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const initialServiceLinesRef = useRef<ServiceLine[]>([]);
  const initialSaleLinesRef = useRef<SaleLine[]>([]);
  const initialAppointmentRef = useRef<CalendarEvent | null>(null);

  useEffect(() => {
    if (isOpen && scrollableRef.current) {
        scrollableRef.current.focus();
    }
  }, [isOpen]);

  // Populate form when dialog opens
  useEffect(() => {
    const initializeDialog = async () => {
        if (isOpen && appointment) {
            setIsPaymentMode(false); // Reset payment mode on open
            const dayAppointments = allAppointments
            .filter(a => a.groupId === appointment.groupId)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
            
            const uniqueGroupIds = [...new Set(dayAppointments.map(a => a.groupId))];
            const salesForGroup = await getSalesForAppointmentGroupAction(uniqueGroupIds);

            const servicesData = dayAppointments.map(app => ({
                id: app.id,
                personnelId: app.personnelId,
                serviceId: app.serviceId,
                price: app.isPackageSession ? '0' : String(app.price),
                name: app.serviceName,
                isPackageSession: app.isPackageSession || false,
                packageSaleId: app.packageSaleId,
            }));
            
            const salesData = salesForGroup.map((sale: Sale, index: number) => ({
                id: Date.now() + index,
                productId: sale.productId,
                quantity: sale.quantity,
                totalAmount: sale.totalAmount,
                personnelId: sale.personnelId || "",
                productDetails: { stock: products.find(p=>p.id === sale.productId)?.stock || 0, sellingPrice: sale.totalAmount / sale.quantity },
                name: sale.productName,
            }));
            
            // Store initial state for dirty checking
            initialServiceLinesRef.current = JSON.parse(JSON.stringify(servicesData)); 
            initialSaleLinesRef.current = JSON.parse(JSON.stringify(salesData));
            initialAppointmentRef.current = JSON.parse(JSON.stringify(dayAppointments[0]));

            if (dayAppointments.length > 0) {
                const firstAppointment = dayAppointments[0];
                const customerId = firstAppointment.customerId;
                
                setSelectedCustomerId(customerId);
                setDate(firstAppointment.start);
                setStartTime(format(firstAppointment.start, 'HH:mm'));
                setNotes(firstAppointment.notes || "");
                setShowNotes(!!firstAppointment.notes);
                setAllGroupIds(uniqueGroupIds);
            }
            setAppointmentsInGroup(dayAppointments as Appointment[]);
            setServiceLines(servicesData);
            setSaleLines(salesData);
        }
    };
    initializeDialog();
  }, [isOpen, appointment, allAppointments, products, customers]);

  const customer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const hasPackageSession = useMemo(() => serviceLines.some(l => l.isPackageSession), [serviceLines]);

  const isDirty = useMemo(() => {
    if (!isOpen || !appointment || !initialAppointmentRef.current) return false;

    // Compare service lines
    const currentServiceLines = serviceLines.map(({ id, personnelId, serviceId, price, isPackageSession, packageSaleId }) => ({ id, personnelId, serviceId, price, isPackageSession, packageSaleId }));
    const initialServiceLines = initialServiceLinesRef.current.map(({ id, personnelId, serviceId, price, isPackageSession, packageSaleId }) => ({ id, personnelId, serviceId, price, isPackageSession, packageSaleId }));
    if (JSON.stringify(currentServiceLines) !== JSON.stringify(initialServiceLines)) return true;
    
    // Compare sale lines
    const currentSaleLines = saleLines.map(({ productId, quantity, totalAmount, personnelId }) => ({ productId, quantity, totalAmount, personnelId }));
    const initialSaleLines = initialSaleLinesRef.current.map(({ productId, quantity, totalAmount, personnelId }) => ({ productId, quantity, totalAmount, personnelId }));
    if(JSON.stringify(currentSaleLines) !== JSON.stringify(initialSaleLines)) return true;

    // Compare main appointment details
    const originalFirstAppointment = initialAppointmentRef.current;
    if (date && format(date, 'yyyy-MM-dd') !== format(new Date(originalFirstAppointment.start), 'yyyy-MM-dd')) return true;
    if (startTime !== format(new Date(originalFirstAppointment.start), 'HH:mm')) return true;
    if (notes !== (originalFirstAppointment.notes || "")) return true;

    return false;
  }, [isOpen, appointment, serviceLines, saleLines, date, startTime, notes]);
  
  useEffect(() => {
    const serviceTotal = serviceLines
        .filter(l => !l.isPackageSession)
        .reduce((sum, currentLine) => sum + (parseFloat(currentLine.price) || 0), 0);
    const saleTotal = saleLines.reduce((sum, saleLine) => sum + saleLine.totalAmount, 0);
    setTotalPrice(serviceTotal + saleTotal);
  }, [serviceLines, saleLines]);


  const handlePayment = async (paymentMethod: PaymentMethod) => {
    setIsSubmitting(true);
    const totalServiceAmount = serviceLines
      .filter(line => !line.isPackageSession)
      .reduce((sum, line) => sum + (parseFloat(line.price) || 0), 0);
    
    const totalProductAmount = saleLines.reduce((sum, line) => sum + line.totalAmount, 0);

    try {
      const result = await performPaymentAndUseSessionAction({
        groupId: appointment.groupId,
        customerId: selectedCustomerId,
        customerName: customer?.fullName || "",
        totalServiceAmount,
        totalProductAmount,
        grandTotalAmount: totalServiceAmount + totalProductAmount,
        paymentMethod: paymentMethod,
        appointmentsInGroup: appointmentsInGroup,
      });

      if (result.success) {
        toast({ title: "Ödeme Başarılı", description: "İşlem başarıyla kaydedildi." });
        onFullSuccess?.();
      } else {
        toast({ title: "Ödeme Hatası", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Sunucu Hatası", description: "Ödeme işlemi sırasında bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsPaymentMode(false);
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("groupId", appointment.groupId);
    formData.append("allGroupIdsToDelete", allGroupIds.join(','));
    formData.append("customerId", selectedCustomerId);
    
    const serviceDurationsChanged = serviceLines.length !== initialServiceLinesRef.current.length || 
        serviceLines.some((line, index) => line.serviceId !== initialServiceLinesRef.current[index]?.serviceId);
    formData.append("isDurationChanged", String(serviceDurationsChanged));
    
    if (date && startTime) {
      const dateString = format(date, "yyyy-MM-dd");
      const fullDate = new Date(`${dateString}T${startTime}`);
      formData.append("dateTime", fullDate.toISOString());
    }
    
    formData.append("notes", showNotes ? notes : "");
    
    serviceLines.forEach(line => {
        if(line.personnelId && line.serviceId){
            formData.append("personnelIds", line.personnelId);
            formData.append("serviceOrPackageIds", line.serviceId);
            formData.append("prices", line.price);
            formData.append("isPackageSession", String(line.isPackageSession));
            if (line.packageSaleId) {
                formData.append("packageSaleIds", line.packageSaleId);
            } else {
                formData.append("packageSaleIds", "");
            }
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
      const result = await performFullUpdateAppointmentAction(formData);
      if (result.success) {
        toast({ title: "Başarılı", description: result.message });
        onFullSuccess?.();
      } else {
        toast({ title: "Hata", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Beklenmedik bir sunucu hatası oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      for (const groupId of allGroupIds) {
        await performDeleteAppointmentAction(groupId);
      }
      toast({ title: "Başarılı", description: "Randevu başarıyla iptal edildi." });
      
      onFullSuccess?.();
    } catch (error) {
      toast({ title: "Hata", description: "Randevu iptal edilirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };
   const handleNewCustomerSuccess = (newCustomer?: Customer) => {
      if(newCustomer){
        onPartialSuccess?.(newCustomer);
        setSelectedCustomerId(newCustomer.id);
        setIsAddCustomerOpen(false);
      }
  }

  const isFormValid = useMemo(() => {
      const servicesValid = serviceLines.length > 0 && serviceLines.every(line => line.personnelId && line.serviceId);
      const salesValid = saleLines.every(line => line.productId && line.quantity > 0 && line.personnelId && line.quantity <= (line.productDetails?.stock || 0));
      return selectedCustomerId && servicesValid && salesValid;
  }, [selectedCustomerId, serviceLines, saleLines]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
            className="sm:max-w-3xl p-0 flex flex-col max-h-[95vh] border-2 border-border shadow-xl"
            hideCloseButton={true}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Randevu Düzenle</DialogTitle>
            <DialogDescription>Mevcut bir randevunun hizmetlerini, ürünlerini, zamanını veya notlarını düzenleyin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="flex flex-col flex-grow min-h-0">
            <AppointmentEditDialogHeader
                customerName={customer?.fullName || ""}
                customerPhone={customer?.phone || ""}
                date={date}
                onDateChange={setDate}
                startTime={startTime}
                onStartTimeChange={setStartTime}
                onAddService={() => setServiceLines([...serviceLines, { id: `new_${Date.now()}`, personnelId: "", serviceId: "", price: "", name: "", isPackageSession: false, isNew: true }])}
                onAddProduct={() => setSaleLines([...saleLines, { id: Date.now(), productId: "", quantity: 1, totalAmount: 0, personnelId: "", productDetails: null, name: "" }])}
                onAddNote={() => setShowNotes(true)}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
                showNotes={showNotes}
            />
            
            <ScrollArea className="flex-grow min-h-0" ref={scrollableRef} tabIndex={0} onWheel={(e) => e.stopPropagation()}>
              <div className="p-6 pt-2 space-y-4">
                <AppointmentEditServiceList
                    serviceLines={serviceLines}
                    personnelList={personnelList}
                    services={services}
                    packages={packages}
                    setServiceLines={setServiceLines}
                    onPartialSuccess={onPartialSuccess}
                    appointmentGroupId={appointment.groupId}
                    selectedCustomerId={selectedCustomerId}
                    isSubmitting={isSubmitting}
                    isDeleting={isDeleting}
                />
                
                <AppointmentEditProductList
                    saleLines={saleLines}
                    setSaleLines={setSaleLines}
                    products={products}
                    personnelList={personnelList}
                    isSubmitting={isSubmitting}
                    isDeleting={isDeleting}
                />

                {showNotes && (
                        <div className="relative flex items-center rounded-md shadow-md h-9 mt-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <input
                                id="notes" 
                                name="notes" 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="Notlar..." 
                                className="w-full h-full border-0 bg-card focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 pr-8 text-sm font-bold text-destructive placeholder:text-muted-foreground" 
                                disabled={isSubmitting || isDeleting} 
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 h-9 w-9 text-muted-foreground"
                                onClick={() => {
                                    setShowNotes(false);
                                    setNotes("");
                                }}
                            >
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            <div className="p-3 pt-2 border-t bg-secondary flex-shrink-0">
                <div className="flex w-full items-center gap-2">
                     {isPaymentMode ? (
                        <div className="grid grid-cols-4 gap-1 w-full">
                            <Button type="button" onClick={() => handlePayment("Nakit")} disabled={isSubmitting} className="h-10 bg-green-600 hover:bg-green-700">Nakit</Button>
                            <Button type="button" onClick={() => handlePayment("Kart")} disabled={isSubmitting} className="h-10 bg-blue-600 hover:bg-blue-700">Kart</Button>
                            <Button type="button" onClick={() => handlePayment("Havale/EFT")} disabled={isSubmitting} className="h-10 bg-purple-600 hover:bg-purple-700">Havale</Button>
                            <Button type="button" variant="destructive" onClick={() => setIsPaymentMode(false)} disabled={isSubmitting} className="h-10">Vazgeç</Button>
                        </div>
                     ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            type="button" 
                                            variant="ghost"
                                            className="h-10 w-10 bg-white hover:bg-gray-100 flex items-center justify-center text-2xl shadow-lg hover:shadow-xl active:shadow-md active:translate-y-0.5 transition-all duration-200 ease-in-out rounded-xl"
                                            disabled={isSubmitting || isDeleting}
                                        >
                                            <span className="text-red-600">❌</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertContent>
                                        <AlertHeader>
                                            <AlertTitle>Bu Randevuyu İptal Etmek İstediğinize Emin misiniz?</AlertTitle>
                                            <AlertDescription>
                                                Bu müşterinin bu randevusunu ve varsa ilişkili ürün satışlarını kalıcı olarak iptal edecektir.
                                            </AlertDescription>
                                        </AlertHeader>
                                        <AlertFooter>
                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                {isDeleting ? "İptal Ediliyor..." : "Evet, İptal Et"}
                                            </AlertDialogAction>
                                        </AlertFooter>
                                    </AlertContent>
                                </AlertDialog>
                                <Button 
                                    type="submit" 
                                    className="h-10 w-10 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center justify-center text-white shadow-lg hover:shadow-xl active:shadow-md active:translate-y-0.5 transition-all duration-200 ease-in-out rounded-xl" 
                                    disabled={isSubmitting || isDeleting || !isDirty || appointment.status === 'completed'}
                                >
                                    {isSubmitting ? <RotateCw className="h-5 w-5 animate-spin" /> : <Edit className="h-5 w-5" />}
                                </Button>
                            </div>
                            <div className="flex-grow">
                                <Button 
                                    type="button" 
                                    className="bg-green-700 hover:bg-green-800 text-white w-full h-10 text-sm font-semibold"
                                    disabled={isSubmitting || isDeleting || !isFormValid || appointment.status === 'completed'}
                                    onClick={() => setIsPaymentMode(true)}
                                >
                                    { hasPackageSession && totalPrice === 0 ? "Kullanım Düş ve Kapat" :
                                    hasPackageSession && totalPrice > 0 ? `${formatCurrency(totalPrice)} Öde, Kullanım Düş ve Kapat` :
                                    totalPrice > 0 ? `${formatCurrency(totalPrice)} Ödeme Al ve Kapat` :
                                    "Randevuyu Kapat"
                                    }
                                </Button>
                            </div>
                        </>
                     )}
                </div>
            </div>
          </form>
        </DialogContent>
    </Dialog>

     <CustomerDialog
        onSuccess={handleNewCustomerSuccess}
      >
        <div/>
      </CustomerDialog>
    </>
  );
}
