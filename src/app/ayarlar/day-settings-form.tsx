
"use client";

import { useState } from "react";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DayHours } from "./actions";

interface DaySettingsFormProps {
    day: { id: string, label: string };
    settings: DayHours;
}

export function DaySettingsForm({ day, settings }: DaySettingsFormProps) {
    const [isWorking, setIsWorking] = useState(settings.isWorkingDay);

    return (
        <div 
            className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors",
                isWorking ? "bg-card" : "bg-muted/50"
            )}
        >
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <CustomSwitch
                    id={`isWorkingDay_${day.id}`}
                    name={`isWorkingDay_${day.id}`}
                    checked={isWorking}
                    onCheckedChange={setIsWorking}
                />
                <Label htmlFor={`isWorkingDay_${day.id}`} className="text-lg font-medium w-24 cursor-pointer">
                    {day.label}
                </Label>
            </div>
            <div className={cn(
                "flex items-center gap-4 transition-opacity", 
                isWorking ? "opacity-100" : "opacity-50 pointer-events-none"
            )}>
                <div className="flex flex-col">
                    <Input
                        id={`startTime_${day.id}`}
                        name={`startTime_${day.id}`}
                        type="time"
                        defaultValue={settings.startTime}
                        className="h-10 rounded-md shadow-md w-32"
                        disabled={!isWorking}
                        aria-label="Başlangıç Saati"
                    />
                </div>
                <div className="flex flex-col">
                    <Input
                        id={`endTime_${day.id}`}
                        name={`endTime_${day.id}`}
                        type="time"
                        defaultValue={settings.endTime}
                        className="h-10 rounded-md shadow-md w-32"
                        disabled={!isWorking}
                        aria-label="Bitiş Saati"
                    />
                </div>
            </div>
        </div>
    );
}
