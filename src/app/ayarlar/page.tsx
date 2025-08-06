
"use client";

import { Button } from "@/components/ui/button";
import { getBusinessHoursAction, updateBusinessHoursAction, type BusinessSettings } from "./actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DaySettingsForm } from "./day-settings-form";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


const daysOfWeek = [
    { id: '1', label: 'Pazartesi' },
    { id: '2', label: 'Salı' },
    { id: '3', label: 'Çarşamba' },
    { id: '4', label: 'Perşembe' },
    { id: '5', label: 'Cuma' },
    { id: '6', label: 'Cumartesi' },
    { id: '0', label: 'Pazar' },
];

export default function AyarlarPage() {
    const [settings, setSettings] = useState<BusinessSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        getBusinessHoursAction().then(data => {
            setSettings(data);
            setIsLoading(false);
        });
    }, []);

    const handleFormAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateBusinessHoursAction(formData);
            if (result.success) {
                toast({
                    title: "Başarılı",
                    description: result.message,
                });
            } else {
                toast({
                    title: "Hata",
                    description: result.message,
                    variant: "destructive",
                });
            }
        });
    };

    if (isLoading || !settings) {
        return (
             <>
                 <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            </>
        )
    }

    return (
        <>
            <Card className="max-w-4xl mx-auto">
                 <form action={handleFormAction}>
                    <CardHeader>
                        <CardTitle>Çalışma Saatleri ve Günleri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {daysOfWeek.map(day => (
                            <DaySettingsForm key={day.id} day={day} settings={settings[day.id]} />
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </>
    );
}
