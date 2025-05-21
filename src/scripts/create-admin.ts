import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Admin kullanıcısı oluşturma scripti başlatıldı...');
    
    // Admin kullanıcısının şifresini hashleme
    const password = await hash('admin123', 10);
    console.log('Şifre hashlendi');

    // Önce kullanıcıyı silmeyi dene (varsa)
    try {
      await prisma.staff.deleteMany({
        where: {
          username: 'admin'
        }
      });
      console.log('Varsa önceki admin kullanıcısı silindi');
    } catch (error) {
      console.log('Silme işlemi başarısız oldu, devam ediliyor...');
    }

    // Admin kullanıcısını oluştur
    const admin = await prisma.staff.create({
      data: {
        username: 'admin',
        password: password,
        name: 'Admin',
        phone: '05555555555',
        email: 'admin@example.com',
        accountType: 'ADMIN',
        serviceGender: 'ALL',
        permissions: [
          'ADD_SERVICE_CATEGORY', 'EDIT_SERVICE_CATEGORY', 'DELETE_SERVICE_CATEGORY',
          'ADD_SERVICE', 'EDIT_SERVICE', 'DELETE_SERVICE', 'BULK_UPDATE_PRICES',
          'VIEW_PRICE_HISTORY', 'VIEW_SERVICES', 'VIEW_STAFF', 'EDIT_STAFF', 'DELETE_STAFF',
          'VIEW_CUSTOMERS', 'ADD_CUSTOMERS', 'EDIT_CUSTOMERS', 'DELETE_CUSTOMERS',
          'VIEW_APPOINTMENTS', 'EDIT_APPOINTMENTS', 'DELETE_APPOINTMENTS',
          'VIEW_PACKAGES', 'ADD_PACKAGES', 'EDIT_PACKAGES', 'DELETE_PACKAGES',
          'VIEW_PACKAGE_SALES', 'ADD_PACKAGE_SALES', 'EDIT_PACKAGE_SALES', 'DELETE_PACKAGE_SALES',
          'VIEW_PRODUCTS', 'ADD_PRODUCTS', 'EDIT_PRODUCTS', 'DELETE_PRODUCTS',
          'VIEW_PAYMENTS', 'EDIT_PAYMENTS', 'DELETE_PAYMENTS',
          'VIEW_PRODUCT_SALES', 'ADD_PRODUCT_SALES', 'EDIT_PRODUCT_SALES', 'DELETE_PRODUCT_SALES'
        ],
        workingHours: [],
      },
    });
    
    console.log(`Admin kullanıcısı başarıyla oluşturuldu: ${admin.id}`);
    console.log('Kullanıcı adı: admin');
    console.log('Şifre: admin123');
  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();