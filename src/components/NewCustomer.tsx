"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/PhoneInput";
import { Label } from "@/components/ui/label";

interface NewCustomerProps {
  onNewCustomer: (customer: any) => void;
}

const NewCustomer = ({ onNewCustomer }: NewCustomerProps) => {
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleNewCustomer = async () => {
    const name = newCustomerName.trim();

    if (!name || !isPhoneValid) {
      alert("Lütfen tüm alanları doğru şekilde doldurun.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          phone: newCustomerPhone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.existingCustomer) {
          setError(`Bu telefon numarası ile kayıtlı müşteri bulunmaktadır: ${data.existingCustomer.name}`);
          return;
        }
        throw new Error(data.error || "Müşteri eklenemedi");
      }

      onNewCustomer(data);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setError("");
    } catch (error) {
      console.error("Müşteri ekleme hatası:", error);
      setError(error instanceof Error ? error.message : "Müşteri eklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value: string, isValid: boolean) => {
    setNewCustomerPhone(value);
    setIsPhoneValid(isValid);
  };
  
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Ad Soyad</Label>
          <Input
            type="text"
            placeholder="Ad Soyad"
            className="w-full"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <PhoneInput
            value={newCustomerPhone}
            onChange={handlePhoneChange}
          />
        </div>
        <div className="col-span-2">
          <Button
            className="w-full"
            onClick={handleNewCustomer}
            disabled={isLoading}
          >
            {isLoading ? "Ekleniyor..." : "Müşteriyi Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewCustomer;