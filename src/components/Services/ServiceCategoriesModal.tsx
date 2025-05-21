"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash, Plus } from 'lucide-react';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';

interface ServiceCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceCategoriesModal({ isOpen, onClose }: ServiceCategoriesModalProps) {
  // Durum
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hook'u kullan
  const {
    categories,
    loading,
    servicesByCategory,
    emptyCategories,
    categoryFormData,
    handleCategoryFormChange,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory
  } = useServiceManagement();
  
  // Yeni kategori oluştur
  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Kategori adı boş olamaz');
      return;
    }
    
    handleCategoryFormChange('name', newCategoryName);
    const result = await handleCreateCategory();
    
    if (result) {
      setNewCategoryName('');
      setError(null);
    }
  };
  
  // Kategori düzenleme moduna geç
  const startEditCategory = (id: string, name: string) => {
    setEditCategoryId(id);
    setEditCategoryName(name);
    setError(null);
  };
  
  // Kategori düzenlemeyi kaydet
  const saveEditCategory = async () => {
    if (!editCategoryName.trim()) {
      setError('Kategori adı boş olamaz');
      return;
    }
    
    if (editCategoryId) {
      const result = await handleUpdateCategory(editCategoryId, editCategoryName);
      
      if (result) {
        setEditCategoryId(null);
        setEditCategoryName('');
        setError(null);
      }
    }
  };
  
  // Kategori düzenlemeyi iptal et
  const cancelEditCategory = () => {
    setEditCategoryId(null);
    setEditCategoryName('');
    setError(null);
  };
  
  // Kategori silme moduna geç
  const openDeleteDialog = (id: string) => {
    setDeleteCategoryId(id);
    setDeleteDialogOpen(true);
  };
  
  // Kategori silmeyi onayla
  const confirmDeleteCategory = async () => {
    if (deleteCategoryId) {
      await handleDeleteCategory(deleteCategoryId);
      setDeleteDialogOpen(false);
      setDeleteCategoryId(null);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Hizmet Kategorileri</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Yeni kategori adı"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button
              onClick={createCategory}
              disabled={loading}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {error && (
            <p className="text-red-500 text-xs mb-4">{error}</p>
          )}
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz kategori bulunmuyor.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                >
                  {editCategoryId === category.id ? (
                    <div className="flex items-center space-x-2 flex-grow">
                      <Input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <Button
                          onClick={saveEditCategory}
                          disabled={loading}
                          size="sm"
                          className="h-8"
                        >
                          Kaydet
                        </Button>
                        <Button
                          onClick={cancelEditCategory}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                          className="h-8"
                        >
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          {servicesByCategory[category.id]?.length || 0} hizmet
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => startEditCategory(category.id, category.name)}
                          disabled={loading}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => openDeleteDialog(category.id)}
                          disabled={loading || (servicesByCategory[category.id]?.length || 0) > 0}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          {emptyCategories.length === 0 && categories.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Not: İçinde hizmet bulunan kategoriler silinemez.
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button onClick={onClose}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteCategory}
        title="Kategori Silme"
        description="Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </>
  );
}
