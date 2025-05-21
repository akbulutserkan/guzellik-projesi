import { NextResponse } from 'next/server'
import { getServiceCategoryByIdFromDb, updateServiceCategoryInDb, deleteServiceCategoryFromDb } from '@/lib/service-service'

/**
 * Kategori detayını getiren API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] service-categories/${params.id} GET isteği alındı`);
    
    // Doğrudan veritabanı servisini kullan
    const result = await getServiceCategoryByIdFromDb(params.id);
    
    if (!result.success) {
      console.error(`[API] ${params.id} ID'li kategori getirilemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Kategori bulunamadı' ? 404 : 500 }
      );
    }
    
    console.log(`[API] ${params.id} ID'li kategori döndürülüyor`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} ID'li kategori getirme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Kategori yüklenemedi' },
      { status: 500 }
    );
  }
}

/**
 * Kategori güncelleme API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] service-categories/${params.id} PATCH isteği alındı`);
    
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir kategori adı gereklidir' },
        { status: 400 }
      );
    }
    
    // Doğrudan veritabanı servisini kullan
    const result = await updateServiceCategoryInDb(params.id, name);
    
    if (!result.success) {
      console.error(`[API] ${params.id} ID'li kategori güncellenemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    console.log(`[API] ${params.id} ID'li kategori güncellendi`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} ID'li kategori güncelleme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Kategori güncellenirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * Kategori silme API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] service-categories/${params.id} DELETE isteği alındı`);
    
    // Doğrudan veritabanı servisini kullan
    const result = await deleteServiceCategoryFromDb(params.id);
    
    if (!result.success) {
      console.error(`[API] ${params.id} ID'li kategori silinemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Silinecek kategori bulunamadı' ? 404 : 400 }
      );
    }
    
    console.log(`[API] ${params.id} ID'li kategori silindi`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} ID'li kategori silme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Kategori silinirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}