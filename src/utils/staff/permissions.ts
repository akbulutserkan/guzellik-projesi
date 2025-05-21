'use client';

import { Permission } from '@prisma/client';

/**
 * İzin grupları ve etiketleri
 */
export const PERMISSION_GROUPS = {
  Hizmetler: [
    "VIEW_SERVICES",
    "ADD_SERVICE_CATEGORY",
    "EDIT_SERVICE_CATEGORY",
    "DELETE_SERVICE_CATEGORY",
    "ADD_SERVICE",
    "EDIT_SERVICE",
    "DELETE_SERVICE",
    "BULK_UPDATE_PRICES",
    "VIEW_PRICE_HISTORY",
  ],
  "Personel Yönetimi": ["VIEW_STAFF", "EDIT_STAFF", "DELETE_STAFF"],
  "Müşteri Yönetimi": ["VIEW_CUSTOMERS", "EDIT_CUSTOMERS", "DELETE_CUSTOMERS"],
  "Randevu Yönetimi": [
    "VIEW_APPOINTMENTS",
    "EDIT_APPOINTMENTS",
    "DELETE_APPOINTMENTS"
  ],
  "Paketler": [
    "VIEW_PACKAGES",
    "ADD_PACKAGES",
    "EDIT_PACKAGES",
    "DELETE_PACKAGES",
  ],
  "Paket Satışları": [
    "VIEW_PACKAGE_SALES",
    "ADD_PACKAGE_SALES",
    "EDIT_PACKAGE_SALES",
    "DELETE_PACKAGE_SALES",
  ],
  "Paket Ödemeleri": [
    "VIEW_PACKAGE_PAYMENTS",
    "EDIT_PACKAGE_PAYMENTS",
    "DELETE_PACKAGE_PAYMENTS",
  ],
  Ürünler: [
    "VIEW_PRODUCTS",
    "ADD_PRODUCTS",
    "EDIT_PRODUCTS",
    "DELETE_PRODUCTS",
  ],
  "Ürün Satışları": [
    "VIEW_PRODUCT_SALES",
    "ADD_PRODUCT_SALES",
    "EDIT_PRODUCT_SALES",
    "DELETE_PRODUCT_SALES", 
  ],
  "Ürün Ödemeleri": [
    "VIEW_PRODUCT_PAYMENTS",
    "EDIT_PRODUCT_PAYMENTS",
    "DELETE_PRODUCT_PAYMENTS",
  ],
  "Ayarlar": [
    "VIEW_SETTINGS"
  ],
};

/**
 * Kullanıcı dostu izin etiketleri
 * @note TypeScript hataları nedeniyle tip tanımını Record<string, string> olarak değiştirdik
 */
export const PERMISSION_LABELS: Record<string, string> = {
  // Hizmet Yetkileri
  VIEW_SERVICES: "Hizmetler Sayfasını Görebilir",
  ADD_SERVICE_CATEGORY: "Hizmet Kategorisi Ekleyebilir",
  EDIT_SERVICE_CATEGORY: "Hizmet Kategorisini Düzenleyebilir",
  DELETE_SERVICE_CATEGORY: "Hizmet Kategorisini Silebilir",
  ADD_SERVICE: "Hizmet Ekleyebilir",
  EDIT_SERVICE: "Hizmet Düzenleyebilir",
  DELETE_SERVICE: "Hizmet Silebilir",
  BULK_UPDATE_PRICES: "Toplu Fiyat Güncelleyebilir",
  VIEW_PRICE_HISTORY: "Fiyat Geçmişini Görüntüleyebilir",

  // Personel Yetkileri
  VIEW_STAFF: "Personel Görüntüleme",
  EDIT_STAFF: "Personel Düzenleme",
  DELETE_STAFF: "Personel Silme",

  // Müşteri Yetkileri
  VIEW_CUSTOMERS: "Müşteri Görüntüleme",
  EDIT_CUSTOMERS: "Müşteri Düzenleme",
  DELETE_CUSTOMERS: "Müşteri Silme",

  // Randevu Yetkileri
  VIEW_APPOINTMENTS: "Randevu Görüntüleme",
  EDIT_APPOINTMENTS: "Randevu Düzenleme",
  DELETE_APPOINTMENTS: "Randevu Silme",

  // Paket Yetkileri
  VIEW_PACKAGES: "Paket Görüntüleme",
  ADD_PACKAGES: "Yeni Paket Ekleyebilir",
  EDIT_PACKAGES: "Paket Düzenleme",
  DELETE_PACKAGES: "Paket Silme",

  // Paket Satış Yetkileri
  VIEW_PACKAGE_SALES: "Paket Satışlarını Görüntüleme",
  ADD_PACKAGE_SALES: "Yeni Paket Satışı Ekleyebilir",
  EDIT_PACKAGE_SALES: "Paket Satışı Düzenleme",
  DELETE_PACKAGE_SALES: "Paket Satışı Silme",

  // Ürün Yetkileri
  VIEW_PRODUCTS: "Ürünler Sayfasını Görebilir",
  ADD_PRODUCTS: "Yeni Ürün Ekleyebilir",
  EDIT_PRODUCTS: "Ürün Düzenleyebilir",
  DELETE_PRODUCTS: "Ürün Silebilir",

  // Ürün Satışları Yetkileri
  VIEW_PRODUCT_SALES: "Ürün Satışları Sayfasını Görebilir",
  ADD_PRODUCT_SALES: "Yeni Ürün Satışı Ekleyebilir",
  EDIT_PRODUCT_SALES: "Ürün Satışını Düzenleyebilir",
  DELETE_PRODUCT_SALES: "Ürün Satışını Silebilir",

  // Bu izinleri geçici olarak yorum satırına aldık
  /* Paket Ödemeleri Yetkileri
  VIEW_PACKAGE_PAYMENTS: "Paket Ödemelerini Görüntüleyebilir",
  EDIT_PACKAGE_PAYMENTS: "Paket Ödemesi Ekleyebilir",
  DELETE_PACKAGE_PAYMENTS: "Paket Ödemelerini Silebilir", */

  /* Ürün Ödemeleri Yetkileri
  VIEW_PRODUCT_PAYMENTS: "Ürün Ödemelerini Görüntüleyebilir",
  EDIT_PRODUCT_PAYMENTS: "Ürün Ödemesi Ekleyebilir",
  DELETE_PRODUCT_PAYMENTS: "Ürün Ödemelerini Silebilir", */

  // Ayarlar Yetkileri
  VIEW_SETTINGS: "Ayarları Görüntüleme",
  
  // Tahsilat yetkileri (gerçek sistem yetkileri)
  VIEW_PAYMENTS: "Tahsilatları Görüntüleyebilir",
  EDIT_PAYMENTS: "Tahsilat Ekleyebilir/Düzenleyebilir",
  DELETE_PAYMENTS: "Tahsilatları Silebilir",
};

/**
 * İzin etiketi getirir
 */
export function getPermissionLabel(permission: string): string {
  return PERMISSION_LABELS[permission] || permission;
}

/**
 * Grup bazında izinleri getirir
 */
export function getPermissionsByGroup() {
  return PERMISSION_GROUPS;
}

/**
 * Bir izin için bağımlı izinleri döndürür
 */
export function getDependentPermissions(permission: string): Permission[] {
  const PERMISSION_DEPENDENCIES: Record<string, Permission[]> = {
    'ADD_SERVICE': ['VIEW_SERVICES'],
    'EDIT_SERVICE': ['VIEW_SERVICES'],
    'DELETE_SERVICE': ['VIEW_SERVICES'],
    'ADD_SERVICE_CATEGORY': ['VIEW_SERVICES'],
    'EDIT_SERVICE_CATEGORY': ['VIEW_SERVICES'],
    'DELETE_SERVICE_CATEGORY': ['VIEW_SERVICES'],
    'BULK_UPDATE_PRICES': ['VIEW_SERVICES', 'EDIT_SERVICE'],
    'VIEW_PRICE_HISTORY': ['VIEW_SERVICES'],
    
    'EDIT_STAFF': ['VIEW_STAFF'],
    'DELETE_STAFF': ['VIEW_STAFF'],
    
    'EDIT_CUSTOMERS': ['VIEW_CUSTOMERS'],
    'DELETE_CUSTOMERS': ['VIEW_CUSTOMERS'],
    
    'EDIT_APPOINTMENTS': ['VIEW_APPOINTMENTS'],
    'DELETE_APPOINTMENTS': ['VIEW_APPOINTMENTS'],
    
    'ADD_PACKAGES': ['VIEW_PACKAGES'],
    'EDIT_PACKAGES': ['VIEW_PACKAGES'],
    'DELETE_PACKAGES': ['VIEW_PACKAGES'],
    
    'ADD_PACKAGE_SALES': ['VIEW_PACKAGE_SALES'],
    'EDIT_PACKAGE_SALES': ['VIEW_PACKAGE_SALES'],
    'DELETE_PACKAGE_SALES': ['VIEW_PACKAGE_SALES'],
    
    // 'EDIT_PACKAGE_PAYMENTS' ve 'DELETE_PACKAGE_PAYMENTS' bağımlılıkları çıkarıldı
    
    'ADD_PRODUCTS': ['VIEW_PRODUCTS'],
    'EDIT_PRODUCTS': ['VIEW_PRODUCTS'],
    'DELETE_PRODUCTS': ['VIEW_PRODUCTS'],
    
    'ADD_PRODUCT_SALES': ['VIEW_PRODUCT_SALES'],
    'EDIT_PRODUCT_SALES': ['VIEW_PRODUCT_SALES'],
    'DELETE_PRODUCT_SALES': ['VIEW_PRODUCT_SALES'],
    
    // 'EDIT_PRODUCT_PAYMENTS' ve 'DELETE_PRODUCT_PAYMENTS' bağımlılıkları çıkarıldı
  };
  
  return PERMISSION_DEPENDENCIES[permission] || [];
}

/**
 * Sanal ve gerçek izinler arasındaki eşleştirmeleri döndürür.
 * Örneğin, VIEW_PACKAGE_PAYMENTS ve VIEW_PRODUCT_PAYMENTS izinleri
 * aslında gerçek VIEW_PAYMENTS iznini temsil eden sanal izinlerdir.
 */
export function getVirtualPermissions(): Record<string, string> {
  return {
    // Paket ödemeleri -> Gerçek ödeme izinleri
    'VIEW_PACKAGE_SALES': 'VIEW_PAYMENTS',
    'EDIT_PACKAGE_SALES': 'EDIT_PAYMENTS',
    'DELETE_PACKAGE_SALES': 'DELETE_PAYMENTS',
    // Ürün ödemeleri -> Gerçek ödeme izinleri
    'VIEW_PRODUCT_SALES': 'VIEW_PAYMENTS',
    'EDIT_PRODUCT_SALES': 'EDIT_PAYMENTS',
    'DELETE_PRODUCT_SALES': 'DELETE_PAYMENTS',
  };
}

/**
 * İzin gruplarını ve izinleri UI gösterimi için hazırlar
 */
export function preparePermissionsForUI(permissions: Permission[]): string[] {
  // Gerçek izinlerden sanal izinleri oluşturma
  const virtualPermissions = new Set<Permission>();
  const virtualMapping = getVirtualPermissions();
  const invertedVirtualMapping: Record<string, string[]> = {};
  
  // Ters eşleştirme oluştur (gerçek izinden sanal izinlere)
  Object.entries(virtualMapping).forEach(([virtual, real]) => {
    if (!invertedVirtualMapping[real]) {
      invertedVirtualMapping[real] = [];
    }
    invertedVirtualMapping[real].push(virtual);
  });
  
  // Gerçek izinleri dön ve sanal izinleri ekleme
  permissions.forEach(permission => {
    if (invertedVirtualMapping[permission]) {
      invertedVirtualMapping[permission].forEach(virtualPerm => {
        // TypeScript'in iterator sorunlarını aşmak için basitleştirilmiş tip dönüşümü
        virtualPermissions.add(virtualPerm as any);
      });
    }
  });
  
  // Tüm izinleri (gerçek + sanal) birleştir
  return [...permissions, ...Array.from(virtualPermissions)];
}
