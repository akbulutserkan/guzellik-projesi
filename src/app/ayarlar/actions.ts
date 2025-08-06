

'use server';

import { db } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";

export interface DayHours {
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
}

export type BusinessSettings = Record<string, DayHours>; // '0' for Sunday, '1' for Monday...

const SETTINGS_DOC_ID = "businessHours";

const defaultSettings: BusinessSettings = {
    '1': { startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Monday
    '2': { startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Tuesday
    '3': { startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Wednesday
    '4': { startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Thursday
    '5': { startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Friday
    '6': { startTime: '10:00', endTime: '16:00', isWorkingDay: false }, // Saturday
    '0': { startTime: '10:00', endTime: '16:00', isWorkingDay: false }, // Sunday
};


// Get business hours settings
export async function getBusinessHoursAction(): Promise<BusinessSettings> {
    if (!db) {
        console.error("Firestore DB connection not available.");
        return defaultSettings; // Default fallback
    }
    try {
        const docRef = db.collection("settings").doc(SETTINGS_DOC_ID);
        const doc = await docRef.get();

        if (doc.exists) {
            const dbSettings = doc.data();
            return { ...defaultSettings, ...dbSettings } as BusinessSettings;
        } else {
            // If no settings exist, create them with default values
            await docRef.set(defaultSettings);
            console.log("Default business hours have been created in the database.");
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error fetching or creating business hours settings:", error);
        // Return default settings on error
        return defaultSettings;
    }
}

// Update business hours settings
export async function updateBusinessHoursAction(formData: FormData) {
    'use server';
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    const settings: BusinessSettings = {};

    for (const day of Object.keys(defaultSettings)) {
        const isWorkingDay = formData.has(`isWorkingDay_${day}`);
        const startTime = formData.get(`startTime_${day}`) as string;
        const endTime = formData.get(`endTime_${day}`) as string;

        if (isWorkingDay) {
            if (!startTime || !endTime) {
                 return { success: false, message: `${day} için başlangıç ve bitiş saatleri zorunludur.` };
            }
             if (startTime >= endTime) {
                return { success: false, message: `Başlangıç saati, bitiş saatinden önce olmalıdır.` };
            }
        }
        
        settings[day] = {
            isWorkingDay,
            startTime,
            endTime
        };
    }
    
    try {
        const docRef = db.collection("settings").doc(SETTINGS_DOC_ID);
        await docRef.set(settings);
        
        revalidatePath("/ayarlar");
        revalidatePath("/takvim"); // Important: Revalidate calendar page

        return { success: true, message: "İşletme ayarları başarıyla güncellendi." };
    } catch (error) {
        console.error("Error updating business hours settings:", error);
        return { success: false, message: "Ayarlar güncellenirken bir hata oluştu." };
    }
}
