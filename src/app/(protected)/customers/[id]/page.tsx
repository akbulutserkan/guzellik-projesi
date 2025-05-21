'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { withPageAuth } from '@/lib/auth';
import { usePermissions } from '@/hooks/permissions/usePermissions';
import { useToast } from '@/components/ui/use-toast';
import EditCustomerModal from '@/components/customers/EditCustomerModal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  const {
    canViewCustomers,
    canEditCustomers,
    canDeleteCustomers
  } = usePermissions();

  useEffect(() => {
    // Müşteri detaylarını getir
    const fetchCustomer = async () => {
      try {
        if (!canViewCustomers) {
          toast({
            variant: "destructive",
            title: "Yetkisiz Erişim",
            description: "Müşteri bilgilerini görüntüleme yetkiniz yok"
          });
          router.push('/customers');
          return;
        }

        const response = await fetch(`/api/customers/${params.id}`);
        if (!response.ok) {
          throw new Error('Müşteri bilgileri alınamadı');
        }

        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error('Müşteri detayları yüklenirken hata:', error);
        setError('Müşteri bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCustomer();
    }
  }, [params.id, canViewCustomers, router, toast]);

  const handleEditSuccess = () => {
    // Müşteri güncellendikten sonra verileri yeniden çek
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${params.id}`);
        if (!response.ok) {
          throw new Error('Müşteri bilgileri alınamadı');
        }

        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error('Müşteri detayları yüklenirken hata:', error);
        setError('Müşteri bilgileri yüklenirken bir hata oluştu');
      }
    };

    fetchCustomer();
  };

  const handleDelete = async () => {
    if (!canDeleteCustomers) {
      toast({
        variant: "destructive",
        title: "Yetkisiz İşlem",
        description: "Müşteri silme yetkiniz bulunmamaktadır"
      });
      return;
    }

    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Müşteri silinemedi');
      }

      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla silindi"
      });
      
      router.push('/customers');
    } catch (error) {
      console.error('Müşteri silinirken hata:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error || 'Müşteri bulunamadı'}
        </div>
        <div className="mt-4">
          <Link href="/customers" className="text-blue-500 hover:underline">
            &larr; Müşteri Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Müşteri Detayları</h1>
        <div className="flex space-x-2">
          <Link href="/customers" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Geri
          </Link>
          {canEditCustomers && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Düzenle
            </button>
          )}
          {canDeleteCustomers && (
            <button 
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sil
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">İsim</h3>
              <p className="mt-1 text-lg">{customer.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Telefon</h3>
              <p className="mt-1 text-lg">{customer.phone}</p>
            </div>
            
            {customer.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">E-posta</h3>
                <p className="mt-1 text-lg">{customer.email}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Kayıt Tarihi</h3>
              <p className="mt-1">
                {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notlar</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Müşteri düzenleme modalı */}
      <EditCustomerModal 
        customerId={params.id as string}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default withPageAuth(CustomerDetailPage);
