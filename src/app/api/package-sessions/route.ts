import { NextRequest, NextResponse } from 'next/server';
import { callMcpApi } from '@/lib/mcp/helpers';

// GET: Tüm paket satışlarını veya filtrelenmiş paket satışlarını getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: any = {};

    // URL parametrelerinden filtreleri al
    if (searchParams.has('customerId')) {
      filters.customerId = searchParams.get('customerId');
    }
    if (searchParams.has('staffId')) {
      filters.staffId = searchParams.get('staffId');
    }
    if (searchParams.has('packageId')) {
      filters.packageId = searchParams.get('packageId');
    }
    if (searchParams.has('startDate')) {
      filters.startDate = searchParams.get('startDate');
    }
    if (searchParams.has('endDate')) {
      filters.endDate = searchParams.get('endDate');
    }
    if (searchParams.has('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.has('includeDeleted')) {
      filters.includeDeleted = searchParams.get('includeDeleted') === 'true';
    }

    // ID parametresi varsa, belirli bir paket satışını getir
    if (searchParams.has('id')) {
      const id = searchParams.get('id') as string;
      const result = await callMcpApi('get-package-sale-by-id', { id });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Paket satışı bulunamadı' },
          { status: result.error === 'Paket satışı bulunamadı' ? 404 : 500 }
        );
      }
      
      return NextResponse.json(result.data);
    }

    // Filtrelere göre tüm paket satışlarını getir
    const result = await callMcpApi('get-package-sales', filters);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Paket satışları getirilirken bir hata oluştu' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Paket satışları getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Paket satışları getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST: Yeni bir paket satışı veya paket seansı veya ödeme oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Eylem tipine göre ilgili fonksiyonu çağır
    switch (action) {
      case 'create-package-sale':
        // Paket satışı oluştur
        const saleResult = await callMcpApi('create-package-sale', body);
        if (!saleResult.success) {
          return NextResponse.json(
            { error: saleResult.error || 'Paket satışı oluşturulamadı' },
            { status: 400 }
          );
        }
        return NextResponse.json(saleResult.data, { status: 201 });

      case 'create-package-session':
        // Paket seansı oluştur
        const sessionResult = await callMcpApi('create-package-session', body);
        if (!sessionResult.success) {
          return NextResponse.json(
            { error: sessionResult.error || 'Paket seansı oluşturulamadı' },
            { status: 400 }
          );
        }
        return NextResponse.json(sessionResult.data, { status: 201 });

      case 'create-payment':
        // Ödeme oluştur
        const paymentResult = await callMcpApi('create-payment', body);
        if (!paymentResult.success) {
          return NextResponse.json(
            { error: paymentResult.error || 'Ödeme oluşturulamadı' },
            { status: 400 }
          );
        }
        return NextResponse.json(paymentResult.data, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Paket satışı işlemi sırasında hata:', error);
    return NextResponse.json(
      { error: 'Paket satışı işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT: Bir paket satışını veya paket seansını güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID parametresi gereklidir' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update-package-sale':
        // Paket satışını güncelle
        const saleResult = await callMcpApi('update-package-sale', { id, ...body });
        if (!saleResult.success) {
          return NextResponse.json(
            { error: saleResult.error || 'Paket satışı güncellenemedi' },
            { status: 400 }
          );
        }
        return NextResponse.json(saleResult.data);

      case 'update-package-session':
        // Paket seansını güncelle
        const sessionResult = await callMcpApi('update-package-session', { id, ...body });
        if (!sessionResult.success) {
          return NextResponse.json(
            { error: sessionResult.error || 'Paket seansı güncellenemedi' },
            { status: 400 }
          );
        }
        return NextResponse.json(sessionResult.data);

      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Paket satışı güncelleme sırasında hata:', error);
    return NextResponse.json(
      { error: 'Paket satışı güncelleme sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE: Bir paket satışını, paket seansını veya ödemeyi sil
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'delete-package-sale';

    if (!id) {
      return NextResponse.json(
        { error: 'ID parametresi gereklidir' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'delete-package-sale':
        // Paket satışını sil
        const saleResult = await callMcpApi('delete-package-sale', { id });
        if (!saleResult.success) {
          return NextResponse.json(
            { error: saleResult.error || 'Paket satışı silinemedi' },
            { status: 400 }
          );
        }
        return NextResponse.json({ success: true, message: 'Paket satışı başarıyla silindi' });

      case 'delete-package-session':
        // Paket seansını sil
        const sessionResult = await callMcpApi('delete-package-session', { id });
        if (!sessionResult.success) {
          return NextResponse.json(
            { error: sessionResult.error || 'Paket seansı silinemedi' },
            { status: 400 }
          );
        }
        return NextResponse.json({ success: true, message: 'Paket seansı başarıyla silindi' });

      case 'delete-payment':
        // Ödemeyi sil
        const paymentResult = await callMcpApi('delete-payment', { id });
        if (!paymentResult.success) {
          return NextResponse.json(
            { error: paymentResult.error || 'Ödeme silinemedi' },
            { status: 400 }
          );
        }
        return NextResponse.json({ success: true, message: 'Ödeme başarıyla silindi' });

      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Paket satışı silme sırasında hata:', error);
    return NextResponse.json(
      { error: 'Paket satışı silme sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
