import { ReactNode, MouseEvent, ChangeEvent, FormEvent } from 'react'
import { Event } from 'react-big-calendar'
import { SlotInfo as RBCSlotInfo } from 'react-big-calendar'

// JSX tiplemesi
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

// Event tiplemeleri
export interface CustomMouseEvent extends MouseEvent<HTMLElement> {
  stopPropagation(): void
}

export interface Staff {
  id: string;
  name: string;
  phone: string
  workingHours: {
    [key: string]: {
      enabled: boolean;
      start: string;
      end: string;
    }
  };
  showInCalendar: boolean;
  // ... diğer özellikler
}
export interface Service {
  id: string
  name: string
  duration: number
  price: number
}

export interface Customer {
  id: string
  name: string
  phone: string
}

export interface FormData {
  customerId: string
  staffId: string
  serviceId: string
  startTime: string
  endTime: string
  notes: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
}

export interface Appointment extends Omit<Event, 'start' | 'end'> {
  id: string
  title: string
  start: Date
  end: Date
  resourceId: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  customerId: string
  serviceId: string
  notes?: string
}

export interface AppointmentResponse {
  id: string
  startTime: string
  endTime: string
  staffId: string
  customer: Customer
  service: Service
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  customerId: string
  serviceId: string
  notes?: string
}

export interface SlotInfo extends Omit<RBCSlotInfo, 'bounds'> {
  bounds: {
    x: number
    y: number
    top: number
    bottom: number
    left: number
    right: number
  } | undefined
  resourceId?: string
}

export interface EventChangeInfo {
  event: Event & Appointment
  start: Date
  end: Date
  resourceId?: string
  isAllDay?: boolean
}

// UpdateEventArgs - aynı EventChangeInfo arayüzü ile
export interface UpdateEventArgs {
  event: Event & Appointment
  start: Date
  end: Date
  resourceId?: string
  isAllDay?: boolean
}

export interface TimeSlot {
  time: Date
  staffId: string
  onDrop: (appointmentId: string, staffId: string, startTime: Date) => void
  children?: ReactNode
}

export interface DraggableAppointmentProps {
  appointment: Appointment
  onResize: (appointmentId: string, duration: number) => void
  timeSlotHeight: number
}

export interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointmentData: FormData) => Promise<void>
  staff: Staff[]
  appointment: Appointment | null
  selectedDate: SlotInfo | null
}