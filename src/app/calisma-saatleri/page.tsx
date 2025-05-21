'use client';

import React, { useState } from 'react';
import WorkingHoursManager from '@/components/working-hours/WorkingHoursManager';
import { useStaff } from '@/hooks/useStaff';

export default function WorkingHoursPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Çalışma Saatleri Yönetimi</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Personel Seçimi (Genel çalışma saatleri için boş bırakın)
          </label>
          <select
            value={selectedStaffId || ''}
            onChange={e => setSelectedStaffId(e.target.value || undefined)}
            className="w-full md:w-1/3 p-2 border rounded"
            disabled={staffLoading}
          >
            <option value="">Genel Çalışma Saatleri</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <WorkingHoursManager staffId={selectedStaffId} />
      </div>
    </div>
  );
}
