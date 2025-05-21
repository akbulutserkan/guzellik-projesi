'use client';

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ShiftEndConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictMessage: string;
  onConfirm: () => void;
}

export default function ShiftEndConflictModal({
  open,
  onOpenChange,
  conflictMessage,
  onConfirm
}: ShiftEndConflictModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Randevu Çakışması</AlertDialogTitle>
          <AlertDialogDescription>
            {conflictMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            İptal
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Çakışmayı Yoksay ve Randevuyu Oluştur
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
