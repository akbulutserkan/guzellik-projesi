

'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue, Transaction } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { formatTitleCase } from "@/lib/utils";

export interface StockEntry {
    id: string;
    purchaseDate: Date;
    purchasePrice: number;
    sellingPrice: number;
    initialQuantity: number; // The original quantity when the stock was added
    remainingQuantity: number; // The quantity left after sales
}
export interface Product {
    id: string;
    name: string;
    stock: number; // This will be the sum of remainingQuantity
    notes?: string;
    createdAt: Date;
    latestSellingPrice?: number; // Dynamically added
}

// Ürünleri ve stok toplamlarını çek
export async function getProductsAction(): Promise<Product[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getProductsAction)");
      return [];
    }
    try {
      const productsSnapshot = await db.collection("products").orderBy("createdAt", "desc").get();
      
      const productsWithStock = await Promise.all(productsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        const stockEntriesSnapshot = await db.collection("products").doc(doc.id).collection("stockEntries").orderBy("purchaseDate", "desc").get();
        const totalStock = stockEntriesSnapshot.docs.reduce((sum, entryDoc) => sum + (entryDoc.data().remainingQuantity || 0), 0);
        
        const latestSellingPriceEntry = stockEntriesSnapshot.docs.find(doc => (doc.data().remainingQuantity || 0) > 0);
        const latestSellingPrice = latestSellingPriceEntry ? latestSellingPriceEntry.data().sellingPrice : 
                                   (!stockEntriesSnapshot.empty ? stockEntriesSnapshot.docs[0].data().sellingPrice : undefined);


        return {
          id: doc.id,
          name: data.name,
          stock: totalStock,
          notes: data.notes,
          createdAt: (data.createdAt as Timestamp).toDate(),
          latestSellingPrice: latestSellingPrice,
        } as Product;
      }));

      return productsWithStock;

    } catch (error) {
      console.error("Ürünler çekilirken hata:", error);
      return [];
    }
}

// Belirli bir ürünün stok girişlerini çek
export async function getStockEntriesAction(productId: string): Promise<StockEntry[]> {
    if (!db) {
        console.error("Firestore veritabanı bağlantısı mevcut değil. (getStockEntriesAction)");
        return [];
    }
    try {
        const stockEntriesSnapshot = await db.collection("products").doc(productId).collection("stockEntries").orderBy("purchaseDate", "desc").get();
        const stockEntries = stockEntriesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                purchaseDate: (data.purchaseDate as Timestamp).toDate(),
                purchasePrice: data.purchasePrice,
                sellingPrice: data.sellingPrice,
                initialQuantity: data.initialQuantity,
                remainingQuantity: data.remainingQuantity
            } as StockEntry;
        });
        return stockEntries;
    } catch (error) {
        console.error("Stok girişleri çekilirken hata:", error);
        return [];
    }
}


// Ürün Ekle (Sadece ana ürün bilgisi, stoksuz)
export async function performAddProductAction(formData: FormData) {
  'use server';
  const nameRaw = formData.get("name") as string;
  const notes = formData.get("notes") as string || "";

  if (!nameRaw) {
    return { success: false, message: "Lütfen ürün adını girin." };
  }

  const name = formatTitleCase(nameRaw);
  
  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

  try {
    const existingProductQuery = await db.collection("products").where("name", "==", name).limit(1).get();
    if (!existingProductQuery.empty) {
        return { success: false, message: "Bu isimde bir ürün zaten mevcut." };
    }

    const productData = { 
        name, 
        notes,
        createdAt: Timestamp.now()
    };
    await db.collection("products").add(productData);
    revalidatePath("/urunler");
    return { success: true, message: `${name} adlı ürün başarıyla eklendi.` };
  } catch (error) {
    console.error("Veritabanına kaydetme hatası:", error);
    return { success: false, message: "Ürün veritabanına kaydedilemedi." };
  }
}

// Yeni Stok Girişi Ekleme
export async function performAddStockAction(formData: FormData) {
    'use server';
    const productId = formData.get("productId") as string;
    const purchasePriceStr = formData.get("purchasePrice") as string;
    const sellingPriceStr = formData.get("sellingPrice") as string;
    const quantityStr = formData.get("quantity") as string;
    const purchaseDateStr = formData.get("purchaseDate") as string;

    if (!productId || !purchasePriceStr || !sellingPriceStr || !quantityStr || !purchaseDateStr) {
        return { success: false, message: "Tüm alanlar zorunludur." };
    }

    const purchasePrice = parseFloat(purchasePriceStr);
    const sellingPrice = parseFloat(sellingPriceStr);
    const quantity = parseInt(quantityStr, 10);
    const purchaseDate = new Date(purchaseDateStr);

    if (isNaN(purchasePrice) || purchasePrice < 0) return { success: false, message: "Geçersiz alış fiyatı." };
    if (isNaN(sellingPrice) || sellingPrice < 0) return { success: false, message: "Geçersiz satış fiyatı." };
    if (isNaN(quantity) || quantity <= 0) return { success: false, message: "Geçersiz miktar. Miktar 0'dan büyük olmalıdır." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const stockEntry = {
            purchasePrice,
            sellingPrice,
            initialQuantity: quantity,
            remainingQuantity: quantity,
            purchaseDate: Timestamp.fromDate(purchaseDate)
        };
        await db.collection("products").doc(productId).collection("stockEntries").add(stockEntry);
        
        revalidatePath("/urunler");
        revalidatePath("/urun-satislar");

        return { success: true, message: "Stok girişi başarıyla kaydedildi." };
    } catch (error) {
        console.error("Stok girişi kaydetme hatası:", error);
        return { success: false, message: "Stok girişi veritabanına kaydedilemedi." };
    }
}


// Ürün Güncelle (Sadece ana bilgiler)
export async function performUpdateProductAction(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    const nameRaw = formData.get("name") as string;
    const notes = formData.get("notes") as string || "";

    if (!id || !nameRaw ) {
        return { success: false, message: "Lütfen ürün adını girin." };
    }

    const name = formatTitleCase(nameRaw);

    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        const updateData = { name, notes };
        await db.collection("products").doc(id).update(updateData);
        revalidatePath("/urunler");
        revalidatePath("/urun-satislar");
        return { success: true, message: "Ürün başarıyla güncellendi." };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { success: false, message: "Ürün güncellenemedi." };
    }
}


// Ürün Sil (Alt koleksiyonla birlikte)
export async function performDeleteProductAction(id: string) {
    'use server';
    if (!id) return { success: false, message: "Ürün ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const productRef = db.collection("products").doc(id);
        const stockEntriesSnapshot = await productRef.collection("stockEntries").get();

        const batch = db.batch();

        stockEntriesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        batch.delete(productRef);

        await batch.commit();

        revalidatePath("/urunler");
        revalidatePath("/urun-satislar");
        return { success: true, message: "Ürün ve tüm stok kayıtları başarıyla silindi." };
    } catch (error) {
        console.error("Silme hatası:", error);
        return { success: false, message: "Ürün silinemedi." };
    }
}

// Satış için stok düşme işlemi (FIFO mantığı varsayımıyla ilk giren stoktan düşer)
export async function decreaseStockForSale(productId: string, quantityToSell: number, transaction: Transaction) {
    const stockEntriesRef = db.collection('products').doc(productId).collection('stockEntries').orderBy('purchaseDate', 'asc');
    const stockEntriesSnapshot = await transaction.get(stockEntriesRef);

    let remainingToSell = quantityToSell;
    let totalStock = 0;
    
    const availableEntries = stockEntriesSnapshot.docs.filter(doc => (doc.data().remainingQuantity || 0) > 0);
    
    availableEntries.forEach(doc => {
        totalStock += (doc.data().remainingQuantity || 0);
    });

    if (totalStock < quantityToSell) {
        throw new Error(`Yetersiz stok. Kalan toplam stok: ${totalStock}`);
    }

    for (const doc of availableEntries) {
        if (remainingToSell <= 0) break;

        const entry = doc.data();
        const currentQuantity = entry.remainingQuantity || 0;
        
        if (currentQuantity >= remainingToSell) {
            transaction.update(doc.ref, { remainingQuantity: currentQuantity - remainingToSell });
            remainingToSell = 0;
        } else {
            transaction.update(doc.ref, { remainingQuantity: 0 });
            remainingToSell -= currentQuantity;
        }
    }
}

// Satış modalı için en güncel ürün detaylarını (stok ve fiyat) çeker
export async function getProductDetailsAction(productId: string): Promise<{ stock: number, sellingPrice: number } | null> {
    if (!productId || !db) return null;

    try {
        const stockEntriesSnapshot = await db.collection("products").doc(productId).collection("stockEntries").orderBy("purchaseDate", "desc").get();
        
        const totalStock = stockEntriesSnapshot.docs.reduce((sum, entryDoc) => sum + (entryDoc.data().remainingQuantity || 0), 0);
        
        const latestSellingPriceEntry = stockEntriesSnapshot.docs.find(doc => (doc.data().remainingQuantity || 0) > 0);
        const latestSellingPrice = latestSellingPriceEntry ? latestSellingPriceEntry.data().sellingPrice : 0;

        return {
            stock: totalStock,
            sellingPrice: latestSellingPrice
        };
    } catch (error) {
        console.error("Ürün detayları çekilirken hata:", error);
        return null;
    }
}

// Stok Girişini Güncelleme
export async function performUpdateStockEntryAction(formData: FormData) {
    'use server';
    const productId = formData.get("productId") as string;
    const stockEntryId = formData.get("stockEntryId") as string;
    const purchasePriceStr = formData.get("purchasePrice") as string;
    const sellingPriceStr = formData.get("sellingPrice") as string;
    const quantityStr = formData.get("quantity") as string;
    const purchaseDateStr = formData.get("purchaseDate") as string;

    if (!productId || !stockEntryId || !purchasePriceStr || !sellingPriceStr || !quantityStr || !purchaseDateStr) {
        return { success: false, message: "Tüm alanlar zorunludur." };
    }

    const purchasePrice = parseFloat(purchasePriceStr);
    const sellingPrice = parseFloat(sellingPriceStr);
    const quantity = parseInt(quantityStr, 10);
    const purchaseDate = new Date(purchaseDateStr);

    if (isNaN(purchasePrice) || purchasePrice < 0) return { success: false, message: "Geçersiz alış fiyatı." };
    if (isNaN(sellingPrice) || sellingPrice < 0) return { success: false, message: "Geçersiz satış fiyatı." };
    if (isNaN(quantity) || quantity < 0) return { success: false, message: "Geçersiz miktar." }; // Allow 0 quantity
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const stockEntryRef = db.collection("products").doc(productId).collection("stockEntries").doc(stockEntryId);
        
        // Önce mevcut dokümanı alıp kalan miktarı koruyalım
        const doc = await stockEntryRef.get();
        if (!doc.exists) {
            return { success: false, message: "Güncellenecek stok girişi bulunamadı." };
        }
        const existingData = doc.data() as StockEntry;
        const difference = quantity - existingData.initialQuantity;
        const newRemainingQuantity = existingData.remainingQuantity + difference;

        if (newRemainingQuantity < 0) {
            return { success: false, message: "Stok miktarı, satılan miktardan daha az olamaz." };
        }

        const stockEntryUpdate = {
            purchasePrice,
            sellingPrice,
            initialQuantity: quantity,
            remainingQuantity: newRemainingQuantity,
            purchaseDate: Timestamp.fromDate(purchaseDate)
        };
        
        await stockEntryRef.update(stockEntryUpdate);
        
        revalidatePath("/urunler");
        revalidatePath("/urun-satislar");

        return { success: true, message: "Stok girişi başarıyla güncellendi." };
    } catch (error) {
        console.error("Stok girişi güncelleme hatası:", error);
        return { success: false, message: "Stok girişi güncellenemedi." };
    }
}

// Stok Girişini Silme
export async function performDeleteStockEntryAction(productId: string, stockEntryId: string) {
    'use server';
    if (!productId || !stockEntryId) {
        return { success: false, message: "Gerekli ID'ler eksik." };
    }
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };

    try {
        const stockEntryRef = db.collection("products").doc(productId).collection("stockEntries").doc(stockEntryId);
        const doc = await stockEntryRef.get();
        if (doc.exists) {
            const data = doc.data() as StockEntry;
            if (data.initialQuantity !== data.remainingQuantity) {
                return { success: false, message: "Bu stok girişinden satış yapıldığı için silinemez. Stoğu düzenleyerek 0 yapabilirsiniz." };
            }
        }

        await stockEntryRef.delete();
        
        revalidatePath("/urunler");
        revalidatePath("/urun-satislar");

        return { success: true, message: "Stok girişi başarıyla silindi." };
    } catch (error) {
        console.error("Stok girişi silme hatası:", error);
        return { success: false, message: "Stok girişi silinemedi." };
    }
}

// Satış iptalinde stoğu geri ekleme
export async function increaseStockAfterSaleCancellation(productId: string, quantityToReturn: number, transaction: Transaction) {
    const stockEntriesRef = db.collection('products').doc(productId).collection('stockEntries').orderBy('purchaseDate', 'desc'); // En son alımdan başlayarak iade et
    const stockEntriesSnapshot = await transaction.get(stockEntriesRef);

    let remainingToReturn = quantityToReturn;

    for (const doc of stockEntriesSnapshot.docs) {
        if (remainingToReturn <= 0) break;

        const entry = doc.data() as StockEntry;
        const currentRemaining = entry.remainingQuantity || 0;
        const capacity = entry.initialQuantity - currentRemaining;

        const amountToReturnToThisEntry = Math.min(remainingToReturn, capacity);

        if (amountToReturnToThisEntry > 0) {
            transaction.update(doc.ref, { remainingQuantity: currentRemaining + amountToReturnToThisEntry });
            remainingToReturn -= amountToReturnToThisEntry;
        }
    }

    if (remainingToReturn > 0) {
        // Bu durumun normalde olmaması gerekir, ama bir güvenlik önlemi olarak hata fırlatılabilir.
        // Veya yeni bir stok girişi olarak eklenebilir. Şimdilik hata fırlatıyoruz.
        throw new Error("Stok iade edilirken bir tutarsızlık oluştu.");
    }
}
