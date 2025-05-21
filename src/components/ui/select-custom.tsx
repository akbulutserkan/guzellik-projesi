import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Özel bir seçici bileşen
export function SelectWithEllipsis({ 
  value, 
  onValueChange, 
  items, 
  placeholder = "Seçin", 
  disabled = false,
  className = "",
  labelKey = "name",
  valueKey = "id"
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`${className} w-full`}>
        <div style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          maxWidth: '100%' 
        }}>
          {value && items ? 
            items.find(item => item[valueKey] === value)?.[labelKey] || placeholder : 
            placeholder
          }
        </div>
      </SelectTrigger>
      <SelectContent>
        {items && items.map((item) => (
          <SelectItem key={item[valueKey]} value={item[valueKey]}>
            {item[labelKey]}
          </SelectItem>
        ))}
        {(!items || items.length === 0) && (
          <SelectItem disabled value="none">
            Seçenek yok
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
