// /src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

console.log('[Prisma] [DEBUG] Prisma istemcisi başlatılıyor');
console.log('[Prisma] [DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[Prisma] [DEBUG] DATABASE_URL:', process.env.DATABASE_URL ? 
  `${process.env.DATABASE_URL.substring(0, 12)}...${process.env.DATABASE_URL.slice(-10)}` : // Başlangıç ve sonu gösteriyoruz
  'Tanımlanmamış');
console.log('[Prisma] [DEBUG] Çalışma dizini:', process.cwd()); 

const prismaClientSingleton = () => {
  console.log('[Prisma] [DEBUG] Yeni PrismaClient oluşturuluyor');
  
  // Prisma client ayarlarını yaplandır
  const client = new PrismaClient({
    log: ['query', 'error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  console.log('[Prisma] [DEBUG] PrismaClient başarıyla oluşturuldu');
  return client;
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

// Mevcut istemciyi temizle ve yeniden oluştur
if (process.env.NODE_ENV !== 'production') {
  console.log('[Prisma] Geliştirme modunda, mevcut istemci temizleniyor');
  console.log('[Prisma] Mevcut istemci durumu:', !!globalForPrisma.prisma);
  globalForPrisma.prisma = undefined
  console.log('[Prisma] İstemci temizlendi');
}

console.log('[Prisma] Prisma istemcisi hazırlanıyor');
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Veritabanı bağlantısını test et
console.log('[Prisma] [DEBUG] Veritabanı bağlantısı test ediliyor');
console.log('[Prisma] [DEBUG] DATABASE_URL mevcut mu?', !!process.env.DATABASE_URL);
console.log('[Prisma] [DEBUG] Prisma client versiyonu:', process.env.NEXT_PUBLIC_PRISMA_CLIENT_VERSION || 'Bilinmiyor');

prisma.$connect()
  .then(async () => {
    console.log('[Prisma] [DEBUG] Veritabanı bağlantısı başarılı - Kullanıcı: serkan');
    
    // Veritabanı bilgilerini göster
    try {
      console.log('[Prisma] [DEBUG] Veritabanı sistem bilgileri alınıyor...');
      const result = await prisma.$queryRaw`SELECT current_database(), current_schema(), version()`;
      console.log('[Prisma] [DEBUG] Veritabanı bilgileri:', result);
      
      // Önemli tabloları kontrol et
      console.log('[Prisma] [DEBUG] Tablo kontrolü yapılıyor - Package mevcut mu?');
      const packageCount = await prisma.package.count();
      console.log(`[Prisma] [DEBUG] Package tablosunda ${packageCount} kayıt bulunuyor`);
      
      // Customer tablosunu da kontrol et
      console.log('[Prisma] [DEBUG] Tablo kontrolü yapılıyor - Customer mevcut mu?');
      const customerCount = await prisma.customer.count();
      console.log(`[Prisma] [DEBUG] Customer tablosunda ${customerCount} kayıt bulunuyor`);
      
      // Prisma client'i test et
      console.log('[Prisma] [DEBUG] Prisma client metotlarını kontrol ediyor...');
      console.log('[Prisma] [DEBUG] Prisma.customer metodu:', typeof prisma.customer === 'object');
      console.log('[Prisma] [DEBUG] prisma.customer.findMany metodu:', typeof prisma.customer.findMany === 'function');
    } catch (testErr) {
      console.error('[Prisma] [ERROR] Veritabanı test sorgusu başarısız:', {
        message: testErr.message,
        code: testErr.code,
        name: testErr.name,
        stack: testErr.stack?.split('\n').slice(0, 5)
      });
    }
  })
  .catch((e) => {
    console.error('[Prisma] [ERROR] Veritabanı bağlantı hatası:', {
      message: e.message,
      code: e.code,
      clientVersion: e.clientVersion,
      meta: e.meta,
      stack: e.stack?.split('\n').slice(0, 5).join('\n') // İlk 5 satır
    });
    
    // DATABASE_URL kontrolü
    if (!process.env.DATABASE_URL) {
      console.error('[Prisma] [HATA] DATABASE_URL çevresel değişkeni tanımlanmamış!');
    }
  });