Merhaba, Next.js ve `react-big-calendar` kütüphanesi kullanan bir takvim uygulaması geliştiriyorum. "Gün" görünümünde, personel isimlerinin (resource headers) hemen altında, zaman çizelgesinin üzerinde fazladan boş bir satır oluşuyor. Bu durum, dikeyde gereksiz bir alan kaplayarak takvimin daha az verimli kullanılmasına neden oluyor.

**Hedef:**

Bu boş satırı CSS veya bileşen yapılandırması yoluyla kaldırarak, personel isimlerinin doğrudan zaman çizelgesinin üstüne bitişik olmasını sağlamak istiyorum.

**Önceki Başarısız Deneme ve Yeni Sorun:**

Bu sorunu çözmek için daha önce bazı CSS kuralları denendi. Özellikle `.rbc-time-header-content > div:not(.rbc-resource-header)` gibi bir seçiciye `display: none` uygulamak, istenmeyen bir yan etkiye yol açtı: Bu kural, sadece boşluğu değil, **personel başlıklarının kendilerini de tamamen ortadan kaldırdı.**

Bu durum, hedeflediğimiz elementin yapısının beklediğimizden farklı olduğunu veya seçicinin fazla agresif olduğunu gösteriyor.

Sizden, bu yeni bilgiyi (yani başlıkların tamamen kaybolması sorununu) dikkate alarak, yalnızca o istenmeyen boşluğu kaldıran, ancak personel başlıklarının görünürlüğünü kesinlikle etkilemeyen, daha hassas ve doğru bir CSS veya bileşen yapılandırma çözümü sunmanızı rica ediyorum.

---

### İlgili Proje Dosyaları

**1. Takvim Sayfası Bileşeni**
Bu dosya, `react-big-calendar`'ın ana yapılandırmasını içerir.

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
import { type Personel, updatePersonelOrderAction, addOrderToExistingPersonel } from '../personeller/actions';
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
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './page.css';

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
    order?: number;
}

interface DraggableItem {
    id: string;
    index: number;
    type: string;
}

const DraggableResourceHeader = ({ resource, index, moveResource }: { 
    resource: Resource, 
    index: number, 
    moveResource: (dragIndex: number, hoverIndex: number) => void 
}) => {
    const ref = useRef<HTMLDivElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
        type: 'resource',
        item: { id: resource.resourceId, index } as DraggableItem,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: 'resource',
        hover(item: DraggableItem, monitor) {
            if (!ref.current) return;
            
            const dragIndex = item.index;
            const hoverIndex = index;
            
            if (dragIndex === hoverIndex) return;
            
            const hoverBoundingRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
            
            moveResource(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    drag(drop(ref));

    return (
        <div 
            ref={ref}
            className={`rbc-resource-header ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            style={{ cursor: 'move' }}
        >
            {resource.resourceTitle}
        </div>
    );
};

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
    
    const initializeOrderField = useCallback(async () => {
        try {
            await addOrderToExistingPersonel();
        } catch (error) {
            console.error("Order alanı eklenirken hata oluştu:", error);
        }
    }, []);
    
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
                resourceTitle: p.fullName,
                order: p.order
            })));
        } catch (error) {
            console.error("Takvim verileri çekilirken hata:", error);
            toast({ title: "Hata", description: "Takvim verileri çekilemedi.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [pageData, toast]);
    
    useEffect(() => {
        initializeOrderField();
        fetchData();
    }, [initializeOrderField, fetchData]);
    
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
    
    const moveResource = useCallback(async (dragIndex: number, hoverIndex: number) => {
        const newResources = [...personnelResources];
        const draggedResource = newResources[dragIndex];
        
        newResources.splice(dragIndex, 1);
        newResources.splice(hoverIndex, 0, draggedResource);
        
        setPersonnelResources(newResources);
        
        try {
            const personelIds = newResources.map(resource => resource.resourceId);
            const result = await updatePersonelOrderAction(personelIds);
            
            if (!result.success) {
                toast({ title: "Hata", description: result.message, variant: "destructive" });
                setPersonnelResources(personnelResources);
            }
        } catch (error) {
            toast({ title: "Hata", description: "Sıralama güncellenirken bir hata oluştu.", variant: "destructive" });
            setPersonnelResources(personnelResources);
        }
    }, [personnelResources, toast]);
    
    const ResourceHeader = ({ resource }: { resource: Resource }) => {
        const index = personnelResources.findIndex(r => r.resourceId === resource.resourceId);
        return <DraggableResourceHeader resource={resource} index={index} moveResource={moveResource} />;
    };
    
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
        <DndProvider backend={HTML5Backend}>
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
                        resourceHeader: ResourceHeader,
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
        </DndProvider>
    );
}

```

**2. Global CSS Dosyası**
Bu dosya, `react-big-calendar` için özel stiller içerir.

**Dosya Yolu:** `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 240 10% 99%; /* Very light gray, almost white */
    --foreground: 240 10% 3.9%; /* Tailwind gray-900 */
    --card: 240 10% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 240 10% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 217 91% 60%; /* Tailwind blue-500 */
    --primary-foreground: 210 40% 98%;
    --secondary: 240 4.8% 95.9%; /* Tailwind gray-100 */
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%; /* Tailwind gray-500 */
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 240 5.9% 90%; /* Tailwind gray-200 */
    --input: 240 5.9% 90%;
    --ring: 217 91% 60%; /* Tailwind blue-500 */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 220 13% 97%; /* Very light, slightly cool gray (#f8f9fa) */
    --sidebar-foreground: 240 5.9% 10%; /* Dark text for light sidebar */
    --sidebar-primary: 217 91% 60%; /* Active sidebar item to match primary color */
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 5.9% 90%; /* Hover color */
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 240 5.9% 90%;
    --sidebar-ring: 217 91% 70%;
  }
  .dark {
    --background: 240 10% 3.9%; /* Dark Gray */
    --foreground: 210 40% 98%;
    --card: 240 10% 100%; /* White card for dialog */
    --card-foreground: 240 10% 3.9%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 210 40% 98%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 210 40% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 217 91% 60%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 20 14.3% 4.1%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217 91% 70%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
}

.product-form {
  @apply max-w-md mx-auto mt-8 p-6 rounded-lg shadow-lg bg-card border border-border;
}

.product-form label {
  @apply block text-sm font-medium text-card-foreground;
}

.product-form input {
  @apply mt-1; 
}

/* Custom styles for react-big-calendar */
/* General container */
.rbc-calendar {
    @apply h-full flex flex-col;
}

/* Header row (personnel names) */
.rbc-time-header {
    @apply bg-transparent border-b-2;
}

.rbc-time-header-content {
    @apply border-y-0 border-x-0;
}

.rbc-time-header .rbc-header {
    @apply p-2 border-b-0 border-x-0 h-auto;
}

.rbc-header {
    @apply text-center text-sm font-semibold text-card-foreground p-3 m-1 bg-card rounded-lg shadow-md border-x-0;
}

.rbc-header.rbc-today {
    @apply bg-primary/20 ring-2 ring-primary;
}

.rbc-header + .rbc-header {
    @apply border-l-0;
}

/* Main content area */
.rbc-time-content {
    @apply flex-grow border-t-0;
}

.rbc-time-content > * + * > * {
    @apply border-l-0;
}

/* Time gutter (saatlerin olduğu sol sütun) */
.rbc-time-gutter {
    @apply bg-card shadow-md rounded-lg mr-2;
}

.rbc-time-gutter .rbc-timeslot-group {
    @apply border-b-0;
}

.rbc-time-gutter .rbc-time-slot {
    @apply border-t-0;
}

.rbc-time-gutter .rbc-label {
    @apply text-xs text-muted-foreground p-2 text-center;
}

/* Day columns */
.rbc-day-slot .rbc-time-slot {
    @apply border-t-0;
}

.rbc-day-bg + .rbc-day-bg {
    @apply border-l-0;
}

.rbc-day-slot .rbc-day-bg {
    @apply bg-card/50 rounded-lg mx-1;
}

/* Non-working day styling */
.rbc-day-bg.rbc-off-range-bg {
    background-color: hsl(var(--muted));
    opacity: 0.6;
    cursor: not-allowed;
}

/* Stil for non-working hours, now more distinct */
.rbc-timeslot.rbc-off-range-slot-bg {
    background-image: repeating-linear-gradient(
        45deg,
        hsla(var(--muted-foreground) / 0.1),
        hsla(var(--muted-foreground) / 0.1) 10px,
        hsla(var(--muted-foreground) / 0.15) 10px,
        hsla(var(--muted-foreground) / 0.15) 20px
    );
    background-color: hsl(var(--muted));
    opacity: 0.9;
}

/* Event styling */
.rbc-event {
    @apply bg-primary/80 border-primary/90 rounded-md p-1 shadow-sm;
}

.rbc-event.rbc-selected {
    @apply bg-primary ring-2 ring-primary-foreground;
}

.rbc-event-label {
    @apply text-xs;
}

.rbc-event-content {
    @apply text-xs;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Modal kaydırma alanları için özel stil */
.modal-scroll-area {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground)) transparent;
  overflow-anchor: none; /* Kaydırma sarsıntısını önler */
  display: flex;
  flex-direction: column;
}

.modal-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.modal-scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground));
  border-radius: 3px;
}

/* Flexbox düzeltmeleri */
.min-h-0 {
  min-height: 0 !important;
}

.flex-grow {
  flex-grow: 1;
}

.h-full {
  height: 100%;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

/* ÇOK ÖNEMLİ: Flex container için gerekli stiller */
.flex-container-fix {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 0%;
}
```

**3. Sürükle-Bırak için Eklenen CSS Dosyası**

**Dosya Yolu:** `src/app/takvim/page.css`
```css
/* Sürülebilir başlıklar için stil */
.rbc-resource-header {
  user-select: none;
  transition: opacity 0.2s, background-color 0.2s;
  padding: 8px 4px;
  border-radius: 4px;
  margin: 2px 0;
}

.rbc-resource-header:hover {
  background-color: rgba(0, 0, 0, 0.05);
  cursor: move;
}

/* Sürükleme sırasında opacity */
.opacity-50 {
  opacity: 0.5 !important;
}

/* Takvimin genel stilini iyileştir */
.rbc-time-header {
  display: flex;
  flex-direction: row; /* Dikey sıralamayı düzeltmek için 'row' yapıldı */
}

.rbc-time-header-content {
  flex: 1;
}

.rbc-time-header-cell-single-day {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.rbc-time-header-cell {
  min-width: 0;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sürükle-bırak için görsel geri bildirim */
.rbc-resource-header.dragging {
  opacity: 0.5;
  background-color: rgba(0, 0, 0, 0.1);
}

.rbc-resource-header.drag-over {
  background-color: rgba(0, 123, 255, 0.1);
  border: 1px dashed rgba(0, 123, 255, 0.5);
}
```