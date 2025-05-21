"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Search, PlusCircle, Trash2, Pencil } from "lucide-react";
import { useProductSaleManagement } from '@/hooks/productSale/useProductSaleManagement';
import { formatPrice } from '@/utils/productSale/formatters';
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
import { Product, Customer, Staff, ProductSale, ProductSaleWithPayments } from "@/types/product";

interface StaffsApiResponse {
  data: StaffWithPosition[];
}

interface EditProductSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: Product[];
  customers: Customer[];
  staffs: Staff[] | StaffsApiResponse;
  productSale: ProductSaleWithPayments | null;
}

type StaffWithPosition = {
  id: string;
  name: string;
  position?: string;
}

export default function EditProductSaleModal({
  open,
  onOpenChange,
  onSuccess,
  products,
  customers,
  staffs,
  productSale,
}: EditProductSaleModalProps) {
  const { toast } = useToast();
  
  // Merkezi hook'a erişim
  const {
    saleFormData,
    setSaleFormData,
    formErrors,
    submitting,
    error,
    handleUpdateSale,
    resetSaleForm
  } = useProductSaleManagement({ autoFetch: false });

  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [customerId, setCustomerId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [productId, setProductId] = useState('');
  const [notes, setNotes] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  
  // Müşteri ve ürün alanları için düzenleme durumu
  const [customerEditMode, setCustomerEditMode] = useState(false);
  const [productEditMode, setProductEditMode] = useState(false);
  
  // Herhangi bir alanda değişiklik yapıldığını izleyen bayrak
  const [isDirty, setIsDirty] = useState(false);
  
  // Yerel hata durumu
  const [localError, setLocalError] = useState("");

  const customerResultsRef = useRef<HTMLDivElement>(null);
  const productResultsRef = useRef<HTMLDivElement>(null);

  // productSale değiştiğinde formu doldur
  useEffect(() => {
    if (productSale && open) {
      setProductId(productSale.productId || '');
      setProductSearch(productSale.productName || '');
      setQuantity(productSale.quantity.toString());
      setUnitPrice(productSale.unitPrice.toString());
      setCustomerId(productSale.customerId || '');
      setCustomerSearch(productSale.customerName || '');
      setStaffId(productSale.staffId || '');
      setSaleDate(new Date(productSale.date).toISOString().slice(0, 10));
      
      // Ödeme yöntemi dönüşümü - paymentStatus'tan ödeme yöntemini belirle
      const paymentStatusToMethod: Record<string, string> = {
        'PAID': 'kart',
        'CASH': 'nakit',
        'TRANSFER': 'havale'
      };
      setPaymentMethod(productSale.paymentStatus ? (paymentStatusToMethod[productSale.paymentStatus] || 'kart') : 'kart');
      setNotes(''); // Notes alanı henüz API'de yok, boş başlat
      
      // Düzenleme modlarını başlangıçta kapalı yap
      setCustomerEditMode(false);
      setProductEditMode(false);
      
      // Değişiklik bayrağını sıfırla
      setIsDirty(false);
      
      // Merkezi hook'a da verileri yükle
      setSaleFormData({
        productId: productSale.productId || '',
        customerId: productSale.customerId || '',
        staffId: productSale.staffId || '',
        quantity: productSale.quantity.toString(),
        unitPrice: productSale.unitPrice.toString(),
        date: new Date(productSale.date).toISOString().slice(0, 10),
        paymentMethod: productSale.paymentStatus ? (paymentStatusToMethod[productSale.paymentStatus] || 'kart') : 'kart',
        isFullyPaid: false  // Düzenleme ekranında isFullyPaid kullanılmıyor
      });
    }
  }, [productSale, open, setSaleFormData]);

  // Modal kapatıldığında formu sıfırla
  useEffect(() => {
    if (!open) {
      setProductId('');
      setProductSearch('');
      setQuantity('1');
      setUnitPrice('');
      setCustomerId('');
      setCustomerSearch('');
      setStaffId('');
      setSaleDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('');
      setNotes('');
      setShowCustomerResults(false);
      setShowProductResults(false);
      setLocalError("");
      setCustomerEditMode(false);
      setProductEditMode(false);
      setIsDirty(false);
      resetSaleForm();
    }
  }, [open, resetSaleForm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerResultsRef.current && !customerResultsRef.current.contains(event.target as Node)) {
        setShowCustomerResults(false);
      }
      if (productResultsRef.current && !productResultsRef.current.contains(event.target as Node)) {
        setShowProductResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    try {
      setLocalError("");
      
      // Form validasyonu
      if (!quantity || Number(quantity) <= 0) {
        setLocalError("Lütfen geçerli bir adet girin");
        return;
      }
      
      if (!unitPrice || Number(unitPrice) <= 0) {
        setLocalError("Lütfen geçerli bir birim fiyat girin");
        return;
      }

      if (!productSale) {
        setLocalError("Düzenlenecek satış bilgisi bulunamadı");
        return;
      }

      // Merkezi hook verilerini güncelle
      setSaleFormData(prev => ({
        ...prev,
        quantity: quantity,
        unitPrice: unitPrice,
        paymentMethod: paymentMethod
      }));
      
      // Merkezi hook ile güncelleme yap
      const updatedSale = await handleUpdateSale(productSale.id);
      
      if (updatedSale) {
        toast({
          title: 'Başarılı',
          description: 'Satış başarıyla güncellendi',
        });
        
        onSuccess();
      }

    } catch (error: any) {
      setLocalError(error.message || "Satış güncellenirken bir hata oluştu");
      toast({
        title: 'Hata',
        description: error.message || 'Satış güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleProductChange = (productId: string) => {
    setProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setUnitPrice(product.price.toString());
      setProductSearch(product.name);
      
      // Merkezi hook güncelle
      setSaleFormData(prev => ({
        ...prev,
        productId,
        unitPrice: product.price.toString()
      }));
    }
    setShowProductResults(false);
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerSearch(customer.name);
    
    // Merkezi hook güncelle
    setSaleFormData(prev => ({
      ...prev,
      customerId: customer.id
    }));
    
    setShowCustomerResults(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 max-h-[85vh] bg-white rounded-lg shadow-lg" hideCloseButton>
        <DialogHeader className="pl-3 pt-1 pb-1 border-b sticky top-0 bg-white z-10">
          <div className="flex-grow text-left">
            <DialogTitle className="text-xs font-medium text-gray-700">
              Satış Düzenle
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div
          className="px-4 pt-2 pb-3 overflow-y-auto bg-white"
          style={{ maxHeight: "calc(90vh - 100px)" }}
        >
          {(localError || error) && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {localError || error}
            </div>
          )}
          
          <div className="space-y-1">
            {/* Satış Tarihi */}
            <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => {
                  setSaleDate(e.target.value);
                  setSaleFormData(prev => ({...prev, date: e.target.value}));
                  setIsDirty(true);
                }}
                placeholder="Satış Tarihi"
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] py-1 h-8"
                disabled={submitting}
              />
            </div>

            {/* Müşteri seçimi */}
            <div className="relative" ref={customerResultsRef}>
              <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <div className="flex-shrink-0 pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Müşteri"
                  value={customerSearch}
                  onChange={(e) => {
                    if (customerEditMode) {
                      setCustomerSearch(e.target.value);
                      setShowCustomerResults(true);
                      setIsDirty(true);
                    }
                  }}
                  onFocus={() => customerEditMode && setShowCustomerResults(true)}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pl-0 py-1 h-8"
                  disabled={submitting || !customerEditMode}
                />
                <div className="flex-shrink-0 pr-3">
                  <Button 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600" 
                    onClick={() => setCustomerEditMode(!customerEditMode)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showCustomerResults && customerSearch && customerEditMode && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
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

            {/* Ürün seçimi */}
            <div className="relative" ref={productResultsRef}>
              <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <div className="flex-shrink-0 pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Ürün/Hizmet"
                  value={productSearch}
                  onChange={(e) => {
                    if (productEditMode) {
                      setProductSearch(e.target.value);
                      setShowProductResults(true);
                      setIsDirty(true);
                    }
                  }}
                  onFocus={() => productEditMode && setShowProductResults(true)}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pl-0 py-1 h-8"
                  disabled={submitting || !productEditMode} 
                />
                <div className="flex-shrink-0 pr-3">
                  <Button 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600" 
                    onClick={() => setProductEditMode(!productEditMode)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showProductResults && productSearch && productEditMode && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleProductChange(product.id)}
                    >
                      {product.name} - {formatPrice(product.price)} (Stok: {product.stock})
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-2 text-gray-500">Sonuç bulunamadı</div>
                  )}
                </div>
              )}
            </div>

            {/* Adet ve Fiyat - Yan Yana */}
            <div className="grid grid-cols-2 gap-2">
              {/* Adet */}
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setSaleFormData(prev => ({...prev, quantity: e.target.value}));
                    setIsDirty(true);
                  }}
                  placeholder="Adet"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] py-1 h-8 pr-12"
                  disabled={submitting}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                  Adet
                </span>
              </div>
              
              {/* Fiyat */}
              <div className="relative flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(e.target.value);
                    setSaleFormData(prev => ({...prev, unitPrice: e.target.value}));
                    setIsDirty(true);
                  }}
                  placeholder="Fiyat"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pr-12"
                  disabled={submitting}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                  ₺
                </span>
              </div>
            </div>
            
            {/* Satıcı Personel */}
            <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <Select
                value={staffId}
                onValueChange={(value) => {
                  setStaffId(value);
                  setSaleFormData(prev => ({...prev, staffId: value}));
                  setIsDirty(true);
                }}
                disabled={submitting}
              >
                <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white h-8 py-0 min-h-0">
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
            
            {/* Ödeme Yöntemi */}
            <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  setSaleFormData(prev => ({...prev, paymentMethod: value}));
                  setIsDirty(true);
                }}
                disabled={submitting}
              >
                <SelectTrigger className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] bg-white h-8 py-0 min-h-0">
                  <SelectValue placeholder="Ödeme Yöntemi" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="kart">Kart</SelectItem>
                  <SelectItem value="nakit">Nakit</SelectItem>
                  <SelectItem value="havale">Havale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Notlar */}
            <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-gray-50">
              <Input
                placeholder="Notlar..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setIsDirty(true);
                }}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] py-1 h-8 bg-gray-50 text-gray-600 placeholder:text-gray-500"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="px-4 py-3 bg-white sticky bottom-0 z-10">
          <Button 
            type="submit" 
            disabled={submitting || (!isDirty && !customerEditMode && !productEditMode)}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-base font-medium rounded-[6px] transition-all duration-200 h-9"
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                Güncelleniyor...
              </>
            ) : "Güncelle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
