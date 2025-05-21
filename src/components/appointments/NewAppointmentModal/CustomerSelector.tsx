'use client';

import { Input } from "@/components/ui/input";
import { useRef, useEffect } from "react";

interface Customer {
  id: string;
  name: string;
}

interface CustomerSelectorProps {
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  formData: {
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    notes: string;
  }>>;
  filteredCustomers: Customer[];
  handleCustomerSelect: (customer: Customer) => void;
  defaultCustomerId?: string;
}

export default function CustomerSelector({
  customerSearch,
  setCustomerSearch,
  formData,
  setFormData,
  filteredCustomers,
  handleCustomerSelect,
  defaultCustomerId
}: CustomerSelectorProps) {
  // Add reference to input field
  const customerInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus on the customer input when modal opens - only for new appointments, not when adding services
  useEffect(() => {
    // Focus on the input field with a slight delay to ensure modal is fully rendered
    // Sadece müşteri ID'si yoksa (yeni randevu oluşturma durumu) odaklan
    const focusTimer = setTimeout(() => {
      if (customerInputRef.current && !defaultCustomerId && !formData.customerId) {
        customerInputRef.current.focus();
        console.log('Customer input field focused');
      }
    }, 300);
    
    return () => clearTimeout(focusTimer);
  }, [defaultCustomerId, formData.customerId]);
  return (
    <div className="flex-1 relative">
      <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 bg-white">
        <Input
          ref={customerInputRef}
          type="text"
          placeholder="Müşteri adı ile ara..."
          value={customerSearch}
          onChange={(e) => {
            setCustomerSearch(e.target.value);
            setFormData((prev) => ({ ...prev, customerId: "" }));
          }}
          className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] ${
            formData.customerId ? "text-gray-900" : "text-gray-500"
          }`}
          disabled={defaultCustomerId != null} // If defaultCustomerId exists, customer cannot be changed
        />
      </div>
      {customerSearch &&
        filteredCustomers.length > 0 &&
        !formData.customerId && 
        !defaultCustomerId && (
          <div className="fixed z-50 mt-1 w-auto min-w-[500px] bg-white border rounded-[6px] shadow-xl max-h-80 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                onClick={() => handleCustomerSelect(customer)}
              >
                {customer.name}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}