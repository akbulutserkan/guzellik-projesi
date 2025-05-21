/**
 * Personel işlemleri için merkezi işlem fonksiyonu
 * Tüm personel ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns API yanıtı ve durum kodu
 */
export async function handleStaffOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Personel işlemi çağrıldı: ${toolName}`, toolArgs);
    
    const { 
      getStaffFromDb, 
      getStaffByIdFromDb, 
      createStaffInDb, 
      updateStaffInDb, 
      deleteStaffFromDb,
      updateStaffPermissionsInDb,
      getStaffScheduleFromDb,
      getStaffAvailabilityFromDb,
      validateWorkingHoursFromDb
    } = await import('@/services/db/staff');
    
    let result, statusCode;
    
    switch (toolName) {
      case 'get-staff':
        result = await getStaffFromDb({ includeInactive: toolArgs?.includeInactive });
        statusCode = result.success ? 200 : 500;
        break;
        
      case 'get-staff-by-id':
        result = await getStaffByIdFromDb(toolArgs.id);
        statusCode = result.success ? 200 : (result.error === 'Personel bulunamadı' ? 404 : 500);
        break;
        
      case 'create-staff':
        result = await createStaffInDb(toolArgs);
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'update-staff':
        result = await updateStaffInDb(toolArgs.id, {
          name: toolArgs.name,
          phone: toolArgs.phone,
          email: toolArgs.email,
          position: toolArgs.position,
          accountType: toolArgs.accountType,
          serviceGender: toolArgs.serviceGender,
          password: toolArgs.password,
          showInCalendar: toolArgs.showInCalendar,
          workingHours: toolArgs.workingHours,
          services: toolArgs.services
        });
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'delete-staff':
        result = await deleteStaffFromDb(toolArgs.id);
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'update-staff-permissions':
        const permissions = Array.isArray(toolArgs.permissions) ? toolArgs.permissions : [];
        result = await updateStaffPermissionsInDb(toolArgs.id, permissions);
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'get-staff-schedule':
        result = await getStaffScheduleFromDb(toolArgs.staffId, toolArgs.date);
        statusCode = result.success ? 200 : 500;
        break;
        
      case 'get-staff-availability':
        result = await getStaffAvailabilityFromDb(toolArgs.staffId, toolArgs.date);
        statusCode = result.success ? 200 : 500;
        break;
        
      case 'validate-working-hours':
        result = await validateWorkingHoursFromDb(toolArgs.workingHours);
        statusCode = result.success ? 200 : 400;
        break;
        
      default:
        result = { success: false, error: 'Bilinmeyen personel işlemi' };
        statusCode = 400;
    }
    
    console.log(`[MCP API] Personel işlemi sonucu:`, result.success ? 'başarılı' : `hata: ${result.error}`);  
    return { result, statusCode };
  } catch (error) {
    console.error(`[MCP API] Personel işlemi sırasında hata:`, error);
    return { 
      result: { 
        success: false, 
        error: `Personel işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
      }, 
      statusCode: 500 
    };
  }
}