'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Basitleştirilmiş Dropdown Menu bileşeni
// Dialog bileşenini kullanarak oluşturulmuştur

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('relative inline-block', className)} {...props}>
    {children}
  </div>
))
DropdownMenu.displayName = 'DropdownMenu'

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DialogTrigger>,
  React.ComponentPropsWithoutRef<typeof DialogTrigger>
>(({ className, children, ...props }, ref) => (
  <DialogTrigger
    ref={ref}
    className={cn('flex items-center', className)}
    {...props}
  >
    {children}
  </DialogTrigger>
))
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md',
      'fixed right-4 mt-2 origin-top-right',
      className
    )}
    {...props}
  >
    {children}
  </DialogContent>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
  </button>
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

// Basitleştirilmiş versiyonda sadece temel bileşenleri dışa aktarıyoruz
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}
