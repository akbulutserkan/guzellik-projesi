'use client';

import React, { useEffect, useState } from 'react';
import { useWorkingHours, WorkingHour, BusinessHour } from '@/hooks/useWorkingHours';

const daysOfWeek = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

export default function WorkingHoursManager({ staffId }: { staffId?: string }) {
  const {
    workingHours,
    businessHours,
    exceptions,
    loading,
    error,
    fetchWorkingHours,
    fetchWorkingHoursByStaff,
    createWorkingHour,
    updateWorkingHour,
    deleteWorkingHour,
    fetchBusinessHours,
    fetchExceptions
  } = useWorkingHours();

  const [selectedDay, setSelectedDay] = useState<number>(1); // Pazartesi
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Veri yükleme
  useEffect(() => {
    if (staffId) {
      fetchWorkingHoursByStaff(staffId);
    } else {
      fetchWorkingHours();
    }
    fetchBusinessHours();
    fetchExceptions();
  }, [staffId, fetchWorkingHours, fetchWorkingHoursByStaff, fetchBusinessHours, fetchExceptions]);

  // Belirli bir gün için çalışma saatlerini filtrele
  const getWorkingHoursForDay = (day: number) => {
    return workingHours.filter(wh => wh.dayOfWeek === day && (!staffId || wh.staffId === staffId));
  };

  // İşletmenin çalışma günü olup olmadığını kontrol et
  const isBusinessDay = (day: number) => {
    const businessDay = businessHours.find(bh => bh.dayOfWeek === day);
    return businessDay?.isOpen || false;
  };

  // Yeni çalışma saati ekle
  const handleAddWorkingHour = async () => {
    if (!isBusinessDay(selectedDay)) {
      alert('Seçilen gün işletme çalışma günü değil.');
      return;
    }

    await createWorkingHour({
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      isActive,
      staffId: staffId || null
    });
  };

  // Çalışma saati sil
  const handleDeleteWorkingHour = async (id: string) => {
    if (confirm('Bu çalışma saatini silmek istediğinize emin misiniz?')) {
      await deleteWorkingHour(id);
    }
  };

  // Çalışma saatinin aktiflik durumunu değiştir
  const handleToggleActive = async (workingHour: WorkingHour) => {
    await updateWorkingHour(workingHour.id, {
      isActive: !workingHour.isActive
    });
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;
  if (error) return <div className="p-4 text-red-500">Hata: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        {staffId ? 'Personel Çalışma Saatleri' : 'Genel Çalışma Saatleri'}
      </h1>

      {/* Çalışma saati ekleme formu */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Yeni Çalışma Saati Ekle</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gün</label>
            <select 
              value={selectedDay}
              onChange={e => setSelectedDay(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              {daysOfWeek.map((day, index) => (
                <option 
                  key={index} 
                  value={index}
                  disabled={!isBusinessDay(index)}
                >
                  {day} {!isBusinessDay(index) && '(Kapalı)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Başlangıç Saati</label>
            <input 
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bitiş Saati</label>
            <input 
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddWorkingHour}
              disabled={loading}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Çalışma saatleri tablosu */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Mevcut Çalışma Saatleri</h2>
        
        {daysOfWeek.map((day, dayIndex) => {
          const dayWorkingHours = getWorkingHoursForDay(dayIndex);
          if (dayWorkingHours.length === 0) return null;
          
          return (
            <div key={dayIndex} className="mb-4">
              <h3 className="font-medium">{day}</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlangıç
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bitiş
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dayWorkingHours.map(workingHour => (
                      <tr key={workingHour.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {workingHour.startTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {workingHour.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 py-1 text-xs rounded-full ${
                              workingHour.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {workingHour.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleToggleActive(workingHour)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={loading}
                          >
                            {workingHour.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          </button>
                          <button
                            onClick={() => handleDeleteWorkingHour(workingHour.id)}
                            className="text-red-600 hover:text-red-900 ml-2"
                            disabled={loading}
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        
        {workingHours.length === 0 && (
          <div className="text-gray-500 py-4">Henüz çalışma saati tanımlanmamış.</div>
        )}
      </div>

      {/* İstisnalar bölümü */}
      {exceptions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">İstisnalar (Tatiller vb.)</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exceptions.map(exception => (
                  <tr key={exception.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(exception.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      {exception.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          exception.isWorkingDay 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {exception.isWorkingDay ? 'Çalışma Günü' : 'Tatil'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
