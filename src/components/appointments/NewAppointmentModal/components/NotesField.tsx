'use client';

interface NotesFieldProps {
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

export default function NotesField({ formData, setFormData }: NotesFieldProps) {
  return (
    <div className="relative">
      <div className="flex items-center border rounded-[6px] focus-within:ring-2 focus-within:ring-blue-500 bg-white">
        <input
          type="text"
          placeholder="Notlar..."
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          className={`w-full h-10 px-3 py-2 border-0 focus:outline-none rounded-[6px] ${
            formData.notes ? "text-gray-900" : "text-gray-500"
          }`}
        />
      </div>
    </div>
  );
}