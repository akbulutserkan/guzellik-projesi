import { NextResponse } from 'next/server'
import { getServiceByIdFromDb, updateServiceInDb, deleteServiceFromDb } from '@/lib/service-service'

/**
 * Hizmet detayını getiren API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] services/${params.id} GET isteği alındı`);
    
    // Doğrudan veritabanı servisini kullan
    const result = await getServiceByIdFromDb(params.id);
    
    if (!result.success) {
      console.error(`[API] ${params.id} ID'li hizmet getirilemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Hizmet bulunamadı' ? 404 : 500 }
      );
    }
    
    console.log(`[API] ${params.id} ID'li hizmet döndürülüyor`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} ID'li hizmet getirme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Hizmet yüklenemedi' },
      { status: 500 }
    );
  }
}

/**
 * Hizmet güncelleme API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] services/${params.id} PATCH isteği alındı`);
    
    const body = await request.json();
    
    // En az bir alan olup olmadığını kontrol et
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek en az bir alan gereklidir' },
        { status: 400 }
      );
    }
    
    // Doğrudan veritabanı servisini kullan
    const updateData: any = {};
    
    // Gelen verileri kontrol et
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // Güncelleme işlemini yap
    const result = await updateServiceInDb(params.id, updateData);
    
    if (!result.success) {
      console.error(`[API] ${params.id} ID'li hizmet güncellenemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    console.log(`[API] ${params.id} ID'li hizmet güncellendi`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} ID'li hizmet güncelleme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Hizmet güncellenirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * Hizmet silme API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] services/${params.id} DELETE isteği alındı`);
    
    // Doğrudan veritabanı servisini kullan
    const result = await deleteServiceFromDb(params.id);
    
    if (!result.success) {
      console.error(`[API] ${params.id} ID'li hizmet silinemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Silinecek hizmet bulunamadı' ? 404 : 400 }
      );
    }
    
    console.log(`[API] ${params.id} ID'li hizmet silindi (soft delete)`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} ID'li hizmet silme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Hizmet silinirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}