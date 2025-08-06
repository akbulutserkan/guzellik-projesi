


'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { getServicesAction, getCategoriesAction, type Service, type Category } from "../hizmetler/actions";

export interface Package {
    id: string;
    name: string;
    price: number;
    sessionCount: number;
    serviceIds: string[];
    serviceNames: string[];
    categoryId: string; // Kategori ID'si eklendi
    createdAt: Date;
}

export interface PackagesByCategory {
    [categoryId: string]: Category & { packages: Package[] }
}

export interface CustomerPackageInfo {
    saleId: string;
    packageId: string;
    packageName: string;
    remainingSessions: number;
    totalSessions: number;
    personnelId: string;
    price: number;
    serviceIds: string[];
}


// Helper to check for duplicate packages
const checkForDuplicatePackage = async (serviceIds: string[], sessionCount: number, currentPackageId?: string): Promise<boolean> => {
    if (!db) return false;
    // Sort IDs to ensure consistent comparison
    const sortedServiceIds = [...serviceIds].sort();

    let query = db.collection("packages")
                  .where("serviceIds", "==", sortedServiceIds)
                  .where("sessionCount", "==", sessionCount);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
        return false;
    }

    // If editing, make sure the found duplicate is not the package itself
    if (currentPackageId) {
        const isSelf = querySnapshot.docs.some(doc => doc.id === currentPackageId);
        // If the only match is the package itself, it's not a duplicate.
        // If there are other matches, it's a duplicate.
        return querySnapshot.size > 1 || !isSelf;
    }
    
    // If adding, any result is a duplicate
    return !querySnapshot.empty;
};


// Paketleri kategori bazında gruplanmış şekilde çek
export async function getGroupedPackagesAction(): Promise<PackagesByCategory> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getGroupedPackagesAction)");
      return {};
    }
    try {
        const [packagesSnapshot, categories] = await Promise.all([
            db.collection("packages").orderBy("createdAt", "desc").get(),
            getCategoriesAction()
        ]);
        
        const packages = packagesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                price: data.price,
                sessionCount: data.sessionCount || 1,
                serviceIds: data.serviceIds || [],
                serviceNames: data.serviceNames || [],
                categoryId: data.categoryId,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Package;
        });

        const packagesByCategory = categories.reduce((acc, category) => {
            acc[category.id] = {
                ...category,
                packages: packages.filter(p => p.categoryId === category.id)
            };
            return acc;
        }, {} as PackagesByCategory);

        return packagesByCategory;

    } catch (error) {
      console.error("Paketler çekilirken hata:", error);
      return {};
    }
}


// Paket Ekle
export async function performAddPackageAction(formData: FormData) {
    'use server';
    console.log("[LOG][performAddPackageAction] Fonksiyon başlatıldı. Gelen form verisi:", Object.fromEntries(formData.entries()));
    const priceStr = formData.get("price") as string;
    const sessionCountStr = formData.get("sessionCount") as string;
    const serviceIds = formData.getAll("serviceIds") as string[];

    if (!priceStr || !sessionCountStr || serviceIds.length === 0) {
        return { success: false, message: "Fiyat, Seans Sayısı ve en az bir hizmet seçimi zorunludur." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    const price = parseFloat(priceStr);
    const sessionCount = parseInt(sessionCountStr, 10);
    
    if (isNaN(price) || price < 0) return { success: false, message: "Geçersiz fiyat." };
    if (isNaN(sessionCount) || sessionCount <= 0) return { success: false, message: "Geçersiz seans sayısı." };

    const isDuplicate = await checkForDuplicatePackage(serviceIds, sessionCount);
    if (isDuplicate) {
        return { success: false, message: "Bu hizmetleri ve seans sayısını içeren bir paket zaten mevcut." };
    }
    
    const allServices = await getServicesAction();
    const selectedServices = allServices.filter(s => serviceIds.includes(s.id));

    if (selectedServices.length !== serviceIds.length) {
        return { success: false, message: "Seçilen hizmetlerden bazıları geçersiz." };
    }

    const serviceNames = selectedServices.map(s => s.name);
    const name = `${serviceNames.join(", ")} Paketi (${sessionCount} Seans)`;
    const categoryId = selectedServices[0]?.categoryId;
    if(!categoryId) {
        return { success: false, message: "Pakete dahil edilen hizmetlerin kategorisi bulunamadı." };
    }

    const packageData = {
        name,
        price,
        sessionCount,
        serviceIds: [...serviceIds].sort(),
        serviceNames,
        categoryId,
        createdAt: Timestamp.now()
    };
    
    try {
        console.log("[LOG][performAddPackageAction] Veritabanına yazılacak paket verisi:", packageData);
        await db.collection("packages").add(packageData);
        console.log("[LOG][performAddPackageAction] Paket başarıyla veritabanına eklendi.");
        revalidatePath("/paketler");
        return { success: true, message: `${name} adlı paket başarıyla oluşturuldu.` };
    } catch (error) {
        console.error("Paket kaydetme hatası:", error);
        return { success: false, message: "Paket veritabanına kaydedilemedi." };
    }
}


// Paket Güncelle (Sadece Fiyat ve Seans)
export async function performUpdatePackageAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string | undefined;
    const priceStr = formData.get("price") as string;
    const sessionCountStr = formData.get("sessionCount") as string;

    if (!id) {
        return { success: false, message: "Paket ID'si düzenleme için gerekli." };
    }
    if (!priceStr || !sessionCountStr) {
        return { success: false, message: "Fiyat ve Seans Sayısı zorunludur." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    const price = parseFloat(priceStr);
    const sessionCount = parseInt(sessionCountStr, 10);
    
    if (isNaN(price) || price < 0) return { success: false, message: "Geçersiz fiyat." };
    if (isNaN(sessionCount) || sessionCount <= 0) return { success: false, message: "Geçersiz seans sayısı." };

    const packageRef = db.collection("packages").doc(id);
    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
        return { success: false, message: "Güncellenecek paket bulunamadı." };
    }
    const existingData = packageDoc.data() as Package;

    const isDuplicate = await checkForDuplicatePackage(existingData.serviceIds, sessionCount, id);
    if (isDuplicate) {
        return { success: false, message: "Aynı hizmetleri içeren ve bu seans sayısına sahip başka bir paket zaten mevcut." };
    }

    const name = `${existingData.serviceNames.join(", ")} Paketi (${sessionCount} Seans)`;

    const packageUpdateData = {
        name,
        price,
        sessionCount,
    };
    
    try {
        await packageRef.update(packageUpdateData);
        revalidatePath("/paketler");
        return { success: true, message: "Paket başarıyla güncellendi." };
    } catch (error) {
        console.error("Paket güncelleme hatası:", error);
        return { success: false, message: "Paket güncellenemedi." };
    }
}


// Paket Sil
export async function performDeletePackageAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Paket ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        await db.collection("packages").doc(id).delete();
        revalidatePath("/paketler");
        return { success: true, message: "Paket başarıyla silindi." };
    } catch (error) {
        console.error("Paket silme hatası:", error);
        return { success: false, message: "Paket silinemedi." };
    }
}

export async function getCustomerPackagesAction(customerId: string): Promise<CustomerPackageInfo[]> {
     if (!customerId || !db) {
        return [];
    }
    try {
        const { getCustomerPackagesAction: getCustomerPackageSales } = await import('../paket-satislar/actions');
        return await getCustomerPackageSales(customerId);
    } catch (error) {
        console.error("Müşteri paketleri çekilirken hata:", error);
        return [];
    }
}

    
