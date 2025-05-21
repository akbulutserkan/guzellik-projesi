import { FC, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { TimeSlot as TimeSlotType } from '../types/appointment'

const TimeSlot: FC<TimeSlotType> = ({ time, staffId, onDrop, children }) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: 'appointment',
    drop: (item: { appointmentId: string }) => {
      onDrop(item.appointmentId, staffId, time)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  dropRef(ref)

  return (
    <div
      ref={ref}
      className={`h-20 border-b p-2 ${isOver ? 'bg-blue-50' : 'bg-white'}`}
    >
      {children}
    </div>
  )
}

export default TimeSlot