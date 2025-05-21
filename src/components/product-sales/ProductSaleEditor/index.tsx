"use client";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { AppointmentEventBus } from '@/components/appointments/AppointmentDetailModal/hooks/useAppointmentModal';
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { createPortal } from "react-dom";

interface ProductSaleEditorProps {
  sale: any;
  toast: any;
  forceRefresh: () => void;
  editingSaleId: string | null;
  setEditingSaleId: (id: string | null) => void;
  loading: boolean;
  editingAppointmentId?: string | null;
}

export default memo(function ProductSaleEditor({
  sale,
  toast,
  forceRefresh,
  editingSaleId,
  setEditingSaleId,
  loading,
  editingAppointmentId
}: ProductSaleEditorProps) {
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState(
    sale?.totalPrice ? sale.totalPrice.toString() : ""
  );
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Dropdown referansları
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const productBtnRef = useRef<HTMLButtonElement>(null);
  const staffBtnRef = useRef<HTMLButtonElement>(null);

  // Fiyat değişikliği işleme
  const handlePriceChange = useCallback(
    async (newPrice: string) => {
      // Fiyat değişmemişse işlem yapmaya gerek yok
      if (newPrice === (sale?.totalPrice?.toString() || "")) {
        setIsEditingPrice(false);
        setIsEditingMode(false);
        setEditingSaleId(null);
        return;
      }

      setCustomPrice(newPrice);
      try {
        const price = parseFloat(newPrice);
        if (isNaN(price)) return;

        console.log(
          "Ürün fiyatı güncelleniyor:",
          price,
          "Satış ID:",
          sale.id
        );

        const response = await fetch(`/api/product-sales/${sale.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalPrice: price
          }),
        });

        console.log("API yanıt durumu:", response.status);
        const responseData = await response.json();
        console.log("API yanıt verisi:", responseData);

        if (!response.ok) {
          throw new Error("Fiyat güncellenemedi");
        }

        toast({
          title: "Başarılı",
          description: "Ürün fiyatı güncellendi",
        });

        // Yerel state'te fiyatı güncelleyelim
        sale.totalPrice = price;

        // Düzenleme modundan çık
        setIsEditingMode(false);
        setEditingSaleId(null);
        // Personel güncellendiğinde event bus ile bildir
      if (sale.customerId) {
        AppointmentEventBus.publish('product_sale_updated', { customerId: sale.customerId });
      }

      forceRefresh();
      } catch (error) {
        console.error("Fiyat güncelleme hatası:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Fiyat güncellenirken bir hata oluştu.",
        });
      } finally {
        setIsEditingPrice(false);
      }
    },
    [sale, toast, forceRefresh, setEditingSaleId]
  );

  // Ürünleri getirme
  const fetchProducts = useCallback(async () => {
    try {
      // MCP API ile ürünleri getir
      console.log('MCP API ile ürünleri getiriyorum...');
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            name: 'get-products',
            arguments: { context: 'sales' }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error("Ürünler getirilemedi");
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Ürünler getirilemedi");
      }
      
      // API yanıtını işle
      let productsData = [];
      if (result.data && Array.isArray(result.data)) {
        productsData = result.data;
      } else if (result.content && result.content[0] && result.content[0].text) {
        try {
          productsData = JSON.parse(result.content[0].text);
          if (productsData.data && Array.isArray(productsData.data)) {
            productsData = productsData.data;
          }
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      setProducts(productsData);
      console.log(`${productsData.length} ürün MCP API'den yüklendi`);
      
      // Yeni veriyi önbelleğe al
      try {
        localStorage.setItem('all_products', JSON.stringify(productsData));
      } catch (e) {
        console.error('Ürünleri önbelleğe alma hatası:', e);
      }
    } catch (error) {
      console.error("Ürünleri getirme hatası:", error);
      
      // Hata durumunda önbellekten yüklemeyi dene
      const cachedProducts = localStorage.getItem('all_products');
      if (cachedProducts) {
        try {
          const parsedProducts = JSON.parse(cachedProducts);
          if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
            console.log(`${parsedProducts.length} önbelleklenmiş ürün kullanılıyor`);
            setProducts(parsedProducts);
          }
        } catch (e) {
          console.error('Önbellekten ürün yükleme hatası:', e);
        }
      }
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ürünler getirilemedi.",
      });
    }
  }, [toast]);

  // Personel listesini getir
  const fetchStaffList = useCallback(async () => {
    try {
      // Önce önbellekten yükle
      const cachedStaff = localStorage.getItem('all_staff');
      if (cachedStaff) {
        try {
          const parsedStaff = JSON.parse(cachedStaff);
          if (Array.isArray(parsedStaff) && parsedStaff.length > 0) {
            console.log(`${parsedStaff.length} önbelleklenmiş personel kullanılıyor`);
            setStaffList(parsedStaff);
            return;
          }
        } catch (e) {
          console.error('Önbellekten personel yükleme hatası:', e);
        }
      }

      // Zaten yüklenmiş personel listesi varsa tekrar yükleme
      if (staffList.length > 0) {
        return;
      }

      console.log('MCP API ile personel listesini getiriyorum...');
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            name: 'get-authorized-staff',
            arguments: {}
          }
        })
      });
      
      if (!response.ok) {
        throw new Error("Personel listesi getirilemedi");
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Personel listesi getirilemedi");
      }
      
      // API yanıtını işle
      let staffData = [];
      if (result.data && Array.isArray(result.data)) {
        staffData = result.data;
      } else if (result.data && result.data.activeStaff && Array.isArray(result.data.activeStaff)) {
        staffData = result.data.activeStaff;
      } else if (result.content && result.content[0] && result.content[0].text) {
        try {
          const parsedData = JSON.parse(result.content[0].text);
          if (parsedData.data && Array.isArray(parsedData.data)) {
            staffData = parsedData.data;
          } else if (parsedData.data && parsedData.data.activeStaff && Array.isArray(parsedData.data.activeStaff)) {
            staffData = parsedData.data.activeStaff;
          }
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      setStaffList(staffData);
      console.log(`${staffData.length} personel MCP API'den yüklendi`);
      
      // Yeni veriyi önbelleğe al
      try {
        localStorage.setItem('all_staff', JSON.stringify(staffData));
      } catch (e) {
        console.error('Personel verilerini önbelleğe alma hatası:', e);
      }
    } catch (error) {
      console.error("Personel listesi getirme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel listesi getirilemedi.",
      });
    }
  }, [staffList.length, toast]);

  // Düzenleme modundan çıkma
  useEffect(() => {
    if (!isEditingMode) return;

    function handleClickOutside(event: MouseEvent) {
      const isDropdownClick =
        (productDropdownRef.current &&
          productDropdownRef.current.contains(event.target as Node)) ||
        (staffDropdownRef.current &&
          staffDropdownRef.current.contains(event.target as Node));

      const isPriceInputClick =
        priceInputRef.current &&
        priceInputRef.current.contains(event.target as Node);

      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node) &&
        !isDropdownClick
      ) {
        if (
          isEditingPrice &&
          customPrice !== (sale?.totalPrice?.toString() || "")
        ) {
          handlePriceChange(customPrice);
        } else {
          setIsEditingMode(false);
          setEditingSaleId(null);
          setIsProductDropdownOpen(false);
          setIsStaffDropdownOpen(false);
          setIsEditingPrice(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isEditingMode,
    isEditingPrice,
    customPrice,
    setEditingSaleId,
    sale?.totalPrice,
    handlePriceChange,
  ]);

  // Dropdown durumu değişikliklerini izleyen useEffect
  useEffect(() => {
    // Dropdown durumu değiştiğinde custom event yayınla
    const isAnyDropdownOpen = isProductDropdownOpen || isStaffDropdownOpen || isEditingPrice;
    
    // Custom event oluştur ve yayınla
    const dropdownEvent = new CustomEvent('appointmentDropdownToggled', {
      detail: { isOpen: isAnyDropdownOpen }
    });
    document.dispatchEvent(dropdownEvent);
    
  }, [isProductDropdownOpen, isStaffDropdownOpen, isEditingPrice]);

  // Ürün dropdown'ını aç/kapat
  const toggleProductDropdown = () => {
    // Eğer dropdown zaten açıksa ve kapatılıyorsa
    if (isProductDropdownOpen) {
      setIsProductDropdownOpen(false);
      setIsEditingMode(false);
      setEditingSaleId(null);
      return;
    }
    
    // Dropdown açılıyorsa
    if (!isProductDropdownOpen) {
      fetchProducts();
      // Dropdown açıldığında arama input'una odaklan
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
    
    setIsProductDropdownOpen(true);
    setIsStaffDropdownOpen(false); // Diğer dropdown'u kapat
  };

  // Personel dropdown'ını aç/kapat
  const toggleStaffDropdown = () => {
    // Eğer dropdown zaten açıksa ve kapatılıyorsa
    if (isStaffDropdownOpen) {
      setIsStaffDropdownOpen(false);
      setIsEditingMode(false);
      setEditingSaleId(null);
      return;
    }

    // Dropdown açılıyorsa personelleri getir
    if (!isStaffDropdownOpen) {
      fetchStaffList();
    }
    
    setIsStaffDropdownOpen(true);
    setIsProductDropdownOpen(false); // Diğer dropdown'u kapat
  };

  // Ürün seçme
  const selectProduct = async (product: any) => {
    try {
      if (!product || !product.id) {
        console.error("Hatalı ürün verisi:", product);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Ürün verisi eksik veya hatalı.",
        });
        return;
      }

      setLoading(true);
      console.log("Ürün güncelleniyor:", product.name, "ID:", product.id);
      
      // API'ye gönderilecek verileri doğrudan productId kullanarak hazırlayalım
      const response = await fetch(`/api/product-sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: sale.quantity || 1,
          unitPrice: parseFloat(product.price || 0),
          totalPrice: parseFloat(product.price || 0) * (sale.quantity || 1),
          paymentType: sale.paymentType || "CASH",
          paymentStatus: sale.paymentStatus || "PENDING",
          productId: product.id  // Ürün ID'sini burada doğrudan ekledik
        }),
      });

      // API yanıtını kontrol et
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ürün güncellenemedi");
      }

      const updatedSale = await response.json();
      console.log("Güncellenmiş satış:", updatedSale);
      
      toast({
        title: "Başarılı",
        description: "Ürün güncellendi",
      });

      // Lokal state güncellemesi
      setCustomPrice(product.price?.toString() || "0");
      sale.productId = product.id;
      sale.productName = product.name;
      sale.unitPrice = parseFloat(product.price || 0);
      sale.totalPrice = parseFloat(product.price || 0) * (sale.quantity || 1);

      // Dropdown'u kapat
      setIsProductDropdownOpen(false);
      setSearchTerm("");
      setIsEditingMode(false);
      setEditingSaleId(null);
      
      // Ürün satışı güncellendiğini event bus ile bildir
      if (sale.customerId) {
        AppointmentEventBus.publish('product_sale_updated', { customerId: sale.customerId });
        
        // Ayrıca document event'i de tetikle (eski yöntem uyumluluğu için)
        const updateEvent = new CustomEvent('product_sale_updated', {
          detail: { customerId: sale.customerId }
        });
        document.dispatchEvent(updateEvent);
      }

      // Yenile
      forceRefresh();
    } catch (error) {
      console.error("Ürün güncelleme hatası:", error);
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürün güncellenirken bir hata oluştu.",
      });
      
      // Hata durumunda da UI elementlerini sıfırla
      setIsProductDropdownOpen(false);
      setIsEditingMode(false);
      setEditingSaleId(null);
      setSearchTerm("");
    } finally {
      setLoading(false);
    }
  };

  // Personel seçme
  const selectStaffMember = async (staff: any) => {
    try {
      const response = await fetch(`/api/product-sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          staffId: staff.id,
          staffName: staff.name
        }),
      });

      if (!response.ok) {
        throw new Error("Personel güncellenemedi");
      }

      toast({
        title: "Başarılı",
        description: "Personel güncellendi",
      });

      // Dropdown'u kapat
      setIsStaffDropdownOpen(false);
      setIsEditingMode(false);
      setEditingSaleId(null);

      // Local state'i güncelle ama düzenleme modundan çıkma
      sale.staffId = staff.id;
      sale.staffName = staff.name;
      
      forceRefresh();
    } catch (error) {
      console.error("Personel güncelleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel güncellenirken bir hata oluştu.",
      });
    }
  };

  return (
    <div
      className="p-2 mb-1 relative"
      ref={editorRef}
    >
      {(editingSaleId !== null && editingSaleId !== sale.id) || editingAppointmentId !== null ? (
          <div className="absolute inset-0 flex items-center justify-center cursor-not-allowed backdrop-blur-sm z-10 rounded-lg" style={{ background: 'rgba(0,0,0,0.05)' }}>
            {/* Düzenleme yapmadığımız satırlarda blur efekti */}
          </div>
        ) : null}
      <div className="flex items-center justify-between">
        {/* Ürün Seçici */}
        <div className="flex-1 w-3/4 relative">
          <button
            ref={productBtnRef}
            className="w-full flex items-center justify-between bg-white border-0 rounded-[8px] px-3 py-2 text-left focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            onClick={() => {
              if (!isEditingMode) {
                setIsEditingMode(true);
                setEditingSaleId(sale.id);
              }
              toggleProductDropdown();
            }}
            disabled={loading}
          >
            <span className="text-base font-medium flex-1">
              {sale.productName || "Ürün seçin"}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>

          {isProductDropdownOpen && createPortal(
            <div
              ref={productDropdownRef}
              style={{
                position: 'fixed',
                top: productBtnRef.current ? productBtnRef.current.getBoundingClientRect().bottom + 2 : '50%',
                left: productBtnRef.current ? productBtnRef.current.getBoundingClientRect().left : '50%',
                width: productBtnRef.current ? productBtnRef.current.offsetWidth : 300,
                zIndex: 99999,
                maxHeight: '300px',
              }}
              className="bg-white border border-gray-300 rounded-[8px] shadow-xl overflow-y-auto"
            >
              <div className="p-2 bg-gray-50 sticky top-0 flex items-center border-b">
                <div className="flex items-center w-full border rounded-md bg-white px-2 outline-none-all focus-within:outline-none focus-within:border-gray-200">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
                    />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Ürün ara..." 
                    className="w-full p-2 outline-none bg-transparent service-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Ürün Listesi */}
              <div className="overflow-y-auto max-h-[225px] scrollbar-custom">
              {/* Seçili ürün gösterimi kaldırıldı */}
                
                {/* Filtrelenmiş ürünleri listele */}
                {products
                  .filter((product) =>
                    product.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .filter(product => product.id !== sale.productId) // Seçili ürünü listeden çıkar
                  .map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                      onClick={() => selectProduct(product)}
                    >
                      <span>{product.name}</span>
                      <span className="text-green-600">
                        {parseFloat(product.price).toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  ))
                }
                
                {/* Sonuç yoksa bildir */}
                {products
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .length === 0 && (
                  <div className="p-2 text-gray-500 text-center">
                    Ürün bulunamadı
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Fiyat Kısmı */}
        <div className="mx-2 w-40 text-left">
          <div className="border-0 rounded-[8px] px-3 py-2 flex items-center relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white shadow-md hover:shadow-lg transition-all"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            {isEditingPrice ? (
              <form
                className="w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePriceChange(customPrice);
                }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  ref={priceInputRef}
                  className="w-full text-[#4F7942] font-medium bg-transparent text-left pr-6 outline-none"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  onBlur={() => {
                    if (
                      customPrice !==
                      (sale?.totalPrice?.toString() || "")
                    ) {
                      handlePriceChange(customPrice);
                      // Fiyat güncellendiğinde event bus ile bildir
                      if (sale.customerId) {
                        AppointmentEventBus.publish('product_sale_updated', { customerId: sale.customerId });
                      }
                    } else {
                      setIsEditingPrice(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePriceChange(customPrice);
                    }
                  }}
                  autoFocus
                />
              </form>
            ) : (
              <button
                onClick={() => {
                  if (!isEditingMode) {
                    setIsEditingMode(true);
                    setEditingSaleId(sale.id);
                  }
                  setIsEditingPrice(true);
                }}
                className="w-full text-left pr-6 text-[#4F7942] font-medium"
                disabled={loading}
              >
                {customPrice || parseFloat(sale.totalPrice || "0").toLocaleString("tr-TR")}
              </button>
            )}
            <span className="text-[#4F7942] font-medium absolute right-2">
              ₺
            </span>
          </div>
        </div>

        {/* Personel Seçici */}
        <div className="relative" style={{ width: '140px', minWidth: '140px' }}>
          <button
            ref={staffBtnRef}
            className="w-full flex items-center justify-between bg-white border-0 rounded-[8px] px-3 py-2 text-left focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            onClick={() => {
              if (!isEditingMode) {
                setIsEditingMode(true);
                setEditingSaleId(sale.id);
              }
              toggleStaffDropdown();
            }}
            disabled={loading}
          >
            <span className="truncate block overflow-hidden text-ellipsis" style={{ maxWidth: 'calc(100% - 20px)' }}>
              {sale.staffName || "Personel"}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </button>

          {isStaffDropdownOpen && createPortal(
            <div
              ref={staffDropdownRef}
              style={{
                position: 'fixed',
                top: staffBtnRef.current ? staffBtnRef.current.getBoundingClientRect().bottom + 2 : '50%',
                left: staffBtnRef.current ? staffBtnRef.current.getBoundingClientRect().left : '50%',
                width: staffBtnRef.current ? staffBtnRef.current.offsetWidth : 140,
                zIndex: 99999,
                maxHeight: '300px',
              }}
              className="bg-white border border-gray-300 rounded-[8px] shadow-xl overflow-y-auto"
            >
              <div className="overflow-y-auto max-h-[225px] scrollbar-custom">
                {/* Seçili personel gösterimi kaldırıldı */}
                
                {/* Tüm personelleri göster (seçili olanı hariç) */}
                {staffList
                  .filter(staff => staff.id !== sale.staffId) // Seçili personeli listeden çıkar
                  .map((staff) => (
                    <div
                      key={staff.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectStaffMember(staff)}
                    >
                      <span className="truncate block overflow-hidden text-ellipsis w-full">
                        {staff.name}
                      </span>
                    </div>
                  ))
                }
                
                {/* Eğer hiç personel yoksa */}
                {staffList.length === 0 && (
                  <div className="p-2 text-gray-500 text-center">
                    Personel bulunamadı
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
})