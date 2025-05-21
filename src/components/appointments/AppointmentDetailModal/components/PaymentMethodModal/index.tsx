'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PaymentMethod = 'Nakit' | 'Kredi Kartı' | 'Havale/EFT';

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMethod: (method: PaymentMethod) => void;
  loading: boolean;
}

export default function PaymentMethodModal({
  open,
  onOpenChange,
  onSelectMethod,
  loading
}: PaymentMethodModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6 bg-white rounded-xl shadow-lg" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Ödeme Yöntemi Seçin</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            disabled={loading}
            onClick={() => onSelectMethod('Nakit')}
            className="p-3 h-auto text-lg bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            Nakit
          </Button>
          
          <Button
            disabled={loading}
            onClick={() => onSelectMethod('Kredi Kartı')}
            className="p-3 h-auto text-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Kart
          </Button>
          
          <Button
            disabled={loading}
            onClick={() => onSelectMethod('Havale/EFT')}
            className="p-3 h-auto text-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            Havale / EFT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
