/**
 * Tahsilat verilerini standardize eden düzeltme scripti
 * 
 * Bu script, veritabanındaki tüm ödeme kayıtlarının
 * paymentType ve paymentMethod değerlerini doğru formata getirir.
 * 
 * Kullanımı:
 * 1. .env dosyasının düzgün yapılandırıldığından emin olun
 * 2. Node.js ile scripti çalıştırın: node fix-payment-format.js
 */

// PrismaClient import
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Standardizasyon haritalandırmaları
const paymentTypeMap = {
  'CASH': 'Nakit',
  'Nakit': 'Nakit',
  'nakit': 'Nakit',
  'CREDIT_CARD': 'Kredi Kartı',
  'Kredi Kartı': 'Kredi Kartı',
  'kredi kartı': 'Kredi Kartı',
  'Kart': 'Kredi Kartı',
  'kart': 'Kredi Kartı',
  'BANK_TRANSFER': 'Havale/EFT',
  'Havale/EFT': 'Havale/EFT',
  'havale/eft': 'Havale/EFT',
  'Havale': 'Havale/EFT',
  'EFT': 'Havale/EFT'
};

const paymentMethodMap = {
  'SERVICE_PAYMENT': 'Hizmet Ödemesi',
  'Hizmet Ödemesi': 'Hizmet Ödemesi',
  'hizmet ödemesi': 'Hizmet Ödemesi',
  'PACKAGE_PAYMENT': 'Paket Ödemesi',
  'Paket Ödemesi': 'Paket Ödemesi',
  'paket ödemesi': 'Paket Ödemesi',
  'PRODUCT_PAYMENT': 'Ürün Ödemesi',
  'Ürün Ödemesi': 'Ürün Ödemesi',
  'ürün ödemesi': 'Ürün Ödemesi'
};

// Statü haritalaması
const statusMap = {
  'COMPLETED': 'Tamamlandı',
  'Tamamlandı': 'Tamamlandı',
  'REFUNDED': 'İade Edildi',
  'İade Edildi': 'İade Edildi',
  'CANCELLED': 'İptal Edildi',
  'İptal Edildi': 'İptal Edildi'
};

// Ana düzeltme fonksiyonu
async function fixPaymentRecords() {
  console.log('Tahsilat kayıtları düzeltme işlemi başlatılıyor...');
  
  try {
    // Tüm ödeme kayıtlarını al
    const payments = await prisma.payment.findMany();
    console.log(`${payments.length} tahsilat kaydı bulundu`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Her bir kayıt için
    for (const payment of payments) {
      try {
        // Ödeme türü (Nakit, Kredi Kartı, Havale/EFT)
        let newPaymentType = payment.paymentType;
        
        // Ödeme şekli (Hizmet Ödemesi, Paket Ödemesi, Ürün Ödemesi)
        let newPaymentMethod = payment.paymentMethod;
        
        // Durum (Tamamlandı, İade Edildi, İptal Edildi)
        let newStatus = payment.status;
        
        // Değiştirmek gerekir mi bakılıyor
        let needsUpdate = false;
        
        // Ödeme türünü standardize et
        if (payment.paymentType && payment.paymentType.toUpperCase() === 'SERVICE_PAYMENT') {
          // Bu bir karıştırılmış kayıttır! 
          // SERVICE_PAYMENT ödeme türü değil, ödeme şekli olmalıdır
          
          // CASH, BANK_TRANSFER veya CREDIT_CARD paymentMethod'dan ödeme türüne taşınmalı
          if (payment.paymentMethod === 'CASH' || payment.paymentMethod === 'BANK_TRANSFER' || payment.paymentMethod === 'CREDIT_CARD') {
            newPaymentType = paymentTypeMap[payment.paymentMethod] || 'Nakit';
            newPaymentMethod = 'Hizmet Ödemesi';
            needsUpdate = true;
          }
          // Eğer doğru değer yoksa varsayılan bir değer ayarla
          else {
            newPaymentType = 'Nakit'; // Varsayılan değer
            newPaymentMethod = 'Hizmet Ödemesi';
            needsUpdate = true;
          }
        } 
        // Standart haritalamaları kontrol et
        else if (paymentTypeMap[payment.paymentType]) {
          newPaymentType = paymentTypeMap[payment.paymentType];
          needsUpdate = newPaymentType !== payment.paymentType;
        }
        
        // Ödeme şeklini standardize et - normal durum
        if (paymentMethodMap[payment.paymentMethod]) {
          newPaymentMethod = paymentMethodMap[payment.paymentMethod];
          needsUpdate = needsUpdate || newPaymentMethod !== payment.paymentMethod;
        }
        
        // Durumu standardize et
        if (statusMap[payment.status]) {
          newStatus = statusMap[payment.status];
          needsUpdate = needsUpdate || newStatus !== payment.status;
        }
        
        // Güncelleme gerekiyorsa
        if (needsUpdate) {
          console.log(`Tahsilat #${payment.id} güncelleniyor:`);
          console.log(`  Eski ödeme türü: "${payment.paymentType}" -> Yeni: "${newPaymentType}"`);
          console.log(`  Eski ödeme şekli: "${payment.paymentMethod}" -> Yeni: "${newPaymentMethod}"`);
          console.log(`  Eski durum: "${payment.status}" -> Yeni: "${newStatus}"`);
          
          // Veritabanında güncelle
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paymentType: newPaymentType,
              paymentMethod: newPaymentMethod,
              status: newStatus
            }
          });
          
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Tahsilat #${payment.id} güncellenirken hata:`, error);
        errorCount++;
      }
    }
    
    console.log('\nDüzeltme işlemi tamamlandı:');
    console.log(`- Toplam: ${payments.length} kayıt`);
    console.log(`- Güncellenen: ${updatedCount} kayıt`);
    console.log(`- Atlanan: ${skippedCount} kayıt`);
    console.log(`- Hatalı: ${errorCount} kayıt`);
    
  } catch (error) {
    console.error('Düzeltme işlemi sırasında hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
fixPaymentRecords()
  .then(() => console.log('İşlem tamamlandı.'))
  .catch(error => console.error('Kritik hata:', error));
