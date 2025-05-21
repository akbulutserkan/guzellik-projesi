"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  compact?: boolean;
  placeholder?: string;
}

const PhoneInput = ({ 
  value, 
  onChange, 
  label = "",
  compact = false,
  placeholder = "Telefon Numarası"
}: PhoneInputProps) => {
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length > 10) return value;
    
    let formatted = '';
    if (cleaned.length > 0) formatted += `(${cleaned.slice(0, 3)}`;
    if (cleaned.length > 3) formatted += `) ${cleaned.slice(3, 6)}`;
    if (cleaned.length > 6) formatted += ` ${cleaned.slice(6, 8)}`;
    if (cleaned.length > 8) formatted += ` ${cleaned.slice(8, 10)}`;
    
    return formatted;
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Eğer en az bir rakam girildiyse ve ilk rakam 5 değilse uyarı ver
    if (cleaned.length > 0 && !cleaned.startsWith('5')) {
      setError('Telefon numarası 5 ile başlamalıdır');
      setIsValid(false);
      return false;
    }
    // 10 rakam girildiyse doğru kabul et
    if (cleaned.length === 10) {
      setError('');
      setIsValid(true);
      return true;
    }
    // Girilen rakam sayısı 10 değilse, eğer kullanıcı veri girmeye başladıysa uzunluk uyarısı ver
    if (cleaned.length > 0) {
      setError('Telefon numarası 10 rakam olmalıdır');
    } else {
      setError('');
    }
    setIsValid(false);
    return false;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    const cleaned = formatted.replace(/\D/g, '');

    if (cleaned.length > 10) return;

    const isValidPhone = validatePhoneNumber(cleaned);
    onChange(formatted, isValidPhone); // formatted numarayı dön
  };

  // Component mount olduğunda veya value değiştiğinde validation yap
  useEffect(() => {
    // Boş bir değer için gereksiz validasyon yapmayı engelle
    if (value && value.trim() !== '') {
      const cleaned = value.replace(/\D/g, '');
      // Sadece telefon numarası formatında bir değer varsa validate et
      const isValidPhone = validatePhoneNumber(cleaned);
      
      // İlk render sırasında gereksiz callback çağrılarını önle
      if (isValidPhone !== isValid) {
        setIsValid(isValidPhone);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (compact) {
    return (
      <>
        <Input
          type="tel"
          value={formatPhoneNumber(value)}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          maxLength={17}
          className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] pl-0 py-1 h-8 ${error ? 'text-red-500' : ''}`}
        />
        {error && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-500">{error}</div>
        )}
      </>
    );
  }
  
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Input
        type="tel"
        value={formatPhoneNumber(value)}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        maxLength={17}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;
