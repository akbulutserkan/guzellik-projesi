"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { View, ToolbarProps } from "react-big-calendar";
import { Navigate } from 'react-big-calendar';

export function CustomToolbar(toolbar: ToolbarProps) {
  const { onNavigate, onView, date, label } = toolbar;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('day');


  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onNavigate(Navigate.DATE, selectedDate);
      setPopoverOpen(false);
    }
  };

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    onNavigate(action);
  };
  
  const handleViewChange = (view: View) => {
    onView(view);
    setCurrentView(view);
  };

  const renderDateNavigation = () => {
    return (
        <div className="flex items-center gap-2">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <div className="flex items-center gap-2 rounded-md shadow-md p-1 bg-card">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleNavigate("PREV")}
                        aria-label="Önceki"
                        className="h-14 w-10"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <PopoverTrigger asChild>
                         <button className="flex flex-col items-center justify-center text-center w-16 h-16 cursor-pointer rounded-full hover:bg-accent transition-colors group">
                            <span className="text-xs font-semibold uppercase text-muted-foreground group-hover:text-primary">
                                {format(date, 'EEE', { locale: tr })}
                            </span>
                             <span className="text-2xl font-bold text-primary">
                                {format(date, 'd')}
                            </span>
                        </button>
                    </PopoverTrigger>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleNavigate("NEXT")}
                        aria-label="Sonraki"
                        className="h-14 w-10"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={tr}
                        defaultMonth={date}
                    />
                </PopoverContent>
            </Popover>
             <Button
              variant="outline"
              onClick={() => handleNavigate("TODAY")}
              className="h-10 rounded-md shadow-md"
            >
              Bugün
            </Button>
        </div>
    );
  };

  return (
    <div className="flex items-center justify-between p-2 mb-4">
        {renderDateNavigation()}
        
        <div className="flex items-center gap-2">
            <Select value={currentView} onValueChange={handleViewChange}>
                <SelectTrigger className="w-[120px] rounded-md shadow-md h-10">
                    <SelectValue placeholder="Görünüm" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="day">Gün</SelectItem>
                    <SelectItem value="week">Hafta</SelectItem>
                    <SelectItem value="month">Ay</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
  );
}
