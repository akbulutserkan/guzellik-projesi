"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Search, Edit2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/permissions";
import {
  Package,
  Staff,
  Customer,
  PackageSale,
} from "@/types/package";

interface ExtendedPackageSale extends PackageSale {
  notes?: string;
  staffId?: string;
}

interface UpdatePackageSaleData {
  id: string;
  price?: number;
  saleDate?: string;
  expiryDate?: string;
  staffId?: string;
  customerId?: string;
  packageId?: string;
}

interface EditPackageSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: ExtendedPackageSale | null;
  onSuccess: (updatedSale: ExtendedPackageSale) => void;
  onUpdateSale?: (data: UpdatePackageSaleData) => Promise<PackageSale | null>;
}

export default function EditPackageSaleModal({
  open,
  onOpenChange,
  sale,
  onSuccess,
  onUpdateSale
}: EditPackageSaleModalProps) {
  const { toast } = useToast();
  const { canEditPackageSales } = usePermissions();
  const formInitialized = useRef(false);

  const [isCustomerEditable, setIsCustomerEditable] = useState(false);
  const [isPackageEditable, setIsPackageEditable] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [packageSearch, setPackageSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const [formData, setFormData] = useState({
    price: "",
    notes: "",
    saleDate: "",
    expiryDate: "",
    staffId: "",
    customerName: "",
    packageName: "",
    customerId: "",
    packageId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Bu bileşenin kendi veri yükleme mantığı farklı şekilde implemente edilmiş
    // Bu fonksiyonu hook içerisine taşıyabiliriz, ancak şu an basit olması için
    // modülü etkilemeden kullanacağız
    const fetchInitialData = async () => {
      try {
        // Örnek olarak hook üzerinden veri alma
        // Burada API çağrıları yerine, props üzerinden Customers ve Packages alınabilir
        // Şu an için bu değişikliği yapmadan sadece arayüzünü değiştiriyoruz
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: error instanceof Error ? error.message : "Veriler yüklenirken bir hata oluştu"
        });
      }
    };

    if (open) {
      fetchInitialData();
    }
  }, [open, toast]);

  // Modalın açılıp kapanmasını ve form verilerini yönetmek için ayrı useEffect kullanıyoruz
  useEffect(() => {
    // Sadece modal açıldığında ve ilk kez form verileri yüklendiğinde çalışsın
    if (sale && open && !formInitialized.current) {
      // Modal yeni açıldığında tüm arama state'lerini temizle
      setCustomerSearch("");
      setPackageSearch("");
      
      setFormData({
        price: sale.price.toString(),
        notes: sale.notes || "",
        saleDate: sale.saleDate
          ? new Date(sale.saleDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        expiryDate: sale.expiryDate
          ? new Date(sale.expiryDate).toISOString().split("T")[0]
          : "",
        staffId: sale.staffId || "",
        customerName: sale.customer?.name || "Bilinmeyen Müşteri",
        packageName: sale.package?.name || "Bilinmeyen Paket",
        customerId: sale.customer?.id?.toString() || "",
        packageId: sale.package?.id || "",
      });
      formInitialized.current = true;
    } else if (!open) {
      // Modal kapandığında referansı sıfırlıyoruz ki bir sonraki açılışta form tekrar yüklensin
      formInitialized.current = false;
      // Modal kapatıldığında edit modlarını sıfırlıyoruz, ancak form verilerini koruyoruz
      setIsCustomerEditable(false);
      setIsPackageEditable(false);
    }
  }, [open, sale]);

  // Arama durumlarını yönetmek için ayrı useEffect'ler kullanıyoruz
  // Müşteri araması için debounce kullanarak gereksiz işlemleri azaltıyoruz
  useEffect(() => {
    // Bir timeout kullanarak fazla işlem yükünü azaltıyoruz
    const timeoutId = setTimeout(() => {
      if (customerSearch && isCustomerEditable) {
        const filtered = customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (customer.phone && customer.phone.includes(customerSearch))
        );
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers([]);
      }
    }, 100); // 100ms debounce

    // Cleanup function - memory leak'leri önler
    return () => clearTimeout(timeoutId);
  }, [customerSearch, customers, isCustomerEditable]);

  // Paket araması için benzer bir debounce yaklaşımı
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (packageSearch && isPackageEditable) {
        const filtered = packages.filter((pkg) =>
          pkg.name.toLowerCase().includes(packageSearch.toLowerCase())
        );
        setFilteredPackages(filtered);
      } else {
        setFilteredPackages([]);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [packageSearch, packages, isPackageEditable]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "saleDate" && !formData.expiryDate) {
      const newExpiryDate = new Date(value);
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      setFormData((prev) => ({
        ...prev,
        expiryDate: newExpiryDate.toISOString().split("T")[0],
      }));
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id.toString(),
      customerName: customer.name,
    }));
    setCustomerSearch(customer.name);
    setFilteredCustomers([]);
    setIsCustomerEditable(false);
  };

  const handlePackageSelect = (pkg: Package) => {
    setFormData((prev) => ({
      ...prev,
      packageId: pkg.id,
      packageName: pkg.name,
    }));
    setPackageSearch(pkg.name);
    setFilteredPackages([]);
    setIsPackageEditable(false);
  };

  const handleSubmit = async () => {
    if (!sale || !onUpdateSale) return;

    setError("");

    try {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue)) throw new Error("Geçersiz fiyat formatı");

      let formattedExpiryDate: string | undefined = undefined;
      if (formData.expiryDate) {
        const dateObj = new Date(formData.expiryDate);
        if (isNaN(dateObj.getTime())) throw new Error("Geçersiz tarih formatı");
        formattedExpiryDate = formData.expiryDate;
      }

      setLoading(true);

      const updateData: UpdatePackageSaleData = {
        id: sale.id,
        price: priceValue,
        expiryDate: formattedExpiryDate,
        staffId: formData.staffId || undefined,
      };

      if (formData.saleDate) {
        updateData.saleDate = formData.saleDate;
      }

      if (
        formData.customerId &&
        formData.customerId !== sale.customer?.id?.toString()
      ) {
        updateData.customerId = formData.customerId;
      }

      if (formData.packageId && formData.packageId !== sale.package?.id) {
        updateData.packageId = formData.packageId;
      }

      console.log('Güncelleme verisi:', updateData);

      // Merkezi hook üzerinden güncelleme
      const result = await onUpdateSale(updateData);

      if (!result) {
        throw new Error("Güncelleme işlemi başarısız oldu");
      }

      onSuccess(result as ExtendedPackageSale);
      toast({
        title: "Başarılı",
        description: "Paket satışı başarıyla güncellendi",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Paket satışı güncellenirken hata:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Paket satışı güncellenirken bir hata oluştu"
      );
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Paket satışı güncellenirken bir hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] bg-white rounded-lg shadow-lg flex flex-col" hideCloseButton={true}>
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 bg-white">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Paket Satışı Düzenle
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto bg-white flex-grow">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Müşteri Seçimi */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                    <Search size={18} className="ml-2 text-gray-400" />
                    <Input
                      type="text"
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                      value={
                        isCustomerEditable
                          ? customerSearch
                          : formData.customerName
                      }
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      disabled={!isCustomerEditable}
                      placeholder="Müşteri adı veya telefon..."
                    />
                    <button
                      className="ml-2 mr-2 text-gray-500 hover:text-blue-500"
                      onClick={() => setIsCustomerEditable(!isCustomerEditable)}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  {isCustomerEditable && filteredCustomers.length > 0 && (
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

              {/* Paket Seçimi */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                    <Search size={18} className="ml-2 text-gray-400" />
                    <Input
                      type="text"
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]"
                      value={
                        isPackageEditable ? packageSearch : formData.packageName
                      }
                      onChange={(e) => setPackageSearch(e.target.value)}
                      disabled={!isPackageEditable}
                      placeholder="Paket adı..."
                    />
                    <button
                      className="ml-2 mr-2 text-gray-500 hover:text-blue-500"
                      onClick={() => setIsPackageEditable(!isPackageEditable)}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  {isPackageEditable && filteredPackages.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border rounded-[6px] shadow-lg max-h-60 overflow-y-auto">
                      {filteredPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => handlePackageSelect(pkg)}
                        >
                          <div className="font-medium">{pkg.name}</div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-600">
                              {pkg.sessionCount} Seans
                            </span>
                            <span className="text-sm font-medium">
                              ₺{pkg.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarihler */}
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
                        value={formData.saleDate}
                        onChange={(e) =>
                          handleFieldChange("saleDate", e.target.value)
                        }
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
                        value={formData.expiryDate}
                        onChange={(e) =>
                          handleFieldChange("expiryDate", e.target.value)
                        }
                        min={formData.saleDate}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiyat */}
              <div className="relative">
                <Label className="text-sm font-medium text-gray-700">
                  Fiyat
                </Label>
                <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                  <Input
                    type="number"
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                    ₺
                  </span>
                </div>
              </div>

              {/* Personel Seçimi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Satış Personeli
                </Label>
                <div className="relative">
                  <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white w-full">
                    <Select
                      value={formData.staffId}
                      onValueChange={(value) => handleFieldChange("staffId", value)}
                    >
                      <SelectTrigger className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px]">
                        <SelectValue placeholder="Satış Personeli Seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} {staff.position && `(${staff.position})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Notlar
                </Label>
                <div className="relative">
                  <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                    <Input
                      type="text"
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] placeholder:text-gray-500 placeholder-opacity-10"
                      placeholder="Notlar..."
                      value={formData.notes}
                      onChange={(e) => handleFieldChange("notes", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Güncelle Butonu - En Altta Sabit */}
          <div className="p-6 bg-white border-t mt-auto">
            <Button
              type="button"
              disabled={loading || !formData.price}
              onClick={handleSubmit}
              className="w-full bg-[#204937] hover:bg-[#183b2d] text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                  Kaydediliyor...
                </>
              ) : (
                "Güncelle"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}