
'use server';

import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import type { PaymentPayload, PaymentMethod, PaymentType, Appointment } from './types';


export async function performPaymentAndUseSessionAction(payload: PaymentPayload) {
    'use server';
    const { groupId, appointmentsInGroup, paymentMethod, ...paymentData } = payload;
    if (!groupId || !paymentMethod) {
        return { success: false, message: "Gerekli ödeme bilgileri eksik." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        await db.runTransaction(async (transaction) => {
            // Check for already completed appointments
            const appointmentRefs = appointmentsInGroup.map(app => db.collection("appointments").doc(app.id));
            const appointmentDocs = await transaction.getAll(...appointmentRefs);
            
            for (const doc of appointmentDocs) {
                if (!doc.exists) throw new Error("İşlem yapılacak randevulardan biri bulunamadı.");
                if (doc.data()?.status === 'completed') throw new Error("Bu randevu grubu zaten kapatılmış.");
            }

            // 1. Mark package sessions as used by decrementing the counter on the sale
            const packageAppointments = appointmentsInGroup.filter(app => app.isPackageSession);
            for (const app of packageAppointments) {
                if (!app.packageSaleId) continue;
                
                const packageSaleRef = db.collection("packageSales").doc(app.packageSaleId);
                transaction.update(packageSaleRef, {
                    remainingSessions: FieldValue.increment(-1)
                });
            }

            // 2. Create payment transaction if there is a payable amount
            if (paymentData.grandTotalAmount > 0) {
                const paymentRef = db.collection("paymentTransactions").doc(); 
                transaction.set(paymentRef, {
                    ...paymentData,
                    appointmentGroupId: groupId, 
                    paymentMethod: paymentMethod,
                    paymentDate: FieldValue.serverTimestamp(),
                    paymentType: 'appointment' as PaymentType, // THIS IS THE CRITICAL FIX
                });
            }

            // 3. Mark all appointments in the group as completed
            appointmentDocs.forEach(doc => {
                transaction.update(doc.ref, { status: "completed" });
            });
        });

        revalidatePath("/takvim");
        revalidatePath("/kasa");
        revalidatePath("/paket-satislar");
        return { success: true, message: "İşlem başarıyla tamamlandı ve randevu kapatıldı." };

    } catch (error: any) {
        console.error("Karma ödeme ve seans kullanımı hatası:", error);
        return { success: false, message: error.message || "İşlem sırasında bir hata oluştu." };
    }
}
