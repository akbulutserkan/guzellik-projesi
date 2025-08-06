
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const CustomSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[18px] w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary",
      "data-[state=unchecked]:bg-gray-400",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none relative flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "data-[state=unchecked]:-translate-x-0.5 data-[state=unchecked]:text-gray-600"
      )}
    >
        <Check
            className={cn(
            "h-4 w-4 stroke-[3] absolute transition-opacity",
            props.checked ? "opacity-100" : "opacity-0"
            )}
        />
        <Minus
            className={cn(
            "h-4 w-4 stroke-[3] absolute transition-opacity",
            !props.checked ? "opacity-100" : "opacity-0"
            )}
        />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
CustomSwitch.displayName = "CustomSwitch"

export { CustomSwitch }
