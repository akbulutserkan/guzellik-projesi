import { NextResponse } from 'next/server'
import { getServicesFromDb, createServiceInDb } from '@/services/db/service'

/**
 * Tüm hizmetleri getiren API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function GET(request: Request) {
  try {
    console.log('[API] services GET isteği alındı');
    
    // URL parametrelerini al
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const isActiveParam = url.searchParams.get('isActive');
    const searchQuery = url.searchParams.get('searchQuery');
    const includeDeletedParam = url.searchParams.get('includeDeleted');
    
    // Filtre oluştur
    const filters: any = {};
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (isActiveParam !== null) {
      filters.isActive = isActiveParam === 'true';
    }
    
    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }
    
    if (includeDeletedParam !== null) {
      filters.includeDeleted = includeDeletedParam === 'true';
    }
    
    console.log('[API] services için filtreler:', filters);
    
    // Doğrudan veritabanı servisini kullan
    const result = await getServicesFromDb(filters);
    
    if (!result.success) {
      console.error('[API] Hizmetler getirilemedi:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    console.log(`[API] ${result.data.length} hizmet döndürülüyor`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Services fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Hizmetler yüklenemedi' },
      { status: 500 }
    );
  }
}

/**
 * Yeni bir hizmet oluşturan API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function POST(request: Request) {
  try {
    console.log('[API] services POST isteği alındı');
    
    const body = await request.json();
    
    // Gerekli alanların varlığını kontrol et
    if (!body.name || !body.categoryId || body.price === undefined || body.duration === undefined) {
      return NextResponse.json(
        { success: false, error: 'Hizmet adı, kategori, fiyat ve süre zorunludur' },
        { status: 400 }
      );
    }
    
    console.log('[API] Hizmet oluşturma verisi:', JSON.stringify(body, null, 2));
    
    // Doğrudan veritabanı servisini kullan
    const result = await createServiceInDb({
      name: body.name,
      price: body.price,
      duration: body.duration,
      categoryId: body.categoryId,
      isActive: body.isActive !== undefined ? body.isActive : true
    });
    
    if (!result.success) {
      console.error('[API] Hizmet oluşturulamadı:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    console.log('[API] Yeni hizmet oluşturuldu:', result.data.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Hizmet oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Hizmet oluşturulurken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}