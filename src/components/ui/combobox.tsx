
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    disabled?: boolean;
    listClassName?: string;
    action?: React.ReactNode;
    onSearchChange?: (search: string) => void;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(({
    options,
    value,
    onChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    noResultsText = "No results found.",
    disabled = false,
    listClassName,
    action,
    onSearchChange,
}, ref) => {
  const [open, setOpen] = React.useState(false)

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 rounded-md shadow-md focus:ring-2 focus:ring-ring bg-card font-normal"
          disabled={disabled}
        >
          <span className="truncate">
            {value ? selectedLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0"
        style={{ 
          zIndex: 9999,
          transform: 'translateZ(0)'
        }}
      >
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-center text-sm">{noResultsText}</div>
              {action}
            </CommandEmpty>
            <div className="max-h-48 overflow-y-auto">
              <CommandGroup className={cn("overflow-auto", listClassName)}>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                        onChange(option.value === value ? "" : option.value)
                        setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
});
Combobox.displayName = "Combobox";

export { Combobox };
