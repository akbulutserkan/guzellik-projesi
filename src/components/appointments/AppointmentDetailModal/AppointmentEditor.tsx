"use client";

import { useRef, memo, useEffect } from "react";
import { useAppointmentEditing } from "./hooks/useAppointmentEditing";
import { EditorSections } from "./components/EditorSections";

interface AppointmentEditorProps {
  appointment: any;
  onUpdate: () => Promise<void>;
  toast: any;
  forceRefresh: () => void;
  updateTotalAmount?: (newPrice: number) => void;
  editingAppointmentId: string | null;
  setEditingAppointmentId: (id: string | null) => void;
  editingSaleId?: string | null;
}

export default memo(function AppointmentEditor({
  appointment,
  toast,
  forceRefresh,
  updateTotalAmount,
  editingAppointmentId,
  setEditingAppointmentId,
  editingSaleId
}: AppointmentEditorProps) {
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const serviceBtnRef = useRef<HTMLButtonElement>(null);
  const staffBtnRef = useRef<HTMLButtonElement>(null);

  // Hook ile state ve fonksiyonları al
  const {
    loading, setLoading,
    isEditingMode, setIsEditingMode,
    isEditingPrice, setIsEditingPrice,
    customPrice, setCustomPrice,
    isServiceDropdownOpen, setIsServiceDropdownOpen,
    isStaffDropdownOpen, setIsStaffDropdownOpen,
    searchTerm, setSearchTerm,
    services, staffList,
    
    exitEditingMode,
    handlePriceChange,
    toggleServiceDropdown,
    toggleStaffDropdown,
    selectService,
    selectStaffMember
  } = useAppointmentEditing({
    appointment,
    updateTotalAmount,
    forceRefresh,
    setEditingAppointmentId,
    toast
  });

  // Search input'a otomatik odaklan
  useEffect(() => {
    if (isServiceDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isServiceDropdownOpen]);

  // Dışarı tıklandığında düzenleme modundan çık
  useEffect(() => {
    if (!isEditingMode) return;

    function handleClickOutside(event: MouseEvent) {
      const isDropdownClick =
        (serviceDropdownRef.current && serviceDropdownRef.current.contains(event.target as Node)) ||
        (staffDropdownRef.current && staffDropdownRef.current.contains(event.target as Node));

      const isPriceInputClick =
        priceInputRef.current && priceInputRef.current.contains(event.target as Node);

      if (editorRef.current && !editorRef.current.contains(event.target as Node) && !isDropdownClick) {
        if (isEditingPrice && customPrice !== (appointment?.service?.price?.toString() || "")) {
          handlePriceChange(customPrice);
        } else {
          exitEditingMode();
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingMode, isEditingPrice, customPrice, appointment?.service?.price, handlePriceChange, exitEditingMode]);

  return (
    <div className="p-2 mb-1 relative" ref={editorRef}>
      {(editingAppointmentId !== null && editingAppointmentId !== appointment.id) || editingSaleId !== null ? (
        <div className="absolute inset-0 flex items-center justify-center cursor-not-allowed backdrop-blur-sm z-10 rounded-lg" style={{ background: 'rgba(0,0,0,0.05)' }} />
      ) : null}
      
      <div className="flex items-center justify-between">
        <div className="flex-1 w-3/4">
          {/* Hizmet Seçici */}
          <EditorSections.Service
            appointment={appointment}
            isEditingMode={isEditingMode}
            setIsEditingMode={setIsEditingMode}
            loading={loading}
            isServiceDropdownOpen={isServiceDropdownOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            services={services}
            setEditingAppointmentId={setEditingAppointmentId}
            toggleServiceDropdown={toggleServiceDropdown}
            selectService={selectService}
            serviceBtnRef={serviceBtnRef}
            searchInputRef={searchInputRef}
            serviceDropdownRef={serviceDropdownRef}
          />
        </div>

        {/* Fiyat Alanı */}
        <EditorSections.Price
          appointment={appointment}
          isEditingMode={isEditingMode}
          setIsEditingMode={setIsEditingMode}
          isEditingPrice={isEditingPrice}
          setIsEditingPrice={setIsEditingPrice}
          customPrice={customPrice}
          setCustomPrice={setCustomPrice}
          loading={loading}
          setEditingAppointmentId={setEditingAppointmentId}
          handlePriceChange={handlePriceChange}
          priceInputRef={priceInputRef}
        />

        {/* Personel Seçici */}
        <EditorSections.Staff
          appointment={appointment}
          isEditingMode={isEditingMode}
          setIsEditingMode={setIsEditingMode}
          loading={loading}
          isStaffDropdownOpen={isStaffDropdownOpen}
          staffList={staffList}
          setEditingAppointmentId={setEditingAppointmentId}
          toggleStaffDropdown={toggleStaffDropdown}
          selectStaffMember={selectStaffMember}
          staffBtnRef={staffBtnRef}
          staffDropdownRef={staffDropdownRef}
        />
      </div>
    </div>
  );
});
