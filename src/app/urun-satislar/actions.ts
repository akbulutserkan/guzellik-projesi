

'use server';

import { db } from "@/lib/firebaseAdmin";
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { getCustomersAction, type Customer } from "../musteriler/actions";
import { getPersonelAction, type Personel } from "../personeller/actions";
import { decreaseStockForSale, getProductsAction as getBaseProductsAction, increaseStockAfterSaleCancellation } from "../urunler/actions";


export interface Product {
  id: string;
  name: string;
  stock: number;
  sellingPrice: number;
  createdAt: Date;
}

export interface Sale {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    customerId?: string;
    customerName?: string;
    personnelId?: string;
    personnelName?: string;
    saleDate: Date;
}

export interface SalesPageData {
    sales: Sale[];
    products: Product[];
    customers: Customer[];
    personel: Personel[];
}

export async function getProductsAction(): Promise<Product[]> {
  if (!db) {
    console.error("Firestore veritabanı bağlantısı mevcut değil. (getProductsAction)");
    return [];
  }
  try {
    const productsWithStock = await getBaseProductsAction();

    return productsWithStock
        .map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            sellingPrice: p.latestSellingPrice || 0,
            createdAt: p.createdAt
        }))
        .filter(p => p.stock > 0);

  } catch (error) {
    console.error("Ürünler çekilirken hata:", error);
    return [];
  }
}

export async function getAllDataForSalesPageAction(): Promise<SalesPageData> {
    const [sales, products, customers, personel] = await Promise.all([
        getSalesAction(),
        getProductsAction(),
        getCustomersAction(),
        getPersonelAction()
    ]);

    return { sales, products, customers, personel };
}


export async function getSalesAction(): Promise<Sale[]> {
    if (!db) {
      console.error("Firestore veritabanı bağlantısı mevcut değil. (getSalesAction)");
      return [];
    }
    try {
      const salesSnapshot = await db.collection("sales").orderBy("saleDate", "desc").get();
      const sales = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productId: data.productId,
          productName: data.productName,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          customerId: data.customerId,
          customerName: data.customerName,
          personnelId: data.personnelId,
          personnelName: data.personnelName,
          saleDate: (data.saleDate as Timestamp).toDate(),
        } as Sale;
      });
      return sales;
    } catch (error) {
      console.error("Satışlar çekilirken hata:", error);
      return [];
    }
}

export async function performRecordSaleAction(formData: FormData) {
  'use server';
  const productId = formData.get("productId") as string;
  const quantityStr = formData.get("quantity") as string;
  const totalAmountStr = formData.get("totalAmount") as string;
  const customerId = formData.get("customerId") as string;
  const personnelId = formData.get("personnelId") as string;

  if (!productId || !quantityStr || !totalAmountStr || !personnelId || !customerId) {
    return { success: false, message: "Lütfen tüm zorunlu alanları doldurun." };
  }
  
  if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
  
  const quantity = parseInt(quantityStr, 10);
  const totalAmount = parseFloat(totalAmountStr);

  if (isNaN(quantity) || quantity <= 0) {
      return { success: false, message: "Geçersiz miktar." };
  }
  if (isNaN(totalAmount) || totalAmount < 0) {
      return { success: false, message: "Geçersiz toplam tutar." };
  }

  let customerName: string | undefined = undefined;
  const customerDoc = await db.collection("customers").doc(customerId).get();
  if (customerDoc.exists) {
    customerName = (customerDoc.data() as Customer).fullName;
  } else {
    return { success: false, message: "Geçersiz müşteri seçimi." };
  }

  const personnelDoc = await db.collection("personel").doc(personnelId).get();
  if (!personnelDoc.exists) {
      return { success: false, message: "Geçersiz personel seçimi."};
  }
  const personnelName = (personnelDoc.data() as Personel).fullName;


  try {
    await db.runTransaction(async (transaction) => {
      const productRef = db.collection("products").doc(productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw new Error("Ürün bulunamadı.");
      }
      
      const productData = productDoc.data();
      if (!productData) {
        throw new Error("Ürün verisi okunamadı.");
      }

      await decreaseStockForSale(productId, quantity, transaction);

      const saleData = {
        productId: productId,
        productName: productData.name,
        quantity: quantity,
        totalAmount: totalAmount,
        customerId: customerId,
        customerName: customerName,
        personnelId: personnelId,
        personnelName: personnelName,
        saleDate: Timestamp.now(),
      };
      transaction.set(db.collection("sales").doc(), saleData);
    });

    revalidatePath("/urun-satislar");
    revalidatePath("/urunler"); 

    return { success: true, message: `Satış başarıyla kaydedildi.` };

  } catch (error: any) {
    console.error("Satış kaydedilirken hata:", error);
    return { success: false, message: error.message || "Satış kaydedilirken bir hata oluştu." };
  }
}

export async function performDeleteSaleAction(saleId: string) {
    'use server';
    if (!saleId) return { success: false, message: "Satış ID'si gerekli." };
    if (!db) return { success: false, message: "Veritabanı bağlantı hatası." };
    
    try {
        const saleRef = db.collection("sales").doc(saleId);
        
        await db.runTransaction(async (transaction) => {
            const saleDoc = await transaction.get(saleRef);

            if (!saleDoc.exists) {
                throw new Error("Silinecek satış kaydı bulunamadı.");
            }

            const saleData = saleDoc.data() as Sale;
            
            // Stoğu geri ekle
            await increaseStockAfterSaleCancellation(saleData.productId, saleData.quantity, transaction);

            // Satış kaydını sil
            transaction.delete(saleRef);
        });

        revalidatePath("/urun-satislar");
        revalidatePath("/urunler");
        return { success: true, message: "Satış başarıyla iptal edildi ve stok iade edildi." };
    } catch (error: any) {
        console.error("Satış silme hatası:", error);
        return { success: false, message: error.message || "Satış silinemedi." };
    }
}
