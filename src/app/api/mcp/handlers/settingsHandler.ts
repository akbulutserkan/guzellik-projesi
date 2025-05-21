import { NextResponse } from 'next/server';

/**
 * Sistem ayarları işlemleri için merkezi işlem fonksiyonu
 * Tüm ayarlar ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handleSettingsOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Ayar işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-business-days':
        console.log('[MCP API] get-business-days tool çağrıldı, argümanlar:', toolArgs);
        const { getBusinessDaysFromDb } = await import('@/services/db/settings');
        const daysResult = await getBusinessDaysFromDb();
        return NextResponse.json(daysResult, { status: daysResult.success ? 200 : 500 });

      case 'update-business-days':
        console.log('[MCP API] update-business-days tool çağrıldı, argümanlar:', toolArgs);
        const { updateBusinessDaysInDb } = await import('@/services/db/settings');
        const updateDaysResult = await updateBusinessDaysInDb(toolArgs);
        return NextResponse.json(updateDaysResult, { status: updateDaysResult.success ? 200 : 400 });

      case 'get-system-settings':
        console.log('[MCP API] get-system-settings tool çağrıldı, argümanlar:', toolArgs);
        const { getSystemSettingsFromDb } = await import('@/services/db/settings');
        const settingsResult = await getSystemSettingsFromDb();
        return NextResponse.json(settingsResult, { status: settingsResult.success ? 200 : 500 });

      case 'update-system-settings':
        console.log('[MCP API] update-system-settings tool çağrıldı, argümanlar:', toolArgs);
        const { updateSystemSettingsInDb } = await import('@/services/db/settings');
        const updateSettingsResult = await updateSystemSettingsInDb(toolArgs);
        return NextResponse.json(updateSettingsResult, { status: updateSettingsResult.success ? 200 : 400 });

      case 'get-working-hours':
        console.log('[MCP API] get-working-hours tool çağrıldı');
        const { getWorkingHoursFromDb } = await import('@/services/db/workingHours');
        const hoursResult = await getWorkingHoursFromDb();
        return NextResponse.json(hoursResult, { status: hoursResult.success ? 200 : 500 });

      case 'get-working-hours-by-staff':
        console.log('[MCP API] get-working-hours-by-staff tool çağrıldı, argümanlar:', toolArgs);
        const { getWorkingHoursByStaffFromDb } = await import('@/services/db/workingHours');
        const staffHoursResult = await getWorkingHoursByStaffFromDb(toolArgs.staffId);
        return NextResponse.json(staffHoursResult, { status: staffHoursResult.success ? 200 : 500 });

      case 'get-working-hour-by-id':
        console.log('[MCP API] get-working-hour-by-id tool çağrıldı, argümanlar:', toolArgs);
        const { getWorkingHourByIdFromDb } = await import('@/services/db/workingHours');
        const hourResult = await getWorkingHourByIdFromDb(toolArgs.id);
        return NextResponse.json(hourResult, { 
          status: hourResult.success ? 200 : (hourResult.error === 'Çalışma saati bulunamadı' ? 404 : 500) 
        });

      case 'create-working-hour':
        console.log('[MCP API] create-working-hour tool çağrıldı, argümanlar:', toolArgs);
        const { createWorkingHourInDb } = await import('@/services/db/workingHours');
        const createHourResult = await createWorkingHourInDb(toolArgs);
        return NextResponse.json(createHourResult, { status: createHourResult.success ? 201 : 400 });

      case 'update-working-hour':
        console.log('[MCP API] update-working-hour tool çağrıldı, argümanlar:', toolArgs);
        const { updateWorkingHourInDb } = await import('@/services/db/workingHours');
        const updateHourResult = await updateWorkingHourInDb(toolArgs.id, toolArgs.data);
        return NextResponse.json(updateHourResult, { status: updateHourResult.success ? 200 : 400 });

      case 'delete-working-hour':
        console.log('[MCP API] delete-working-hour tool çağrıldı, argümanlar:', toolArgs);
        const { deleteWorkingHourFromDb } = await import('@/services/db/workingHours');
        const deleteHourResult = await deleteWorkingHourFromDb(toolArgs.id);
        return NextResponse.json(deleteHourResult, { status: deleteHourResult.success ? 200 : 400 });

      case 'get-business-hours-details':
        console.log('[MCP API] get-business-hours-details tool çağrıldı');
        const { getBusinessHoursFromDb } = await import('@/services/db/workingHours');
        const businessHoursResult = await getBusinessHoursFromDb();
        return NextResponse.json(businessHoursResult, { status: businessHoursResult.success ? 200 : 500 });

      case 'get-working-hour-exceptions':
        console.log('[MCP API] get-working-hour-exceptions tool çağrıldı, argümanlar:', toolArgs);
        const { getWorkingHourExceptionsFromDb } = await import('@/services/db/workingHours');
        const exceptionsResult = await getWorkingHourExceptionsFromDb(toolArgs.date);
        return NextResponse.json(exceptionsResult, { status: exceptionsResult.success ? 200 : 500 });

      case 'create-working-hour-exception':
        console.log('[MCP API] create-working-hour-exception tool çağrıldı, argümanlar:', toolArgs);
        const { createWorkingHourExceptionInDb } = await import('@/services/db/workingHours');
        const createExceptionResult = await createWorkingHourExceptionInDb(toolArgs);
        return NextResponse.json(createExceptionResult, { status: createExceptionResult.success ? 201 : 400 });

      case 'update-working-hour-exception':
        console.log('[MCP API] update-working-hour-exception tool çağrıldı, argümanlar:', toolArgs);
        const { updateWorkingHourExceptionInDb } = await import('@/services/db/workingHours');
        const updateExceptionResult = await updateWorkingHourExceptionInDb(toolArgs.id, toolArgs.data);
        return NextResponse.json(updateExceptionResult, { status: updateExceptionResult.success ? 200 : 400 });

      case 'delete-working-hour-exception':
        console.log('[MCP API] delete-working-hour-exception tool çağrıldı, argümanlar:', toolArgs);
        const { deleteWorkingHourExceptionFromDb } = await import('@/services/db/workingHours');
        const deleteExceptionResult = await deleteWorkingHourExceptionFromDb(toolArgs.id);
        return NextResponse.json(deleteExceptionResult, { status: deleteExceptionResult.success ? 200 : 400 });

      default:
        console.log(`[MCP API] Bilinmeyen ayar işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen ayar işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Ayar işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Ayar işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}