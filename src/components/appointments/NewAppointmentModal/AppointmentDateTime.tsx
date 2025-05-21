'use client';

import { Input } from "@/components/ui/input";

interface AppointmentDateTimeProps {
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
}

export default function AppointmentDateTime({
  formData,
  setFormData
}: AppointmentDateTimeProps) {
  return (
    <div className="flex-1 relative">
      <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 bg-white">
        <Input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, startTime: e.target.value }))
          }
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[6px] text-gray-900"
        />
      </div>
    </div>
  );
}