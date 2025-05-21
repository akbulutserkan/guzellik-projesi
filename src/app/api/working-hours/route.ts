// src/app/api/working-hours/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getWorkingHoursFromDb,
  getWorkingHoursByStaffFromDb,
  getBusinessHoursFromDb,
  getWorkingHourExceptionsFromDb
} from '@/lib/working-hours-service';

/**
 * Bu API endpoint'i artık merkezi API mimarisine geçiş için güncellenmiştir.
 * Tüm çalışma saatleri işlemleri merkezi MCP API aracılığıyla 
 * '/api/mcp' endpoint'ine ve '/lib/working-hours-service' modülüne yönlendirilir.
 */

/**
 * GET /api/working-hours
 * Çalışma saatlerini getirir
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/working-hours isteği alındı');
    
    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');
    
    // Her zaman işletme çalışma saatlerini al
    const businessHoursResult = await getBusinessHoursFromDb();
    
    if (!businessHoursResult.success) {
      console.error('[API] İşletme çalışma saatleri alınırken hata:', businessHoursResult.error);
      return NextResponse.json(
        { success: false, error: 'İşletme çalışma saatleri alınırken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Istisnaları getir (eğer tarih belirtilmişse)
    const exceptionsResult = await getWorkingHourExceptionsFromDb(date);
    
    if (!exceptionsResult.success) {
      console.error('[API] Çalışma saati istisnaları alınırken hata:', exceptionsResult.error);
      return NextResponse.json(
        { success: false, error: 'Çalışma saati istisnaları alınırken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Eğer staffId belirtilmişse, personel çalışma saatlerini getir
    let staffWorkingHoursResult = { success: true, data: [] };
    
    if (staffId) {
      staffWorkingHoursResult = await getWorkingHoursByStaffFromDb(staffId);
      
      if (!staffWorkingHoursResult.success) {
        console.error('[API] Personel çalışma saatleri alınırken hata:', staffWorkingHoursResult.error);
        return NextResponse.json(
          { success: false, error: 'Personel çalışma saatleri alınırken bir hata oluştu' },
          { status: 500 }
        );
      }
    } else {
      // StaffId belirtilmemişse tüm çalışma saatlerini getir
      staffWorkingHoursResult = await getWorkingHoursFromDb();
      
      if (!staffWorkingHoursResult.success) {
        console.error('[API] Tüm çalışma saatleri alınırken hata:', staffWorkingHoursResult.error);
        return NextResponse.json(
          { success: false, error: 'Tüm çalışma saatleri alınırken bir hata oluştu' },
          { status: 500 }
        );
      }
    }

    // Tüm verileri birleştir ve döndür
    return NextResponse.json({
      success: true,
      data: {
        businessHours: businessHoursResult.data,
        staffWorkingHours: staffWorkingHoursResult.data,
        exceptions: exceptionsResult.data
      }
    });
  } catch (error) {
    console.error('[API] Çalışma saatleri getirilirken beklenmeyen hata:', error);
    return NextResponse.json(
      { success: false, error: 'Çalışma saatleri getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
