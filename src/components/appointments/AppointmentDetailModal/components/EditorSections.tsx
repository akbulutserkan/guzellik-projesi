"use client";

import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useRef, RefObject, useState } from "react";
import { createPortal } from "react-dom";

interface EditorSectionsProps {
  appointment: any;
  loading: boolean;
  isEditingMode: boolean;
  setIsEditingMode: (value: boolean) => void;
  isEditingPrice: boolean;
  setIsEditingPrice: (value: boolean) => void;
  customPrice: string;
  setCustomPrice: (value: string) => void;
  isServiceDropdownOpen: boolean;
  isStaffDropdownOpen: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  services: any[];
  staffList: any[];
  setEditingAppointmentId: (id: string | null) => void;
  toggleServiceDropdown: () => void;
  toggleStaffDropdown: () => void;
  handlePriceChange: (price: string) => void;
  selectService: (service: any) => void;
  selectStaffMember: (staff: any) => void;
  priceInputRef: RefObject<HTMLInputElement>;
  searchInputRef: RefObject<HTMLInputElement>;
  serviceBtnRef: RefObject<HTMLButtonElement>;
  staffBtnRef: RefObject<HTMLButtonElement>;
  serviceDropdownRef: RefObject<HTMLDivElement>;
  staffDropdownRef: RefObject<HTMLDivElement>;
}

export function ServiceSection({
  appointment,
  isEditingMode,
  setIsEditingMode,
  loading,
  isServiceDropdownOpen,
  searchTerm,
  setSearchTerm,
  services,
  setEditingAppointmentId,
  toggleServiceDropdown,
  selectService,
  serviceBtnRef,
  searchInputRef,
  serviceDropdownRef
}: Partial<EditorSectionsProps>) {
  
  // Bu işlev genellikle bir event handler içinde çağrılır
  const handleServiceItemClick = (service: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    selectService!(service);
  };

  return (
    <div className="relative">
      <button
        ref={serviceBtnRef}
        className="w-full flex items-center justify-between bg-white border-0 rounded-[8px] px-3 py-2 text-left focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        onClick={() => {
          if (!isEditingMode) {
            setIsEditingMode!(true);
            setEditingAppointmentId!(appointment!.id);
          }
          toggleServiceDropdown!();
        }}
        disabled={loading}
      >
        <span className="text-base font-medium flex-1">
          {appointment?.service?.name || "Hizmet seçin"}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
      </button>

      {isServiceDropdownOpen && createPortal(
        <div
          ref={serviceDropdownRef}
          style={{
            position: 'fixed',
            top: serviceBtnRef?.current ? serviceBtnRef.current.getBoundingClientRect().bottom + 2 : '50%',
            left: serviceBtnRef?.current ? serviceBtnRef.current.getBoundingClientRect().left : '50%',
            width: serviceBtnRef?.current ? Math.max(serviceBtnRef.current.offsetWidth, 300) : 300,
            zIndex: 99999,
            maxHeight: '400px',
            pointerEvents: 'auto'
          }}
          className="bg-white border border-gray-300 rounded-[8px] shadow-xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 bg-gray-50 sticky top-0 border-b">
            <div className="flex items-center border rounded-md bg-white px-2 outline-none-all focus-within:outline-none focus-within:border-gray-200">
              <svg
                className="w-5 h-5 text-gray-400 mr-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
              <input 
                type="text" 
                placeholder="Hizmet ara..." 
                className="w-full py-2 px-1 outline-none bg-transparent service-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm!(e.target.value)}
                ref={searchInputRef}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[225px] scrollbar-custom">
            {services
              ?.filter((service) =>
                service.name
                  .toLowerCase()
                  .includes(searchTerm!.toLowerCase())
              ) 
              .map((service) => (
                <div
                  key={service.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer flex justify-between"
                  onClick={(e) => handleServiceItemClick(service, e)}
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-green-600 font-medium">
                    {parseFloat(service.price).toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              ))}
              
            {/* Sonuç yoksa bildir */}
            {services
              ?.filter(s => s.name.toLowerCase().includes(searchTerm!.toLowerCase()))
              .length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                Hizmet bulunamadı
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function PriceSection({
  appointment,
  isEditingMode,
  setIsEditingMode,
  isEditingPrice,
  setIsEditingPrice,
  customPrice,
  setCustomPrice,
  loading,
  setEditingAppointmentId,
  handlePriceChange,
  priceInputRef
}: Partial<EditorSectionsProps>) {
  return (
    <div className="mx-2 w-40 text-left">
      <div className="border-0 rounded-[8px] px-3 py-2 flex items-center relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white shadow-md hover:shadow-lg transition-all"
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        {isEditingPrice ? (
          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
              handlePriceChange!(customPrice!);
            }}
          >
            <input
              type="text"
              inputMode="decimal"
              ref={priceInputRef}
              className="w-full text-[#4F7942] font-medium bg-transparent text-left pr-6 outline-none"
              value={customPrice}
              onChange={(e) => setCustomPrice!(e.target.value)}
              onBlur={() => {
                if (
                  customPrice !==
                  (appointment?.service?.price?.toString() || "")
                ) {
                  handlePriceChange!(customPrice!);
                } else {
                  setIsEditingPrice!(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePriceChange!(customPrice!);
                }
              }}
              autoFocus
            />
          </form>
        ) : (
          <button
            onClick={() => {
              if (!isEditingMode) {
                setIsEditingMode!(true);
                setEditingAppointmentId!(appointment!.id);
              }
              setIsEditingPrice!(true);
            }}
            className="w-full text-left pr-6 text-[#4F7942] font-medium"
            disabled={loading}
          >
            {customPrice ||
              (appointment!.service?.price
                ? parseFloat(appointment!.service.price).toLocaleString(
                    "tr-TR"
                  )
                : "0")}
          </button>
        )}
        <span className="text-[#4F7942] font-medium absolute right-2">
          ₺
        </span>
      </div>
    </div>
  );
}

export function StaffSection({
  appointment,
  isEditingMode,
  setIsEditingMode,
  loading,
  isStaffDropdownOpen,
  staffList,
  setEditingAppointmentId,
  toggleStaffDropdown,
  selectStaffMember,
  staffBtnRef,
  staffDropdownRef
}: Partial<EditorSectionsProps>) {
  
  // Staff item click handler
  const handleStaffItemClick = (staff: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    selectStaffMember!(staff);
  };
  
  return (
    <div className="relative" style={{ width: '140px', minWidth: '140px' }}>
      <button
        ref={staffBtnRef}
        className="w-full flex items-center justify-between bg-white border-0 rounded-[8px] px-3 py-2 text-left focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        onClick={() => {
          if (!isEditingMode) {
            setIsEditingMode!(true);
            setEditingAppointmentId!(appointment!.id);
          }
          toggleStaffDropdown!();
        }}
        disabled={loading}
      >
        <span className="truncate block overflow-hidden text-ellipsis" style={{ maxWidth: 'calc(100% - 20px)' }}>
          {appointment?.staff?.name || "Personel"}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isStaffDropdownOpen && createPortal(
        <div
          ref={staffDropdownRef}
          style={{
            position: 'fixed',
            top: staffBtnRef?.current ? staffBtnRef.current.getBoundingClientRect().bottom + 2 : '50%',
            left: staffBtnRef?.current ? staffBtnRef.current.getBoundingClientRect().left : '50%',
            width: staffBtnRef?.current ? staffBtnRef.current.offsetWidth : 140,
            zIndex: 99999,
            maxHeight: '300px',
            pointerEvents: 'auto'
          }}
          className="bg-white border border-gray-300 rounded-[8px] shadow-xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-y-auto max-h-[225px] scrollbar-custom">
            {/* Tüm personelleri göster (seçili olanı hariç) */}
            {staffList
              ?.filter(staff => staff.id !== appointment?.staffId) // Seçili personeli listeden çıkar
              .map((staff) => (
                <div
                  key={staff.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => handleStaffItemClick(staff, e)}
                >
                  <span className="truncate block overflow-hidden text-ellipsis w-full">{staff.name}</span>
                </div>
              ))
            }
            
            {/* Eğer hiç personel yoksa */}
            {staffList?.length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                Personel bulunamadı
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export const EditorSections = {
  Service: ServiceSection,
  Price: PriceSection,
  Staff: StaffSection
};

export default EditorSections;
