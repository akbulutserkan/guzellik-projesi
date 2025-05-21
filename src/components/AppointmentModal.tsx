import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Phone, Calendar, Clock, User, FileText } from 'lucide-react'


interface AppointmentModalProps {
  appointment: {
    id: string
    start: Date
    end: Date
    customer: {
      firstName: string
      lastName: string
      phone: string
    }
    staff: {
      firstName: string
      lastName: string
    }
    service: {
      name: string
      price?: number
      duration?: number
    }
    status: string
    attendance: string
    notes?: string
  } | null
  isOpen: boolean
  onClose: () => void
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const statusText = {
  PENDING: 'Beklemede',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal Edildi'
}

const attendanceColors = {
  NOT_SPECIFIED: 'bg-gray-100 text-gray-800',
  ATTENDED: 'bg-green-100 text-green-800',
  NOT_ATTENDED: 'bg-red-100 text-red-800'
}

const attendanceText = {
  NOT_SPECIFIED: 'Belirtilmemiş',
  ATTENDED: 'Geldi',
  NOT_ATTENDED: 'Gelmedi'
}

const calculateEndTime = (startTime: string, duration: number) => {
  const start = new Date(startTime);
  return new Date(start.getTime() + duration * 60000);
};

export default function AppointmentModal({ appointment, isOpen, onClose }: AppointmentModalProps) {
  const router = useRouter();

  if (!isOpen || !appointment) return null;

  const handleEdit = () => {
    router.push(`/appointments/${appointment.id}/edit`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {appointment.customer.firstName} {appointment.customer.lastName}
              </h2>
              <p className="text-gray-600 flex items-center mt-1">
                <Phone size={16} className="mr-1" />
                {appointment.customer.phone}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="px-6 mt-4 flex space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[appointment.status as keyof typeof statusColors]}`}>
            {statusText[appointment.status as keyof typeof statusText]}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${attendanceColors[appointment.attendance as keyof typeof attendanceColors]}`}>
            {attendanceText[appointment.attendance as keyof typeof attendanceText]}
          </span>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center text-gray-700">
            <User size={18} className="mr-2" />
            <span>{appointment.staff.firstName} {appointment.staff.lastName}</span>
          </div>

          <div className="flex items-center text-gray-700">
            <Calendar size={18} className="mr-2" />
            <span>{format(appointment.start, 'dd MMMM yyyy, EEEE', { locale: tr })}</span>
          </div>

          <div className="flex items-center text-gray-700">
            <Clock size={18} className="mr-2" />
            <span>
              {format(appointment.start, 'HH:mm', { locale: tr })} - {format(appointment.end, 'HH:mm', { locale: tr })}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="font-medium">{appointment.service.name}</div>
            <div className="text-gray-600 text-sm mt-1">
              {appointment.service.duration && `${appointment.service.duration} dakika`}
              {appointment.service.price && appointment.service.duration && ' • '}
              {appointment.service.price && `${appointment.service.price} TL`}
            </div>
          </div>

          {appointment.notes && (
            <div className="border-t pt-3">
              <div className="flex items-center text-gray-700 mb-2">
                <FileText size={18} className="mr-2" />
                <span className="font-medium">Notlar</span>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap text-sm">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Kapat
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
          >
            Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}
