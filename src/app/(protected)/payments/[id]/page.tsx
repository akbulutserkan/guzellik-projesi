'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { withPageAuth } from '@/lib/auth'

// Yeni merkezi sistemi kullan
import usePaymentManagement from '@/hooks/usePaymentManagement'
import { formatDateTime } from '@/utils/payment/formatters'

function PaymentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  
  // usePaymentManagement hook'unu kullan
  const {
    selectedPayment,
    loading,
    error,
    submitting,
    permissions,
    fetchPaymentById,
    handleUpdatePaymentStatus,
    printPayment
  } = usePaymentManagement({
    autoFetch: false,
    showToasts: true
  })

  useEffect(() => {
    const loadPayment = async () => {
      await fetchPaymentById(params.id)
    }

    loadPayment()
  }, [fetchPaymentById, params.id])

  const handleRefund = async () => {
    if (!confirm('Bu tahsilatı iade etmek istediğinize emin misiniz?')) return

    const updated = await handleUpdatePaymentStatus(params.id, 'İade Edildi')
    // Başarılı olursa zaten selectedPayment state'i hook içinde güncellenecek
  }

  if (loading) return <div className="p-8">Yükleniyor...</div>
  if (!selectedPayment) return <div className="p-8">Tahsilat bulunamadı</div>

  // Kullanıcı yetki kontrolü
  if (!permissions.canView) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tahsilat Detayı</h1>
        <div className="space-x-4">
          <button
            onClick={printPayment}
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Yazdır
          </button>
          {selectedPayment.status === 'Tamamlandı' && permissions.canEdit && (
            <button
              onClick={handleRefund}
              disabled={submitting}
              className={`${
                submitting ? 'bg-yellow-300' : 'bg-yellow-500 hover:bg-yellow-700'
              } text-white px-4 py-2 rounded`}
            >
              {submitting ? 'İşlem Yapılıyor...' : 'İade Et'}
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Geri
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Müşteri Bilgileri</h2>
            <dl>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Ad Soyad</dt>
                <dd>{selectedPayment.customer.name}</dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Telefon</dt>
                <dd>{selectedPayment.customer.phone || "-"}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Ödeme Bilgileri</h2>
            <dl>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Tarih</dt>
                <dd>{formatDateTime(selectedPayment.createdAt)}</dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Tutar</dt>
                <dd className="text-lg font-bold">
                  {selectedPayment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Ödeme Türü</dt>
                <dd>
                  {selectedPayment.paymentType}
                  {selectedPayment.installment && ` (${selectedPayment.installment} Taksit)`}
                </dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Ödeme Şekli</dt>
                <dd>
                  {selectedPayment.paymentMethod}
                  {selectedPayment.packageSale && (
                    <div className="text-sm text-gray-500">
                      {selectedPayment.packageSale.package.name} - 
                      {selectedPayment.packageSale.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>
                  )}
                </dd>
              </div>
              {selectedPayment.receiptNumber && (
                <div className="mb-2">
                  <dt className="font-medium text-gray-500">Fiş/Fatura No</dt>
                  <dd>{selectedPayment.receiptNumber}</dd>
                </div>
              )}
              <div className="mb-2">
                <dt className="font-medium text-gray-500">İşlemi Yapan</dt>
                <dd>{selectedPayment.processedBy}</dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium text-gray-500">Durum</dt>
                <dd>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedPayment.status === 'Tamamlandı' ? 'bg-green-100 text-green-800' : selectedPayment.status === 'İade Edildi' ? 'bg-yellow-100 text-yellow-800' : selectedPayment.status === 'İptal Edildi' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedPayment.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {selectedPayment.notes && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Notlar</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{selectedPayment.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default withPageAuth(PaymentDetailPage);