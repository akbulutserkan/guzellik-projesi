"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Plus, CreditCard, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useProductSaleManagement } from '@/hooks/productSale/useProductSaleManagement';
import { formatPrice, formatDate, getPaymentTypeText, getPaymentMethodText } from '@/utils/productSale/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ProductSale } from "@/types/product";
import { ProductSaleWithPayments, Payment } from "@/services/productSaleService";

interface PaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: ProductSaleWithPayments | null;
  onSuccess: () => void;
}

const PaymentsModal = ({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: PaymentsModalProps) => {
  const { toast } = useToast();
  
  // Merkezi hook'a erişim
  const {
    paymentFormData,
    setPaymentFormData,
    submitting,
    error,
    handleCreatePayment,
    handleDeletePayment,
    resetPaymentForm
  } = useProductSaleManagement({ autoFetch: false });
  
  const [deleting, setDeleting] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form durumları
  const [newPayment, setNewPayment] = useState({
    amount: "",
    paymentMethod: "nakit",
    date: new Date().toISOString().split("T")[0], // Bugünün tarihini varsayılan olarak ayarla
    notes: ""
  });

  // Ödeme verilerini yükleme ve hesaplama işlevi
  const calculatePaymentTotals = (saleData: ProductSaleWithPayments | null, paymentList: Payment[]) => {
    if (!saleData) return;
    
    // Toplam tahsilatı hesapla
    const received = paymentList.reduce((sum, p) => sum + p.amount, 0) || 0;
    setTotalReceived(received);
    
    // Kalan tutarı hesapla
    const totalPrice = saleData.totalPrice || (saleData.quantity * saleData.unitPrice);
    setRemainingAmount(Math.max(0, totalPrice - received));
  };

  // Sale değiştiğinde ödemeleri güncelle
  useEffect(() => {
    if (sale && open) {
      // Ödemeleri ve sale verisini güncelle
      if (sale.payments && Array.isArray(sale.payments)) {
        setPayments(sale.payments);
        calculatePaymentTotals(sale, sale.payments);
      } else {
        // Ödeme verileri yoksa varsayılan değerleri ayarla
        setPayments([]);
        calculatePaymentTotals(sale, []);
      }
    }
  }, [sale, open]);
  
  // Modal kapatıldığında formu sıfırla
  useEffect(() => {
    if (!open) {
      setShowNewPaymentForm(false);
      setNewPayment({
        amount: "",
        paymentMethod: "nakit",
        date: new Date().toISOString().split("T")[0],
        notes: ""
      });
      resetPaymentForm();
    }
  }, [open, resetPaymentForm]);

  const handlePaymentDelete = async (paymentId: string) => {
    if (!sale) return;

    try {
      setDeleting(paymentId);
      
      // Merkezi hook ile ödeme silme işlemi
      const success = await handleDeletePayment(paymentId);
      
      if (success) {
        toast({
          title: "Başarılı",
          description: "Ödeme başarıyla silindi",
        });
        
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ödeme silinirken bir hata oluştu",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handlePaymentAdd = async () => {
    if (!sale) return;

    try {
      const amount = parseFloat(newPayment.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Geçerli bir tutar giriniz");
      }
      if (amount > remainingAmount) {
        throw new Error("Ödeme tutarı kalan tutardan büyük olamaz");
      }

      // Merkezi hook'a verileri aktarma
      setPaymentFormData({
        amount: newPayment.amount,
        paymentMethod: newPayment.paymentMethod,
        paymentType: "urun-satis",
        date: newPayment.date,
        notes: newPayment.notes
      });
      
      // Merkezi hook ile ödeme oluşturma
      const payment = await handleCreatePayment(sale.id);
      
      if (payment) {
        toast({
          title: "Başarılı",
          description: "Ödeme başarıyla eklendi",
        });
        
        setNewPayment({
          amount: "",
          paymentMethod: "nakit",
          date: new Date().toISOString().split("T")[0],
          notes: ""
        });
        setShowNewPaymentForm(false);
        
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ödeme eklenirken bir hata oluştu",
      });
    }
  };

  if (!sale) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white shadow-xl">
          {isLoadingData && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
          <div className="bg-white p-0 overflow-hidden rounded-lg shadow-xl border border-gray-200">
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <Dialog.Title className="text-xl font-semibold">
                Ödeme Bilgileri
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full h-6 w-6 inline-flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div
              className="overflow-y-auto p-6 bg-white"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-700 mb-2">Müşteri</h3>
                  <p className="text-gray-900">{sale.customerName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-700 mb-2">Ürün</h3>
                  <p className="text-gray-900">{sale.productName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-700 mb-1">
                    Toplam Tutar
                  </h3>
                  <p className="text-lg font-bold text-blue-800">
                    {formatPrice(sale.totalPrice || (sale.quantity * sale.unitPrice))}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-medium text-green-700 mb-1">
                    Tahsil Edilen
                  </h3>
                  <p className="text-lg font-bold text-green-800">
                    {formatPrice(totalReceived)}
                  </p>
                </div>
                <div
                  className={`p-4 rounded ${
                    remainingAmount > 0 ? "bg-yellow-50" : "bg-gray-50"
                  }`}
                >
                  <h3
                    className={`font-medium mb-1 ${
                      remainingAmount > 0 ? "text-yellow-700" : "text-gray-700"
                    }`}
                  >
                    Kalan
                  </h3>
                  <p
                    className={`text-lg font-bold ${
                      remainingAmount > 0 ? "text-yellow-800" : "text-gray-800"
                    }`}
                  >
                    {formatPrice(remainingAmount)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Ödeme Geçmişi</h3>
                  {remainingAmount > 0 && (
                    <Button
                      onClick={() => setShowNewPaymentForm(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Yeni Ödeme
                    </Button>
                  )}
                </div>

                {payments.length === 0 ? (
                  <div className="flex items-center justify-center bg-gray-50 py-8 rounded border border-gray-200">
                    <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                    <p className="text-gray-500">Henüz bir ödeme yapılmamış</p>
                  </div>
                ) : (
                  <div className="border rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tarih
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tutar
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Ödeme Tipi
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          ></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {payment.createdAt
                                ? format(
                                    new Date(payment.createdAt),
                                    "dd MMM yyyy HH:mm",
                                    { locale: tr }
                                  )
                                : "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(payment.amount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {getPaymentMethodText(payment.paymentMethod || "nakit")}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handlePaymentDelete(payment.id)}
                                disabled={deleting === payment.id || submitting}
                                className="text-red-600 hover:text-red-900 focus:outline-none disabled:text-gray-400"
                              >
                                {deleting === payment.id ? (
                                  <span className="inline-block h-4 w-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin"></span>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {showNewPaymentForm && remainingAmount > 0 && (
                <div className="border p-4 rounded-md bg-gray-50 mb-6">
                  <h3 className="text-md font-medium mb-4">Yeni Ödeme Ekle</h3>

                  {/* Ödeme Tutarı ve Ödeme Yöntemi yan yana */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="amount">Ödeme Tutarı</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        max={remainingAmount}
                        step="0.01"
                        value={newPayment.amount}
                        onChange={(e) =>
                          setNewPayment({
                            ...newPayment,
                            amount: e.target.value,
                          })
                        }
                        placeholder={`En fazla ${formatPrice(remainingAmount)}`}
                        className="mt-1 placeholder:text-gray-500 placeholder-opacity-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
                      <Select
                        value={newPayment.paymentMethod}
                        onValueChange={(value) =>
                          setNewPayment({ ...newPayment, paymentMethod: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Ödeme Yöntemi Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nakit">Nakit</SelectItem>
                          <SelectItem value="kart">Kredi Kartı</SelectItem>
                          <SelectItem value="havale">Havale/EFT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Ödeme Tarihi Girişi en sonda */}
                  <div>
                    <Label htmlFor="paymentDate">Ödeme Tarihi</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={newPayment.date}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          date: e.target.value,
                        })
                      }
                      className="mt-1 w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewPaymentForm(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePaymentAdd}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {submitting ? (
                        <>
                          <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Ödeme Al
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {remainingAmount > 0 && !showNewPaymentForm && (
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => setShowNewPaymentForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {formatPrice(remainingAmount)} Ödeme Al
                  </Button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-white border-t flex justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Kapat
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PaymentsModal;
