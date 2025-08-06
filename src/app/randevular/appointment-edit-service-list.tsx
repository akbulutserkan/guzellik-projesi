
"use client";

import { useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, BadgeCent } from "lucide-react";
import type { ServiceLine } from "./appointment-edit-dialog";
import type { Personel } from "../personeller/actions";
import type { Service } from "../hizmetler/actions";
import type { Package } from "../paketler/actions";
import { useToast } from "@/hooks/use-toast";
import { addServiceToAppointmentAction, deleteSingleAppointmentAction } from "./actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface AppointmentEditServiceListProps {
  serviceLines: ServiceLine[];
  personnelList: Personel[];
  services: Service[];
  packages: Package[];
  setServiceLines: React.Dispatch<React.SetStateAction<ServiceLine[]>>;
  onPartialSuccess?: (newCustomer?: any) => void;
  appointmentGroupId: string;
  selectedCustomerId: string;
  isSubmitting: boolean;
  isDeleting: boolean;
}

export function AppointmentEditServiceList({
  serviceLines,
  personnelList,
  services,
  packages,
  setServiceLines,
  onPartialSuccess,
  appointmentGroupId,
  selectedCustomerId,
  isSubmitting,
  isDeleting,
}: AppointmentEditServiceListProps) {
  const { toast } = useToast();

  const personnelOptions = useMemo(() => personnelList.map(p => ({ value: p.id, label: p.fullName })), [personnelList]);
  const serviceAndPackageOptions = useMemo(() => {
    const serviceOpts = services.map(s => ({ value: s.id, label: s.name, price: s.price }));
    const packageOpts = packages.map(p => ({ value: p.id, label: `Paket: ${p.name}`, price: p.price }));
    return [...serviceOpts, ...packageOpts];
  }, [services, packages]);

  const updateServiceLine = async (index: number, field: keyof Omit<ServiceLine, 'id' | 'name' | 'isPackageSession' | 'packageSaleId' | 'isNew'>, value: string) => {
    const newLines = [...serviceLines];
    const line = { ...newLines[index] };
    const isNewLine = line.isNew;
    (line as any)[field] = value;

    if (field === 'serviceId') {
      const selected = serviceAndPackageOptions.find(opt => opt.value === line.serviceId);
      if (selected) {
        line.price = String(selected.price);
      }
    }
    
    newLines[index] = line;
    setServiceLines(newLines);

    // Only auto-add if it's a new line and all info is present
    if (isNewLine && field === 'serviceId' && line.personnelId && line.serviceId) {
      const selectedOption = serviceAndPackageOptions.find(opt => opt.value === line.serviceId);

      const result = await addServiceToAppointmentAction({
        groupId: appointmentGroupId,
        customerId: selectedCustomerId,
        personnelId: line.personnelId,
        serviceId: line.serviceId,
        price: selectedOption?.price ?? 0,
        isPackage: !!selectedOption?.label.startsWith('Paket:'),
      });

      if (result.success) {
        toast({ title: "Başarılı", description: "Hizmet başarıyla eklendi." });
        onPartialSuccess?.(); // This reloads the entire modal's data
      } else {
        toast({ title: "Hata", description: result.message, variant: "destructive" });
        // Remove the failed new line
        setServiceLines(prev => prev.filter(l => l.id !== line.id));
      }
    }
  };

  const removeServiceLine = async (lineId: string, index: number) => {
    const lineToRemove = serviceLines[index];

    // If it's a new, unsaved line, just remove it from the local state
    if (lineToRemove.isNew) {
      const updatedLines = serviceLines.filter((_, i) => i !== index);
      setServiceLines(updatedLines);
      return;
    }

    // If it's an existing line, call the delete action
    const result = await deleteSingleAppointmentAction(lineId);
    if (result.success) {
      toast({ title: "Başarılı", description: "Hizmet başarıyla silindi." });
      onPartialSuccess?.();
    } else {
      toast({ title: "Hata", description: result.message, variant: "destructive" });
    }
  };
  
  const handlePriceChange = (index: number, newPriceValue: string) => {
    const newLines = [...serviceLines];
    newLines[index].price = newPriceValue;
    setServiceLines(newLines);
  };


  return (
    <div className="space-y-2">
      {serviceLines.map((line, index) => {
        const selectedServiceLabel = serviceAndPackageOptions.find(opt => opt.value === line.serviceId)?.label || "";
        return (
            <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                    <Combobox options={personnelOptions} value={line.personnelId} onChange={(value) => updateServiceLine(index, 'personnelId', value)} placeholder="Personel seçin..." searchPlaceholder="Personel ara..." disabled={isSubmitting || isDeleting} />
                </div>
                <div className="col-span-6">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full">
                                    <Combobox options={serviceAndPackageOptions} value={line.serviceId} onChange={(value) => updateServiceLine(index, 'serviceId', value)} placeholder="Hizmet veya Paket..." searchPlaceholder="Hizmet/Paket ara..." disabled={isSubmitting || isDeleting || !line.personnelId} />
                                </div>
                            </TooltipTrigger>
                            {selectedServiceLabel && (
                                <TooltipContent>
                                    <p>{selectedServiceLabel}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="col-span-2">
                    {line.isPackageSession ? (
                    <div className="flex items-center justify-center h-10">
                        <Badge variant="secondary" className="h-10 text-sm w-full justify-center">
                        <BadgeCent className="mr-2 h-4 w-4" />
                        Paket
                        </Badge>
                    </div>
                    ) : (
                    <div className="relative flex items-center h-10 rounded-md shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Input
                            type="number"
                            value={line.price}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            placeholder="Fiyat"
                            className="h-10 w-full pl-2 pr-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-right font-semibold"
                            required
                            disabled={isSubmitting || isDeleting || !line.serviceId}
                        />
                        <span className="absolute inset-y-0 right-1.5 flex items-center text-xs text-muted-foreground pointer-events-none">₺</span>
                    </div>
                    )}
                </div>
                <div className="col-span-1 flex justify-end">
                    {serviceLines.length > 1 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" disabled={isSubmitting || isDeleting}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Bu Hizmeti Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Bu işlem geri alınamaz. Bu hizmet randevudan kalıcı olarak kaldırılacaktır.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeServiceLine(line.id, index)}>Evet, Sil</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    )}
                </div>
            </div>
        )
      })}
    </div>
  );
}
