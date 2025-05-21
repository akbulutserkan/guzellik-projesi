'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ApiService from '@/services/api';

interface SystemSettings {
  company_name?: string;
  timezone?: string;
  currency?: string;
  tax_rate?: number;
  receipt_footer?: string;
  default_appointment_duration?: number;
  default_session_duration?: number;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  [key: string]: any;
}

export function SystemSettingsForm() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Merkezi API'den verileri al
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await ApiService.settings.getSystemSettings();
        
        if (!response.success) {
          throw new Error(response.error || 'Sistem ayarları yüklenemedi');
        }
        
        setSettings(response.data);
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        toast.error('Sistem ayarları yüklenemedi');
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
      const response = await ApiService.settings.updateSystemSettings(settings);
      
      if (!response.success) {
        throw new Error(response.error || 'Ayarlar kaydedilemedi');
      }
      
      // Kullanıcıya bilgi ver
      toast.success('Sistem ayarları başarıyla kaydedildi');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Sistem ayarları kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: value
    });
  };

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
        <p className="text-red-500">Sistem ayarları yüklenemedi. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Sistem Ayarları</h2>
        <p className="text-sm text-gray-500">İşletmenizin genel ayarlarını yapılandırın</p>
      </div>

      <div className="space-y-6">
        {/* İşletme Adı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            İşletme Adı
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.company_name || ''}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
          />
        </div>

        {/* Saat Dilimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Saat Dilimi
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.timezone || 'Europe/Istanbul'}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
          >
            <option value="Europe/Istanbul">Istanbul (UTC+03:00)</option>
            <option value="Europe/London">London (UTC+00:00)</option>
            <option value="America/New_York">New York (UTC-05:00)</option>
            <option value="Asia/Dubai">Dubai (UTC+04:00)</option>
            <option value="Asia/Tokyo">Tokyo (UTC+09:00)</option>
          </select>
        </div>

        {/* Para Birimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Para Birimi
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.currency || 'TRY'}
            onChange={(e) => handleInputChange('currency', e.target.value)}
          >
            <option value="TRY">Türk Lirası (₺)</option>
            <option value="USD">Amerikan Doları ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">İngiliz Sterlini (£)</option>
          </select>
        </div>

        {/* Vergi Oranı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vergi Oranı (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.tax_rate || 0}
            onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
          />
        </div>

        {/* Fiş/Fatura Alt Metni */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fiş/Fatura Alt Metni
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={settings.receipt_footer || ''}
            onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
          ></textarea>
        </div>

        {/* Varsayılan Randevu Süresi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Varsayılan Randevu Süresi (dakika)
          </label>
          <input
            type="number"
            min="5"
            step="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.default_appointment_duration || 60}
            onChange={(e) => handleInputChange('default_appointment_duration', parseInt(e.target.value))}
          />
        </div>

        {/* E-posta Bildirimleri */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">E-posta Bildirimleri</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.email_notifications || false}
              onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* SMS Bildirimleri */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">SMS Bildirimleri</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.sms_notifications || false}
              onChange={(e) => handleInputChange('sms_notifications', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="mt-8">
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
      </div>
    </form>
  );
}