
"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent, type ReactNode, useEffect, useMemo } from "react";
import { performAddPersonelAction, performUpdatePersonelAction, type Personel, type PersonelStatus, type WorkingDays } from "./actions";
import type { Service, Category } from "../hizmetler/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type ServicesByCategory = Record<string, Category & { services: Service[] }>;

interface PersonelDialogProps {
  children: ReactNode;
  personel?: Personel;
  servicesByCategory: ServicesByCategory;
  onSuccess?: () => void;
}

const daysOfWeek = [
    { id: '1', label: 'Pazartesi' },
    { id: '2', label: 'Salı' },
    { id: '3', label: 'Çarşamba' },
    { id: '4', label: 'Perşembe' },
    { id: '5', label: 'Cuma' },
    { id: '6', label: 'Cumartesi' },
    { id: '0', label: 'Pazar' },
];

const defaultWorkingDays: WorkingDays = {
    '1': { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
    '2': { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
    '3': { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
    '4': { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
    '5': { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
    '6': { isWorkingDay: false, startTime: '10:00', endTime: '16:00' },
    '0': { isWorkingDay: false, startTime: '10:00', endTime: '16:00' },
};


export function PersonelDialog({ children, personel, servicesByCategory, onSuccess }: PersonelDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = personel !== undefined;

  const [fullName, setFullName] = useState(personel?.fullName || "");
  const [phone, setPhone] = useState(personel?.phone || "");
  const [status, setStatus] = useState<PersonelStatus | "">(personel?.status || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(personel?.serviceIds || []);
  const [workingDays, setWorkingDays] = useState<WorkingDays>(personel?.workingDays || {});

  const statusOptions: {value: PersonelStatus, label: string}[] = [
    { value: "Personel", label: "Personel" },
    { value: "Yönetici", label: "Yönetici" },
    { value: "Kasa", label: "Kasa" }
  ];

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
    const servicesChanged = JSON.stringify(selectedServices.sort()) !== JSON.stringify(personel?.serviceIds.sort());
    const workingDaysChanged = JSON.stringify(workingDays) !== JSON.stringify(personel?.workingDays || {});

    return (
        fullName !== personel?.fullName ||
        phone !== personel?.phone ||
        status !== personel?.status ||
        servicesChanged ||
        workingDaysChanged
    );
  }, [fullName, phone, status, selectedServices, workingDays, personel, isEditMode]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    if(isEditMode) {
        formData.append('id', personel.id);
    }
    formData.set('phone', phone);
    formData.set('status', status as PersonelStatus);
    
    selectedServices.forEach(id => formData.append('serviceIds', id));
    
    const action = isEditMode ? performUpdatePersonelAction : performAddPersonelAction;

    try {
      const result = await action(formData);

      if (result.success) {
        toast({
          title: isEditMode ? "Personel Güncellendi" : "Personel Eklendi",
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
  };
  
   useEffect(() => {
    if (open) {
      setFullName(personel?.fullName || "");
      setPhone(personel?.phone || "");
      setStatus(personel?.status || "");
      setSelectedServices(personel?.serviceIds || []);
      setWorkingDays(personel?.workingDays && Object.keys(personel.workingDays).length > 0 ? personel.workingDays : {});
    }
  }, [open, personel]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  const handleSelectAllCategoryServices = (categoryId: string, isSelected: boolean) => {
    const categoryServices = servicesByCategory[categoryId]?.services.map(s => s.id) || [];
    setSelectedServices(prev => {
        const otherServices = prev.filter(sId => !categoryServices.includes(sId));
        return isSelected ? [...otherServices, ...categoryServices] : otherServices;
    });
  };

  const handleWorkingDayChange = (dayId: string, field: 'isWorkingDay' | 'startTime' | 'endTime', value: boolean | string) => {
    setWorkingDays(prev => {
        const daySettings = prev[dayId] || defaultWorkingDays[dayId];
        const newSettings = { ...prev };
        
        if (field === 'isWorkingDay') {
             if (value) {
                newSettings[dayId] = { ...daySettings, isWorkingDay: true };
            } else {
                if (newSettings[dayId]) {
                    delete newSettings[dayId];
                }
            }
        } else {
            newSettings[dayId] = { ...daySettings, [field]: value };
        }

        return newSettings;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl bg-card p-0 flex flex-col h-full max-h-[95vh] rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogTitle className="sr-only">Personel Düzenle</DialogTitle>
        <DialogDescription className="sr-only">Personel bilgilerini güncelleyin.</DialogDescription>
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow">
              <div className="px-6 py-6 space-y-6">
                  <div className="space-y-4">
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
                      <div className="grid grid-cols-2 gap-4">
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
                          <Select
                              value={status}
                              onValueChange={(value) => setStatus(value as PersonelStatus)}
                              required
                              disabled={isSubmitting}
                          >
                              <SelectTrigger className="h-10 rounded-md shadow-md focus:ring-2 focus:ring-ring bg-card">
                                <SelectValue placeholder="Statü seçin..." />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                      </div>
                  </div>

                  <Accordion type="multiple" className="w-full space-y-4">
                      <AccordionItem value="services" className="border-none">
                           <AccordionTrigger className="px-4 py-3 hover:no-underline font-medium rounded-lg shadow-sm border bg-muted/50 data-[state=open]:rounded-b-none">Verdiği Hizmetler</AccordionTrigger>
                          <AccordionContent className="p-0">
                               <ScrollArea className="h-64 w-full p-2 border-x border-b rounded-b-lg">
                                  <Accordion type="multiple" className="w-full">
                                      {Object.values(servicesByCategory).filter(cat => cat.services.length > 0).map((category) => {
                                           const allCategoryServices = category.services.map(s => s.id);
                                           const selectedCategoryServices = selectedServices.filter(sId => allCategoryServices.includes(sId));
                                           const isAllSelected = allCategoryServices.length > 0 && selectedCategoryServices.length === allCategoryServices.length;

                                          return (
                                          <AccordionItem value={category.id} key={category.id}>
                                                <AccordionTrigger className="hover:no-underline justify-between">
                                                    <span>{category.name}</span>
                                                    <div className="flex items-center gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            id={`select-all-${category.id}`}
                                                            checked={isAllSelected}
                                                            onCheckedChange={(checked) => handleSelectAllCategoryServices(category.id, !!checked)}
                                                            disabled={isSubmitting}
                                                        />
                                                        <Label htmlFor={`select-all-${category.id}`} className="text-xs font-normal cursor-pointer">Tümünü Seç</Label>
                                                    </div>
                                                </AccordionTrigger>
                                              <AccordionContent>
                                                  <div className="space-y-2 pt-2">
                                                      {category.services.map(service => (
                                                          <div key={service.id} className="flex items-center justify-between space-x-3 rounded-md p-2 hover:bg-muted/50">
                                                              <label
                                                                  htmlFor={`service-${service.id}`}
                                                                  className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                              >
                                                                  {service.name}
                                                              </label>
                                                              <CustomSwitch
                                                                  id={`service-${service.id}`}
                                                                  checked={selectedServices.includes(service.id)}
                                                                  onCheckedChange={() => handleServiceToggle(service.id)}
                                                                  disabled={isSubmitting}
                                                              />
                                                          </div>
                                                      ))}
                                                  </div>
                                              </AccordionContent>
                                          </AccordionItem>
                                          )
                                      })}
                                  </Accordion>
                              </ScrollArea>
                          </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="working-hours" className="border-none">
                         <AccordionTrigger className="px-4 py-3 hover:no-underline font-medium rounded-lg shadow-sm border bg-muted/50 data-[state=open]:rounded-b-none">
                              <span>
                                Personele Özel Çalışma Gün ve Saatleri
                                <span className="text-xs text-muted-foreground ml-2 font-normal">(Belirlenmezse genel ayarlar geçerli olur)</span>
                              </span>
                          </AccordionTrigger>
                          <AccordionContent className="p-0">
                              <ScrollArea className="h-64 w-full p-2 border-x border-b rounded-b-lg">
                                  <div className="space-y-2">
                                      {daysOfWeek.map(day => {
                                          const daySetting = workingDays[day.id];
                                          const isWorking = daySetting?.isWorkingDay ?? false;
                                          return (
                                              <div key={day.id} className={cn("grid grid-cols-12 gap-x-4 items-center p-1 rounded-md", isWorking ? "bg-card/80" : "bg-muted/50")}>
                                                  <div className="col-span-4 flex items-center gap-4">
                                                      <CustomSwitch
                                                          id={`isWorkingDay_${day.id}`}
                                                          name={`isWorkingDay_${day.id}`}
                                                          checked={isWorking}
                                                          onCheckedChange={(checked) => handleWorkingDayChange(day.id, 'isWorkingDay', checked)}
                                                          disabled={isSubmitting}
                                                      />
                                                      <Label htmlFor={`isWorkingDay_${day.id}`} className="font-medium">
                                                          {day.label}
                                                      </Label>
                                                  </div>
                                                  <div className={cn("col-span-8 grid grid-cols-2 gap-4 transition-opacity", isWorking ? "opacity-100" : "opacity-50 pointer-events-none")}>
                                                      <Input
                                                          id={`startTime_${day.id}`}
                                                          name={`startTime_${day.id}`}
                                                          type="time"
                                                          value={daySetting?.startTime || defaultWorkingDays[day.id].startTime}
                                                          onChange={(e) => handleWorkingDayChange(day.id, 'startTime', e.target.value)}
                                                          className="h-8 rounded-md shadow-sm"
                                                          disabled={!isWorking || isSubmitting}
                                                          step="900"
                                                      />
                                                      <Input
                                                          id={`endTime_${day.id}`}
                                                          name={`endTime_${day.id}`}
                                                          type="time"
                                                          value={daySetting?.endTime || defaultWorkingDays[day.id].endTime}
                                                          onChange={(e) => handleWorkingDayChange(day.id, 'endTime', e.target.value)}
                                                          className="h-8 rounded-md shadow-sm"
                                                          disabled={!isWorking || isSubmitting}
                                                          step="900"
                                                      />
                                                  </div>
                                              </div>
                                          )
                                      })}
                                  </div>
                              </ScrollArea>
                          </AccordionContent>
                      </AccordionItem>
                  </Accordion>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t bg-secondary rounded-b-xl flex-shrink-0">
                <Button type="submit" disabled={isSubmitting || !status || !isPhoneValid || !isDirty} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yeni Personeli Ekle")}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
