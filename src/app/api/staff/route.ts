import { NextRequest, NextResponse } from 'next/server';
import { callMcpApi } from '@/lib/mcp/helpers';

/**
 * Personel listesini getir
 * Merkezi API yapısına geçirilmiş versiyonu - MCP API kullanır
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Staff API] GET request received');
    
    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    console.log(`[Staff API] Parameters: includeInactive=${includeInactive}`);
    
    // MCP API üzerinden veritabanı servisini çağır
    const result = await callMcpApi('get-staff', { includeInactive }, {
      showToast: false,
      customErrorMsg: 'Personel listesi alınırken bir hata oluştu'
    });
    
    if (!result.success) {
      console.error('[Staff API] Error from MCP API:', result.error);
      return NextResponse.json(
        { error: result.error || 'Personel listesi alınamadı' },
        { status: 500 }
      );
    }
    
    // Başarılı sonuç - aktif personel listesini dön
    // Geriye uyumluluk için düz dizi formatında dönüyoruz
    const staffList = result.data?.activeStaff || [];
    console.log(`[Staff API] Found ${staffList.length} staff members`);
    
    return NextResponse.json(staffList);
  } catch (error) {
    console.error('[Staff API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Personel listesi alınırken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * Yeni personel ekleme
 * Merkezi API yapısına geçirilmiş versiyonu - MCP API kullanır
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('[Staff API] POST request received');
    
    // MCP API üzerinden veritabanı servisini çağır
    const result = await callMcpApi('create-staff', data, {
      showToast: false,
      customErrorMsg: 'Personel oluşturulurken bir hata oluştu'
    });
    
    if (!result.success) {
      console.error('[Staff API] Error from MCP API:', result.error);
      return NextResponse.json(
        { error: result.error || 'Personel oluşturulamadı' },
        { status: 400 }
      );
    }
    
    // Başarılı sonuç
    console.log('[Staff API] Staff member created successfully:', result.data?.id);
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('[Staff API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Personel oluşturulurken beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}