
"use client";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, dateFnsLocalizer, Views, type View, type Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setHours, setMinutes, isSameDay, addHours } from 'date-fns';
import tr from 'date-fns/locale/tr';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getCalendarPageData, performUpdateAppointmentAction, type Appointment, type CalendarPageData } from '../randevular/actions';
import { getBusinessHoursAction, type BusinessSettings } from '../ayarlar/actions';
import { type Personel, updatePersonelOrderAction } from '../personeller/actions';
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
    
    const refreshData = useCallback(async () => {
        setIsLoading(true);
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
            
            const sortedPersonnel = data.personnel.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            setPersonnelResources(sortedPersonnel.map((p: Personel) => ({
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
    }, [toast]);
    
    useEffect(() => {
        refreshData();
    }, [refreshData]);
    
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
                    setConfirmationState(prev => ({ ...prev, isOpen: false }));
                    openAppointmentModal();
                },
                onCancel: () => setConfirmationState(prev => ({ ...prev, isOpen: false }))
            });
        } else {
            openAppointmentModal();
        }
    }, [isSlotWorkingTime]); 
    
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
        if (confirmationState.isOpen) setConfirmationState(prev => ({ ...prev, isOpen: false }));
        setTimeout(() => { isClosingModal.current = false; }, 100);
    };
    
    const handleFullSuccess = () => {
        handleModalClose();
        refreshData();
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
                     refreshData();
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
                    setConfirmationState(prev => ({ ...prev, isOpen: false }));
                    proceedWithUpdate();
                },
                onCancel: () => {
                    setConfirmationState(prev => ({ ...prev, isOpen: false }));
                    setEvents(prev => [...prev]); 
                }
            });
        } else {
            await proceedWithUpdate();
        }
    }, [refreshData, toast, pageData?.personnel, isSlotWorkingTime]);
    
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
                refreshData();
            }
        } catch (error) {
            toast({ title: "Hata", description: "Randevu güncellenirken bir hata oluştu.", variant: "destructive" });
            setEvents(prevEvents => prevEvents.map(e => e.id === originalEvent.id ? (originalEvent as CalendarEvent) : e));
        }
    }, [toast, refreshData]);

    const handleNavigate = useCallback((newDate: Date) => setDate(newDate), []);
    const handleView = useCallback((newView: View) => setView(newView), []);
    
    const moveResource = useCallback(async (dragIndex: number, hoverIndex: number) => {
        setPersonnelResources(prevResources => {
            const newResources = [...prevResources];
            const draggedResource = newResources[dragIndex];
            
            newResources.splice(dragIndex, 1);
            newResources.splice(hoverIndex, 0, draggedResource);
            
            const personelIds = newResources.map(resource => resource.resourceId);
            updatePersonelOrderAction(personelIds)
                .catch(() => {
                    toast({ title: "Hata", description: "Sıralama güncellenirken bir hata oluştu.", variant: "destructive" });
                    refreshData(); 
                });

            return newResources;
        });
    }, [refreshData, toast]);
    
    const ResourceHeader = useCallback(({ resource }: { resource: Resource }) => {
        const index = personnelResources.findIndex(r => r.resourceId === resource.resourceId);
        return <DraggableResourceHeader resource={resource} index={index} moveResource={moveResource} />;
    }, [personnelResources, moveResource]);
    
    const eventsOnDay = useMemo(() => events.filter(e => isSameDay(e.start, date)), [events, date]);

    const { minTime, maxTime } = useMemo(() => {
        let min = setMinutes(setHours(new Date(), 9), 0);
        let max = setMinutes(setHours(new Date(), 18), 0);

        if (pageData?.personnel && businessSettings) {
            const relevantSettings = [businessSettings, ...pageData.personnel.map(p => p.workingDays).filter(wd => wd && Object.keys(wd).length > 0)];
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
    
        if (eventsOnDay.length > 0) {
            const latestEventEnd = new Date(Math.max(...eventsOnDay.map(e => e.end.getTime())));
            if (latestEventEnd > max) max = latestEventEnd;
        }
        max = addHours(max, 2);
    
        return { minTime: min, maxTime: max };
    }, [date, businessSettings, pageData?.personnel, eventsOnDay]);

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
                        onCustomerAdded={refreshData}
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
                        onPartialSuccess={refreshData}
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
