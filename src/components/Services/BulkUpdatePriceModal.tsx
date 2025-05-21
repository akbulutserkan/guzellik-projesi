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
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { BulkUpdatePreview } from '@/types/service';
import { Check, X } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
// MCP API fonksiyonlarını import et
import { bulkUpdateServicePricesMcp, bulkUpdatePreviewServicePricesMcp } from '@/lib/mcp/services'; 

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string }>;
  onUpdate: () => Promise<void>;
}

export function BulkUpdatePriceModal({ open, onOpenChange, categories, onUpdate }: Props) {
  const [type, setType] = useState<'increase' | 'decrease'>('increase');
  const [amount, setAmount] = useState<string>('');
  const [isPercentage, setIsPercentage] = useState<boolean>(true);
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<BulkUpdatePreview | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    try {
      // MCP API ile önizleme yap
      const preview = await bulkUpdatePreviewServicePricesMcp({
        type,
        amount: Number(amount),
        isPercentage,
        categoryId: categoryId || undefined
      });

      setPreview(preview);
    } catch (error) {
      setError("Önizleme alınırken bir hata oluştu");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) fetchPreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, type, isPercentage, categoryId, open]);

  const handleSubmit = () => {
    setError(null);
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Lütfen geçerli bir miktar girin");
      return;
    }
    
    setConfirmationOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      // MCP API üzerinden toplu fiyat güncelleme yap
      await bulkUpdateServicePricesMcp({
        type,
        amount: Number(amount),
        isPercentage,
        categoryId: categoryId || undefined
      });

      toast({
        title: "Başarılı",
        description: "Hizmetlerin fiyatları başarıyla güncellendi"
      });

      await onUpdate();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      setError("Fiyatlar güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
      setConfirmationOpen(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setType('increase');
    setIsPercentage(true);
    setCategoryId('');
    setPreview(null);
    setError(null);
  };

  // Modal kapatıldığında formu sıfırla
  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 max-h-[85vh] bg-white rounded-lg shadow-lg" hideCloseButton={true}>
          <DialogHeader className="pl-3 pt-1 pb-1 border-b sticky top-0 bg-white z-10">
            <div className="flex-grow text-left">
              <DialogTitle className="text-xs font-medium text-gray-700">
                Toplu Fiyat Güncelleme
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
            
            <div className="space-y-1">
              {/* İşlem Tipi Seçimi */}
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={type}
                  onValueChange={(value: 'increase' | 'decrease') => setType(value)}
                >
                  <SelectTrigger className="w-full h-8 border-0 py-0 min-h-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                    <SelectValue placeholder="İşlem Tipi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="increase">Artış</SelectItem>
                    <SelectItem value="decrease">İndirim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Miktar Girişi */}
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  type="number"
                  placeholder="Miktar"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step={isPercentage ? "1" : "0.01"}
                  className="h-8 py-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                  disabled={loading}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                  {isPercentage ? '%' : '₺'}
                </span>
              </div>

              {/* Yüzde/Sabit Seçimi */}
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={isPercentage ? "percentage" : "fixed"}
                  onValueChange={(value) => setIsPercentage(value === "percentage")}
                >
                  <SelectTrigger className="w-full h-8 border-0 py-0 min-h-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                    <SelectValue placeholder="Tür" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit Miktar (₺)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Kategori Seçimi */}
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={categoryId || "all"}
                  onValueChange={(value) => setCategoryId(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-8 border-0 py-0 min-h-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white">
                    <SelectValue placeholder="Kategori Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Önizleme */}
              {preview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-sm mb-1">Değişiklik Önizlemesi</h3>
                  <div className="space-y-1 text-sm">
                    <p>Etkilenecek Hizmet: <span className="font-medium">{preview.affectedServices}</span></p>
                    <p>Mevcut Fiyat Aralığı: <span className="font-medium">₺{preview.currentPriceRange.min.toFixed(2)} - ₺{preview.currentPriceRange.max.toFixed(2)}</span></p>
                    <p>Yeni Fiyat Aralığı: <span className="font-medium">₺{preview.newPriceRange.min.toFixed(2)} - ₺{preview.newPriceRange.max.toFixed(2)}</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="px-3 py-2 bg-gray-50 border-t sticky bottom-0 z-10">
            <Button 
              type="submit" 
              disabled={loading}
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-base font-medium rounded-[6px] transition-all duration-200 h-9"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                  İşleniyor...
                </>
              ) : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onay Dialog'u */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 max-h-[85vh] bg-white rounded-lg shadow-lg" hideCloseButton={true}>
          <DialogHeader className="pl-3 pt-1 pb-1 border-b sticky top-0 bg-white z-10">
            <div className="flex-grow text-left">
              <DialogTitle className="text-xs font-medium text-gray-700">
                İşlemi Onaylayın
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div 
            className="px-3 pt-1 pb-2 overflow-y-auto bg-white"
            style={{ maxHeight: "calc(90vh - 100px)" }}
          >
            <p className="text-gray-600">
              Bu işlemi onayladığınızda seçilen hizmetlerin fiyatları güncellenecektir. Devam etmek istiyor musunuz?
            </p>
          </div>
          
          <DialogFooter className="px-3 py-2 bg-gray-50 border-t sticky bottom-0 z-10">
            <div className="w-full grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmationOpen(false)}
                className="rounded-[6px]"
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-[6px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Onayla
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