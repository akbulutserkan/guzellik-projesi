import { NextResponse } from 'next/server';

/**
 * Hizmet işlemleri için merkezi işlem fonksiyonu
 * Tüm hizmet ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handleServiceOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Hizmet işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-services':
        console.log('[MCP API] get-services tool çağrıldı, argümanlar:', toolArgs);
        const { getServicesFromDb } = await import('@/services/db/service');
        const result = await getServicesFromDb(toolArgs);
        return NextResponse.json(result, { status: result.success ? 200 : 500 });

      case 'get-service-categories':
        console.log('[MCP API] get-service-categories tool çağrıldı');
        const { getServiceCategoriesFromDb } = await import('@/services/db/service');
        const categoriesResult = await getServiceCategoriesFromDb();
        console.log('[MCP API] get-service-categories yanıtı:', categoriesResult.success ? 'başarılı' : 'başarısız');
        return NextResponse.json(categoriesResult, { status: categoriesResult.success ? 200 : 500 });

      case 'get-service-by-id':
        console.log('[MCP API] get-service-by-id tool çağrıldı, argümanlar:', toolArgs);
        const { getServiceByIdFromDb } = await import('@/services/db/service');
        const serviceResult = await getServiceByIdFromDb(toolArgs.id);
        return NextResponse.json(serviceResult, { 
          status: serviceResult.success ? 200 : (serviceResult.error === 'Hizmet bulunamadı' ? 404 : 500) 
        });

      case 'get-service-category-by-id':
        console.log('[MCP API] get-service-category-by-id tool çağrıldı, argümanlar:', toolArgs);
        const { getServiceCategoryByIdFromDb } = await import('@/services/db/service');
        const categoryResult = await getServiceCategoryByIdFromDb(toolArgs.id);
        return NextResponse.json(categoryResult, { 
          status: categoryResult.success ? 200 : (categoryResult.error === 'Kategori bulunamadı' ? 404 : 500) 
        });

      case 'add-service-category':
        console.log('[MCP API] add-service-category tool çağrıldı, argümanlar:', toolArgs);
        const { createServiceCategoryInDb } = await import('@/services/db/service');
        const createCategoryResult = await createServiceCategoryInDb(toolArgs.name);
        return NextResponse.json(createCategoryResult, { status: createCategoryResult.success ? 200 : 400 });

      case 'update-service-category':
        console.log('[MCP API] update-service-category tool çağrıldı, argümanlar:', toolArgs);
        const { updateServiceCategoryInDb } = await import('@/services/db/service');
        const updateCategoryResult = await updateServiceCategoryInDb(toolArgs.id, toolArgs.name);
        return NextResponse.json(updateCategoryResult, { status: updateCategoryResult.success ? 200 : 400 });

      case 'delete-service-category':
        console.log('[MCP API] delete-service-category tool çağrıldı, argümanlar:', toolArgs);
        const { deleteServiceCategoryFromDb } = await import('@/services/db/service');
        const deleteCategoryResult = await deleteServiceCategoryFromDb(toolArgs.id);
        return NextResponse.json(deleteCategoryResult, { status: deleteCategoryResult.success ? 200 : 400 });

      case 'add-service':
      case 'create-service':
        console.log(`[MCP API] [DEBUG] ${toolName} tool çağrıldı, argümanlar:`, JSON.stringify(toolArgs, null, 2));
        try {
          const { createServiceInDb } = await import('@/services/db/service');
          // Veri temizleme ve validasyon
          const cleanData = {
            name: toolArgs.name,
            price: Number(toolArgs.price),
            duration: Number(toolArgs.duration),
            categoryId: toolArgs.categoryId,
            isActive: toolArgs.isActive !== undefined ? Boolean(toolArgs.isActive) : true
          };
          
          console.log('[MCP API] [DEBUG] Temizlenmiş veri ile createServiceInDb çağrılıyor:', JSON.stringify(cleanData, null, 2));
          
          const createResult = await createServiceInDb(cleanData);
          
          console.log('[MCP API] [DEBUG] createServiceInDb sonucu:', {
            success: createResult.success,
            error: createResult.error || 'YOK',
            dataId: createResult.data?.id || 'YOK'
          });
          
          return NextResponse.json(createResult, { status: createResult.success ? 200 : 400 });
        } catch (error) {
          console.error('[MCP API] [DEBUG] createServiceInDb HATA:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Hizmet oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
          }, { status: 500 });
        }

      case 'update-service':
        console.log('[MCP API] update-service tool çağrıldı, argümanlar:', toolArgs);
        const { updateServiceInDb } = await import('@/services/db/service');
        const updateResult = await updateServiceInDb(toolArgs.id, {
          name: toolArgs.name,
          duration: toolArgs.duration,
          price: toolArgs.price,
          categoryId: toolArgs.categoryId,
          isActive: toolArgs.isActive
        });
        return NextResponse.json(updateResult, { status: updateResult.success ? 200 : 400 });

      case 'delete-service':
        console.log('[MCP API] delete-service tool çağrıldı, argümanlar:', toolArgs);
        const { deleteServiceFromDb } = await import('@/services/db/service');
        const deleteResult = await deleteServiceFromDb(toolArgs.id);
        return NextResponse.json(deleteResult, { status: deleteResult.success ? 200 : 400 });

      case 'bulk-update-service-prices':
        const { bulkUpdateServicePricesInDb } = await import('@/services/db/service');
        const bulkUpdateResult = await bulkUpdateServicePricesInDb(toolArgs);
        return NextResponse.json(bulkUpdateResult, { status: bulkUpdateResult.success ? 200 : 400 });

      case 'bulk-update-preview':
        const { bulkUpdatePreviewServicePricesInDb } = await import('@/services/db/service');
        const previewResult = await bulkUpdatePreviewServicePricesInDb(toolArgs);
        return NextResponse.json(previewResult, { status: previewResult.success ? 200 : 400 });

      case 'get-service-price-history':
        const { getServicePriceHistoryFromDb } = await import('@/services/db/service');
        const historyResult = await getServicePriceHistoryFromDb();
        return NextResponse.json(historyResult, { status: historyResult.success ? 200 : 500 });

      case 'revert-price-history':
        const { revertPriceHistoryInDb } = await import('@/services/db/service');
        const revertResult = await revertPriceHistoryInDb(toolArgs.id);
        return NextResponse.json(revertResult, { status: revertResult.success ? 200 : 400 });

      default:
        console.log(`[MCP API] Bilinmeyen hizmet işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen hizmet işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Hizmet işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Hizmet işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}