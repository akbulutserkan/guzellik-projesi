'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ApiService from '@/services/api';

// Tip tanımlamaları
interface DaySettings {
  enabled: boolean;
  start: string;
  end: string;
}

interface BusinessHours {
  [key: string]: DaySettings;
}

interface Day {
  label: string;
  key: keyof BusinessHours;
}

export function BusinessHoursForm() {
  const [settings, setSettings] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Merkezi API'den verileri al
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await ApiService.settings.getBusinessDays();
        
        if (!response.success) {
          throw new Error(response.error || 'Ayarlar yüklenemedi');
        }
        
        setSettings(response.data);
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        toast.error('Ayarlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      
      // Merkezi API ile güncelleme yap
      const response = await ApiService.settings.updateBusinessDays(settings);
      
      if (!response.success) {
        throw new Error(response.error || 'Ayarlar kaydedilemedi');
      }
      
      // Kullanıcıya bilgi ver
      toast.success('Ayarlar başarıyla kaydedildi');
      
      // Takvim önbelleğini temizle bilgilendirmesi
      toast.success('Takvim güncellemeleri görmek için sayfayı yenileyin', {
        duration: 5000
      });
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDayChange = (day: string, field: keyof DaySettings, value: any) => {
    if (!settings) return;

    setSettings((prev) => ({
      ...prev,
      [day]: {
        ...prev![day],
        [field]: value,
      },
    }));
  };

  const days = [
    { label: 'Pazartesi', key: 'monday' },
    { label: 'Salı', key: 'tuesday' },
    { label: 'Çarşamba', key: 'wednesday' },
    { label: 'Perşembe', key: 'thursday' },
    { label: 'Cuma', key: 'friday' },
    { label: 'Cumartesi', key: 'saturday' },
    { label: 'Pazar', key: 'sunday' },
  ];

  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Veriler yüklenene kadar render etme
  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Ayarlar yüklenemedi. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Çalışma Saatleri</h2>
        <p className="text-sm text-gray-500">İşletmenizin çalışma saatlerini gün gün ayarlayın</p>
      </div>

      {days.map((day) => (
        <div key={day.key} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">{day.label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[day.key]?.enabled || false}
                onChange={(e) => handleDayChange(day.key, 'enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings[day.key]?.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Saati
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings[day.key]?.start || ''}
                  onChange={(e) => handleDayChange(day.key, 'start', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Saati
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings[day.key]?.end || ''}
                  onChange={(e) => handleDayChange(day.key, 'end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          saving
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {saving ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Kaydediliyor...
          </div>
        ) : (
          'Ayarları Kaydet'
        )}
      </button>
    </form>
  );
}