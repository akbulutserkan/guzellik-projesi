"use client"

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "@/hooks/utility";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";
import { registerLocale, setDefaultLocale } from "react-datepicker";

registerLocale("tr", tr);
setDefaultLocale("tr");

export type DateRange = { startDate: Date | null; endDate: Date | null };

interface PackageSalesDateFilterProps {
  initialDates: DateRange;
  onDateFilterChange: (dateRange: { startDate: string; endDate: string }) => void;
}

export default function PackageSalesDateFilter({ initialDates, onDateFilterChange }: PackageSalesDateFilterProps) {
  const [showDatePresets, setShowDatePresets] = useState(false);
  const [showCustomDateInput, setShowCustomDateInput] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>(initialDates);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(initialDates);
  const datePresetsRef = useRef<HTMLDivElement>(null);
  const prevInitialDatesRef = useRef<DateRange>(initialDates);

  // Only update state if initialDates prop changes
  useEffect(() => {
    const startDateChanged = initialDates.startDate?.getTime() !== prevInitialDatesRef.current.startDate?.getTime();
    const endDateChanged = initialDates.endDate?.getTime() !== prevInitialDatesRef.current.endDate?.getTime();
    
    if (startDateChanged || endDateChanged) {
      setCurrentDateRange(initialDates);
      setTempDateRange(initialDates);
      prevInitialDatesRef.current = initialDates;
    }
  }, [initialDates]);

  const currentPreset = useMemo(() => determinePreset(currentDateRange), [currentDateRange]);
  const buttonText = useMemo(() => {
    if (currentPreset === "custom") {
      if (currentDateRange.startDate && currentDateRange.endDate) {
        return `${formatDate(currentDateRange.startDate)} - ${formatDate(currentDateRange.endDate)}`;
      }
      return "Özel";
    }
    return getPresetsLabel(currentPreset);
  }, [currentPreset, currentDateRange]);

  const handleDatePreset = useCallback((preset: string) => {
    if (preset === "custom") {
      setShowCustomDateInput(true);
      setShowDatePresets(false);
      return;
    }
    
    const newDateRange = calculateDateRange(preset);
    setCurrentDateRange(newDateRange);
    setShowDatePresets(false);
    
    // Only call onDateFilterChange if the dates actually changed
    const startDate = newDateRange.startDate?.toISOString().split("T")[0] || "";
    const endDate = newDateRange.endDate?.toISOString().split("T")[0] || "";
    onDateFilterChange({ startDate, endDate });
  }, [onDateFilterChange]);

  const handleApplyCustomDates = useCallback(() => {
    setCurrentDateRange(tempDateRange);
    setShowCustomDateInput(false);
    
    const startDate = tempDateRange.startDate?.toISOString().split("T")[0] || "";
    const endDate = tempDateRange.endDate?.toISOString().split("T")[0] || "";
    onDateFilterChange({ startDate, endDate });
  }, [tempDateRange, onDateFilterChange]);

  useClickOutside(datePresetsRef, () => setShowDatePresets(false));

  return (
    <div className="mb-4 flex gap-4 items-center">
      <div className="relative">
        <button
          onClick={() => setShowDatePresets(!showDatePresets)}
          className="border rounded p-2 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          {buttonText}
          <ChevronDown className={`w-4 h-4 transition-transform ${showDatePresets ? "rotate-180" : ""}`} />
        </button>
        {showDatePresets && (
          <div ref={datePresetsRef} className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 z-10 w-48">
            {["today", "yesterday", "thisMonth", "lastMonth", "custom"].map((preset) => (
              <button
                key={preset}
                onClick={() => handleDatePreset(preset)}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors"
              >
                {getPresetsLabel(preset)}
              </button>
            ))}
          </div>
        )}
      </div>
      {showCustomDateInput && (
        <div className="flex gap-2 items-center">
          <DatePicker
            selected={tempDateRange.startDate}
            onChange={(date: Date | null) => setTempDateRange((prev) => ({ ...prev, startDate: date }))}
            dateFormat="yyyy-MM-dd"
            className="border rounded p-2"
            placeholderText="Başlangıç"
            selectsStart
            startDate={tempDateRange.startDate}
            endDate={tempDateRange.endDate}
            locale="tr"
            shouldCloseOnSelect
          />
          <span>-</span>
          <DatePicker
            selected={tempDateRange.endDate}
            onChange={(date: Date | null) => setTempDateRange((prev) => ({ ...prev, endDate: date }))}
            dateFormat="yyyy-MM-dd"
            className="border rounded p-2"
            placeholderText="Bitiş"
            selectsEnd
            startDate={tempDateRange.startDate}
            endDate={tempDateRange.endDate}
            minDate={tempDateRange.startDate || undefined}
            locale="tr"
            shouldCloseOnSelect
          />
          <button
            onClick={handleApplyCustomDates}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Uygula
          </button>
          <button
            onClick={() => {
              setTempDateRange(currentDateRange);
              setShowCustomDateInput(false);
            }}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            İptal
          </button>
        </div>
      )}
    </div>
  );
}

function getPresetsLabel(preset: string): string {
  const labels: Record<string, string> = {
    today: "Bugün",
    yesterday: "Dün",
    thisMonth: "Bu Ay",
    lastMonth: "Geçen Ay",
    custom: "Özel",
  };
  return labels[preset] || "Tarih Seçin";
}

function calculateDateRange(preset: string): DateRange {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const today = new Date(Date.UTC(utcYear, utcMonth, utcDate));
  today.setUTCHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { startDate: today, endDate: today };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setUTCDate(today.getUTCDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }
    case "thisMonth": {
      const startDate = new Date(Date.UTC(utcYear, utcMonth, 1));
      const endDate = new Date(Date.UTC(utcYear, utcMonth + 1, 0));
      endDate.setUTCHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
    case "lastMonth": {
      const lastMonthYear = utcMonth === 0 ? utcYear - 1 : utcYear;
      const lastMonth = utcMonth === 0 ? 11 : utcMonth - 1;
      const startDate = new Date(Date.UTC(lastMonthYear, lastMonth, 1));
      const endDate = new Date(Date.UTC(lastMonthYear, lastMonth + 1, 0));
      endDate.setUTCHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
    default:
      return { startDate: null, endDate: null };
  }
}

function determinePreset(dateRange: DateRange): string {
  if (!dateRange.startDate || !dateRange.endDate) return "custom";
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);

  if (isToday(start) && isToday(end)) return "today";
  if (isYesterday(start) && isYesterday(end)) return "yesterday";
  if (isThisMonth(start) && isThisMonth(end) && isFirstDayOfMonth(start) && isLastDayOfMonth(end)) return "thisMonth";
  if (isLastMonth(start) && isLastMonth(end) && isFirstDayOfMonth(start) && isLastDayOfMonth(end)) return "lastMonth";
  return "custom";
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

function isThisMonth(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function isLastMonth(date: Date): boolean {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth();
}

function isFirstDayOfMonth(date: Date): boolean {
  return date.getDate() === 1;
}

function isLastDayOfMonth(date: Date): boolean {
  const test = new Date(date);
  test.setDate(test.getDate() + 1);
  return test.getDate() === 1;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}