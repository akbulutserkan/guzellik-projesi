import { NextResponse } from 'next/server'
import { testDeleteService } from '@/lib/test/delete-service-test';

/**
 * Test amaçlı hizmet silme route
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[TEST-API] services/${params.id} DELETE isteği alındı`);
    
    // Test silme işlemini çağır
    const result = await testDeleteService(params.id);
    
    if (!result.success) {
      console.error(`[TEST-API] ${params.id} ID'li hizmet silinemedi:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    console.log(`[TEST-API] ${params.id} ID'li hizmet silindi (soft delete)`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[TEST-API] ${params.id} ID'li hizmet silme hatası:`, error);
    return NextResponse.json(
      { success: false, error: 'Hizmet silinirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}