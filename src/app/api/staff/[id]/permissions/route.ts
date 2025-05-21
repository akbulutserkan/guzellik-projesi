import { NextRequest, NextResponse } from 'next/server';
import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Personel izinlerini güncelle
 * Merkezi API yapısına geçirilmiş versiyonu - MCP API kullanır
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    console.log(`[Staff API] PUT permissions request received for ID ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Personel ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    if (!data.permissions || !Array.isArray(data.permissions)) {
      return NextResponse.json(
        { error: 'Geçerli izin listesi gereklidir' },
        { status: 400 }
      );
    }
    
    // MCP API üzerinden veritabanı servisini çağır
    const result = await callMcpApi('update-staff-permissions', { 
      id, 
      permissions: data.permissions 
    }, {
      showToast: false,
      customErrorMsg: 'Personel izinleri güncellenirken bir hata oluştu'
    });
    
    if (!result.success) {
      console.error(`[Staff API] Error updating permissions for staff ID ${id}:`, result.error);
      
      // Personel bulunamadıysa 404 dön
      if (result.error === 'Personel bulunamadı') {
        return NextResponse.json(
          { error: 'Personel bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || 'Personel izinleri güncellenemedi' },
        { status: 400 }
      );
    }
    
    // Başarılı sonuç
    console.log(`[Staff API] Permissions updated successfully for staff ID: ${id}`);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Staff API] Unexpected error during permissions update:', error);
    return NextResponse.json(
      { error: 'Personel izinleri güncellenirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}