
"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { tr } from 'date-fns/locale'
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "./separator"
import { startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onDateChange
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const presets = [
    { label: 'Bugün', range: { from: new Date(), to: new Date() } },
    { label: 'Dün', range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) } },
    { label: 'Son 7 Gün', range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: 'Bu Ay', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: 'Geçen Ay', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } }
  ];

  const handleSelect = (range: DateRange | undefined) => {
    onDateChange(range);
    // If a full range is selected, close the popover.
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal h-10 rounded-md shadow-md",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL, y", { locale: tr })} -{" "}
                  {format(date.to, "dd LLL, y", { locale: tr })}
                </>
              ) : (
                format(date.from, "dd LLL, y", { locale: tr })
              )
            ) : (
              <span>Tarih aralığı seçin</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex bg-popover" align="start">
          <div className="flex flex-col space-y-2 p-2 border-r">
            {presets.map(({ label, range }) => (
              <Button
                key={label}
                variant="ghost"
                className="justify-start"
                onClick={() => handleSelect(range)}
              >
                {label}
              </Button>
            ))}
            <Separator />
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleSelect(undefined)}
            >
              Temizle
            </Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={tr}
            captionLayout="dropdown-buttons"
            fromYear={2020}
            toYear={new Date().getFullYear() + 1}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
