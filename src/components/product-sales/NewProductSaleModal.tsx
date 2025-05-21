"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Trash2, CheckCircle, Check } from "lucide-react";
import { useProductSaleManagement } from '@/hooks/productSale/useProductSaleManagement';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, Customer, Staff } from "@/types/product";

interface SaleItem {
  productId: string;
  quantity: string;
  unitPrice: string;
}

interface SaleItemUI {
  search: string;
  showResults: boolean;
}

interface StaffsApiResponse {
  data: StaffWithPosition[];
}

interface NewProductSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: Product[];
  customers: Customer[];
  staffs: Staff[] | StaffsApiResponse;
  defaultCustomerId?: string;
  disableCustomerSelection?: boolean;
  hidePaymentOptions?: boolean;
}

// Alt Bileşen: SaleItemComponent
type StaffWithPosition = {
  id: string;
  name: string;
  position?: string;
}

const SaleItemComponent = ({
  item,
  itemUI = { search: '', showResults: false },
  products,
  onProductChange,
  onQuantityChange,
  onUnitPriceChange,
  onSearchChange,
  onShowResultsChange,
  onRemove,
  index,
  inputRef, // inputRef prop'u
}: {
  item: SaleItem;
  itemUI?: SaleItemUI;
  products: Product[];
  onProductChange: (productId: string) => void;
  onQuantityChange: (quantity: string) => void;
  onUnitPriceChange: (unitPrice: string) => void;
  onSearchChange: (search: string) => void;
  onShowResultsChange: (showResults: boolean) => void;
  onRemove: () => void;
  index: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) => {
  const productResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productResultsRef.current && !productResultsRef.current.contains(event.target as Node)) {
        onShowResultsChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onShowResultsChange]);

  const getFilteredProducts = () => {
    if (!itemUI) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(itemUI.search.toLowerCase())
    );
  };

  const selectedProduct = products.find(p => p.id === item.productId);

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="relative" ref={productResultsRef}>
        <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
          <Input
            ref={inputRef}
            placeholder="Ürün"
            value={selectedProduct ? selectedProduct.name : itemUI?.search || ''}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onShowResultsChange(true);
            }}
            onFocus={() => {
              onShowResultsChange(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && item.productId) {
                onProductChange('');
                onSearchChange('');
                onUnitPriceChange('');
                onShowResultsChange(true);
              }
            }}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white placeholder:text-gray-400"
          />
        </div>
        {itemUI?.showResults && (
          <div className="fixed z-50 w-full max-w-[220px] mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {getFilteredProducts().slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onProductChange(product.id);
                }}
              >
                {product.name} - ₺{product.price} (Stok: {product.stock})
              </div>
            ))}
            {getFilteredProducts().length === 0 && (
              <div className="p-2 text-gray-500">Sonuç bulunamadı</div>
            )}
          </div>
        )}
      </div>
      <div>
        <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12 bg-white placeholder:text-gray-400"
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs pointer-events-none">
            Adet
          </span>
        </div>
      </div>
      <div className="relative flex items-center">
        <div className="relative flex-1 border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
          <Input
            type="number"
            value={item.unitPrice}
            onChange={(e) => onUnitPriceChange(e.target.value)}
            placeholder=""
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12 bg-white placeholder:text-gray-400"
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">
            ₺
          </span>
        </div>
        <Button 
          variant="ghost" 
          className="ml-2 text-red-500 hover:text-red-700 p-2" 
          onClick={onRemove}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default function NewProductSaleModal({
  open,
  onOpenChange,
  onSuccess,
  products,
  customers,
  staffs,
  defaultCustomerId,
  disableCustomerSelection = false,
  hidePaymentOptions = false
}: NewProductSaleModalProps) {
  const { toast } = useToast();
  
  // Merkezi hook'a erişim
  const {
    saleFormData,
    setSaleFormData,
    formErrors,
    submitting,
    handleCreateSale,
    resetSaleForm,
    error
  } = useProductSaleManagement({ autoFetch: false });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([{
    productId: '',
    quantity: '1',
    unitPrice: ''
  }]);

  const [saleItemsUI, setSaleItemsUI] = useState<SaleItemUI[]>([{
    search: '',
    showResults: false
  }]);

  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [staffId, setStaffId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isFullyPaid, setIsFullyPaid] = useState(true);

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const customerResultsRef = useRef<HTMLDivElement>(null);
  const [localError, setLocalError] = useState("");

  // Modal kapatıldığında formu sıfırla
  useEffect(() => {
    if (!open) {
      setSaleItems([{
        productId: '',
        quantity: '1',
        unitPrice: ''
      }]);
      setSaleItemsUI([{
        search: '',
        showResults: false
      }]);
      if (!disableCustomerSelection) {
        setCustomerId('');
        setCustomerSearch('');
      }
      setStaffId('');
      setSaleDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('');
      setShowCustomerResults(false);
      setLocalError("");
      setIsFullyPaid(true);
      resetSaleForm();
    }
  }, [open, disableCustomerSelection, resetSaleForm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerResultsRef.current && !customerResultsRef.current.contains(event.target as Node)) {
        setShowCustomerResults(false);
      }
    };

    if (!disableCustomerSelection) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [disableCustomerSelection]);
  
  // Müşteri bilgisini defaultCustomerId ile ayarla
  useEffect(() => {
    if (defaultCustomerId && disableCustomerSelection) {
      setCustomerId(defaultCustomerId);
      const selectedCustomer = customers.find(c => c.id === defaultCustomerId);
      if (selectedCustomer) {
        setCustomerSearch(selectedCustomer.name);
      }
    }
  }, [defaultCustomerId, customers, disableCustomerSelection]);

  const handleSubmit = async () => {
    try {
      setLocalError("");
      
      // Form validasyonu
      if (!customerId) {
        setLocalError("Lütfen bir müşteri seçin");
        return;
      }
      
      if (!staffId) {
        setLocalError("Lütfen bir personel seçin");
        return;
      }
      
      if (isFullyPaid && !hidePaymentOptions && !paymentMethod) {
        setLocalError("Lütfen ödeme yöntemi seçin");
        return;
      }
      
      // Ürün kontrolü
      const invalidItems = saleItems.filter(item => 
        !item.productId || !item.quantity || Number(item.quantity) <= 0 || !item.unitPrice || Number(item.unitPrice) <= 0
      );
      
      if (invalidItems.length > 0 || saleItems.length === 0) {
        setLocalError("Tüm ürün bilgilerini doğru şekilde girdiğinizden emin olun");
        return;
      }

      // Merkezi hook'u kullanarak form verilerini ayarla
      setSaleFormData({
        productId: saleItems[0].productId,
        customerId: customerId,
        staffId: staffId,
        quantity: saleItems[0].quantity,
        unitPrice: saleItems[0].unitPrice,
        date: saleDate,
        paymentMethod: isFullyPaid ? paymentMethod : '',
        isFullyPaid: isFullyPaid
      });

      // Satış oluştur
      const newSale = await handleCreateSale();
      
      if (newSale) {
        toast({
          title: 'Başarılı',
          description: 'Satış başarıyla eklendi',
        });
        
        onSuccess();
      }

    } catch (error: any) {
      setLocalError(error.message || "Satış eklenirken bir hata oluştu");
      toast({
        title: 'Hata',
        description: error.message || 'Satış eklenirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleAddProduct = () => {
    setSaleItems(prev => [
      ...prev,
      {
        productId: '',
        quantity: '1',
        unitPrice: '',
      },
    ]);

    setSaleItemsUI(prev => [
      ...prev,
      {
        search: '',
        showResults: false
      }
    ]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const updatedItems = [...saleItems];
    const updatedItemsUI = [...saleItemsUI];
    updatedItems[index].productId = productId;
    const product = products.find((p) => p.id === productId);
    if (product) {
      updatedItems[index].unitPrice = (product.price * Number(updatedItems[index].quantity)).toString();
    }
    updatedItemsUI[index].showResults = false;
    updatedItemsUI[index].search = product?.name || '';
    setSaleItems(updatedItems);
    setSaleItemsUI(updatedItemsUI);
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    const updatedItems = [...saleItems];
    updatedItems[index].quantity = quantity;

    const product = products.find((p) => p.id === updatedItems[index].productId);
    if (product) {
      updatedItems[index].unitPrice = (product.price * Number(quantity)).toString();
    }

    setSaleItems(updatedItems);
  };

  const handleUnitPriceChange = (index: number, unitPrice: string) => {
    const updatedItems = [...saleItems];
    updatedItems[index].unitPrice = unitPrice;
    setSaleItems(updatedItems);
  };

  const handleRemoveProduct = (index: number) => {
    if (saleItems.length === 1) {
      // En az bir ürün kalmalı
      setSaleItems([{
        productId: '',
        quantity: '1',
        unitPrice: ''
      }]);
      setSaleItemsUI([{
        search: '',
        showResults: false
      }]);
      return;
    }
    
    setSaleItems(prev => prev.filter((_, i) => i !== index));
    setSaleItemsUI(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearchChange = (index: number, search: string) => {
    const updatedItemsUI = [...saleItemsUI];
    updatedItemsUI[index].search = search;
    setSaleItemsUI(updatedItemsUI);
  };

  const handleShowResultsChange = (index: number, showResults: boolean) => {
    const updatedItemsUI = [...saleItemsUI];
    updatedItemsUI[index].showResults = showResults;
    setSaleItemsUI(updatedItemsUI);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setShowCustomerResults(false);
  };

  // Ürün input alanına odaklanmak için ref oluştur
  const firstProductInputRef = useRef<HTMLInputElement>(null);
  
  // Modal açıldığında ürün alanına otomatik olarak odaklan
  useEffect(() => {
    if (open) {
      // Modal açıldıktan sonra DOM güncellenip inputlar oluşunca odaklanmak için setTimeout kullan
      const timer = setTimeout(() => {
        if (firstProductInputRef.current) {
          firstProductInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-50 product-sale-overlay" 
          aria-hidden="true"
        />
      )}
      <Dialog 
        open={open} 
        onOpenChange={onOpenChange}
        modal={false}
      >
        <DialogContent 
          className="sm:max-w-[700px] p-0 max-h-[90vh] bg-white rounded-lg shadow-lg z-50"
          hideCloseButton={true}
        >
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Yeni Satış
          </DialogTitle>
        </DialogHeader>
        
        <div
          className="px-6 py-4 overflow-y-auto bg-white"
          style={{ maxHeight: "calc(90vh - 180px)", paddingBottom: "70px" }}
        >
          {(localError || error) && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {localError || error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Müşteri seçimi - disableCustomerSelection durumunda salt görüntüleme */}
            <div className="relative" ref={customerResultsRef}>
              <div className={`flex items-center border rounded-[6px] ${disableCustomerSelection ? 'bg-gray-100' : 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white'}`}>
                <Input
                  placeholder="Müşteri"
                  value={customerSearch}
                  onChange={(e) => {
                    if (!disableCustomerSelection) {
                      setCustomerSearch(e.target.value);
                      setShowCustomerResults(true);
                    }
                  }}
                  onFocus={() => !disableCustomerSelection && setShowCustomerResults(true)}
                  className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] ${disableCustomerSelection ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} placeholder:text-gray-400`}
                  disabled={disableCustomerSelection}
                />
              </div>
              {!disableCustomerSelection && showCustomerResults && customerSearch && (
                <div className="fixed z-50 w-full max-w-[320px] mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      {customer.name}
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-2 text-gray-500">Sonuç bulunamadı</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Satış Tarihi */}
            <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                placeholder="Satış Tarihi"
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white placeholder:text-gray-400"
              />
            </div>
            
            {/* Satış ürünleri */}
            <div className="space-y-4 pt-4 pb-2">
              <div className="flex justify-end items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={handleAddProduct}
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Ürün Ekle
                </Button>
              </div>
              
              <div className="space-y-2">
                {saleItems.map((item, index) => (
                  <SaleItemComponent
                    key={index}
                    item={item}
                    itemUI={saleItemsUI[index]}
                    products={products}
                    onProductChange={(productId) => handleProductChange(index, productId)}
                    onQuantityChange={(quantity) => handleQuantityChange(index, quantity)}
                    onUnitPriceChange={(unitPrice) => handleUnitPriceChange(index, unitPrice)}
                    onSearchChange={(search) => handleSearchChange(index, search)}
                    onShowResultsChange={(showResults) => handleShowResultsChange(index, showResults)}
                    onRemove={() => handleRemoveProduct(index)}
                    index={index}
                    inputRef={index === 0 ? firstProductInputRef : undefined}
                  />
                ))}
              </div>
            </div>
            
            {/* Satıcı Personel */}
            <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <Select
                value={staffId}
                onValueChange={(value) => setStaffId(value)}
              >
                <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white text-gray-900 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="Personel" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {Array.isArray(staffs) 
                    ? staffs.map((staff: StaffWithPosition) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                        {staff.position && ` (${staff.position})`}
                      </SelectItem>
                    ))
                    : 'data' in staffs && Array.isArray(staffs.data) 
                      ? staffs.data.map((staff: StaffWithPosition) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                            {staff.position && ` (${staff.position})`}
                          </SelectItem>
                        ))
                      : []
                  }
                </SelectContent>
              </Select>
            </div>
            
            {/* Ödeme Yöntemi - hidePaymentOptions true ise gösterme */}
            {isFullyPaid && !hidePaymentOptions && (
              <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white text-gray-900 data-[placeholder]:text-gray-400">
                    <SelectValue placeholder="Ödeme Yöntemi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="kart">Kart</SelectItem>
                    <SelectItem value="nakit">Nakit</SelectItem>
                    <SelectItem value="havale">Havale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tahsilat Durumu - hidePaymentOptions true ise gösterme */}
            {!hidePaymentOptions && (
              <div className="flex items-center space-x-3 py-2">
                <div 
                  className="flex items-center h-5 cursor-pointer" 
                  onClick={() => setIsFullyPaid(!isFullyPaid)}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center ${isFullyPaid ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                    {isFullyPaid && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
                <span 
                  className="text-sm font-medium text-gray-700 cursor-pointer" 
                  onClick={() => setIsFullyPaid(!isFullyPaid)}
                >
                  Satış tutarının tamamı tahsil edildi
                </span>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4 bg-white fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 shadow-sm">
          <Button 
            type="submit" 
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200 max-w-[650px] mx-auto"
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                Satış Ekleniyor...
              </>
            ) : "Satışı Tamamla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
