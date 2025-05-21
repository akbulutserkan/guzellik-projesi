'use client';

import { useState, useRef, useEffect } from 'react';
import { PackageWithRelations, PackageWithServices } from '@/types/package';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { formatPrice, formatSessionCount } from '@/utils/package/formatters';
import { useClickOutside } from '@/hooks/utility';

interface PackageListItemProps {
  pkg: PackageWithRelations | PackageWithServices;
  onDelete?: (pkg: PackageWithRelations | PackageWithServices) => void; // ID yerine tüm paketi geçiyoruz
  onUpdate?: (id: string, data: Partial<PackageWithRelations | PackageWithServices>) => Promise<void>;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function PackageListItem({ pkg, onDelete, onUpdate, isDeleting, isUpdating }: PackageListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    sessionCount: pkg.sessionCount,
    price: pkg.price,
  });
  
  // Dışarı tıklama kontrolu için ref
  const editFormRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklamayı algılama
  useClickOutside(editFormRef, () => {
    if (isEditing) {
      // Değişiklik yapılmışsa kaydetme işlemini tetikle
      if (editedData.sessionCount !== pkg.sessionCount || 
          editedData.price !== pkg.price) {
        handleSave();
      } else {
        // Değişiklik yoksa sadece editing modunu kapat
        setIsEditing(false);
      }
    }
  });

  const handleSave = async () => {
    if (!onUpdate) return;

    // Değişiklik olup olmadığını kontrol et
    if (editedData.sessionCount === pkg.sessionCount && 
        editedData.price === pkg.price) {
      setIsEditing(false);
      return; // Değişiklik yoksa API çağrısı yapma
    }
  
    console.log('[PAKET-GUNCELLEME] [1] Güncelleme başlatılıyor, paket ID:', pkg.id);
    console.log('[PAKET-GUNCELLEME] [1] Orijinal paket verileri:', JSON.stringify(pkg, null, 2));
    console.log('[PAKET-GUNCELLEME] [1] Değiştirilen alanlar:', JSON.stringify(editedData, null, 2));
    
    try {
      // Tüm gerekli alanları içeren güncellenmiş veri gönder
      const completeData = {
        ...pkg,  // Mevcut tüm özellikleri içerir
        name: pkg.name,
        categoryId: pkg.categoryId || pkg.category?.id,
        serviceIds: pkg.services?.map(s => s.id) || [],
        // Değiştirilen değerler
        sessionCount: editedData.sessionCount,
        price: editedData.price
      };
      
      console.log('[PAKET-GUNCELLEME] [1] Güncelleme için gönderilen tam veri:', JSON.stringify(completeData, null, 2));
      await onUpdate(pkg.id, completeData);
      console.log('[PAKET-GUNCELLEME] [1] Güncelleme işlemi tamamlandı');
      setIsEditing(false);
    } catch (error) {
      console.error('[PAKET-GUNCELLEME] [1] Güncelleme başarısız oldu, hata:', error);
    }
  };

  if (isEditing) {
    return (
      <div 
        ref={editFormRef}
        className="flex items-center justify-between p-4 border rounded-lg shadow-lg transition-all hover:shadow-xl hover:bg-white bg-gray-50"
      >        <div>
          <h3 className="font-medium">{pkg.name}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">Seans:</label>
            <Input
              type="number"
              value={editedData.sessionCount}
              onChange={(e) => setEditedData(prev => ({ ...prev, sessionCount: parseInt(e.target.value) }))}
              className="w-20 h-8 bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              min="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Fiyat:</label>
            <Input
              type="number"
              value={editedData.price}
              onChange={(e) => setEditedData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              className="w-24 h-8 bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              step="0.01"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="text-green-500 hover:text-green-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
              aria-label="Değişiklikleri Kaydet"
            >
              <Check className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
              aria-label="İptal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-lg transition-all hover:shadow-xl hover:bg-white">
      <div>
        <h3 className="text-sm font-medium">{pkg.name}</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium">{formatPrice(pkg.price)}</div>
            <div className="text-sm text-gray-600">{formatSessionCount(pkg.sessionCount)}</div>
          </div>
          <div className="flex items-center space-x-2">
            {onUpdate && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
                aria-label="Paket Düzenle"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </button>
            )}
            {onDelete && (
            <button 
              onClick={() => onDelete(pkg)} // Direkt olarak paketi geçirelim, onDelete fonksiyonu artık id değil tüm paketi alıyor
              className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
              aria-label="Paket Sil"
              disabled={isDeleting}
            >
              {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}