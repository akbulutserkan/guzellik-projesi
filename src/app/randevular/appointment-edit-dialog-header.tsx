
"use client";

import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";

interface AppointmentEditDialogHeaderProps {
  customerName: string;
  customerPhone: string;
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  onAddService: () => void;
  onAddProduct: () => void;
  onAddNote: () => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  showNotes: boolean;
}

export function AppointmentEditDialogHeader({
  customerName,
  customerPhone,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  onAddService,
  onAddProduct,
  onAddNote,
  isSubmitting,
  isDeleting,
  showNotes
}: AppointmentEditDialogHeaderProps) {
  return (
    <div className="p-4 pb-2 space-y-2 flex-shrink-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-grow">
          <h2 className="text-lg font-bold">{customerName}</h2>
          <p className="text-sm text-muted-foreground">{formatPhoneNumber(customerPhone)}</p>
        </div>
        <div className="flex-grow flex justify-center items-center gap-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg flex-shrink-0 bg-card shadow-md">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onAddService} disabled={isSubmitting || isDeleting}>Hizmet Ekle</DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddProduct} disabled={isSubmitting || isDeleting}>Ürün Ekle</DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddNote} disabled={isSubmitting || isDeleting || showNotes}>Not Ekle</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
               <button type="button"
                className="flex flex-col items-center justify-center text-center w-14 h-14 cursor-pointer rounded-full hover:bg-accent transition-colors group border shadow-md"
              >
                <span className="text-xs font-semibold uppercase text-muted-foreground group-hover:text-primary">
                  {date ? format(date, 'EEE', { locale: tr }) : ''}
                </span>
                <span className="text-xl font-bold text-primary">
                  {date ? format(date, 'd') : ''}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                initialFocus
                locale={tr}
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear() + 1}
              />
            </PopoverContent>
          </Popover>
          <CustomTimePicker
            value={startTime}
            onChange={onStartTimeChange}
            disabled={isSubmitting || isDeleting}
          />
        </div>
        <div className="flex-grow"></div>
      </div>
    </div>
  );
}
