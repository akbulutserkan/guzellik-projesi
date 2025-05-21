'use client';

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface ModalFooterProps {
  loading: boolean;
  attendanceStatus: string;
  handleStatusChange: (status: string) => void;
  confirmNoShow: () => void;
  handlePaymentSave: () => Promise<void>;
  setShowCancelConfirm: (show: boolean) => void;
  isDropdownOpen?: boolean;
  editingSaleId?: string | null;
}

export default function ModalFooter({
  loading,
  attendanceStatus,
  handleStatusChange,
  confirmNoShow,
  handlePaymentSave,
  setShowCancelConfirm,
  isDropdownOpen = false,
  editingSaleId = null
}: ModalFooterProps) {
  return (
    <DialogFooter className={`px-4 py-3 bg-white flex flex-col sm:flex-row gap-2 rounded-b-xl ${isDropdownOpen || editingSaleId ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Geldi/Belirtilmemiş/Gelmedi Butonları */}
      <div className="flex gap-2 w-full sm:w-auto">
        <Button 
          onClick={() => handleStatusChange('showed')} 
          className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
            attendanceStatus === 'showed' 
              ? 'bg-[#85BB65] hover:bg-[#6DA554] text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          disabled={loading}
        >
          Geldi
        </Button>
        <Button 
          onClick={() => {
            // Direkt olarak durum değişikliği isteği gönder
            const event = new CustomEvent('status_change_requested', {
              detail: { status: 'unspecified' }
            });
            document.dispatchEvent(event);
          }} 
          className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
            attendanceStatus === 'unspecified' 
              ? 'bg-gray-500 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          disabled={loading}
        >
          Belirtilmemiş
        </Button>
        <Button 
          onClick={() => confirmNoShow()} 
          className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
            attendanceStatus === 'noshow' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          disabled={loading}
        >
          Gelmedi
        </Button>
      </div>

      {/* Orta Boşluk - Flexbox ile otomatik genişler */}
      <div className="flex-grow"></div>

      {/* İptal veya Tahsilat Butonu */}
      {attendanceStatus === 'showed' ? (
        <Button
          variant="default"
          className="px-4 py-1 rounded-xl text-sm font-medium bg-[#85BB65] hover:bg-[#6DA554] text-white"
          onClick={handlePaymentSave}
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : 'Tahsilatı Kaydet'}
        </Button>
      ) : (
        <Button
          variant="destructive"
          className="px-4 py-1 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setShowCancelConfirm(true)}
          disabled={loading}
        >
          İptal
        </Button>
      )}
    </DialogFooter>
  );
}
