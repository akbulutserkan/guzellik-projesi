'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RotateCcw, X, Check } from 'lucide-react';
// MCP API fonksiyonlarını import et
import { getServicePriceHistoryMcp, revertPriceHistoryMcp } from '@/lib/mcp/services';

interface PriceHistoryRecord {
  id: string;
  type: string;
  amount: number;
  isPercentage: boolean;
  categoryId: string | null;
  categoryName: string | null;
  affectedCount: number;
  createdAt: Date;
  oldPrices: Record<string, number>;
  isReverted: boolean;
  revertedAt: Date | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => Promise<void>;
}

export function PriceHistoryModal({ open, onOpenChange, onUpdate }: Props) {
  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PriceHistoryRecord | null>(null);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);

  // Geçmiş kayıtlarını getir
  const fetchHistory = async () => {
    if (!open) return;
    
    try {
      setLoading(true);
      
      // MCP API ile fiyat geçmişini getir
      const data = await getServicePriceHistoryMcp();
      setHistory(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Geçmiş kayıtları alınırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Modal açıldığında geçmişi çek
  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  // Geri alma işlemi
  const handleRevert = async () => {
    if (!selectedRecord) return;
    
    try {
      setRevertLoading(true);
      
      // MCP API üzerinden fiyat geçmişi kaydını geri al
      await revertPriceHistoryMcp(selectedRecord.id);

      await onUpdate(); // Hizmet listesini güncelle
      await fetchHistory(); // Geçmişi güncelle
      
      toast({
        title: "Başarılı",
        description: "Fiyatlar başarıyla geri alındı"
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Geri alma işlemi başarısız oldu");
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Geri alma işlemi başarısız oldu",
        variant: "destructive"
      });
    } finally {
      setRevertLoading(false);
      setRevertDialogOpen(false);
    }
  };

  // Geçmiş kaydını formatla
  const formatHistoryRecord = (record: PriceHistoryRecord) => {
    const operation = record.type === 'increase' ? 'Artış' : 
                     record.type === 'decrease' ? 'İndirim' : 'Geri Alma';
    const amount = record.isPercentage ? 
      `%${record.amount}` : 
      `${record.amount.toFixed(2)}₺`;
    
    return `${amount} ${operation}${record.categoryName ? ` - ${record.categoryName}` : ''}`;
  };

  // Sıralı geri alma kontrolü
  const canRevert = (record: PriceHistoryRecord, history: PriceHistoryRecord[]) => {
    const recordIndex = history.findIndex(h => h.id === record.id);
    // Daha yeni kayıtlar geri alınmış olmalı
    for (let i = 0; i < recordIndex; i++) {
      if (!history[i].isReverted) return false;
    }
    return !record.isReverted;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 max-h-[85vh] bg-white rounded-lg shadow-lg" hideCloseButton={true}>
          <DialogHeader className="pl-3 pt-1 pb-1 border-b sticky top-0 bg-white z-10">
            <div className="flex-grow text-left">
              <DialogTitle className="text-xs font-medium text-gray-700">
                Fiyat Güncelleme Geçmişi
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div 
            className="px-3 pt-1 pb-2 overflow-y-auto bg-white"
            style={{ maxHeight: "calc(90vh - 100px)" }}
          >
            {error && (
              <div className="mb-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                Henüz fiyat güncellemesi yapılmamış
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div 
                    key={record.id} 
                    className="p-3 border rounded-[6px] hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(record.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}
                        </div>
                        <div className="font-medium">
                          {formatHistoryRecord(record)}
                        </div>
                        <div className="text-sm">
                          {record.affectedCount} hizmet etkilendi
                        </div>
                        {record.isReverted && (
                          <div className="text-sm text-blue-500">
                            {format(new Date(record.revertedAt!), 'dd.MM.yyyy HH:mm', { locale: tr })} tarihinde geri alındı
                          </div>
                        )}
                      </div>
                      
                      {/* Geri alma butonu */}
                      {record.type !== 'revert' && canRevert(record, history) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setRevertDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Geri Al
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="px-3 py-2 bg-gray-50 border-t sticky bottom-0 z-10">
            <Button 
              type="button" 
              onClick={() => onOpenChange(false)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 text-base font-medium rounded-[6px] transition-all duration-200 h-9"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Geri Alma Onay Dialog'u */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 max-h-[85vh] bg-white rounded-lg shadow-lg" hideCloseButton={true}>
          <DialogHeader className="pl-3 pt-1 pb-1 border-b sticky top-0 bg-white z-10">
            <div className="flex-grow text-left">
              <DialogTitle className="text-xs font-medium text-gray-700">
                İşlemi Geri Al
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div 
            className="px-3 pt-1 pb-2 overflow-y-auto bg-white"
            style={{ maxHeight: "calc(90vh - 100px)" }}
          >
            <p className="text-gray-600">
              Bu fiyat güncelleme işlemini geri almak istediğinizden emin misiniz? Bu işlem, etkilenen hizmetlerin fiyatlarını önceki değerlerine döndürecektir.
            </p>
          </div>
          
          <DialogFooter className="px-3 py-2 bg-gray-50 border-t sticky bottom-0 z-10">
            <div className="w-full grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setRevertDialogOpen(false)}
                className="rounded-[6px]"
                disabled={revertLoading}
              >
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
              <Button
                onClick={handleRevert}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-[6px]"
                disabled={revertLoading}
              >
                {revertLoading ? (
                  <>
                    <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Geri Al
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}