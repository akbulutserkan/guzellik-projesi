import { NextRequest, NextResponse } from 'next/server';
import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * ID'ye göre personel detayını getir
 * Merkezi API yapısına geçirilmiş versiyonu - MCP API kullanır
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[Staff API] GET by ID request received, id: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Personel ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // MCP API üzerinden veritabanı servisini çağır
    const result = await callMcpApi('get-staff-by-id', { id }, {
      showToast: false,
      customErrorMsg: 'Personel detayı alınırken bir hata oluştu'
    });
    
    if (!result.success) {
      console.error(`[Staff API] Error from MCP API for ID ${id}:`, result.error);
      
      // Personel bulunamadıysa 404 dön
      if (result.error === 'Personel bulunamadı') {
        return NextResponse.json(
          { error: 'Personel bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || 'Personel detayı alınamadı' },
        { status: 500 }
      );
    }
    
    // Başarılı sonuç
    console.log(`[Staff API] Staff details retrieved successfully for ID ${id}`);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Staff API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Personel detayı alınırken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * ID'ye göre personeli güncelle
 * Merkezi API yapısına geçirilmiş versiyonu - MCP API kullanır
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    console.log(`[Staff API] PUT request received for ID ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Personel ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // MCP API üzerinden veritabanı servisini çağır
    const result = await callMcpApi('update-staff', { id, ...data }, {
      showToast: false,
      customErrorMsg: 'Personel güncellenirken bir hata oluştu'
    });
    
    if (!result.success) {
      console.error(`[Staff API] Error updating staff member ID ${id}:`, result.error);
      
      // Personel bulunamadıysa 404 dön
      if (result.error === 'Personel bulunamadı') {
        return NextResponse.json(
          { error: 'Personel bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || 'Personel güncellenemedi' },
        { status: 400 }
      );
    }
    
    // Başarılı sonuç
    console.log(`[Staff API] Staff member updated successfully, ID: ${id}`);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Staff API] Unexpected error during update:', error);
    return NextResponse.json(
      { error: 'Personel güncellenirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * ID'ye göre personeli sil
 * Merkezi API yapısına geçirilmiş versiyonu - MCP API kullanır
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[Staff API] DELETE request received for ID ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Personel ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // MCP API üzerinden veritabanı servisini çağır
    const result = await callMcpApi('delete-staff', { id }, {
      showToast: false,
      customErrorMsg: 'Personel silinirken bir hata oluştu'
    });
    
    if (!result.success) {
      console.error(`[Staff API] Error deleting staff member ID ${id}:`, result.error);
      
      // Personel bulunamadıysa 404 dön
      if (result.error === 'Personel bulunamadı') {
        return NextResponse.json(
          { error: 'Personel bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || 'Personel silinemedi' },
        { status: 400 }
      );
    }
    
    // Başarılı sonuç
    console.log(`[Staff API] Staff member deleted successfully, ID: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Staff API] Unexpected error during delete:', error);
    return NextResponse.json(
      { error: 'Personel silinirken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}