"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductManagement } from "@/hooks/product/useProductManagement";
import { Product } from "@/services/productService";

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function EditProductModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductModalProps) {
  const {
    formData,
    setFormData,
    formErrors,
    loading,
    error,
    selectedProduct,
    setSelectedProduct,
    handleUpdateProduct
  } = useProductManagement({ autoFetch: false });
  
  // Seçili ürünü hook'a aktar
  useEffect(() => {
    if (product && open) {
      setSelectedProduct(product);
    }
  }, [product, open, setSelectedProduct]);

  const handleClose = () => {
    setSelectedProduct(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    const updatedProduct = await handleUpdateProduct(product.id);
    
    if (updatedProduct) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] bg-white rounded-lg shadow-lg">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Ürün Düzenle
          </DialogTitle>
        </DialogHeader>
        
        <div
          className="px-6 py-4 overflow-y-auto bg-white"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className={`flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white ${formErrors.name ? 'border-red-500' : ''}`}>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ürün Adı"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                />
              </div>
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className={`relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white ${formErrors.price ? 'border-red-500' : ''}`}>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Fiyat"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                  ₺
                </span>
              </div>
              {formErrors.price && (
                <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className={`relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white ${formErrors.stock ? 'border-red-500' : ''}`}>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Stok"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                  stok
                </span>
              </div>
              {formErrors.stock && (
                <p className="text-sm text-red-500 mt-1">{formErrors.stock}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Açıklama (Opsiyonel)"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t sticky bottom-0 z-10">
          <Button 
            type="submit" 
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                Kaydediliyor...
              </>
            ) : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
