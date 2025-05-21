import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Basit bir sorgu deneyelim - personel sayısını alalım
    const staffCount = await prisma.staff.count();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Veritabanı bağlantısı başarılı',
      staffCount 
    });
  } catch (error) {
    console.error('Veritabanı hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Veritabanı bağlantı hatası',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}