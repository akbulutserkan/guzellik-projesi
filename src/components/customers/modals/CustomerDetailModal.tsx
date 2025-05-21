'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, XCircle, Ban, CreditCard, Wallet, BanknoteIcon } from 'lucide-react';
import useCustomerManagement from '@/hooks/customer/useCustomerManagement';
import { 
  standardizePaymentType, 
  standardizePaymentMethod, 
  standardizeAppointmentStatus 
} from '@/utils/customer/formatters';

interface CustomerDetailModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerDetailModal({
  customerId,
  open,
  onOpenChange
}: CustomerDetailModalProps) {
  const [activeTab, setActiveTab] = useState('appointments');
  
  // useCustomerManagement hook'unu kullan
  const {
    loading,
    loadCustomerDetail,
    selectedCustomer,
    getAppointments,
    getPayments,
    calculateTotal
  } = useCustomerManagement({ autoFetch: false, showToasts: true });
  
  // Müşteri verilerini getir
  useEffect(() => {
    if (customerId && open) {
      fetchCustomerDetails();
    }
  }, [customerId, open]);
  
  // Müşteri detaylarını getir
  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    await loadCustomerDetail(customerId);
  };

  // Tarih formatlama
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Durum görselleştirmeleri
  const renderAppointmentStatus = (status: string) => {
    const standardStatus = standardizeAppointmentStatus(status);
    
    switch (standardStatus) {
      case 'Onaylandı':
      case 'Tamamlandı':
        return <div className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Geldi</div>;
      case 'Gelmedi':
        return <div className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-1" /> Gelmedi</div>;
      case 'İptal Edildi':
        return <div className="flex items-center text-orange-600"><Ban className="h-4 w-4 mr-1" /> İptal Edildi</div>;
      case 'Bekliyor':
      default:
        return <div className="flex items-center text-yellow-600"><Clock className="h-4 w-4 mr-1" /> Bekliyor</div>;
    }
  };

  const renderPaymentType = (type: string) => {
    const standardType = standardizePaymentType(type);
    
    // Ödeme yöntemi ikonunu ve metnini göster
    if (standardType === 'Kredi Kartı') {
      return <div className="flex items-center"><CreditCard className="h-4 w-4 mr-1" /> Kredi Kartı</div>;
    }
    
    if (standardType === 'Nakit') {
      return <div className="flex items-center"><Wallet className="h-4 w-4 mr-1" /> Nakit</div>;
    }
    
    if (standardType === 'Havale/EFT') {
      return <div className="flex items-center"><BanknoteIcon className="h-4 w-4 mr-1" /> Havale/EFT</div>;
    }
    
    return <div className="flex items-center"><Wallet className="h-4 w-4 mr-1" /> {type}</div>;
  };

  // Hizmet/ürün adını tespit et
  const getServiceProductName = (payment: any) => {
    if (payment.packageSale?.package?.name) {
      return payment.packageSale.package.name;
    }
    if (payment.productSale?.product?.name) {
      return payment.productSale.product.name;
    }
    return standardizePaymentMethod(payment.paymentMethod);
  };

  // Randevuları tarihe göre gruplama
  const groupAppointmentsByDate = () => {
    if (!selectedCustomer?.appointments || !Array.isArray(selectedCustomer.appointments)) {
      return [];
    }
    
    const groupedAppointments: Record<string, {
      date: string,
      appointments: any[],
      statuses: Set<string>,
      services: string[]
    }> = {};

    selectedCustomer.appointments.forEach((appointment) => {
      const dateKey = formatDate(appointment.startTime);
      
      if (!groupedAppointments[dateKey]) {
        groupedAppointments[dateKey] = {
          date: dateKey,
          appointments: [],
          statuses: new Set<string>(),
          services: []
        };
      }
      
      groupedAppointments[dateKey].appointments.push(appointment);
      groupedAppointments[dateKey].statuses.add(appointment.status);
      
      if (appointment.service?.name) {
        groupedAppointments[dateKey].services.push(appointment.service.name);
      }
    });

    return Object.values(groupedAppointments).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  // Gruptaki randevuların ilk başlangıç saatini alma
  const getFirstAppointmentTime = (appointments: any[]) => {
    if (appointments.length === 0) return '';
    
    const sortedAppointments = [...appointments].sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    return formatTime(sortedAppointments[0].startTime);
  };

  // Grup statüsünü belirleme
  const getGroupStatus = (statuses: Set<string>) => {
    if (statuses.has('CANCELLED') || statuses.has('İptal Edildi')) {
      return 'İptal Edildi';
    } else if (statuses.has('NO_SHOW') || statuses.has('Gelmedi')) {
      return 'Gelmedi';
    } else if (statuses.has('COMPLETED') || statuses.has('Tamamlandı')) {
      return 'Tamamlandı';
    } else if (statuses.has('CONFIRMED') || statuses.has('Onaylandı')) {
      return 'Onaylandı';
    } else {
      return 'Bekliyor';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <DialogTitle className="text-lg font-semibold text-gray-800 text-center">
            Müşteri Detayları
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2 text-sm">Yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <Button 
                  variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                  className={`py-3 px-6 rounded-none font-medium ${activeTab === 'appointments' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  Randevular
                </Button>
                <Button 
                  variant={activeTab === 'payments' ? 'default' : 'ghost'}
                  className={`py-3 px-6 rounded-none font-medium ${activeTab === 'payments' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  Tahsilatlar
                </Button>
              </div>
            </div>
            
            {/* Appointments Tab Content */}
            {activeTab === 'appointments' && (
              <div className="flex-1 overflow-y-auto p-0 m-0">
                <div className="overflow-x-auto">
                  {!selectedCustomer?.appointments || selectedCustomer.appointments.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Bu müşteriye ait randevu bulunamadı
                    </div>
                  ) : (
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hizmetler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupAppointmentsByDate().map((group, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                {group.date} {getFirstAppointmentTime(group.appointments)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {renderAppointmentStatus(getGroupStatus(group.statuses))}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {group.services.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            
            {/* Payments Tab Content */}
            {activeTab === 'payments' && (
              <div className="flex-1 overflow-y-auto p-0 m-0">
                <div className="overflow-x-auto">
                  {!selectedCustomer?.payments || selectedCustomer.payments.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Bu müşteriye ait tahsilat bulunamadı
                    </div>
                  ) : (
                    <div>
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ödeme Türü
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tutar
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ürün/Hizmet
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCustomer.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatDateTime(payment.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {renderPaymentType(payment.paymentType)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {payment.amount.toLocaleString('tr-TR')} ₺
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {getServiceProductName(payment)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-6 py-3 text-right font-medium">
                              Toplam Tutar:
                            </td>
                            <td className="px-6 py-3 text-left font-medium">
                              {calculateTotal(selectedCustomer.payments).toLocaleString('tr-TR')} ₺
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
