'use client';

import { PlusCircle, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
  onAddCategory: () => void;
  onAddService: () => void;
}

export const EmptyStateComponent = ({ onAddCategory, onAddService }: EmptyStateProps) => {
  return (
    <Card className="w-full shadow-md bg-white border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-gray-800">Henüz Hiç Hizmet Kategorisi Eklenmemiş</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 rounded-full bg-gray-50 p-3">
            <LayoutGrid className="h-10 w-10 text-[#204937]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Hizmet Eklemek İçin Önce Kategori Oluşturun</h3>
          <p className="mb-6 text-sm text-gray-500 max-w-md">
            Müşterilerinize sunduğunuz hizmetleri eklemeden önce kategoriler oluşturarak daha düzenli bir yapı sağlayabilirsiniz.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onAddCategory} className="bg-[#204937] hover:bg-[#183b2d] text-white">
              <PlusCircle className="h-4 w-4 mr-2" /> Yeni Kategori Ekle
            </Button>
            <Button onClick={onAddService} variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              <PlusCircle className="h-4 w-4 mr-2" /> Yeni Hizmet Ekle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyStateComponent;