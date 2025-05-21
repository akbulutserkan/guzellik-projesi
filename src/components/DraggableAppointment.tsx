import { FC, useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { useDrag } from 'react-dnd'
import { DraggableAppointmentProps } from '../types/appointment'

const DraggableAppointment: FC<DraggableAppointmentProps> = ({ 
  appointment, 
  onResize,
  timeSlotHeight 
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startHeight, setStartHeight] = useState(0)
  const [height, setHeight] = useState((appointment.service.duration / 60) * timeSlotHeight)

  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'appointment',
    item: { appointmentId: appointment.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  dragRef(ref)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 hover:bg-yellow-200'
      case 'CONFIRMED': return 'bg-green-100 hover:bg-green-200'
      case 'CANCELLED': return 'bg-red-100 hover:bg-red-200'
      default: return 'bg-gray-100 hover:bg-gray-200'
    }
  }

  const handleMouseDown = (e: React.MouseEvent, position: 'top' | 'bottom') => {
    if (e.button !== 0) return
    setIsResizing(true)
    setStartY(e.clientY)
    setStartHeight(height)

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientY - startY
      let newHeight = position === 'bottom' ? startHeight + diff : startHeight - diff
      newHeight = Math.max(timeSlotHeight, Math.min(timeSlotHeight * 4, newHeight))
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      const newDuration = Math.round((height / timeSlotHeight) * 60)
      onResize(appointment.id, newDuration)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={ref}
      className={`relative ${getStatusColor(appointment.status)} rounded mb-1 ${isDragging ? 'opacity-50' : ''}`}
      style={{ height: `${height}px` }}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-gray-400 hover:bg-opacity-25"
        onMouseDown={(e) => handleMouseDown(e, 'top')}
      />
      <div className="p-2 h-full cursor-move">
        <div className="font-medium text-sm truncate">{appointment.service.name}</div>
        <div className="text-xs truncate">
          {appointment.customer.firstName} {appointment.customer.lastName}
        </div>
        <div className="text-xs text-gray-500">
          {format(parseISO(appointment.startTime), 'HH:mm')}
        </div>
        <div className="text-xs text-gray-500">
          Süre: {Math.round((height / timeSlotHeight) * 60)} dk
        </div>
      </div>
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-gray-400 hover:bg-opacity-25"
        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
      />
    </div>
  )
}

export default DraggableAppointment