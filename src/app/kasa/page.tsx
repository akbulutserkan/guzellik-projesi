
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Banknote, Edit, Trash2, Package, Sparkles, Star, Users } from "lucide-react";
import { getPaymentTransactionsAction, type EnrichedPaymentTransaction, getPersonnelRevenueReportAction, type PersonnelRevenueDetail } from "./actions";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KasaDeleteDialog } from "./kasa-delete-dialog";
import { getCalendarPageData } from "../randevular/actions";
import { KasaEditDialog } from "./kasa-edit-dialog";
import type { CalendarEvent } from "../takvim/page";
import type { Appointment, CalendarPageData } from "../randevular/actions";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function KasaPage() {
  const [allTransactions, setAllTransactions] = useState<EnrichedPaymentTransaction[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarPageData | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<EnrichedPaymentTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [reportData, setReportData] = useState<PersonnelRevenueDetail[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportFetched, setReportFetched] = useState(false);

  useEffect(() => {
    setDateRange({
        from: startOfDay(new Date()),
        to: endOfDay(new Date())
    });
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [transactions, data] = await Promise.all([
        getPaymentTransactionsAction(),
        getCalendarPageData()
    ]);
    
    setAllTransactions(transactions);
    setCalendarData(data);
    
    const formattedEvents = data.appointments.map((appointment: Appointment) => ({
        ...appointment,
        title: `${appointment.customerName} (${appointment.serviceName})`,
        resourceId: appointment.personnelId,
    }));
    setEvents(formattedEvents);

    setReportFetched(false);
    setReportData([]);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // This `useEffect` will only run when the date range changes, resetting the personnel report.
  useEffect(() => {
      setReportFetched(false);
      setReportData([]);
  }, [dateRange]);

  const filteredTransactions = useMemo(() => {
    const lowercasedFilter = searchTerm.toLocaleLowerCase('tr-TR');
    
    return allTransactions.filter((transaction) => {
        const isTextMatch = searchTerm.length < 2 ? true :
                            transaction.customerName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
                            transaction.description.toLocaleLowerCase('tr-TR').includes(lowercasedFilter) ||
                            transaction.personnelName.toLocaleLowerCase('tr-TR').includes(lowercasedFilter);

        const isDateMatch = (() => {
            if (!dateRange || (!dateRange.from && !dateRange.to)) {
                return true;
            }
            const transactionDate = new Date(transaction.paymentDate);
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;

            if (from && to) return transactionDate >= from && transactionDate <= to;
            if (from) return transactionDate >= from;
            if (to) return transactionDate <= to;
            return true;
        })();
        
        return isTextMatch && isDateMatch;
    });
  }, [searchTerm, dateRange, allTransactions]);

  
  const handleModalClose = () => {
    setEditingTransaction(null);
  };
  
  const handleSuccess = () => {
    handleModalClose();
    fetchData(); 
  };

  const fetchPersonnelReport = useCallback(async () => {
    if (!dateRange) return;
    setIsReportLoading(true);
    try {
        const data = await getPersonnelRevenueReportAction(dateRange);
        setReportData(data);
        setReportFetched(true);
    } catch (error) {
        toast({ title: "Hata", description: "Personel raporu çekilemedi.", variant: "destructive" });
    } finally {
        setIsReportLoading(false);
    }
  }, [dateRange, toast]);

  const onAccordionChange = (value: string) => {
    if (value === "personnel-report" && !reportFetched) {
        fetchPersonnelReport();
    }
  }


  const summary = useMemo(() => {
      const totals = {
          nakit: 0,
          kart: 0,
          havale: 0,
          general: 0,
      };
      filteredTransactions.forEach(t => {
          if (t.paymentMethod === 'Nakit') totals.nakit += t.grandTotalAmount;
          if (t.paymentMethod === 'Kart') totals.kart += t.grandTotalAmount;
          if (t.paymentMethod === 'Havale/EFT') totals.havale += t.grandTotalAmount;
          totals.general += t.grandTotalAmount;
      });
      return totals;
  }, [filteredTransactions]);

  const getPaymentTypeIcon = (type: EnrichedPaymentTransaction['paymentType']) => {
    switch (type) {
      case 'package_sale':
        return <Sparkles className="h-4 w-4 text-yellow-500" title="Yeni Paket Satışı" />;
      case 'package_payment':
      case 'package':
        return <Package className="h-4 w-4 text-blue-500" title="Paket Ödemesi" />;
      case 'appointment':
        return <Sparkles className="h-4 w-4 text-pink-500" title="Randevu Ödemesi" />;
      default:
         return <Package className="h-4 w-4 text-gray-500" title="Diğer Ödeme" />;
    }
  }

  const renderDescription = (description: string) => {
    const salePrefix = "Paket Satışı: ";
    const paymentPrefix = "Kalan Ödeme: ";
  
    if (description.startsWith(salePrefix)) {
      return (
        <p className="truncate max-w-xs">
          <span className="font-bold text-green-600">{salePrefix}</span>
          {description.substring(salePrefix.length)}
        </p>
      );
    }
  
    if (description.startsWith(paymentPrefix)) {
      return (
        <p className="truncate max-w-xs">
          <span className="font-bold text-blue-600">{paymentPrefix}</span>
          {description.substring(paymentPrefix.length)}
        </p>
      );
    }
  
    return <p className="truncate max-w-xs">{description}</p>;
  };


  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold">
          Kasa Hareketleri
        </h1>
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Müşteri, personel, açıklama ara..."
                className="pl-9 h-10 rounded-md shadow-md w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Nakit</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.nakit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kart</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.kart)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Havale/EFT</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.havale)}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/90 text-primary-foreground">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genel Toplam</CardTitle>
            <Banknote className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.general)}</div>
          </CardContent>
        </Card>
      </div>

       <Accordion type="single" collapsible className="w-full mb-6" onValueChange={onAccordionChange}>
        <AccordionItem value="personnel-report" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="text-base font-medium hover:no-underline flex-1 py-3 px-4 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary"/>
                    <span>Personel Bazında Ciro Raporu</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-2">
              {isReportLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : reportData.length > 0 ? (
                 <Accordion type="multiple" className="w-full">
                    {reportData.map(personnel => (
                        <AccordionItem value={personnel.personnelName} key={personnel.personnelName}>
                            <AccordionTrigger className="hover:no-underline font-semibold text-base py-3 px-4">
                                <div className="flex justify-between w-full">
                                    <span>{personnel.personnelName}</span>
                                    <span className="text-primary pr-2">{formatCurrency(personnel.totalRevenue)}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                  <TableHeader><TableRow><TableHead>Hizmet/Ürün</TableHead><TableHead>Adet</TableHead><TableHead className="text-right">Toplam Tutar</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {personnel.services.map(s => (
                                      <TableRow key={s.serviceName}><TableCell>{s.serviceName}</TableCell><TableCell>{s.quantity}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(s.totalAmount)}</TableCell></TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">Seçili tarih aralığında personel cirosu bulunamadı.</p>
              )}
            </AccordionContent>
        </AccordionItem>
      </Accordion>


      <div className="rounded-lg border shadow-sm bg-muted/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"></TableHead>
              <TableHead>MÜŞTERİ</TableHead>
              <TableHead>PERSONEL</TableHead>
              <TableHead>AÇIKLAMA</TableHead>
              <TableHead>TOPLAM TUTAR</TableHead>
              <TableHead>ÖDEME YÖNTEMİ</TableHead>
              <TableHead>TARİH</TableHead>
               <TableHead className="text-right w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => {
                return (
                  <TableRow key={t.id} className="hover:bg-muted/60">
                    <TableCell>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>{getPaymentTypeIcon(t.paymentType)}</TooltipTrigger>
                                <TooltipContent>
                                    <p>{t.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">{t.customerName}</TableCell>
                    <TableCell>{t.personnelName}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                {renderDescription(t.description)}
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{t.description}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(t.grandTotalAmount)}</TableCell>
                    <TableCell><Badge variant="secondary">{t.paymentMethod}</Badge></TableCell>
                    <TableCell>{format(t.paymentDate, 'dd MMMM yyyy, HH:mm', { locale: tr })}</TableCell>
                     <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Düzenle" 
                                onClick={() => setEditingTransaction(t)}
                                disabled={t.paymentType.startsWith('package')}
                              >
                                  <Edit className="h-4 w-4" />
                              </Button>
                              <KasaDeleteDialog transactionId={t.id} onSuccess={fetchData}>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Sil">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </KasaDeleteDialog>
                          </div>
                     </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Seçili tarih aralığında kasa hareketi bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
       {editingTransaction && calendarData && (
         <KasaEditDialog
            isOpen={!!editingTransaction}
            onOpenChange={(open) => { 
                if (!open) handleModalClose();
            }}
            transaction={editingTransaction as unknown as EnrichedPaymentTransaction}
            allAppointments={events}
            customers={calendarData.customers}
            personnelList={calendarData.personnel}
            services={calendarData.services}
            packages={calendarData.packages}
            products={calendarData.products}
            onSuccess={handleSuccess}
        />
    )}
    </>
  );
}
