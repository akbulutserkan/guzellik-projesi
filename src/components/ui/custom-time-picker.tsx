
"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CustomTimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

export function CustomTimePicker({ value, onChange, disabled }: CustomTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hour, minute] = value.split(':');
  
  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);

  const handleHourClick = (h: string) => {
    onChange(`${h}:${minute}`);
  };
  
  const handleMinuteClick = (m: string) => {
    onChange(`${hour}:${m}`);
    setOpen(false);
  };

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        const selectedHour = hourRef.current?.querySelector(`[data-hour="${hour}"]`);
        selectedHour?.scrollIntoView({ block: "nearest" });
        
        const selectedMinute = minuteRef.current?.querySelector(`[data-minute="${minute}"]`);
        selectedMinute?.scrollIntoView({ block: "nearest" });
      }, 10);
    }
  }, [open, hour, minute]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex flex-col items-center justify-center text-center w-14 h-14 cursor-pointer rounded-full",
            "hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="text-xl font-bold tabular-nums -mb-1 pointer-events-none">
            {hour || "00"}
          </span>
          <span className="text-xs uppercase text-muted-foreground group-hover:text-primary tabular-nums pointer-events-none">
            {minute || "00"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1" align="center">
        <div className="flex">
          <div 
            ref={hourRef}
            className="h-48 w-16 overflow-y-auto no-scrollbar p-1"
            onWheel={(e) => {
              e.currentTarget.scrollBy(0, e.deltaY);
              e.preventDefault();
            }}
          >
            {hours.map((h) => (
              <div
                key={h}
                data-hour={h}
                onClick={() => handleHourClick(h)}
                className={cn(
                  "w-full text-center rounded-sm py-2 text-sm cursor-pointer",
                  h === hour
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                {h}
              </div>
            ))}
          </div>
          
          <div 
            ref={minuteRef}
            className="h-48 w-16 overflow-y-auto no-scrollbar p-1 border-l"
            onWheel={(e) => {
              e.currentTarget.scrollBy(0, e.deltaY);
              e.preventDefault();
            }}
          >
            {minutes.map((m) => (
              <div
                key={m}
                data-minute={m}
                onClick={() => handleMinuteClick(m)}
                className={cn(
                  "w-full text-center rounded-sm py-2 text-sm cursor-pointer",
                  m === minute
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
