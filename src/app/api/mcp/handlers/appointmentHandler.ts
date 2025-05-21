import { NextResponse } from 'next/server';

/**
 * Randevu işlemleri için merkezi işlem fonksiyonu
 * Tüm randevu ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handleAppointmentOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Randevu işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-appointments':
        console.log('[MCP API] get-appointments tool çağrıldı, argümanlar:', toolArgs);
        // Sunucu tarafındaki getAppointmentsFromDb fonksiyonunu çağır
        const { getAppointmentsFromDb } = await import('@/services/db/appointment');
        console.log('[MCP API] getAppointmentsFromDb fonksiyonu import edildi, çağrılıyor...');
        const result = await getAppointmentsFromDb(toolArgs);
        console.log('[MCP API] getAppointmentsFromDb sonuç:', result.success, 'veri sayısı:', result.data?.length || 0);
        return NextResponse.json(result, { status: result.success ? 200 : 500 });

      case 'get-appointment-by-id':
        const { getAppointmentByIdFromDb } = await import('@/services/db/appointment');
        const appointmentResult = await getAppointmentByIdFromDb(toolArgs.id);
        return NextResponse.json(appointmentResult, { status: appointmentResult.success ? 200 : 404 });

      case 'create-appointment':
        console.log('[MCP API] create-appointment tool çağrılıyor, argümanlar:', JSON.stringify(toolArgs, null, 2));
        
        try {
          // Sunucu tarafındaki createAppointmentInDb fonksiyonunu çağır
          const { createAppointmentInDb } = await import('@/services/db/appointment');
          console.log('[MCP API] createAppointmentInDb fonksiyonu import edildi');
          
          const createResult = await createAppointmentInDb(toolArgs);
          console.log('[MCP API] createAppointmentInDb çağrısı sonucu:', JSON.stringify({
            success: createResult.success, 
            error: createResult.error,
            data: createResult.data ? `ID: ${createResult.data.id}` : null
          }, null, 2));
          
          if (!createResult.success) {
            console.error('[MCP API] create-appointment işlemi başarısız:', createResult.error);
            return NextResponse.json(createResult, { status: 400 }); // Hata durumunda 400 Bad Request döndür
          }
          
          console.log('[MCP API] create-appointment işlemi başarılı');
          return NextResponse.json(createResult, { status: 200 });
        } catch (error) {
          console.error('[MCP API] create-appointment işleminde beklenmeyen hata:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Randevu oluşturulurken beklenmeyen bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
          }, { status: 500 });
        }

      case 'update-appointment':
        const { updateAppointmentInDb } = await import('@/services/db/appointment');
        const updateResult = await updateAppointmentInDb(toolArgs.id, {
          startTime: toolArgs.startTime,
          endTime: toolArgs.endTime,
          staffId: toolArgs.staffId,
          serviceId: toolArgs.serviceId,
          notes: toolArgs.notes,
          status: toolArgs.status,
          attendance: toolArgs.attendance
        });
        return NextResponse.json(updateResult, { status: updateResult.success ? 200 : 500 });

      case 'delete-appointment':
        const { deleteAppointmentFromDb } = await import('@/services/db/appointment');
        const deleteResult = await deleteAppointmentFromDb(toolArgs.id);
        return NextResponse.json(deleteResult, { status: deleteResult.success ? 200 : 500 });

      case 'update-appointment-status':
        const { updateAppointmentStatusInDb } = await import('@/services/db/appointment');
        const statusResult = await updateAppointmentStatusInDb(toolArgs.id, toolArgs.status);
        return NextResponse.json(statusResult, { status: statusResult.success ? 200 : 500 });

      case 'update-appointment-notes':
        const { updateNotesInDb } = await import('@/services/db/appointment');
        const notesResult = await updateNotesInDb(toolArgs.id, {
          notes: toolArgs.notes
        });
        return NextResponse.json(notesResult, { status: notesResult.success ? 200 : 500 });

      case 'get-calendar-appointments':
        const { getCalendarAppointmentsFromDb } = await import('@/services/db/appointment');
        const calendarResult = await getCalendarAppointmentsFromDb({
          startDate: toolArgs.startDate,
          endDate: toolArgs.endDate,
          staffId: toolArgs.staffId,
          customerId: toolArgs.customerId
        });
        return NextResponse.json(calendarResult, { status: calendarResult.success ? 200 : 500 });

      case 'get-calendar-data':
        console.log('[MCP API] get-calendar-data tool çağrıldı, argümanlar:', toolArgs);
        const { getCalendarDataFromDb } = await import('@/services/db/appointment');
        console.log('[MCP API] getCalendarDataFromDb fonksiyonu import edildi');
        const calendarDataResult = await getCalendarDataFromDb(toolArgs);
        console.log('[MCP API] getCalendarDataFromDb sonuç:', calendarDataResult.success, 'personel sayısı:', calendarDataResult.data?.staff?.length || 0, 'randevu sayısı:', calendarDataResult.data?.appointments?.length || 0);
        return NextResponse.json(calendarDataResult, { status: calendarDataResult.success ? 200 : 500 });

      case 'check-staff-availability':
        const { checkStaffAvailabilityFromDb } = await import('@/services/db/appointment');
        const availabilityResult = await checkStaffAvailabilityFromDb(
          toolArgs.staffId,
          toolArgs.startTime,
          toolArgs.endTime,
          toolArgs.excludeEventId
        );
        return NextResponse.json(availabilityResult, { status: availabilityResult.success ? 200 : 500 });

      case 'update-appointment-drag':
        const { updateAppointmentDragFromDb } = await import('@/services/db/appointment');
        const dragResult = await updateAppointmentDragFromDb(toolArgs);
        return NextResponse.json(dragResult, { status: dragResult.success ? 200 : 500 });

      case 'get-business-hours':
        const { getBusinessHoursFromDb } = await import('@/services/db/appointment');
        const hoursResult = await getBusinessHoursFromDb();
        return NextResponse.json(hoursResult, { status: hoursResult.success ? 200 : 500 });

      case 'get-customer-appointments':
        const { getCustomerAppointmentsFromDb } = await import('@/services/db/appointment');
        const customerAppointmentsResult = await getCustomerAppointmentsFromDb(toolArgs.customerId, toolArgs.date);
        return NextResponse.json(customerAppointmentsResult, { status: customerAppointmentsResult.success ? 200 : 500 });

      default:
        console.log(`[MCP API] Bilinmeyen randevu işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen randevu işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Randevu işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Randevu işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}