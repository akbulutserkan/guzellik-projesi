
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, type ReactNode } from "react";
import { getCustomerDetailsAction, type Customer, type CustomerDetails } from "./actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatCurrency, formatPhoneNumber, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Package, ShoppingBag, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface CustomerDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export function CustomerDetailDialog({ isOpen, onOpenChange, customer }: CustomerDetailDialogProps) {
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setDetails(null); 
      getCustomerDetailsAction(customer.id)
        .then(data => {
            if (data) {
                setDetails(data);
            } else {
                setDetails(null);
            }
        })
        .catch(error => {
            console.error('[DIALOG LOG] Müşteri detayları çekilirken hata oluştu:', error);
            setDetails(null);
        })
        .finally(() => {
            setIsLoading(false);
        });
    }
  }, [isOpen, customer.id]);

  const getStatusInfo = (status: 'active' | 'completed' | 'cancelled') => {
    switch (status) {
        case 'completed':
            return { text: 'Tamamlandı', className: 'bg-green-100 text-green-800 border-green-200' };
        case 'cancelled':
            return { text: 'İptal Edildi', className: 'bg-red-100 text-red-800 border-red-200' };
        case 'active':
            return { text: 'Aktif', className: 'bg-secondary text-secondary-foreground' };
        default:
            return { text: status, className: 'bg-secondary text-secondary-foreground' };
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0" hideCloseButton={true}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">
            {details?.customer?.fullName || customer.fullName}
            <span className="text-lg font-medium text-muted-foreground ml-4">{formatPhoneNumber(details?.customer?.phone || customer.phone)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto px-6 pb-6">
            {isLoading ? (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : !details ? (
                <div className="text-center p-8">Müşteri detayları yüklenemedi. Lütfen sunucu loglarını kontrol edin.</div>
            ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Toplam Randevu" value={details.appointments.length} icon={CalendarDays} />
                    <StatCard title="Aktif Paket" value={details.packageSales.filter(p => (p.remainingSessions ?? 0) > 0).length} icon={Package} />
                    <StatCard title="Alınan Ürün Sayısı" value={details.productSales.reduce((sum, s) => sum + s.quantity, 0)} icon={ShoppingBag} />
                    <StatCard title="Toplam Ödeme" value={formatCurrency(details.totalSpent)} icon={Wallet} />
                </div>
                
                 <Tabs defaultValue="payments" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="payments">Ödemeler</TabsTrigger>
                        <TabsTrigger value="appointments">Randevular</TabsTrigger>
                        <TabsTrigger value="packages">Paketler</TabsTrigger>
                        <TabsTrigger value="products">Ürün Alımları</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="h-72 mt-4">
                        <TabsContent value="payments">
                            <div className="rounded-lg border shadow-sm bg-muted/40">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Tarih</TableHead>
                                          <TableHead>Tutar</TableHead>
                                          <TableHead>Yöntem</TableHead>
                                          <TableHead>Açıklama</TableHead>
                                          <TableHead>Personel</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {details.paymentTransactions.length === 0 ? (
                                          <TableRow><TableCell colSpan={5} className="text-center h-24">Ödeme geçmişi bulunmuyor.</TableCell></TableRow>
                                      ) : (
                                          details.paymentTransactions.map(trans => (
                                              <TableRow key={trans.id}>
                                                  <TableCell>{format(trans.paymentDate, 'dd MMM yyyy, HH:mm', { locale: tr })}</TableCell>
                                                  <TableCell className="font-semibold">{formatCurrency(trans.grandTotalAmount)}</TableCell>
                                                  <TableCell><Badge variant="outline">{trans.paymentMethod}</Badge></TableCell>
                                                   <TableCell>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <p className="truncate max-w-xs">{trans.description}</p>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{trans.description}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                  <TableCell>{trans.personnelName}</TableCell>
                                              </TableRow>
                                          ))
                                      )}
                                  </TableBody>
                              </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="appointments">
                             <div className="rounded-lg border shadow-sm bg-muted/40">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tarih</TableHead>
                                            <TableHead>Hizmet</TableHead>
                                            <TableHead>Personel</TableHead>
                                            <TableHead>Notlar</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead className="text-right">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {details.appointments.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Randevu geçmişi bulunmuyor.</TableCell></TableRow>
                                    ) : (
                                        details.appointments.map(app => {
                                            const statusInfo = getStatusInfo(app.status);
                                            return (
                                                <TableRow key={app.id} className={cn(app.status === 'cancelled' && 'text-muted-foreground')}>
                                                    <TableCell className={cn(app.status === 'cancelled' && 'line-through')}>{format(app.start, 'dd MMM yyyy, HH:mm', { locale: tr })}</TableCell>
                                                    <TableCell className={cn(app.status === 'cancelled' && 'line-through')}>{app.serviceName}</TableCell>
                                                    <TableCell className={cn(app.status === 'cancelled' && 'line-through')}>{app.personnelName}</TableCell>
                                                     <TableCell>
                                                        {app.notes ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <p className="truncate max-w-[150px]">{app.notes}</p>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{app.notes}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(statusInfo.className, "w-24 justify-center")}>
                                                            {statusInfo.text}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={cn("text-right", app.status === 'cancelled' && 'line-through')}>{formatCurrency(app.price)}</TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                    </TableBody>
                                </Table>
                             </div>
                        </TabsContent>
                        <TabsContent value="packages">
                          {details.packageSales.length === 0 ? (
                             <div className="text-center p-8 h-24 flex items-center justify-center rounded-lg border shadow-sm bg-muted/40">Satın alınmış paket bulunmuyor.</div>
                          ) : (
                            <Accordion type="multiple" className="w-full">
                              {details.packageSales.map(sale => {
                                const usedSessions = details.appointments.filter(app => app.packageSaleId === sale.id && app.isPackageSession);
                                return (
                                  <AccordionItem value={sale.id} key={sale.id}>
                                    <AccordionTrigger className="hover:no-underline text-left">
                                      <div className="flex justify-between items-center w-full">
                                          <div>
                                              <p className="font-semibold">{sale.packageName}</p>
                                              <p className="text-xs text-muted-foreground">{format(sale.saleDate, 'dd MMM yyyy', { locale: tr })} tarihinde satıldı.</p>
                                          </div>
                                          <div className="flex items-center gap-4 pr-4">
                                            <Badge variant={(sale.remainingSessions ?? 0) === 0 ? "destructive" : "secondary"}>
                                                {sale.usedSessionsCount} / {sale.totalSessionsCount}
                                            </Badge>
                                            <span className="font-semibold">{formatCurrency(sale.price)}</span>
                                          </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      {usedSessions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">Bu paketten henüz seans kullanılmamış.</p>
                                      ) : (
                                        <div className="p-2 bg-muted/50 rounded-b-md">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Kullanım Tarihi</TableHead>
                                                <TableHead>Kullanılan Hizmet</TableHead>
                                                <TableHead>Personel</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {usedSessions.map(session => (
                                                <TableRow key={session.id}>
                                                  <TableCell>{format(session.start, 'dd MMM yyyy, HH:mm', { locale: tr })}</TableCell>
                                                  <TableCell>{session.serviceName}</TableCell>
                                                  <TableCell>{session.personnelName}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )
                              })}
                            </Accordion>
                          )}
                        </TabsContent>
                        <TabsContent value="products">
                             <div className="rounded-lg border shadow-sm bg-muted/40">
                                <Table>
                                     <TableHeader>
                                        <TableRow>
                                            <TableHead>Ürün Adı</TableHead>
                                            <TableHead>Tarih</TableHead>
                                            <TableHead>Adet</TableHead>
                                            <TableHead className="text-right">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {details.productSales.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Ürün alım geçmişi bulunmuyor.</TableCell></TableRow>
                                    ) : (
                                        details.productSales.map(sale => (
                                            <TableRow key={sale.id}>
                                                <TableCell>{sale.productName}</TableCell>
                                                <TableCell>{format(sale.saleDate, 'dd MMM yyyy', { locale: tr })}</TableCell>
                                                <TableCell>{sale.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    