import { NextResponse } from 'next/server';

/**
 * Ürün satışı işlemleri için merkezi işlem fonksiyonu
 * Tüm ürün satışı ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handleProductSaleOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Ürün satışı işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-product-sales':
        console.log('[MCP API] get-product-sales tool çağrıldı, argümanlar:', toolArgs);
        try {
          console.log('[MCP API] [DEBUG] productSale DB servisini import etmeye çalışıyor...');
          
          // Hata nerede olabilecek diye birkaç farklı import yolunu deniyoruz
          try {
            console.log('[MCP API] [DEBUG] İlk yol deneniyor: @/services/db/productSale');
            const { getProductSalesFromDb } = await import('@/services/db/productSale');
            console.log('[MCP API] [DEBUG] İlk yol başarılı!');
            
            // Ürün satışlarını getir
            console.log('[MCP API] [DEBUG] getProductSalesFromDb fonksiyonu çağrılıyor...');
            const result = await getProductSalesFromDb(toolArgs);
            return NextResponse.json(result, { status: result.success ? 200 : 500 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            try {
              console.log('[MCP API] [DEBUG] İkinci yol deneniyor: @/services/db/productSale/crudService');
              const { getProductSalesFromDb } = await import('@/services/db/productSale/crudService');
              console.log('[MCP API] [DEBUG] İkinci yol başarılı!');
              
              // Ürün satışlarını getir
              console.log('[MCP API] [DEBUG] getProductSalesFromDb fonksiyonu çağrılıyor...');
              const result = await getProductSalesFromDb(toolArgs);
              return NextResponse.json(result, { status: result.success ? 200 : 500 });
            } catch (secondImportError) {
              console.error('[MCP API] [DEBUG] İkinci import yolu da hata verdi:', secondImportError.message);
              throw new Error(`ProductSale modülü import edilemedi: İlk hata: ${importError.message}, İkinci hata: ${secondImportError.message}`);
            }
          }
        } catch (error) {
          console.error('[MCP API] [ERROR] get-product-sales çağrısında ciddi hata:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Ürün satışları getirilirken beklenmeyen bir hata oluştu: ${error.message || error}`,
            stackTrace: error.stack
          }, { status: 500 });
        }

      case 'get-product-sale-by-id':
        console.log('[MCP API] get-product-sale-by-id tool çağrıldı, argümanlar:', toolArgs);
        try {
          try {
            const { getProductSaleByIdFromDb } = await import('@/services/db/productSale');
            const result = await getProductSaleByIdFromDb(toolArgs.id);
            return NextResponse.json(result, { status: result.success ? 200 : 500 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            const { getProductSaleByIdFromDb } = await import('@/services/db/productSale/crudService');
            const result = await getProductSaleByIdFromDb(toolArgs.id);
            return NextResponse.json(result, { status: result.success ? 200 : 500 });
          }
        } catch (error) {
          console.error('[MCP API] Ürün satışı detayı getirme hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Ürün satışı detayı alınırken bir hata oluştu: ${error.message || error}` 
          }, { status: 500 });
        }

      case 'create-product-sale':
        console.log('[MCP API] create-product-sale tool çağrıldı, argümanlar:', toolArgs);
        try {
          try {
            const { createProductSaleInDb } = await import('@/services/db/productSale');
            const result = await createProductSaleInDb(toolArgs);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            const { createProductSaleInDb } = await import('@/services/db/productSale/crudService');
            const result = await createProductSaleInDb(toolArgs);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
          }
        } catch (error) {
          console.error('[MCP API] Ürün satışı oluşturma hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Ürün satışı oluşturulurken bir hata oluştu: ${error.message || error}` 
          }, { status: 400 });
        }

      case 'update-product-sale':
        console.log('[MCP API] update-product-sale tool çağrıldı, argümanlar:', toolArgs);
        try {
          try {
            const { updateProductSaleInDb } = await import('@/services/db/productSale');
            const result = await updateProductSaleInDb(toolArgs.id, {
              quantity: toolArgs.quantity,
              unitPrice: toolArgs.unitPrice,
              paymentType: toolArgs.paymentType,
              paymentStatus: toolArgs.paymentStatus,
              isFullyPaid: toolArgs.isFullyPaid,
              notes: toolArgs.notes,
              staffId: toolArgs.staffId,
              date: toolArgs.date
            });
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            const { updateProductSaleInDb } = await import('@/services/db/productSale/crudService');
            const result = await updateProductSaleInDb(toolArgs.id, {
              quantity: toolArgs.quantity,
              unitPrice: toolArgs.unitPrice,
              paymentType: toolArgs.paymentType,
              paymentStatus: toolArgs.paymentStatus,
              isFullyPaid: toolArgs.isFullyPaid,
              notes: toolArgs.notes,
              staffId: toolArgs.staffId,
              date: toolArgs.date
            });
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
          }
        } catch (error) {
          console.error('[MCP API] Ürün satışı güncelleme hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Ürün satışı güncellenirken bir hata oluştu: ${error.message || error}` 
          }, { status: 400 });
        }

      case 'delete-product-sale':
        console.log('[MCP API] delete-product-sale tool çağrıldı, argümanlar:', toolArgs);
        try {
          try {
            const { deleteProductSaleFromDb } = await import('@/services/db/productSale');
            const result = await deleteProductSaleFromDb(toolArgs.id);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            const { deleteProductSaleFromDb } = await import('@/services/db/productSale/crudService');
            const result = await deleteProductSaleFromDb(toolArgs.id);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
          }
        } catch (error) {
          console.error('[MCP API] Ürün satışı silme hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Ürün satışı silinirken bir hata oluştu: ${error.message || error}` 
          }, { status: 400 });
        }

      default:
        console.log(`[MCP API] Bilinmeyen ürün satışı işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen ürün satışı işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Ürün satışı işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Ürün satışı işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}