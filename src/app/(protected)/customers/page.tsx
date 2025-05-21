'use client'

import { useState } from 'react'
import NewCustomerModal from '@/components/customers/NewCustomerModal'
import EditCustomerModal from '@/components/customers/EditCustomerModal'
import CustomerDetailModal from '@/components/customers/modals/CustomerDetailModal'
import { withPageAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { UserPlus, Eye, Pencil, Trash2 } from 'lucide-react'
import useCustomerManagement from '@/hooks/customer/useCustomerManagement'

/**
 * Müşteriler Sayfası
 * 
 * Bu sayfada, işletmenin müşteri bilgileri yönetilir.
 * useCustomerManagement hook'u kullanılarak dengeli bir yapı oluşturulmuştur.
 */
function CustomersPage() {
  // Modaller için state'ler
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // useCustomerManagement hook'unu kullan
  const {
    customers,
    isLoading,
    error,
    permissions,
    loadCustomers,
    deleteCustomer
  } = useCustomerManagement();
  
  // Modal yönetim fonksiyonları
  const handleNewCustomer = () => {
    loadCustomers();
  };

  const handleAddNewClick = () => {
    setIsNewModalOpen(true);
  };

  const handleEditCustomer = (id: string) => {
    setEditingCustomerId(id);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadCustomers();
  };

  const handleViewCustomerDetail = (id: string) => {
    setViewingCustomerId(id);
    setIsDetailModalOpen(true);
  };

  const handleDeleteRequest = async (id: string) => {
    await deleteCustomer(id);
  };

  // Sayfa erişim kontrolü
  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
          <p className="mt-2">Müşteriler sayfasını görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Müşteriler</h1>
        {permissions.canAdd && (
          <Button 
            onClick={handleAddNewClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Yeni Müşteri Ekle
          </Button>
        )}
      </div>

      {customers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Henüz müşteri bulunmamaktadır.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleViewCustomerDetail(customer.id)}
                        className="text-blue-500 hover:text-blue-700 mr-3 inline-flex items-center"
                        title="Detay"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {permissions.canEdit && (
                        <button
                          onClick={() => handleEditCustomer(customer.id)}
                          className="text-yellow-500 hover:text-yellow-700 inline-flex items-center"
                          title="Düzenle"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button
                          onClick={() => handleDeleteRequest(customer.id)}
                          className="text-red-500 hover:text-red-700 inline-flex items-center ml-4"
                          title="Sil"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Yeni müşteri ekleme modalı */}
      <NewCustomerModal 
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        onSuccess={handleNewCustomer}
      />

      {/* Müşteri düzenleme modalı */}
      <EditCustomerModal 
        customerId={editingCustomerId}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Müşteri detay modalı */}
      <CustomerDetailModal
        customerId={viewingCustomerId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}

export default withPageAuth(CustomersPage); // withPageAuth ile sarmalandı