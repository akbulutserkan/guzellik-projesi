"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Plus, CreditCard, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  getPaymentTypeText, 
  getPaymentMethodText, 
  formatPrice 
} from "@/utils/packageSale/formatters";
import { Payment, PackageSale } from "@/types/package";

interface PaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: PackageSale | null;
  onSuccess: () => void;
  onAddPayment?: (data: {
    packageSaleId: string;
    customerId: string;
    amount: number;
    paymentMethod: string;
    paymentType: string;
    staffId: string; // Not undefined! Kesinlikle string olmalı
  }) => Promise<Payment | null>;
  onDeletePayment?: (id: string) => Promise<boolean>;
  onGetSaleById?: (id: string) => Promise<PackageSale>;
}

const PaymentsModal = ({
  open,
  onOpenChange,
  sale,
  onSuccess,
  onAddPayment,
  onDeletePayment,
  onGetSaleById
}: PaymentsModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form durumları
  const [newPayment, setNewPayment] = useState({
    amount: "",
    paymentType: "CASH",
    paymentDate: new Date().toISOString().split("T")[0], // Bugünün tarihini varsayılan olarak ayarla
  });

  // Sale verilerini yükleme fonksiyonu
  const fetchLatestSaleData = async (saleId: string) => {
    if (!saleId || !onGetSaleById) return;

    setIsLoadingData(true);
    try {
      // Merkezi hook üzerinden veri alma
      const saleData = await onGetSaleById(saleId);
      console.log("Hook üzerinden ödeme verisi alındı:", saleData);
      
      // Ödeme verilerini güncelle
      if (saleData.payments) {
        setPayments(saleData.payments || []);
      }
      
      // Toplamları hesapla
      const received = saleData.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      setTotalReceived(received);
      
      // Kalan tutarı hesapla
      setRemainingAmount(saleData.price - received);
    } catch (error) {
      console.error("Tahsilat verileri çekilirken hata:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tahsilat bilgileri güncellenirken bir hata oluştu",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Parent'ı yenileme fonksiyonu + modal state güncellemesi
  const refreshParentAndModal = async () => {
    // Önce parent bileşendeki listeyi güncelle
    await onSuccess();

    // Modal için yeni verileri çek (1 sn. bekleyerek API'nin güncellenmesi için zaman tanı)
    if (sale?.id) {
      // Kısa bir gecikme ekleyerek API'nin güncellenmesini bekle
      setTimeout(async () => {
        console.log("Tahsilat verileri yeniden yükleniyor...");
        await fetchLatestSaleData(sale.id);
      }, 1000);
    }
  };

  // Değişen satış veya modal durumu için veri yükleme
  useEffect(() => {
    console.log("Modal useEffect tetiklendi:", { open, saleId: sale?.id });
    if (open && sale?.id) {
      console.log("Modal açıldı, verileri yüklemeye başlıyorum:", sale.id);
      // Verileri yükle
      fetchLatestSaleData(sale.id);

      // Form state'lerini sadece modal açıldığında sıfırla
      setNewPayment({
        amount: "",
        paymentType: "CASH",
        paymentDate: new Date().toISOString().split("T")[0], // Bugünün tarihini varsayılan olarak ayarla
      });
      setShowNewPaymentForm(false);

      // Verileri periyodik olarak yenile (her 15 saniyede bir)
      const intervalId = setInterval(() => {
        console.log("Periyodik yenileme yürütülüyor...");
        fetchLatestSaleData(sale.id);
      }, 15000);

      // Cleanup fonksiyonu - modal kapanınca interval'i temizle
      return () => {
        clearInterval(intervalId);
        console.log("Periyodik yenileme durduruldu");
      };
    }
  }, [open, sale?.id]);

  // Sale değiştiğinde (özellikle payments) güncelleme yap
  useEffect(() => {
    if (sale && open) {
      // Burada sale ve özellikle payments değiştiğinde veriyi güncelliyoruz
      setPayments(sale.payments || []);
      const received =
        sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      setTotalReceived(received);
      setRemainingAmount(sale.price - received);
    }
  }, [sale, sale?.payments, open]);

  const handleDeletePayment = async (paymentId: string) => {
    if (!sale || !onDeletePayment) return;

    const paymentToDelete = payments.find((p) => p.id === paymentId);
    if (!paymentToDelete) return;

    try {
      setDeleting(paymentId);
      console.log("Ödeme siliniyor:", paymentId);

      // Merkezi hook üzerinden silme işlemi
      const result = await onDeletePayment(paymentId);
      
      if (!result) {
        throw new Error("Ödeme silinemedi");
      }

      toast({
        title: "Başarılı",
        description: "Ödeme başarıyla silindi",
      });

      // Parent'i ve modal'i yenile
      refreshParentAndModal();
    } catch (error) {
      console.error("Ödeme silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Ödeme silinirken bir hata oluştu",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleAddPayment = async () => {
    if (!sale || !onAddPayment) return;

    try {
      setLoading(true);
      const amount = parseFloat(newPayment.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Geçerli bir tutar giriniz");
      }
      if (amount > remainingAmount) {
        throw new Error("Ödeme tutarı kalan tutardan büyük olamaz");
      }

      // Müşteri ID kontrolü
      if (!sale.customer.id) {
        console.error("Uyarı: sale.customer.id bulunamadı!", sale);
        throw new Error("Müşteri bilgisi eksik, lütfen yöneticinize başvurun.");
      }

      // Personel ID değeri, direkt staffId alanından alınır
      const staffId = sale.staffId || "";
      
      // Detaylı loglar
      console.log("Satış bilgileri:", {
        id: sale.id,
        customerId: sale.customer.id,
        customerName: sale.customer.name,
        staffId: sale.staffId,
        package: sale.package
      });
      
      // Ödeme verileri
      const paymentData = {
        packageSaleId: sale.id,
        customerId: sale.customer.id,
        amount: amount,
        paymentMethod: newPayment.paymentType,
        paymentType: newPayment.paymentType, // Prisma uyumluluğu için
        staffId
      };

      console.log("Eklenen ödeme tipi kontrolü:", {
        paymentMethod: newPayment.paymentType,
        staffId: staffId, // Kesinlikle string olmalı
        amount: amount
      });

      // Merkezi hook üzerinden ödeme ekleme
      const result = await onAddPayment(paymentData);
      
      if (!result) {
        throw new Error("Ödeme eklenemedi");
      }

      // Ödeme başarılı mesajı
      toast({
        title: "Başarılı",
        description: "Ödeme başarıyla eklendi",
      });

      // Tüm güncellemeleri yap
      setNewPayment({
        amount: "",
        paymentType: "CASH",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      setShowNewPaymentForm(false);

      // Ana sayfayı ve modalı tazele
      refreshParentAndModal();
    } catch (error) {
      console.error("Ödeme ekleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Ödeme eklenirken bir hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  console.log("Modal render edildi:", { open, saleId: sale?.id });

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
                  <p className="text-gray-900">{sale.customer.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-700 mb-2">Paket</h3>
                  <p className="text-gray-900">{sale.package.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-700 mb-1">
                    Toplam Tutar
                  </h3>
                  <p className="text-lg font-bold text-blue-800">
                    {formatPrice(sale.price)}
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
                              {getPaymentTypeText(
                                payment.paymentType || "CASH"
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                disabled={deleting === payment.id}
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
                      <Label htmlFor="paymentType">Ödeme Yöntemi</Label>
                      <Select
                        value={newPayment.paymentType}
                        onValueChange={(value) =>
                          setNewPayment({ ...newPayment, paymentType: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Ödeme Yöntemi Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Nakit</SelectItem>
                          <SelectItem value="CREDIT_CARD">
                            Kredi Kartı
                          </SelectItem>
                          <SelectItem value="BANK_TRANSFER">
                            Havale/EFT
                          </SelectItem>
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
                      value={newPayment.paymentDate}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          paymentDate: e.target.value,
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
                      onClick={handleAddPayment}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
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
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
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