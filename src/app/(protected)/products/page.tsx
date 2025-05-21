'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { withPageAuth } from '@/lib/auth';
import { useProductManagement } from "@/hooks/product/useProductManagement";
import NewProductModal from "@/components/products/NewProductModal";
import EditProductModal from "@/components/products/EditProductModal";
import { formatPrice } from '@/utils/product/formatters';

function ProductsPage() {
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  
  const {
    products,
    loading,
    selectedProduct,
    setSelectedProduct,
    fetchProducts,
    handleDeleteProduct,
    permissions
  } = useProductManagement({
    autoFetch: true,
    showToasts: true
  });

  const handleProductAdded = () => {
    // Ürün eklendiğinde 
    setIsNewProductModalOpen(false);
    fetchProducts();
  };

  const handleProductUpdated = () => {
    // Ürün güncellendiğinde
    setSelectedProduct(null);
    fetchProducts();
  };

  const handleEdit = (product) => {
    if (!permissions.canEdit) return;
    setSelectedProduct(product);
  };

  const handleDelete = async (id) => {
    if (!permissions.canDelete) return;
    
    const isConfirmed = window.confirm('Bu ürünü silmek istediğinizden emin misiniz?');
    if (!isConfirmed) return;
    
    const success = await handleDeleteProduct(id);
    if (success) {
      fetchProducts();
    }
  };

  // Sayfa erişim kontrolü
  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
          <p className="mt-2">Ürünler sayfasını görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ürünler</h1>
        {permissions.canAdd && (
          <Button
            onClick={() => setIsNewProductModalOpen(true)}
            className="bg-pink-400 hover:bg-pink-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ürün Ekle
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr 
                key={product.id} 
                className={`hover:bg-gray-50 cursor-pointer ${!product.isActive ? 'bg-gray-100' : ''}`}
                onClick={() => permissions.canEdit && handleEdit(product)}
              >
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatPrice(product.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={product.stock === 0 ? 'text-red-500' : ''}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    {permissions.canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni Ürün Modalı */}
      <NewProductModal 
        open={isNewProductModalOpen}
        onOpenChange={setIsNewProductModalOpen}
        onSuccess={handleProductAdded}
      />

      {/* Ürün Düzenleme Modalı */}
      <EditProductModal
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        product={selectedProduct}
        onSuccess={handleProductUpdated}
      />
    </div>
  );
}

export default withPageAuth(ProductsPage);
