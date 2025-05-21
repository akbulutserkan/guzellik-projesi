'use client'

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { withPageAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/payment/formatters';

// Merkezi sistemi kullan
import usePaymentManagement from '@/hooks/usePaymentManagement';

function NewPaymentPage() {
  const router = useRouter();
  
  // usePaymentManagement hook'unu kullan
  const {
    customers,
    packageSales,
    loading,
    error,
    submitting,
    formData,
    formErrors,
    permissions,
    handleFormChange,
    handleCreatePayment,
    fetchCustomers,
    fetchPackageSales,
    resetForm,
    formIsDirty
  } = usePaymentManagement({
    autoFetch: false,
    showToasts: true,
    cacheEnabled: true
  });

  // İlgili verileri bir kere getir
  useEffect(() => {
    const fetchInitialData = async () => {
      // Müşteri ve paket satışlarını getir
      await Promise.all([
        fetchCustomers(),
        fetchPackageSales()
      ]);
    };

    fetchInitialData();
    
    // Sayfa kapanırken formu temizle
    return () => {
      resetForm();
    };
  }, [fetchCustomers, fetchPackageSales, resetForm]);

  // Müşteri değiştiğinde ilgili paket satışlarını getir
  useEffect(() => {
    if (formData.customerId && formData.paymentMethod === 'Paket Ödemesi') {
      fetchPackageSales(formData.customerId);
    }
  }, [formData.customerId, formData.paymentMethod, fetchPackageSales]);

  // Filtrelenmiş paket satışları - müşteriye göre
  const filteredPackageSales = useMemo(() => {
    if (!formData.customerId) return [];
    return packageSales.filter(sale => sale.customer?.id === formData.customerId);
  }, [packageSales, formData.customerId]);

  // Formun gönderilmesi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPayment = await handleCreatePayment();
    
    if (newPayment) {
      router.push('/payments');
    }
  };

  // Formdan vazgeçme işlemi
  const handleCancel = () => {
    // Form değiştirilmişse onay iste
    if (formIsDirty) {
      if (window.confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-2">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Kullanıcı yetki kontrolü
  if (!permissions.canAdd) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="text-lg font-semibold">Yetkisiz Erişim</h2>
          <p>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
        <Button 
          onClick={() => router.push('/payments')}
          variant="outline"
        >
          Tahsilatlar Sayfasına Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Yeni Tahsilat Oluştur</h1>
        <Button 
          onClick={() => router.push('/payments')}
          variant="outline"
        >
          Tahsilatlar Listesine Dön
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label htmlFor="customerId" className="block text-gray-700 font-bold mb-2">
              Müşteri <span className="text-red-500">*</span>
            </label>
            <select
              id="customerId"
              name="customerId"
              value={formData.customerId}
              onChange={handleFormChange}
              className={`shadow appearance-none border ${formErrors.customerId ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              required
            >
              <option value="">Müşteri Seçin</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                </option>
              ))}
            </select>
            {formErrors.customerId && (
              <p className="text-red-500 text-xs italic mt-1">{formErrors.customerId}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-bold mb-2">
              Tutar <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                value={formData.amount}
                onChange={handleFormChange}
                className={`shadow appearance-none border ${formErrors.amount ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                ₺
              </div>
            </div>
            {formErrors.amount && (
              <p className="text-red-500 text-xs italic mt-1">{formErrors.amount}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="paymentType" className="block text-gray-700 font-bold mb-2">
              Ödeme Türü <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentType"
              name="paymentType"
              value={formData.paymentType}
              onChange={handleFormChange}
              className={`shadow appearance-none border ${formErrors.paymentType ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              required
            >
              <option value="Nakit">Nakit</option>
              <option value="Kredi Kartı">Kredi Kartı</option>
              <option value="Havale/EFT">Havale/EFT</option>
            </select>
            {formErrors.paymentType && (
              <p className="text-red-500 text-xs italic mt-1">{formErrors.paymentType}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="paymentMethod" className="block text-gray-700 font-bold mb-2">
              Ödeme Şekli <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleFormChange}
              className={`shadow appearance-none border ${formErrors.paymentMethod ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              required
            >
              <option value="Hizmet Ödemesi">Hizmet Ödemesi</option>
              <option value="Paket Ödemesi">Paket Ödemesi</option>
              <option value="Ürün Ödemesi">Ürün Ödemesi</option>
            </select>
            {formErrors.paymentMethod && (
              <p className="text-red-500 text-xs italic mt-1">{formErrors.paymentMethod}</p>
            )}
          </div>

          {formData.paymentMethod === 'Paket Ödemesi' && (
            <div className="mb-4">
              <label htmlFor="packageSaleId" className="block text-gray-700 font-bold mb-2">
                Paket <span className="text-red-500">*</span>
              </label>
              <select
                id="packageSaleId"
                name="packageSaleId"
                value={formData.packageSaleId}
                onChange={handleFormChange}
                className={`shadow appearance-none border ${formErrors.packageSaleId ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                required={formData.paymentMethod === 'Paket Ödemesi'}
              >
                <option value="">Paket Seçin</option>
                {filteredPackageSales.length > 0 ? (
                  filteredPackageSales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      {sale.package.name} - {formatPrice(sale.price)}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {formData.customerId ? 'Bu müşteriye ait paket bulunamadı' : 'Önce müşteri seçiniz'}
                  </option>
                )}
              </select>
              {formErrors.packageSaleId && (
                <p className="text-red-500 text-xs italic mt-1">{formErrors.packageSaleId}</p>
              )}
              {formData.customerId && filteredPackageSales.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">
                  Seçilen müşteriye ait paket satışı bulunamadı.
                </p>
              )}
            </div>
          )}

          {formData.paymentType === 'Kredi Kartı' && (
            <div className="mb-4">
              <label htmlFor="installment" className="block text-gray-700 font-bold mb-2">
                Taksit Sayısı
              </label>
              <input
                type="number"
                id="installment"
                name="installment"
                value={formData.installment}
                onChange={handleFormChange}
                min="1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <p className="text-gray-500 text-xs mt-1">Tek çekim için boş bırakabilirsiniz</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="receiptNumber" className="block text-gray-700 font-bold mb-2">
              Fiş/Fatura No
            </label>
            <input
              type="text"
              id="receiptNumber"
              name="receiptNumber"
              value={formData.receiptNumber}
              onChange={handleFormChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Fiş veya fatura numarası"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="processedBy" className="block text-gray-700 font-bold mb-2">
              İşlemi Yapan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="processedBy"
              name="processedBy"
              value={formData.processedBy}
              onChange={handleFormChange}
              className={`shadow appearance-none border ${formErrors.processedBy ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              placeholder="İşlemi yapan personel"
              required
            />
            {formErrors.processedBy && (
              <p className="text-red-500 text-xs italic mt-1">{formErrors.processedBy}</p>
            )}
          </div>
        </div>

        <div className="mb-6 mt-4">
          <label htmlFor="notes" className="block text-gray-700 font-bold mb-2">
            Notlar
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
            placeholder="Ödeme ile ilgili ek notlar"
          />
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            className="mr-2"
            disabled={submitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className={`${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"></span>
                Kaydediliyor...
              </>
            ) : 'Tahsilatı Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default withPageAuth(NewPaymentPage);