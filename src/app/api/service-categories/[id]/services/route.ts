import { NextResponse } from 'next/server'
import { getServicesByCategoryFromDb } from '@/lib/service-service'

/**
 * Kategori ID'sine göre hizmetleri getiren API route
 * Merkezi API yapısına uygun olarak doğrudan veritabanı servisini kullanır
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] service-categories/${params.id}/services GET isteği alındı`);
    
    // Doğrudan veritabanı servisini kullan
    const result = await getServicesByCategoryFromDb(params.id);
    
    if (!result.success) {
      console.error(`[API] ${params.id} kategorisine ait hizmetler getirilemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Kategori bulunamadı' ? 404 : 500 }
      );
    }
    
    console.log(`[API] ${params.id} kategorisine ait ${result.data.length} hizmet döndürülüyor`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] ${params.id} kategorisine ait hizmetleri getirme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Kategori hizmetleri yüklenemedi' },
      { status: 500 }
    );
  }
}