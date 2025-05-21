import { NextResponse } from 'next/server';

/**
 * Paket satışı işlemleri için merkezi işlem fonksiyonu
 * Tüm paket satışı ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handlePackageSaleOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Paket satışı işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-package-sales':
        console.log('[MCP API] get-package-sales tool çağrıldı, argümanlar:', toolArgs);
        const { getPackageSalesFromDb } = await import('@/services/db/packageSale');
        const salesResult = await getPackageSalesFromDb(toolArgs);
        return NextResponse.json(salesResult, { status: salesResult.success ? 200 : 500 });

      case 'get-package-sale-by-id':
        console.log('[MCP API] get-package-sale-by-id tool çağrıldı, argümanlar:', toolArgs);
        try {
          const { getPackageSaleByIdFromDb } = await import('@/services/db/packageSale');
          const result = await getPackageSaleByIdFromDb(toolArgs.id);
          
          if (result.success && result.data) {
            // Package tipini import et
            const { Package } = await import('@/services/db/package/types');
            
            // Tek bir paket satışı için services alanını düzenle
            if (result.data.package) {
              // Doğru tipleme ile paket nesnesini işle
              const packageData = result.data.package as Package;
              
              if (!packageData.services && packageData.packageServices) {
                result.data.package.services = packageData.packageServices.map(ps => ({
                  id: ps.serviceId,
                  name: ps.service?.name || 'Bilinmeyen Hizmet',
                  duration: ps.service?.duration || 0,
                  price: ps.service?.price || 0
                }));
                // API yanıtında hem packageServices hem de services var
                console.log(`[MCP API] [DEBUG] Paket services alanı düzeltildi`);
              }
            }
          }
          
          return NextResponse.json(result, { status: result.success ? 200 : (result.error === 'Paket satışı bulunamadı' ? 404 : 500) });
        } catch (error) {
          console.error('[MCP API] Paket satışı detayı getirilirken hata:', error);
          return NextResponse.json({
            success: false,
            error: `Paket satışı detayı getirilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
          }, { status: 500 });
        }

      case 'create-package-sale':
        console.log('[MCP API] create-package-sale tool çağrıldı, argümanlar:', toolArgs);
        const { createPackageSaleInDb } = await import('@/services/db/packageSale');
        const createResult = await createPackageSaleInDb(toolArgs);
        return NextResponse.json(createResult, { status: createResult.success ? 200 : 400 });

      case 'update-package-sale':
        console.log('[MCP API] update-package-sale tool çağrıldı, argümanlar:', toolArgs);
        const { updatePackageSaleInDb } = await import('@/services/db/packageSale');
        const updateResult = await updatePackageSaleInDb(toolArgs.id, {
          price: toolArgs.price,
          saleDate: toolArgs.saleDate,
          expiryDate: toolArgs.expiryDate,
          staffId: toolArgs.staffId,
          notes: toolArgs.notes,
          isCompleted: toolArgs.isCompleted
        });
        return NextResponse.json(updateResult, { status: updateResult.success ? 200 : 400 });

      case 'delete-package-sale':
        console.log('[MCP API] delete-package-sale tool çağrıldı, argümanlar:', toolArgs);
        const { deletePackageSaleFromDb } = await import('@/services/db/packageSale');
        const deleteResult = await deletePackageSaleFromDb(toolArgs.id);
        return NextResponse.json(deleteResult, { status: deleteResult.success ? 200 : 400 });

      default:
        console.log(`[MCP API] Bilinmeyen paket satışı işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen paket satışı işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Paket satışı işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Paket satışı işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}