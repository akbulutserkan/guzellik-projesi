const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Veritabanı bağlantısını test et
    await prisma.$connect();
    console.log('✅ Veritabanına başarıyla bağlanıldı');
    
    // Paket satışlarını say
    const packageSaleCount = await prisma.packageSale.count();
    console.log(`📊 Paket satışı sayısı: ${packageSaleCount}`);
    
    // Paketleri say
    const packageCount = await prisma.package.count();
    console.log(`📦 Paket sayısı: ${packageCount}`);
    
    // Müşterileri say
    const customerCount = await prisma.customer.count();
    console.log(`👥 Müşteri sayısı: ${customerCount}`);
    
    // İlk 5 paket satışını getir (eğer varsa)
    const firstSales = await prisma.packageSale.findMany({
      take: 5,
      select: {
        id: true,
        price: true,
        status: true,
        saleDate: true,
        customer: {
          select: { name: true }
        },
        package: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n🔍 İlk 5 paket satışı:');
    console.log(JSON.stringify(firstSales, null, 2));
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();