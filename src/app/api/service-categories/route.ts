import { NextResponse } from 'next/server'
import { getServiceCategoriesFromDb, createServiceCategoryInDb } from '@/services/db/service/categoryService'

/**
 * Tüm hizmet kategorilerini getiren API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function GET() {
  try {
    console.log('[API] service-categories GET isteği alındı');
    
    // Doğrudan veritabanı servisini kullan
    const result = await getServiceCategoriesFromDb();
    
    if (!result.success) {
      console.error('[API] Kategoriler getirilemedi:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    console.log(`[API] ${result.data.length} kategori döndürülüyor`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Categories fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Kategoriler yüklenemedi' },
      { status: 500 }
    );
  }
}

/**
 * Yeni bir hizmet kategorisi oluşturan API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function POST(request: Request) {
  try {
    console.log('[API] service-categories POST isteği alındı');
    
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir kategori adı gereklidir' },
        { status: 400 }
      );
    }
    
    // Doğrudan veritabanı servisini kullan
    const result = await createServiceCategoryInDb(name);
    
    if (!result.success) {
      console.error('[API] Kategori oluşturulamadı:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    console.log('[API] Yeni kategori oluşturuldu:', result.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Kategori oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Kategori oluşturulurken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}