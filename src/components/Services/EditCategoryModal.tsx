"use client";

import { useState } from 'react';
import { DialogWithoutPrevent, DialogWithoutPreventContent } from '@/components/ui/dialog-without-prevent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServiceManagement } from '@/hooks/service';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

export default function EditCategoryModal({ isOpen, onClose, categoryId, categoryName }: EditCategoryModalProps) {
  const [name, setName] = useState(categoryName);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { handleUpdateCategory } = useServiceManagement();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Kategori adı boş olamaz');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await handleUpdateCategory(categoryId, name);
      
      if (result) {
        onClose();
      } else {
        setError('Kategori güncellenemedi');
      }
    } catch (error: any) {
      console.error("Kategori güncelleme hatası:", error);
      setError(error instanceof Error ? error.message : 'Kategori güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWithoutPrevent 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogWithoutPreventContent className="sm:max-w-[500px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              placeholder="Kategori adı"
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogWithoutPreventContent>
    </DialogWithoutPrevent>
  );
}
