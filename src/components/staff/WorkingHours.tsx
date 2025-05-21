import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface WorkingHoursProps {
  value: DaySchedule[];
  onChange: (hours: DaySchedule[]) => void;
}

// Günlük çalışma saatleri için interface
interface DaySchedule {
  day: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

// Günler
const DAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
];

// Saat seçenekleri
const timeOptions: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  const hourStr = hour.toString().padStart(2, '0');
  timeOptions.push(
    `${hourStr}:00`,
    `${hourStr}:30`
  );
}


const defaultHours: DaySchedule[] = DAYS.map(day => ({
  day: day.value,
  isWorking: true,
  startTime: "09:00",
  endTime: "19:00"
}));

export default function WorkingHours({ value, onChange }: WorkingHoursProps) {

  useEffect(() => {
    // Eğer başlangıçta value boş ise, varsayılan değerleri ata
    if (value.length === 0) {
      onChange(defaultHours);
    }
  }, [value, onChange]);

  const handleDayChange = (dayIndex: number, changes: Partial<DaySchedule>) => {
    const newHours = value.map(day =>
      day.day === dayIndex ? { ...day, ...changes } : day
    );
    onChange(newHours);
  };

  // İşletme Saatleri API Çağrısı
  const fetchBusinessHours = async () => {
    try {
      const response = await fetch('/api/settings/business-days');
      if (response.ok) {
        const data = await response.json();
        // Business days verisini çalışma saatleri formatına dönüştür
        const businessHours = data.map((day: any) => ({
          day: day.dayOfWeek,
          isWorking: day.isWorkingDay,
          startTime: day.startTime || "09:00",
          endTime: day.endTime || "19:00"
        }));
        // İşletme saatlerini form verisi olarak ayarla
        onChange(businessHours);
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
    }
  };

  // İşletme saatlerini kullan butonuna tıklandığında
  const useBusinessHours = async () => {
    await fetchBusinessHours();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Label className="text-sm font-medium">Çalışma Saatleri</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={useBusinessHours}
        >
          İşletme Saatlerini Kullan
        </Button>
      </div>

      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayHours = value.find(h => h.day === day.value) || {
            day: day.value,
            isWorking: false,
            startTime: '09:00',
            endTime: '19:00'
          };

          return (
            <div key={day.value} className="flex items-center space-x-4 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800">
              <div className="w-24">
                <Label>{day.label}</Label>
              </div>

              <Switch
                checked={dayHours.isWorking}
                onCheckedChange={(checked) =>
                  handleDayChange(day.value, { isWorking: checked })
                }
              />

              {dayHours.isWorking && (
                <>
                  <Select
                    value={dayHours.startTime}
                    onValueChange={(time) => handleDayChange(day.value, { startTime: time })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Başlangıç" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span>-</span>

                  <Select
                    value={dayHours.endTime}
                    onValueChange={(time) => handleDayChange(day.value, { endTime: time })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Bitiş" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}