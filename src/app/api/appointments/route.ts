import { NextResponse } from 'next/server';
import { getAppointmentsFromDb, createAppointmentInDb } from '@/services/db/appointment';
export const dynamic = 'force-dynamic'; // Next.js 15 için önbellekleme davranışını devre dışı bırak

// Randevuları listele - Merkezi mimariye bağlı
export async function GET(request: Request) {
  try {
    console.log('[API-Appointments-GET] İstek alındı');
    
    // URL parametrelerini çıkar
    const searchParams = new URL(request.url).searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const view = searchParams.get('view'); // 'calendar' veya 'list' için

    console.log(`[API-Appointments-GET] Parametreler: startDate=${startDate}, endDate=${endDate}, staffId=${staffId}, customerId=${customerId}, status=${status}, view=${view}`);

    // Filtreleri oluştur
    const filters: any = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (staffId) filters.staffId = staffId;
    if (customerId) filters.customerId = customerId;
    if (status) filters.status = status;
    
    // Görünüm tipine göre filtreleme
    if (view === 'calendar') {
      // Takvim görünümünde sadece aktif randevuları göstermek için özel bir işlem yapılabilir
      // Bu şimdilik appointment-service içinde hallediliyor
    }

    // Servis katmanını çağır
    const result = await getAppointmentsFromDb(filters);

    if (result.success) {
      console.log(`[API-Appointments-GET] ${result.data?.length || 0} randevu bulundu`);
      return NextResponse.json(result.data);
    } else {
      console.error('[API-Appointments-GET] Hata:', result.error);
      return NextResponse.json(
        { error: result.error || 'Randevular listelenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API-Appointments-GET] Detaylı hata:', error instanceof Error ? error.stack : JSON.stringify(error));
    return NextResponse.json(
      { error: 'Randevular listelenirken bir hata oluştu', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Yeni randevu oluştur - Merkezi mimariye bağlı
export async function POST(request: Request) {
  try {
    console.log('[API-Appointments-POST] Yeni randevu isteği alındı');
    const body = await request.json();
    console.log('[API-Appointments-POST] Body içeriği:', JSON.stringify({
      customerId: body.customerId,
      staffId: body.staffId,
      serviceId: body.serviceId,
      startTime: body.startTime,
      // Diğer hassas olmayan alanlar
    }));

    // Gerekli alanların kontrolü
    if (!body.customerId || !body.staffId || !body.serviceId || !body.startTime) {
      console.log('[API-Appointments-POST] Eksik alanlar var, istek ret edildi');
      return NextResponse.json(
        { error: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      );
    }

    // Servis katmanını çağır
    const result = await createAppointmentInDb({
      customerId: body.customerId,
      staffId: body.staffId,
      serviceId: body.serviceId,
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes,
      status: body.status,
      forceCreate: body.forceCreate
    });

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      // Çakışma hatası için özel durum
      if (result.error?.includes('başka bir randevusu') || result.error?.includes('çakışma')) {
        return NextResponse.json(
          { error: result.error },
          { status: 409 } // Conflict
        );
      }
      
      console.error('[API-Appointments-POST] Hata:', result.error);
      return NextResponse.json(
        { error: result.error || 'Randevu oluşturulurken bir hata oluştu' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Randevu oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}