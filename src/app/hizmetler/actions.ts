

'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { formatTitleCase, formatUpperCase } from "@/lib/utils";

export interface Category {
    id: string;
    name: string;
    createdAt: Date;
}

export interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
    categoryId: string;
    categoryName: string;
    createdAt: Date;
}

// Kategorileri çek
export async function getCategoriesAction(): Promise<Category[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getCategoriesAction)");
      return [];
    }
    try {
      const categoriesSnapshot = await db.collection("serviceCategories").orderBy("createdAt", "desc").get();
      const categories = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Category;
      });
      return categories;
    } catch (error) {
      console.error("Kategoriler çekilirken hata:", error);
      return [];
    }
}

// Kategori Ekle
export async function addCategoryAction(formData: FormData) {
  'use server';
  const nameRaw = formData.get("name") as string;

  if (!nameRaw) {
    return { success: false, message: "Kategori adı boş olamaz." };
  }
  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
  
  const name = formatUpperCase(nameRaw);

  try {
    const category = { name, createdAt: Timestamp.now() };
    await db.collection("serviceCategories").add(category);
    revalidatePath("/hizmetler");
    return { success: true, message: `${name} adlı kategori başarıyla eklendi.` };
  } catch (error) {
    console.error("Kategori kaydetme hatası:", error);
    return { success: false, message: "Kategori veritabanına kaydedilemedi." };
  }
}

// Kategori Güncelle
export async function updateCategoryAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    const newNameRaw = formData.get("name") as string;

    if (!id || !newNameRaw) {
        return { success: false, message: "Kategori ID'si ve yeni ad gerekli." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    const newName = formatUpperCase(newNameRaw);

    try {
        const categoryRef = db.collection("serviceCategories").doc(id);
        const servicesQuery = db.collection("services").where("categoryId", "==", id);

        await db.runTransaction(async (transaction) => {
            // 1. Update the category name
            transaction.update(categoryRef, { name: newName });

            // 2. Find and update all services with the new category name
            const servicesSnapshot = await transaction.get(servicesQuery);
            servicesSnapshot.docs.forEach(doc => {
                const serviceRef = db.collection("services").doc(doc.id);
                transaction.update(serviceRef, { categoryName: newName });
            });
        });

        revalidatePath("/hizmetler");
        return { success: true, message: "Kategori ve ilişkili hizmetler başarıyla güncellendi." };
    } catch (error) {
        console.error("Kategori güncelleme hatası:", error);
        return { success: false, message: "Kategori güncellenemedi." };
    }
}

// Kategori Sil
export async function deleteCategoryAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Kategori ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        const servicesSnapshot = await db.collection("services").where("categoryId", "==", id).limit(1).get();

        if (!servicesSnapshot.empty) {
            return { success: false, message: "Bu kategoriye atanmış hizmetler var. Önce hizmetleri silin veya başka bir kategoriye atayın." };
        }

        await db.collection("serviceCategories").doc(id).delete();
        revalidatePath("/hizmetler");
        return { success: true, message: "Kategori başarıyla silindi." };
    } catch (error) {
        console.error("Kategori silme hatası:", error);
        return { success: false, message: "Kategori silinemedi." };
    }
}


// Hizmetleri çek
export async function getServicesAction(): Promise<Service[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getServicesAction)");
      return [];
    }
    try {
      const servicesSnapshot = await db.collection("services").orderBy("createdAt", "desc").get();
      const services = servicesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            price: data.price,
            duration: data.duration,
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Service;
      });
      return services;
    } catch (error) {
      console.error("Hizmetler çekilirken hata:", error);
      return [];
    }
}

// Hizmet Ekle
export async function performAddServiceAction(formData: FormData) {
  'use server';
  const nameRaw = formData.get("name") as string;
  const priceStr = formData.get("price") as string;
  const durationStr = formData.get("duration") as string;
  const categoryId = formData.get("categoryId") as string;

  if (!nameRaw || !priceStr || !durationStr || !categoryId) {
    return { success: false, message: "Lütfen tüm alanları doldurun." };
  }
  
  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
  
  const allCategories = await getCategoriesAction();
  const categoryInfo = allCategories.find(c => c.id === categoryId);
  if (!categoryInfo) {
      return { success: false, message: "Geçersiz kategori seçimi." };
  }
  
  const name = formatTitleCase(nameRaw);
  const price = parseFloat(priceStr);
  const duration = parseInt(durationStr, 10);

  if (isNaN(price) || price < 0) return { success: false, message: "Geçersiz fiyat." };
  if (isNaN(duration) || duration <= 0) return { success: false, message: "Geçersiz süre. Süre 0'dan büyük olmalıdır." };

  try {
    const existingServiceQuery = await db.collection("services").where("name", "==", name).limit(1).get();
    if (!existingServiceQuery.empty) {
        return { success: false, message: "Bu isimde bir hizmet zaten mevcut." };
    }
    
    const service = { 
        name, 
        price, 
        duration, 
        categoryId,
        categoryName: categoryInfo.name, // The category name is already formatted
        createdAt: Timestamp.now() 
    };
    await db.collection("services").add(service);
    revalidatePath("/hizmetler");
    return { success: true, message: `${name} adlı hizmet başarıyla eklendi.` };
  } catch (error) {
    console.error("Veritabanına kaydetme hatası:", error);
    return { success: false, message: "Hizmet veritabanına kaydedilemedi." };
  }
}

// Hizmet Güncelle
export async function performUpdateServiceAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    const nameRaw = formData.get("name") as string;
    const priceStr = formData.get("price") as string;
    const durationStr = formData.get("duration") as string;
    const categoryId = formData.get("categoryId") as string;

    if (!id || !nameRaw || !priceStr || !durationStr || !categoryId) {
        return { success: false, message: "Lütfen tüm alanları doldurun." };
    }
    
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    const allCategories = await getCategoriesAction();
    const categoryInfo = allCategories.find(c => c.id === categoryId);
    if (!categoryInfo) {
      return { success: false, message: "Geçersiz kategori seçimi." };
    }

    const name = formatTitleCase(nameRaw);
    const price = parseFloat(priceStr);
    const duration = parseInt(durationStr, 10);

    if (isNaN(price) || price < 0) return { success: false, message: "Geçersiz fiyat." };
    if (isNaN(duration) || duration <= 0) return { success: false, message: "Geçersiz süre. Süre 0'dan büyük olmalıdır." };
    
    try {
        const serviceRef = db.collection("services").doc(id);
        const serviceDoc = await serviceRef.get();
        if (!serviceDoc.exists) {
            throw new Error("Hizmet bulunamadı.");
        }
        const oldCategoryId = serviceDoc.data()?.categoryId;

        // 1. Update the service itself
        await serviceRef.update({ 
            name, 
            price, 
            duration, 
            categoryId, 
            categoryName: categoryInfo.name 
        });

        // 2. If the category has changed, update related packages
        if (oldCategoryId && oldCategoryId !== categoryId) {
            const packagesToUpdateQuery = db.collection("packages").where("serviceIds", "array-contains", id);
            const packagesToUpdateSnapshot = await packagesToUpdateQuery.get();
            
            if (!packagesToUpdateSnapshot.empty) {
                const batch = db.batch();
                packagesToUpdateSnapshot.docs.forEach(doc => {
                    const packageRef = db.collection("packages").doc(doc.id);
                    // Check if all services in the package belong to the new category.
                    // This is a simplified approach assuming a package belongs to the category of its first service.
                    // A more robust solution might be needed for complex scenarios.
                    batch.update(packageRef, { categoryId: categoryId });
                });
                await batch.commit();
            }
        }

        revalidatePath("/hizmetler");
        revalidatePath("/paketler"); // Revalidate packages page as well
        return { success: true, message: "Hizmet ve ilişkili paketler başarıyla güncellendi." };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { success: false, message: "Hizmet güncellenemedi." };
    }
}


// Hizmet Sil
export async function performDeleteServiceAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Hizmet ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        await db.collection("services").doc(id).delete();
        revalidatePath("/hizmetler");
        return { success: true, message: "Hizmet başarıyla silindi." };
    } catch (error) {
        console.error("Silme hatası:", error);
        return { success: false, message: "Hizmet silinemedi." };
    }
}
