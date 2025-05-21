'use client';

import { Button } from "@/components/ui/button";

interface FormActionsProps {
  handleSubmit: () => Promise<void>;
  loading: boolean;
  appointment?: any;
  defaultCustomerId?: string;
}

export default function FormActions({
  handleSubmit,
  loading,
  appointment,
  defaultCustomerId
}: FormActionsProps) {
  return (
    <Button
      type="button"
      onClick={handleSubmit}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium rounded-[6px] transition-all duration-200"
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
          Kaydediliyor...
        </div>
      ) : (
        appointment ? "Güncelle" : (defaultCustomerId ? "Hizmet Ekle" : "Randevu Oluştur")
      )}
    </Button>
  );
}