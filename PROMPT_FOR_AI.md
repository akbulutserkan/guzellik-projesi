
Merhaba, Next.js, React, Firebase/Firestore ve `react-big-calendar` kullanan bir uygulama geliştiriyorum. Takvim sayfasında, personel sütunlarının sırasını kullanıcıların sürükle-bırak (drag-and-drop) yöntemiyle değiştirebilmesini ve bu sıralamanın kalıcı olmasını sağlamak istiyorum.

**İstenen Özellik:**

Kullanıcı, "Takvim" görünümündeki personel isimlerinin (sütun başlıklarının) yerini fare ile sürükleyip bırakarak değiştirebilmelidir. Örneğin, "Personel A | Personel B | Personel C" şeklindeki sıralamayı "Personel C | Personel A | Personel B" olarak güncelleyebilmelidir. Bu sıralama, sayfa yenilendiğinde veya uygulamaya tekrar girildiğinde korunmalıdır.

**Soru:**

Bu özellik, aşağıda verilen proje yapısı ve dosya içerikleriyle teknik olarak mümkün müdür? Eğer mümkünse, bu özelliği hayata geçirmek için hangi dosyalarda ne gibi değişiklikler yapmam gerektiğini adım adım, tam dosya içeriklerini verecek şekilde açıklar mısın?

---

### Proje Dosyaları ve İçerikleri

İşte bu özellikle ilgili olduğunu düşündüğüm ana dosyaların yolları ve tam içerikleri:

#### 1. Personel Veri Yönetimi (actions)
Bu dosya, personel verilerinin veritabanından nasıl okunacağını ve yazılacağını yönetir. Sıralama bilgisinin bu dosyada yönetilmesi gerekecektir.

**Dosya Yolu:** `src/app/personeller/actions.ts`
```typescript
'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { formatTitleCase } from "@/lib/utils";

export type PersonelStatus = "Personel" | "Yönetici" | "Kasa";

export interface DayHours {
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
}

export type WorkingDays = Record<string, DayHours>; // '0' for Sunday, '1' for Monday...

export interface Personel {
    id: string;
    fullName: string;
    phone: string;
    status: PersonelStatus;
    serviceIds: string[];
    workingDays: WorkingDays; // Changed from workingHours to structured data
    createdAt: Date;
}

// Personelleri çek
export async function getPersonelAction(): Promise<Personel[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getPersonelAction)");
      return [];
    }
    try {
      const personelSnapshot = await db.collection("personel").orderBy("createdAt", "desc").get();
      
      const personelList = personelSnapshot.docs.map(doc => {
        const data = doc.data();
        const mappedPersonel = {
          id: doc.id,
          fullName: data.fullName,
          phone: data.phone,
          status: data.status || "Personel",
          serviceIds: data.serviceIds || [],
          workingDays: data.workingDays || {}, // Ensure workingDays is always an object
          createdAt: (data.createdAt as Timestamp).toDate(),
        } as Personel;
        return mappedPersonel;
      });

      return personelList;
    } catch (error: any) {
      console.error("Personel verileri çekilirken kritik hata:", error);
      return [];
    }
}

// Personel Ekle
export async function performAddPersonelAction(formData: FormData) {
  'use server';
  const fullNameRaw = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const status = formData.get("status") as PersonelStatus;
  const serviceIds = formData.getAll("serviceIds") as string[];

  const workingDays: WorkingDays = {};
    for (let i = 0; i < 7; i++) {
        const day = String(i);
        const isWorkingDay = formData.has(`isWorkingDay_${day}`);
        
        if (isWorkingDay) {
            const startTime = formData.get(`startTime_${day}`) as string;
            const endTime = formData.get(`endTime_${day}`) as string;
             if (!startTime || !endTime) {
                 return { success: false, message: `Çalışma günü olarak işaretlenen günler için başlangıç ve bitiş saatleri zorunludur.` };
            }
             if (startTime >= endTime) {
                return { success: false, message: `Başlangıç saati, bitiş saatinden önce olmalıdır.` };
            }
            workingDays[day] = { 
                isWorkingDay: true, 
                startTime: startTime, 
                endTime: endTime 
            };
        }
    }


  if (!fullNameRaw || !phone || !status) {
    return { success: false, message: "Ad Soyad, Telefon ve Statü alanları zorunludur." };
  }
  if (!/^[5]\d{9}$/.test(phone)) {
    return { success: false, message: "Geçersiz telefon numarası formatı. Numara '5' ile başlamalı ve 10 haneli olmalıdır." };
  }

  const fullName = formatTitleCase(fullNameRaw);

  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

  try {
    const personel = { 
        fullName, 
        phone, 
        status, 
        serviceIds, 
        workingDays, 
        createdAt: Timestamp.now(),
    };

    await db.collection("personel").add(personel);
    revalidatePath("/personeller");
    revalidatePath("/takvim");
    return { success: true, message: `${fullName} adlı personel başarıyla eklendi.` };
  } catch (error) {
    console.error("Veritabanına kaydetme hatası:", error);
    return { success: false, message: "Personel veritabanına kaydedilemedi." };
  }
}

// Personel Güncelle
export async function performUpdatePersonelAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    const fullNameRaw = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const status = formData.get("status") as PersonelStatus;
    const serviceIds = formData.getAll("serviceIds") as string[];

    const workingDays: WorkingDays = {};
    for (let i = 0; i < 7; i++) {
        const day = String(i);
        const isWorkingDay = formData.has(`isWorkingDay_${day}`);
        
        if (isWorkingDay) {
            const startTime = formData.get(`startTime_${day}`) as string;
            const endTime = formData.get(`endTime_${day}`) as string;
             if (!startTime || !endTime) {
                 return { success: false, message: `Çalışma günü olarak işaretlenen günler için başlangıç ve bitiş saatleri zorunludur.` };
            }
             if (startTime >= endTime) {
                return { success: false, message: `Başlangıç saati, bitiş saatinden önce olmalıdır.` };
            }
            workingDays[day] = { 
                isWorkingDay: true, 
                startTime: startTime, 
                endTime: endTime 
            };
        }
    }

    if (!id || !fullNameRaw || !phone || !status) {
        return { success: false, message: "Ad Soyad, Telefon ve Statü alanları zorunludur." };
    }
     if (!/^[5]\d{9}$/.test(phone)) {
        return { success: false, message: "Geçersiz telefon numarası formatı. Numara '5' ile başlamalı ve 10 haneli olmalıdır." };
    }

    const newFullName = formatTitleCase(fullNameRaw);

    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        await db.runTransaction(async (transaction) => {
            const personelRef = db.collection("personel").doc(id);
            
            // --- TÜM OKUMA (READ) İŞLEMLERİ ---
            const personelDoc = await transaction.get(personelRef);
            if (!personelDoc.exists) {
                throw new Error("Personel bulunamadı.");
            }
            
            const oldFullName = personelDoc.data()?.fullName;
            const nameChanged = oldFullName !== newFullName;

            let appointmentsSnap, salesSnap, packageSalesSnap;

            if (nameChanged) {
                const appointmentsQuery = db.collection("appointments").where("personnelId", "==", id);
                appointmentsSnap = await transaction.get(appointmentsQuery);

                const salesQuery = db.collection("sales").where("personnelId", "==", id);
                salesSnap = await transaction.get(salesQuery);

                const packageSalesQuery = db.collection("packageSales").where("personnelId", "==", id);
                packageSalesSnap = await transaction.get(packageSalesQuery);
            }

            // --- TÜM YAZMA (WRITE) İŞLEMLERİ ---
            
            // 1. Ana personel dökümanını güncelle.
            transaction.update(personelRef, { fullName: newFullName, phone, status, serviceIds, workingDays });

            // 2. Sadece isim değiştiyse ilişkili kayıtları güncelle.
            if (nameChanged) {
                if (appointmentsSnap) {
                    appointmentsSnap.docs.forEach(doc => {
                        transaction.update(doc.ref, { personnelName: newFullName });
                    });
                }
                if (salesSnap) {
                    salesSnap.docs.forEach(doc => {
                        transaction.update(doc.ref, { personnelName: newFullName });
                    });
                }
                if (packageSalesSnap) {
                    packageSalesSnap.docs.forEach(doc => {
                        transaction.update(doc.ref, { personnelName: newFullName });
                    });
                }
            }
        });

        revalidatePath("/personeller");
        revalidatePath("/takvim");
        revalidatePath("/kasa");
        revalidatePath("/urun-satislar");
        revalidatePath("/paket-satislar");
        revalidatePath("/musteriler"); 

        return { success: true, message: "Personel bilgileri ve tüm ilişkili kayıtlar başarıyla güncellendi." };
    } catch (error: any) {
        console.error("Güncelleme hatası:", error);
        return { success: false, message: error.message || "Personel bilgileri güncellenemedi." };
    }
}


// Personel Sil
export async function performDeletePersonelAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Personel ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        await db.collection("personel").doc(id).delete();
        revalidatePath("/personeller");
        return { success: true, message: "Personel başarıyla silindi." };
    } catch (error) {
        console.error("Silme hatası:", error);
        return { success: false, message: "Personel silinemedi." };
    }
}
```

#### 2. Takvim Sayfası
Sürükle-bırak işlevselliğinin entegre edileceği ana sayfa burasıdır.

**Dosya Yolu:** `src/app/takvim/page.tsx`
```tsx
"use client";

import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, dateFnsLocalizer, Views, type View, type Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setHours, setMinutes, isSameDay, addHours } from 'date-fns';
import tr from 'date-fns/locale/tr';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getCalendarPageData, performUpdateAppointmentAction, type Appointment, type CalendarPageData } from '../randevular/actions';
import { getBusinessHoursAction, type BusinessSettings } from '../ayarlar/actions';
import { type Personel } from '../personeller/actions';
import type { Customer } from '../musteriler/actions';
import { AppointmentDialog } from '../randevular/appointment-dialog';
import { useToast } from '@/hooks/use-toast';
import { CustomToolbar } from './custom-toolbar';
import { AppointmentEditDialog } from '../randevular/appointment-edit-dialog';
import { cn } from '@/lib/utils';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const locales = {
  'tr': tr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: tr }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);


const messages = {
    allDay: 'Tüm Gün',
    previous: 'Önceki',
    next: 'Sonraki',
    today: 'Bugün',
    month: 'Ay',
    week: 'Hafta',
    day: 'Gün',
    agenda: 'Ajanda',
    date: 'Tarih',
    time: 'Saat',
    event: 'Randevu',
    showMore: (total: number) => `+ ${total} daha`,
    noEventsInRange: 'Bu aralıkta randevu yok.',
};

export interface CalendarEvent extends Appointment {
    title: string;
    resourceId: string;
}

export interface Resource {
    resourceId: string;
    resourceTitle: string;
}

interface AddModalState {
  isOpen: boolean;
  initialData?: { start: Date; end: Date; resourceId?: string };
}

interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
}


export default function TakvimPage() {
    const [pageData, setPageData] = useState<CalendarPageData | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addModalState, setAddModalState] = useState<AddModalState>({ isOpen: false });
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [personnelResources, setPersonnelResources] = useState<Resource[]>([]);
    const [confirmationState, setConfirmationState] = useState<ConfirmationDialogState>({
      isOpen: false,
      title: "",
      description: "",
      onConfirm: () => {},
    });

    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.DAY);
    const isModalOpen = useRef(false);
    const isClosingModal = useRef(false);

    useEffect(() => {
        const modalCurrentlyOpen = addModalState.isOpen || !!editingEvent || confirmationState.isOpen;
        isModalOpen.current = modalCurrentlyOpen;
    }, [addModalState.isOpen, editingEvent, confirmationState.isOpen]);

    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        if (!pageData) setIsLoading(true);
        try {
            const [data, settings] = await Promise.all([
                getCalendarPageData(),
                getBusinessHoursAction()
            ]);
            setPageData(data);
            setCustomers(data.customers);
            setBusinessSettings(settings);

            const activeAppointments = data.appointments.filter(app => app.status === 'active');
            
            const formattedEvents = activeAppointments.map((appointment: Appointment) => ({
                ...appointment,
                title: `${appointment.customerName} (${appointment.serviceName})`,
                resourceId: appointment.personnelId,
            }));
            setEvents(formattedEvents);

            setPersonnelResources(data.personnel.map((p: Personel) => ({
                resourceId: p.id,
                resourceTitle: p.fullName
            })));

        } catch (error) {
            console.error("Takvim verileri çekilirken hata:", error);
            toast({ title: "Hata", description: "Takvim verileri çekilemedi.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [pageData, toast]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCustomerAdded = useCallback((newCustomer: Customer) => {
      setCustomers(prev => [...prev, newCustomer]);
      fetchData();
    }, [fetchData]);

    
    const isSlotWorkingTime = useCallback((slotDate: Date, resourceId?: string): boolean => {
        if (!businessSettings || !pageData?.personnel) return true;
    
        const dayOfWeek = getDay(slotDate).toString();
        const personnel = resourceId ? pageData.personnel.find(p => p.id === resourceId) : null;
    
        const personnelWorkingDays = personnel?.workingDays;
        const hasCustomSchedule = personnelWorkingDays && Object.keys(personnelWorkingDays).length > 0;
    
        let effectiveSettings;
    
        if (hasCustomSchedule) {
            effectiveSettings = personnelWorkingDays[dayOfWeek];
        } else {
            effectiveSettings = businessSettings[dayOfWeek];
        }

        if (!effectiveSettings || !effectiveSettings.isWorkingDay) {
            return false;
        }
    
        const slotTime = slotDate.getHours() * 60 + slotDate.getMinutes();
        const startTime = parseInt(effectiveSettings.startTime.split(':')[0]) * 60 + parseInt(effectiveSettings.startTime.split(':')[1]);
        const endTime = parseInt(effectiveSettings.endTime.split(':')[0]) * 60 + parseInt(effectiveSettings.endTime.split(':')[1]);
    
        return slotTime >= startTime && slotTime < endTime;
    }, [businessSettings, pageData?.personnel]);


    const handleSelectSlot = useCallback(({ start, end, resourceId }: { start: Date, end: Date, resourceId?: string }) => {
        if (isClosingModal.current || isModalOpen.current) {
            return;
        }

        const openAppointmentModal = () => {
            setAddModalState({ isOpen: true, initialData: { start, end, resourceId } });
        };

        if (!isSlotWorkingTime(start, resourceId)) {
            setConfirmationState({
                isOpen: true,
                title: "Çalışma Saati Uyarısı",
                description: "Seçtiğiniz zaman dilimi, personelin normal çalışma saatleri dışındadır. Yine de randevu oluşturmak istiyor musunuz?",
                onConfirm: () => {
                    setConfirmationState({ ...confirmationState, isOpen: false });
                    openAppointmentModal();
                },
                onCancel: () => setConfirmationState({ ...confirmationState, isOpen: false })
            });
        } else {
            openAppointmentModal();
        }
    }, [isSlotWorkingTime, confirmationState]); 
    
    const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
        if (isModalOpen.current) {
            return;
        }
        setEditingEvent(event as CalendarEvent);
    }, []); 


    const handleModalClose = () => {
        isClosingModal.current = true;
        if (addModalState.isOpen) setAddModalState({ isOpen: false });
        if(editingEvent) setEditingEvent(null);
        if (confirmationState.isOpen) setConfirmationState({ ...confirmationState, isOpen: false });
        setTimeout(() => { isClosingModal.current = false; }, 100);
    };

    const handlePartialSuccess = (newCustomer? : Customer) => {
        if (newCustomer) handleCustomerAdded(newCustomer);
        else fetchData();
    }
    
    const handleFullSuccess = () => {
        handleModalClose();
        fetchData();
    }
    
    const slotPropGetter = useCallback((date: Date, resourceId?: string) => {
        if (!isSlotWorkingTime(date, resourceId)) {
            return { className: 'rbc-off-range-bg' };
        }
        return {};
    }, [isSlotWorkingTime]);

    const eventPropGetter = (event: CalendarEvent) => {
        const isCompleted = event.status === 'completed';
        return {
            className: cn(isCompleted && 'bg-green-200 border-green-400 text-gray-600'),
            style: { opacity: isCompleted ? 0.7 : 1 },
        };
    };

    const handleEventDrop = useCallback(async ({ event, start, end, resourceId }: { event: BigCalendarEvent, start: Date, end: Date, resourceId: string }) => {
        
        const originalEvent = { ...event } as CalendarEvent;

        const proceedWithUpdate = async () => {
            const newPersonnel = pageData?.personnel.find(p => p.id === resourceId);

            const updatedEvent = {
                ...event,
                start,
                end,
                resourceId,
                personnelId: resourceId,
                personnelName: newPersonnel?.fullName || event.personnelName,
            } as CalendarEvent;

            setEvents(prevEvents => prevEvents.map(e => e.id === event.id ? updatedEvent : e));

            try {
                const result = await performUpdateAppointmentAction({ 
                    event: event as Appointment, 
                    start, 
                    end, 
                    newPersonnelId: resourceId 
                });

                if (!result.success) {
                    toast({ title: "Hata", description: result.message, variant: "destructive" });
                    setEvents(prevEvents => prevEvents.map(e => e.id === originalEvent.id ? originalEvent : e));
                } else {
                     toast({ title: "Başarılı", description: "Randevu başarıyla güncellendi."});
                     fetchData();
                }
            } catch (error) {
                toast({ title: "Hata", description: "Randevu güncellenirken bir hata oluştu.", variant: "destructive" });
                setEvents(prevEvents => prevEvents.map(e => e.id === originalEvent.id ? originalEvent : e));
            }
        }
        
        if (!isSlotWorkingTime(start, resourceId)) {
             setConfirmationState({
                isOpen: true,
                title: "Çalışma Saati Uyarısı",
                description: "Randevuyu personelin normal çalışma saatleri dışına taşıyorsunuz. Emin misiniz?",
                onConfirm: () => {
                    setConfirmationState({ ...confirmationState, isOpen: false });
                    proceedWithUpdate();
                },
                onCancel: () => {
                    setConfirmationState({ ...confirmationState, isOpen: false });
                    setEvents(prev => [...prev]); 
                }
            });
        } else {
            await proceedWithUpdate();
        }

    }, [fetchData, toast, pageData?.personnel, isSlotWorkingTime, confirmationState]);
    
    const handleEventResize = useCallback(async ({ event, start, end }: { event: BigCalendarEvent, start: Date, end: Date }) => {
        const originalEvent = { ...event };

        const updatedEvent = { ...event, start, end } as CalendarEvent;
        setEvents(prevEvents => prevEvents.map(e => e.id === event.id ? updatedEvent : e));
        
        try {
            const result = await performUpdateAppointmentAction({
                event: event as Appointment,
                start,
                end,
            });

            if (!result.success) {
                toast({ title: "Hata", description: result.message, variant: "destructive" });
                setEvents(prevEvents => prevEvents.map(e => e.id === originalEvent.id ? (originalEvent as CalendarEvent) : e));
            } else {
                toast({ title: "Başarılı", description: "Randevu süresi başarıyla güncellendi."});
            }
        } catch (error) {
            toast({ title: "Hata", description: "Randevu güncellenirken bir hata oluştu.", variant: "destructive" });
            setEvents(prevEvents => prevEvents.map(e => e.id === originalEvent.id ? (originalEvent as CalendarEvent) : e));
        }
    }, [toast]);


    const handleNavigate = useCallback((newDate: Date) => setDate(newDate), []);
    const handleView = useCallback((newView: View) => setView(newView), []);

    const { minTime, maxTime } = useMemo(() => {
        let min = setMinutes(setHours(new Date(), 9), 0);
        let max = setMinutes(setHours(new Date(), 18), 0);

        const relevantSettings = businessSettings ? [businessSettings] : [];
        pageData?.personnel.forEach(p => {
            if (p.workingDays && Object.keys(p.workingDays).length > 0) {
                relevantSettings.push(p.workingDays);
            }
        });

        if (relevantSettings.length > 0) {
            const dayOfWeek = getDay(date).toString();
            let earliestStart = 24 * 60;
            let latestEnd = 0;

            relevantSettings.forEach(settingCollection => {
                const daySetting = settingCollection[dayOfWeek];
                if (daySetting && daySetting.isWorkingDay) {
                    const start = parseInt(daySetting.startTime.split(':')[0]) * 60 + parseInt(daySetting.startTime.split(':')[1]);
                    const end = parseInt(daySetting.endTime.split(':')[0]) * 60 + parseInt(daySetting.endTime.split(':')[1]);
                    if (start < earliestStart) earliestStart = start;
                    if (end > latestEnd) latestEnd = end;
                }
            });

            if (earliestStart !== 24 * 60) min = setMinutes(setHours(new Date(), Math.floor(earliestStart / 60)), earliestStart % 60);
            if (latestEnd !== 0) max = setMinutes(setHours(new Date(), Math.floor(latestEnd / 60)), latestEnd % 60);
        }
    
        const eventsOnDay = events.filter(e => isSameDay(e.start, date));
        if (eventsOnDay.length > 0) {
            const latestEventEnd = new Date(Math.max(...eventsOnDay.map(e => e.end.getTime())));
            if (latestEventEnd > max) max = latestEventEnd;
        }
        max = addHours(max, 2);
    
        return { minTime: min, maxTime: max };
    }, [date, businessSettings, events, pageData?.personnel]);


    if (isLoading || !businessSettings) {
        return <div className="flex justify-center items-center h-full"><p>Takvim yükleniyor...</p></div>;
    }

    return (
        <div className="h-full bg-card p-4 rounded-lg shadow-md flex flex-col">
            <DnDCalendar
                localizer={localizer}
                events={events}
                resources={personnelResources}
                resourceIdAccessor="resourceId"
                resourceTitleAccessor="resourceTitle"
                views={[Views.DAY, Views.WEEK, Views.MONTH]}
                step={15}
                timeslots={4}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                messages={messages}
                culture='tr'
                selectable={true}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                resizable
                slotPropGetter={slotPropGetter}
                eventPropGetter={eventPropGetter}
                min={minTime} 
                max={maxTime} 
                date={date}
                view={view}
                onNavigate={handleNavigate}
                onView={handleView}
                components={{
                    toolbar: CustomToolbar,
                }}
            />

            {pageData && (
                <AppointmentDialog
                    isOpen={addModalState.isOpen}
                    onOpenChange={(open) => {
                        if (!open) handleModalClose();
                    }}
                    customers={customers}
                    personnelList={pageData.personnel}
                    services={pageData.services}
                    packages={pageData.packages}
                    onSuccess={handleFullSuccess}
                    onCustomerAdded={handleCustomerAdded}
                    initialData={addModalState.initialData}
                />
            )}
            
            {editingEvent && pageData && (
                 <AppointmentEditDialog
                    isOpen={!!editingEvent}
                    onOpenChange={(open) => {
                        if (!open) handleModalClose();
                    }}
                    appointment={editingEvent}
                    allAppointments={events}
                    customers={customers}
                    personnelList={pageData.personnel}
                    services={pageData.services}
                    packages={pageData.packages}
                    products={pageData.products}
                    onFullSuccess={handleFullSuccess}
                    onPartialSuccess={handlePartialSuccess}
                />
            )}

             <AlertDialog open={confirmationState.isOpen} onOpenChange={(isOpen) => !isOpen && confirmationState.onCancel?.()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmationState.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmationState.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={confirmationState.onCancel}>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmationState.onConfirm}>Devam Et</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
```

#### 3. Proje Bağımlılıkları
`react-dnd` ve `react-dnd-html5-backend` kütüphanelerinin projede zaten mevcut olduğunu gösterir.

**Dosya Yolu:** `package.json`
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.0.4",
    "@genkit-ai/next": "^1.0.4",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@tanstack-query-firebase/react": "^1.0.5",
    "@tanstack/react-query": "^5.66.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.1.3",
    "firebase": "^11.3.0",
    "firebase-admin": "^12.3.0",
    "genkit": "^1.0.4",
    "lucide-react": "^0.475.0",
    "next": "15.2.3",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-big-calendar": "^1.13.1",
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "server-only": "^0.0.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-big-calendar": "^1.8.9",
    "@types/react-dom": "^18",
    "genkit-cli": "^1.0.4",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```