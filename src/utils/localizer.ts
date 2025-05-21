import { format, parse, startOfWeek, getDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { dateFnsLocalizer } from 'react-big-calendar'

const locales = {
  'tr': tr
}

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})