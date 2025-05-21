import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listData() {
  try {
    const data = await prisma.projectData.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log('Veritabanındaki tüm kayıtlar:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Sorgulama hatası:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

listData()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
