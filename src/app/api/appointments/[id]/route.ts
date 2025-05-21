import { NextResponse } from 'next/server';
import { getAppointmentByIdFromDb, updateAppointmentInDb, deleteAppointmentFromDb } from '@/services/db/appointment';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Randevu ID'sini al
    const appointmentId = params.id.toString();
    console.log('[API-Appointments-GET-ID] Görüntülenen Randevu ID:', appointmentId);
    
    // İsteğin URL parametrelerini al
    const searchParams = new URL(request.url).searchParams;
    const includeServices = searchParams.get('includeServices') === 'true';
    
    // Servis katmanını çağır
    const result = await getAppointmentByIdFromDb(appointmentId, includeServices);
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error || 'Randevu bulunamadı' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[API-Appointments-GET-ID] Randevu getirme hatası:', error);
    return NextResponse.json(
      { error: 'Randevu getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Randevu ID'sini al
    const appointmentId = params.id.toString();
    
    // İstek verilerini al
    const data = await request.json();
    console.log('[API-Appointments-PUT] Güncellenen veriler:', data);

    // Status kontrolü ve öncelikli alanları ayarla
    let status = data.status || 'PENDING';
    let attendance = data.attendance;

    // Frontend'den gelen Türkçe durum değerini veritabanı enum değerine dönüştür
    if (status === 'gelmedi' || status === 'NO_SHOW') {
      status = 'NO_SHOW';
      attendance = 'NO_SHOW';
    } else if (status === 'geldi' || status === 'COMPLETED') {
      status = 'COMPLETED';
      attendance = 'ATTENDED';
    } else if (data.attendance === 'ATTENDED') {
      status = 'COMPLETED';
    } else if (data.attendance === 'NO_SHOW') {
      status = 'NO_SHOW';
    }
    
    // SCHEDULED değeri gönderilmişse PENDING olarak düzelt
    if (status === 'SCHEDULED') {
      status = 'PENDING';
    }
    
    // Log yaz
    console.log('[API-Appointments-PUT] Güncellenen Randevu ID:', appointmentId);
    console.log('[API-Appointments-PUT] Yeni Durum:', status);
    console.log('[API-Appointments-PUT] Katılım:', attendance);

    // Güncelleme verilerini hazırla
    const updateData = {
      attendance: attendance || data.attendance,
      notes: data.notes,
      status: status,
      staffId: data.staffId,
      serviceId: data.serviceId,
      startTime: data.startTime,
      endTime: data.endTime
    };

    // Servis katmanını çağır
    const result = await updateAppointmentInDb(appointmentId, updateData);

    if (result.success) {
      // Eğer müşteri geldi ve tahsilat tutarı girilmişse ödeme kaydı oluştur
      // NOT: Bu kısım aslında business logic - ideal olarak service katmanında olmalı
      // Ancak örnek olması için şimdilik bu şekilde bırakıyoruz
      if (data.attendance === 'ATTENDED' && data.amount) {
        try {
          console.log('[API-Appointments-PUT] Tahsilat kaydı oluşturuluyor');
          // Burada payment oluşturma işlemi service katmanına taşınmalı
          // ödeme işlemi için ApiService.payments.create veya uygun bir MCP çağrısı yapılabilir
        } catch (error) {
          console.error('[API-Appointments-PUT] Ödeme kaydı oluşturma hatası:', error);
          // Ödeme hatası olsa bile randevu güncellemesi devam etsin
        }
      }
      
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.error || 'Randevu güncellenirken bir hata oluştu' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API-Appointments-PUT] Randevu/Tahsilat güncelleme hatası:', error);
    
    // Hata detaylarını kapsamlı olarak logla
    if (error instanceof Error) {
      console.error('Hata mesajı:', error.message);
      console.error('Hata yığını:', error.stack);
    }
    
    // Daha açıklayıcı hata mesajı ile cevap ver
    return NextResponse.json(
      { 
        error: 'Güncelleme sırasında bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Randevu ID'sini al
    const appointmentId = params.id.toString();
    console.log('[API-Appointments-DELETE] Silinecek Randevu ID:', appointmentId);
    
    // Servis katmanını çağır
    const result = await deleteAppointmentFromDb(appointmentId);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Randevu başarıyla silindi' });
    } else {
      return NextResponse.json(
        { error: result.error || 'Randevu silinirken bir hata oluştu' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[API-Appointments-DELETE] Randevu silme hatası:', error);
    return NextResponse.json(
      { error: 'Randevu silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}