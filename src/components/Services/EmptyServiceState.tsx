'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EmptyServiceState = ({ onAddCategory, onAddService }) => {
  return (
    <Card className="w-full shadow-md bg-white border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-gray-800">Henüz Hiç Hizmet Kategorisi Eklenmemiş</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 rounded-full bg-blue-50 p-3">
            <PlusCircle className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Hizmet Eklemek İçin Önce Kategori Oluşturun</h3>
          <p className="mb-6 text-sm text-gray-500 max-w-md">
            Müşterilerinize sunduğunuz hizmetleri eklemeden önce kategoriler oluşturarak daha düzenli bir yapı sağlayabilirsiniz.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onAddCategory} className="bg-blue-600 hover:bg-blue-700">
              Yeni Kategori Ekle
            </Button>
            <Button onClick={onAddService} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              Yeni Hizmet Ekle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyServiceState;