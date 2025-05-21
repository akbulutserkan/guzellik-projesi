"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

// Bu yeni bir Dialog bileşenidir, dış tıklamaları kapanabilecek şekilde
const DialogWithoutPrevent = DialogPrimitive.Root

const DialogWithoutPreventTrigger = DialogPrimitive.Trigger

const DialogWithoutPreventPortal = ({
  className,
  ...props
}: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal className={cn(className)} {...props} />
)
DialogWithoutPreventPortal.displayName = DialogPrimitive.Portal.displayName

const DialogWithoutPreventOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
DialogWithoutPreventOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogWithoutPreventContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DialogWithoutPreventPortal>
    <DialogWithoutPreventOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-background p-6 shadow-xl border-0 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
        className
      )}
      {...props}
    />
  </DialogWithoutPreventPortal>
))
DialogWithoutPreventContent.displayName = DialogPrimitive.Content.displayName

const DialogWithoutPreventHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogWithoutPreventHeader.displayName = "DialogWithoutPreventHeader"

const DialogWithoutPreventFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogWithoutPreventFooter.displayName = "DialogWithoutPreventFooter"

const DialogWithoutPreventTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
DialogWithoutPreventTitle.displayName = DialogPrimitive.Title.displayName

const DialogWithoutPreventDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogWithoutPreventDescription.displayName =
  DialogPrimitive.Description.displayName

const DialogWithoutPreventAction = DialogPrimitive.Close

export {
  DialogWithoutPrevent,
  DialogWithoutPreventTrigger,
  DialogWithoutPreventContent,
  DialogWithoutPreventHeader,
  DialogWithoutPreventFooter,
  DialogWithoutPreventTitle,
  DialogWithoutPreventDescription,
  DialogWithoutPreventAction,
}
