"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NewCustomerModal from "@/components/customers/NewCustomerModal";
import PackageModal from "@/components/packages/PackageModal";
import { usePermissions } from "@/hooks/permissions";
import {
  Package,
  Staff,
  Customer,
  PaymentFormData,
  PackageSale,
} from "@/types/package";
import { validateSaleData } from "@/utils/packageSale/formatters";

// Import or create the PaymentMethodModal
import PaymentMethodModal from "@/components/appointments/AppointmentDetailModal/components/PaymentMethodModal";

interface CreatePackageSaleData {
  customerId: string;
  packageId: string;
  staffId: string;
  price: number;
  saleDate?: string;
  expiryDate?: string;
  payment?: {
    amount: number;
    paymentMethod: string;
  };
}

interface NewPackageSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sale: PackageSale) => void;
  packages: Package[];
  customers: Customer[];
  staffList: Staff[];
  onNewCustomer: (customer: Customer) => void;
  fetchPackages: () => Promise<void>;
  saleDate: string;
  expiryDate: string;
  onSaleDateChange: (date: string) => void;
  onExpiryDateChange: (date: string) => void;
  onCreateSale?: (data: CreatePackageSaleData) => Promise<PackageSale | null>;
}

export default function NewPackageSaleModal({
  open,
  onOpenChange,
  onSuccess,
  packages,
  customers,
  staffList,
  onNewCustomer,
  fetchPackages,
  saleDate,
  expiryDate,
  onSaleDateChange,
  onExpiryDateChange,
  onCreateSale
}: NewPackageSaleModalProps) {
  const { toast } = useToast();
  const { canAddCustomers, canAddPackages } = usePermissions();
  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const packageSearchInputRef = useRef<HTMLInputElement>(null);
  const packagesDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [packageSearch, setPackageSearch] = useState<string>("");
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewPackageModalOpen, setIsNewPackageModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);

  const [payment, setPayment] = useState<PaymentFormData>({
    amount: "0",
    paymentMethod: null,
    processedBy: "",
  });

  // Modalın dışına tıklandığında paket listesini kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        packagesDropdownRef.current && 
        !packagesDropdownRef.current.contains(event.target as Node) &&
        packageSearchInputRef.current &&
        !packageSearchInputRef.current.contains(event.target as Node)
      ) {
        setShowAllPackages(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Personel listesini doğru şekilde işle
    let staffArray: Staff[] = [];
    
    if (Array.isArray(staffList)) {
      staffArray = staffList;
    } else if (staffList && typeof staffList === 'object' && 'activeStaff' in staffList) {
      staffArray = (staffList as any).activeStaff || [];
    } else if (staffList && typeof staffList === 'object' && 'allStaff' in staffList) {
      staffArray = (staffList as any).allStaff || [];
    }
    
    if (staffArray.length === 1 && !selectedStaffId) {
      setSelectedStaffId(staffArray[0].id);
    }
  }, [staffList, selectedStaffId]);

  useEffect(() => {
    if (open) {
      resetForm();
      // Focus on customer search input when modal opens
      setTimeout(() => {
        if (customerSearchInputRef.current) {
          customerSearchInputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    // useRef kullanırsak daha iyi olurdu, ancak bu düzeltme için yeterli
    let isMounted = true;
    
    // Gecikme ile filtreleme yapalım
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      
      if (customerSearch.length > 0) {
        const filtered = customers.filter((customer) => 
          `${customer.name} ${customer.phone || ""}`
            .toLowerCase()
            .includes(customerSearch.toLowerCase())
        );
        
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers([]);
      }
    }, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [customerSearch, customers]);

  useEffect(() => {
    // useRef kullanırsak daha iyi olurdu, ancak bu düzeltme için yeterli
    let isMounted = true;
    
    // Gecikme ile filtreleme yapalım
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      
      if (packageSearch.length > 0 || showAllPackages) {
        let filtered = packages;
        
        if (packageSearch.length > 0) {
          filtered = packages.filter((pkg) =>
            pkg.name.toLowerCase().includes(packageSearch.toLowerCase())
          );
        }
        
        setFilteredPackages(filtered);
      } else {
        setFilteredPackages([]);
      }
    }, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [packageSearch, packages, showAllPackages]);

  const resetForm = () => {
    // Personel listesini doğru şekilde işle
    let staffArray: Staff[] = [];
    if (Array.isArray(staffList)) {
      staffArray = staffList;
    } else if (staffList && typeof staffList === 'object' && 'activeStaff' in staffList) {
      staffArray = (staffList as any).activeStaff || [];
    } else if (staffList && typeof staffList === 'object' && 'allStaff' in staffList) {
      staffArray = (staffList as any).allStaff || [];
    }
    
    setSelectedCustomerId("");
    setSelectedPackageId("");
    setCustomerSearch("");
    setPackageSearch("");
    setPrice("");
    setSelectedPackage(null);
    setSelectedStaffId(staffArray.length === 1 ? staffArray[0].id : "");
    setError("");
    onSaleDateChange(new Date().toISOString().split("T")[0]);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    onExpiryDateChange(nextYear.toISOString().split("T")[0]);
    setPayment({ amount: "0", paymentMethod: null, processedBy: "" });
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomerId(customer.id.toString());
    setCustomerSearch(customer.name);
    setFilteredCustomers([]);
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackageId(pkg.id);
    setPackageSearch("");
    setSelectedPackage(pkg);
    setFilteredPackages([]);
    setShowAllPackages(false);
    setPrice(pkg.price ? pkg.price.toString() : "");
  };

  const handleSaleDateChange = (date: string) => {
    onSaleDateChange(date);
    const newExpiryDate = new Date(date);
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
    onExpiryDateChange(newExpiryDate.toISOString().split("T")[0]);
  };

  const handleExpiryDateChange = (date: string) => {
    onExpiryDateChange(date);
  };

  const handleNewCustomerSuccess = (customer: any) => {
    const newCustomer: Customer = {
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onNewCustomer(newCustomer);
    setSelectedCustomerId(customer.id.toString());
    setCustomerSearch(customer.name);
    setIsNewCustomerModalOpen(false);
  };

  const handleNewPackageSuccess = async () => {
    await fetchPackages();
    setIsNewPackageModalOpen(false);
  };

  const handlePackageInputClick = () => {
    setShowAllPackages(true);
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(payment.amount || "0");
    const parsedPrice = parseFloat(price || "0");

    if (
      !selectedCustomerId ||
      !selectedPackageId ||
      !price ||
      !selectedStaffId ||
      !onCreateSale
    ) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
      });
      return;
    }

    // Check if payment amount is entered, but payment method is not selected yet
    if (parsedAmount > 0 && !payment.paymentMethod) {
      setIsPaymentMethodModalOpen(true);
      return;
    }

    const saleData = {
      customerId: selectedCustomerId,
      packageId: selectedPackageId,
      price: parsedPrice,
      staffId: selectedStaffId,
      saleDate: saleDate,
      expiryDate: expiryDate,
      payment:
        parsedAmount > 0
          ? {
              amount: parsedAmount,
              paymentMethod: payment.paymentMethod || "", // boş string atayıp null değerini engelliyoruz
            }
          : undefined
    };

    // Doğrulama işlemi yap
    const validation = validateSaleData(saleData);
    if (!validation.valid) {
      setError(validation.message || "Lütfen tüm alanları doğru şekilde doldurun.");
      return;
    }

    await processSale(saleData);
  };

  const processSale = async (saleData: CreatePackageSaleData) => {
    setSaving(true);
    setError("");

    try {
      console.log("Gönderilen satış verisi:", saleData);

      // Merkezi hook üzerinden satış oluşturma
      const result = await onCreateSale!(saleData);
      
      if (!result) {
        throw new Error("Satış kaydedilemedi.");
      }
      
      toast({
        title: "Başarılı",
        description: "Paket satışı başarıyla oluşturuldu.",
      });

      onSuccess(result);
      onOpenChange(false);
      
    } catch (error) {
      console.error("Satış hatası:", error);
      setError(error instanceof Error ? error.message : "Satış kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodSelect = async (method: string) => {
    const parsedAmount = parseFloat(payment.amount || "0");
    const parsedPrice = parseFloat(price || "0");
    
    // Map payment method from the modal's format to the expected format
    let paymentMethod = "";
    switch (method) {
      case "Nakit":
        paymentMethod = "CASH";
        break;
      case "Kredi Kartı":
        paymentMethod = "CREDIT_CARD";
        break;
      case "Havale/EFT":
        paymentMethod = "TRANSFER";
        break;
      default:
        paymentMethod = "CASH";
    }
    
    setPayment({ ...payment, paymentMethod });
    setIsPaymentMethodModalOpen(false);
    
    const saleData = {
      customerId: selectedCustomerId,
      packageId: selectedPackageId,
      price: parsedPrice,
      staffId: selectedStaffId,
      saleDate: saleDate,
      expiryDate: expiryDate,
      payment: {
        amount: parsedAmount,
        paymentMethod: paymentMethod,
      }
    };
    
    await processSale(saleData);
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] p-0 max-h-[calc(100vh-120px)] bg-white rounded-lg shadow-lg z-50 overflow-hidden" hideCloseButton={true}>
          <div className="px-6 py-4 flex justify-end items-center gap-2">
            {canAddCustomers && (
              <Button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                size="sm"
                className="h-8 bg-[#204937] hover:bg-[#183b2d] text-white flex items-center gap-1 whitespace-nowrap"
              >
                <Plus size={16} /> Yeni Müşteri Ekle
              </Button>
            )}
            {canAddPackages && (
              <Button
                type="button"
                onClick={() => setIsNewPackageModalOpen(true)}
                size="sm"
                className="h-8 bg-[#204937] hover:bg-[#183b2d] text-white flex items-center gap-1 whitespace-nowrap"
              >
                <Plus size={16} /> Yeni Paket Oluştur
              </Button>
            )}
          </div>

          <div
            className="px-6 py-4 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 240px)" }}
          >
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-[6px]">
                {error}
              </div>
            )}
            <div className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                      <Search size={18} className="ml-2 text-gray-400" />
                      <Input
                        ref={customerSearchInputRef}
                        type="text"
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                        placeholder="Müşteri adı veya telefon..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setSelectedCustomerId("");
                        }}
                      />
                    </div>
                  </div>
                  {customerSearch &&
                    filteredCustomers.length > 0 &&
                    !selectedCustomerId && (
                      <div className="absolute z-20 mt-1 w-full bg-white border rounded-[6px] shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-600">
                              {customer.phone || "Telefon belirtilmemiş"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                      <Search size={18} className="ml-2 text-gray-400" />
                      <Input
                        ref={packageSearchInputRef}
                        type="text"
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                        placeholder="Paket adı ile ara..."
                        value={
                          selectedPackage ? selectedPackage.name : packageSearch
                        }
                        onChange={(e) => {
                          setPackageSearch(e.target.value);
                          setSelectedPackage(null);
                          setSelectedPackageId("");
                        }}
                        onClick={handlePackageInputClick}
                      />
                    </div>
                  </div>
                  {(packageSearch || showAllPackages) &&
                    filteredPackages.length > 0 &&
                    !selectedPackage && (
                      <div 
                        ref={packagesDropdownRef}
                        className="absolute z-20 mt-1 w-full bg-white border rounded-[6px] shadow-lg overflow-y-auto"
                        style={{ maxHeight: '200px' }}
                      >
                        {filteredPackages.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => handlePackageSelect(pkg)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{pkg.name}</span>
                              <span className="text-sm text-gray-600">
                                {pkg.sessionCount} Seans | ₺{pkg.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                {selectedPackage && (
                  <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 bg-white h-10">
                    <input
                      type="text"
                      readOnly
                      value={`${selectedPackage.name} | ${selectedPackage.sessionCount} Seans | ₺${selectedPackage.price}`}
                      className="w-full h-10 px-3 py-2 border-0 focus:outline-none rounded-[6px] text-gray-900"
                    />
                  </div>
                )}
              </div>

              {/* Staff Selection */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white w-full">
                    <Select
                      onValueChange={setSelectedStaffId}
                      value={selectedStaffId}
                    >
                      <SelectTrigger className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]">
                        <SelectValue placeholder="Satış Personeli Seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {Array.isArray(staffList) 
                          ? staffList.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} {staff.position && `(${staff.position})`}
                              </SelectItem>
                            ))
                          : staffList && typeof staffList === 'object' && 'activeStaff' in staffList ? 
                            ((staffList as any).activeStaff || []).map((staff: Staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} {staff.position && `(${staff.position})`}
                              </SelectItem>
                            )) : []
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Satış Tarihi
                  </Label>
                  <div className="relative">
                    <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                      <Input
                        type="date"
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                        value={saleDate}
                        onChange={(e) => handleSaleDateChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Son Geçerlilik Tarihi
                  </Label>
                  <div className="relative">
                    <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                      <Input
                        type="date"
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                        value={expiryDate}
                        onChange={(e) => handleExpiryDateChange(e.target.value)}
                        min={saleDate}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Satış Fiyatı</Label>
                    <div className="relative">
                      <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                        <Input
                          type="number"
                          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                          ₺
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      Tahsilat Tutarı
                    </Label>
                    <div className="relative">
                      <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                        <Input
                          type="number"
                          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12"
                          placeholder="0.00"
                          value={payment.amount}
                          onChange={(e) =>
                            setPayment({ ...payment, amount: e.target.value })
                          }
                          min="0"
                          max={price}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                          ₺
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-white z-10">
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#204937] hover:bg-[#183b2d] text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                  Kaydediliyor...
                </>
              ) : (
                "Satışı Tamamla"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        open={isPaymentMethodModalOpen}
        onOpenChange={setIsPaymentMethodModalOpen}
        onSelectMethod={handlePaymentMethodSelect}
        loading={saving}
      />

      {/* Nested Modals with Higher Z-Index */}
      <NewCustomerModal
        open={isNewCustomerModalOpen}
        onOpenChange={setIsNewCustomerModalOpen}
        onSuccess={handleNewCustomerSuccess}
      />
      {/* PackageModal with explicit z-index */}
      {isNewPackageModalOpen && (
        <div className="fixed inset-0 z-[1000]">
          <PackageModal
            isOpen={isNewPackageModalOpen}
            onClose={() => setIsNewPackageModalOpen(false)}
            onSubmit={handleNewPackageSuccess}
            packageData={null}
            fetchPackages={fetchPackages}
          />
        </div>
      )}
    </>
  );
}