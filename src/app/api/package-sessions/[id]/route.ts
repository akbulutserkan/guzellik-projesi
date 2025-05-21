import { NextResponse } from 'next/server';
import { 
  getPackageSaleByIdFromDb, 
  updatePackageSaleInDb, 
  deletePackageSaleFromDb,
  getPaymentsByPackageSaleFromDb
} from '@/lib/package-sale-service';

// GET: ID'ye göre paket satışı detayı veya ödeme bilgilerini getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    // ID'ye göre paket satışını getir (varsayılan işlem)
    if (!action || action === 'details') {
      const result = await getPackageSaleByIdFromDb(params.id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Paket satışı bulunamadı' },
          { status: result.error === 'Paket satışı bulunamadı' ? 404 : 500 }
        );
      }
      
      return NextResponse.json(result.data);
    } 
    // ID'ye göre ödemeleri getir
    else if (action === 'payments') {
      const result = await getPaymentsByPackageSaleFromDb(params.id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Ödemeler getirilirken bir hata oluştu' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    return NextResponse.json(
      { error: 'Geçersiz işlem' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Paket satışı bilgileri getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Paket satışı bilgileri getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT: ID'ye göre paket satışını güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Merkezi servis ile paket satışını güncelle
    const result = await updatePackageSaleInDb(params.id, body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Paket satışı güncellenemedi' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Paket satışı güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Paket satışı güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE: ID'ye göre paket satışını sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Merkezi servis ile paket satışını sil
    const result = await deletePackageSaleFromDb(params.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Paket satışı silinemedi' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Paket satışı başarıyla silindi' });
  } catch (error) {
    console.error('Paket satışı silinirken hata:', error);
    return NextResponse.json(
      { error: 'Paket satışı silinemedi' },
      { status: 500 }
    );
  }
}