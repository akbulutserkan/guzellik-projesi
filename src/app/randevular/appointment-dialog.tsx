
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
import { useState, type FormEvent, useMemo, useEffect, useRef } from "react";
import { performAddAppointmentAction } from "./actions";
import type { Customer } from "../musteriler/actions";
import { CustomerDialog } from "../musteriler/customer-dialog";
import type { Personel } from "../personeller/actions";
import type { Service } from "../hizmetler/actions";
import type { Package } from "../paketler/actions";
import { PlusCircle, Trash2, BadgeCent, Calendar as CalendarIcon } from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { getCustomerPackagesAction, type CustomerPackageInfo } from "../paket-satislar/actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";


interface ServiceLine {
    id: number;
    personnelId: string;
    serviceId: string;
    price: string;
    isPackageSession: boolean;
    packageSaleId?: string;
    name: string;
    showAllServices: boolean;
}

interface AppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  personnelList: Personel[];
  services: Service[];
  packages: Package[];
  onSuccess?: () => void;
  onCustomerAdded?: (newCustomer: Customer) => void; 
  initialData?: { start: Date; end: Date; resourceId?: string };
}

export function AppointmentDialog({ 
    isOpen, 
    onOpenChange, 
    customers, 
    personnelList, 
    services, 
    packages,
    onSuccess,
    onCustomerAdded,
    initialData
}: AppointmentDialogProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [customerPackages, setCustomerPackages] = useState<CustomerPackageInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const firstServiceComboboxRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    if (isOpen && scrollableRef.current) {
        scrollableRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
        if(initialData) {
            const defaultPersonnelId = initialData.resourceId || "";
            const initialServiceLine = { 
                id: 1, 
                personnelId: defaultPersonnelId, 
                serviceId: "", 
                price: "", 
                isPackageSession: false, 
                packageSaleId: undefined, 
                name: "", 
                showAllServices: false 
            };
    
            setServiceLines([initialServiceLine]);
            setDate(initialData.start);
            setStartTime(format(initialData.start, 'HH:mm'));
        } else {
             setServiceLines([{ id: 1, personnelId: "", serviceId: "", price: "", isPackageSession: false, packageSaleId: undefined, name: "", showAllServices: false }]);
             setDate(new Date());
             setStartTime("10:00");
        }
        
        setSelectedCustomerId("");
        setCustomerPackages([]);
        setNotes("");
        
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const fetchPackages = async () => {
        if (selectedCustomerId) {
            const pkgs = await getCustomerPackagesAction(selectedCustomerId);
            setCustomerPackages(pkgs);
            const firstLine = serviceLines.length > 0 ? serviceLines[0] : { id: 1, personnelId: "", serviceId: "", price: "", isPackageSession: false, packageSaleId: undefined, name: "", showAllServices: false };
            setServiceLines([firstLine]);
            
            setTimeout(() => {
                firstServiceComboboxRef.current?.focus();
                firstServiceComboboxRef.current?.click();
            }, 100);

        } else {
            setCustomerPackages([]);
        }
    };
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: `${c.fullName} (${formatPhoneNumber(c.phone)})` })), [customers]);
  const personnelOptions = useMemo(() => personnelList.map(p => ({ value: p.id, label: p.fullName })), [personnelList]);
  
  const regularServiceOptions = useMemo(() => services.map(s => ({
      value: s.id,
      label: s.name,
      price: s.price,
      isPackageSession: false,
  })), [services]);

  const packageServiceOptions = useMemo(() => {
    return customerPackages.flatMap(pkgInfo => 
      pkgInfo.serviceIds.map(serviceId => {
        const serviceDetails = services.find(s => s.id === serviceId);
        if (!serviceDetails) return null;
        
        return {
          value: serviceId,
          label: `(Paket) ${serviceDetails.name}`,
          price: 0,
          isPackageSession: true,
          packageSaleId: pkgInfo.saleId
        };
      }).filter(Boolean)
    ) as { value: string; label: string; price: number; isPackageSession: boolean; packageSaleId: string }[];
  }, [customerPackages, services]);

  const getServiceOptionsForLine = (line: ServiceLine) => {
    const selectedPersonnel = personnelList.find(p => p.id === line.personnelId);
    
    const personnelServices = regularServiceOptions.filter(serviceOption => 
        selectedPersonnel?.serviceIds.includes(serviceOption.value)
    );
    
    const baseOptions = line.showAllServices ? regularServiceOptions : personnelServices;

    const combinedOptions = [
      ...packageServiceOptions, 
      ...baseOptions.filter(opt => !packageServiceOptions.some(pOpt => pOpt.value === opt.value))
    ];
    
    return combinedOptions;
  }

  const addServiceLine = () => {
    setServiceLines([...serviceLines, { id: Date.now(), personnelId: "", serviceId: "", price: "", isPackageSession: false, name: "", showAllServices: false }]);
  };

  const updateServiceLine = (id: number, field: keyof Omit<ServiceLine, 'id' | 'name'>, value: string | boolean) => {
      setServiceLines(prevLines =>
        prevLines.map(line => {
          if (line.id === id) {
            const updatedLine = { ...line, [field]: value };
            
            if (field === 'serviceId' && typeof value === 'string') {
                const allPossibleOptions = [...packageServiceOptions, ...regularServiceOptions];
                const selectedOption = allPossibleOptions.find(opt => opt.value === value);
                
                if (selectedOption) {
                    updatedLine.price = String(selectedOption.price || 0);
                    updatedLine.isPackageSession = !!selectedOption.isPackageSession;
                    updatedLine.packageSaleId = (selectedOption as any).packageSaleId;
                    updatedLine.name = selectedOption.label;
                }
            }
             if (field === 'personnelId') {
                updatedLine.serviceId = "";
                updatedLine.price = "";
                updatedLine.name = "";
                updatedLine.showAllServices = false;
            }

            return updatedLine;
          }
          return line;
        })
      );
  };
  
  const toggleShowAllServices = (lineId: number) => {
    setServiceLines(prevLines =>
        prevLines.map(line =>
            line.id === lineId ? { ...line, showAllServices: !line.showAllServices, serviceId: "", price: "", name: "" } : line
        )
    );
  };

  const removeServiceLine = (id: number) => {
    setServiceLines(serviceLines.filter(line => line.id !== id));
  };
  
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("customerId", selectedCustomerId);
    
    if (date && startTime) {
      const dateString = format(date, "yyyy-MM-dd");
      const fullDate = new Date(`${dateString}T${startTime}`);
      formData.append("dateTime", fullDate.toISOString());
    }
    
    formData.append("notes", notes);
    
    serviceLines.forEach(line => {
        if (line.personnelId && line.serviceId) {
            formData.append("personnelIds", line.personnelId);
            formData.append("serviceOrPackageIds", line.serviceId);
            formData.append("prices", line.price);
            formData.append("isPackageSession", String(line.isPackageSession));
            formData.append("packageSaleIds", line.packageSaleId || "");
        }
    });
    
    try {
      const result = await performAddAppointmentAction(formData);

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

  const handleNewCustomerSuccess = (newCustomer?: Customer) => {
      if(newCustomer){
        onCustomerAdded?.(newCustomer); 
        setSelectedCustomerId(newCustomer.id);
      }
  }

  const isFormValid = useMemo(() => {
      return selectedCustomerId && date && serviceLines.length > 0 && serviceLines.every(line => line.personnelId && line.serviceId && line.price !== "");
  }, [selectedCustomerId, date, serviceLines]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) setCustomerSearchQuery(''); }}>
        <DialogContent 
            className="sm:max-w-3xl p-0 flex flex-col rounded-xl shadow-xl border-2 border-border max-h-[95vh]"
            hideCloseButton={true}
        >
              <div className="flex-shrink-0 p-6 pb-4 space-y-4 bg-background z-10 border-b rounded-t-xl">
                  <div className="flex items-center justify-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button"
                                className="flex flex-col items-center justify-center text-center w-14 h-14 cursor-pointer rounded-full hover:bg-accent transition-colors group border shadow-md"
                                disabled={isSubmitting}
                                >
                                    <span className="text-xs font-semibold uppercase text-muted-foreground group-hover:text-primary">
                                        {date ? format(date, 'EEE', { locale: tr }) : ''}
                                    </span>
                                    <span className="text-xl font-bold text-primary">
                                        {date ? format(date, 'd') : ''}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    locale={tr}
                                    captionLayout="dropdown-buttons"
                                    fromYear={2020}
                                    toYear={new Date().getFullYear() + 1}
                                />
                            </PopoverContent>
                        </Popover>
                        <CustomTimePicker
                            value={startTime}
                            onChange={setStartTime}
                            disabled={isSubmitting}
                        />
                  </div>
                  <Combobox
                      options={customerOptions}
                      value={selectedCustomerId}
                      onChange={setSelectedCustomerId}
                      placeholder="Müşteri seçin..."
                      searchPlaceholder="Müşteri ara..."
                      noResultsText="Müşteri bulunamadı."
                      onSearchChange={setCustomerSearchQuery}
                      disabled={isSubmitting}
                      action={
                          <CustomerDialog
                            onSuccess={handleNewCustomerSuccess}
                            initialName={customerSearchQuery}
                          >
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full h-8"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Yeni Müşteri Ekle
                            </Button>
                          </CustomerDialog>
                      }
                    />
              </div>

              
                <form id="appointment-form" onSubmit={handleFormSubmit} className="flex flex-col flex-grow min-h-0">
                  <ScrollArea 
                    className="flex-grow min-h-0"
                    ref={scrollableRef} 
                    tabIndex={0} 
                    onWheel={(e) => e.stopPropagation()}
                  >
                  <div className="p-4 space-y-4">
                      <div className="space-y-3">
                          {serviceLines.map((line, index) => (
                            <div key={line.id} className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-4">
                                    <Combobox
                                        options={personnelOptions}
                                        value={line.personnelId}
                                        onChange={(value) => updateServiceLine(line.id, 'personnelId', value)}
                                        placeholder="Personel seçin..."
                                        searchPlaceholder="Personel ara..."
                                        disabled={isSubmitting}
                                        listClassName="max-h-48"
                                    />
                                </div>
                                <div className="col-span-5">
                                    <Combobox
                                        ref={index === 0 ? firstServiceComboboxRef : null}
                                        options={getServiceOptionsForLine(line)}
                                        value={line.serviceId}
                                        onChange={(value) => updateServiceLine(line.id, 'serviceId', value)}
                                        placeholder="Hizmet veya Paket seçin..."
                                        searchPlaceholder="Hizmet/Paket ara..."
                                        disabled={isSubmitting || !selectedCustomerId || !line.personnelId}
                                        noResultsText={!selectedCustomerId ? "Önce müşteri seçin" : !line.personnelId ? "Önce personel seçin" : "Sonuç bulunamadı"}
                                        listClassName="max-h-48"
                                        action={
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="w-full h-8"
                                                onClick={() => toggleShowAllServices(line.id)}
                                            >
                                                {line.showAllServices ? 'Verdiği Hizmetleri Göster' : 'Tüm Hizmetleri Göster'}
                                            </Button>
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                {line.isPackageSession ? (
                                    <div className="flex items-center justify-center h-10">
                                        <Badge variant="secondary" className="h-10 text-sm w-full justify-center">
                                            <BadgeCent className="mr-2 h-4 w-4"/>
                                            Paket
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="relative flex items-center h-10 rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                        <Input
                                            type="number"
                                            name="prices"
                                            value={line.price}
                                            onChange={(e) => updateServiceLine(line.id, 'price', e.target.value)}
                                            placeholder="Fiyat"
                                            className="h-10 w-full pl-2 pr-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            required
                                            disabled={!line.serviceId}
                                            step="0.01"
                                            min="0"
                                        />
                                        <span className="absolute inset-y-0 right-1.5 flex items-center text-xs text-muted-foreground pointer-events-none">₺</span>
                                    </div>
                                )}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {serviceLines.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeServiceLine(line.id)}
                                            className="text-destructive hover:text-destructive h-8 w-8"
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                          ))}
                      </div>
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addServiceLine}
                          className="w-full mt-3"
                          disabled={isSubmitting || !selectedCustomerId}
                      >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Bir Hizmet Daha Ekle
                      </Button>
                      <Separator className="my-4"/>
                      <div className="relative flex items-center rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 h-10">
                          <Input
                              id="notes"
                              name="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Notlar..."
                              className="w-full h-full border-0 bg-card focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 pr-3 font-bold text-destructive text-sm placeholder:text-muted-foreground"
                              disabled={isSubmitting}
                          />
                      </div>
                  </div>
                </ScrollArea>
              </form>

              <DialogFooter className="flex-shrink-0 px-6 py-3 border-t bg-secondary rounded-b-xl">
                <Button type="submit" form="appointment-form" disabled={isSubmitting || !isFormValid} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-12 text-lg">
                  {isSubmitting ? "Oluşturuluyor..." : "Randevu Oluştur"}
                </Button>
              </DialogFooter>

        </DialogContent>
      </Dialog>
      <CustomerDialog
          onSuccess={handleNewCustomerSuccess}
          initialName={customerSearchQuery}
      >
        <div />
      </CustomerDialog>
    </>
  );
}
