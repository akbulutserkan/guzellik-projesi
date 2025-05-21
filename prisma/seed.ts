import { PrismaClient, Permission, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seed işlemi başlatılıyor...');

    // TÜM YETKİLERİ TANIMLAMA
    const allPermissions: Permission[] = [
      // Hizmet Yetkileri
      'ADD_SERVICE_CATEGORY', 'EDIT_SERVICE_CATEGORY', 'DELETE_SERVICE_CATEGORY',
      'ADD_SERVICE', 'EDIT_SERVICE', 'DELETE_SERVICE', 'BULK_UPDATE_PRICES',
      'VIEW_PRICE_HISTORY', 'VIEW_SERVICES',

      // Personel Yetkileri
      'VIEW_STAFF', 'EDIT_STAFF', 'DELETE_STAFF',

      // Müşteri Yetkileri
      'VIEW_CUSTOMERS', 'ADD_CUSTOMERS', 'EDIT_CUSTOMERS', 'DELETE_CUSTOMERS',

      // Randevu Yetkileri
      'VIEW_APPOINTMENTS', 'EDIT_APPOINTMENTS', 'DELETE_APPOINTMENTS',

      // Paket Yetkileri
      'VIEW_PACKAGES', 'ADD_PACKAGES', 'EDIT_PACKAGES', 'DELETE_PACKAGES',

      // Paket Satışları Yetkileri
      'VIEW_PACKAGE_SALES', 'ADD_PACKAGE_SALES', 'EDIT_PACKAGE_SALES', 'DELETE_PACKAGE_SALES',

      // Ürün Yetkileri
      'VIEW_PRODUCTS', 'ADD_PRODUCTS', 'EDIT_PRODUCTS', 'DELETE_PRODUCTS',

      // Ödeme Yetkileri
      'VIEW_PAYMENTS', 'EDIT_PAYMENTS', 'DELETE_PAYMENTS',

      // Ürün Satışları Yetkileri
      'VIEW_PRODUCT_SALES', 'ADD_PRODUCT_SALES', 'EDIT_PRODUCT_SALES', 'DELETE_PRODUCT_SALES'
    ];

    // Admin kullanıcısının şifresini hashleme
    const password = await hash('admin123', 10);
    console.log('Şifre hashlendi');

    // Önce mevcut admin kullanıcısını silelim (varsa)
    try {
      await prisma.staff.deleteMany({
        where: {
          username: 'admin'
        }
      });
      console.log('Mevcut admin kullanıcısı temizlendi');
    } catch (error) {
      console.log('Admin kullanıcısı temizleme hatası (önemli değil): ', error);
    }

    // Admin kullanıcısını oluştur
    const admin = await prisma.staff.create({
      data: {
        username: 'admin',
        password: password,
        name: 'Admin',
        phone: '05555555555', 
        email: 'admin@example.com',
        accountType: UserRole.ADMIN,
        serviceGender: 'ALL',
        permissions: allPermissions,
        showInCalendar: true,
        workingHours: [], // Boş çalışma saatleri
        isActive: true,
        position: 'Yönetici',
        failedAttempts: 0,
        isLocked: false
      },
    });

    console.log(`Admin kullanıcısı başarıyla oluşturuldu! ID: ${admin.id}`);
    console.log('Kullanıcı adı: admin');
    console.log('Şifre: admin123');
    console.log(`Toplam yetki sayısı: ${allPermissions.length}`);

    // Buraya ihtiyaç olabilecek başka seed verileri eklenebilir
    // Örneğin: kategoriler, hizmetler, iş günleri, vb.

    console.log('Seed işlemi başarıyla tamamlandı!');
  } catch (error) {
    console.error('Seed işlemi sırasında hata oluştu:', error);
    throw error; // Hatayı yukarı fırlat
  }
}

// Seed işlemini çalıştır
main()
  .catch((error) => {
    console.error('Seed başarısız oldu:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Veritabanı bağlantısını kapat
    await prisma.$disconnect();
    console.log('Veritabanı bağlantısı kapatıldı.');
  });
