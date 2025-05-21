import { NextResponse } from 'next/server';

/**
 * Müşteri işlemleri için merkezi işlem fonksiyonu
 * Tüm müşteri ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handleCustomerOperations(toolName: string, toolArgs: any) {
  console.log(`[MCP API] [DEBUG] handleCustomerOperations başladı - Tool: ${toolName}`);
  console.log(`[MCP API] [DEBUG] handleCustomerOperations - Args:`, toolArgs);
  try {
    console.log(`[MCP API] Müşteri işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-customers':
        // Sunucu tarafı müşteri servisine yönlendir
        try {
          console.log('[MCP API] get-customers çağrılıyor, args:', toolArgs);
          
          // Filtre parametrelerini doğru şekilde işle
          let filters = {};
          
          // toolArgs bir boolean değer veya null/undefined ise
          if (typeof toolArgs === 'boolean' || toolArgs === null || toolArgs === undefined) {
            filters = { includeDeleted: Boolean(toolArgs) };
          }
          // toolArgs bir nesne ise
          else if (typeof toolArgs === 'object') {
            filters = { ...toolArgs };
          }
          
          console.log('[MCP API] get-customers için hazırlanan filtreler:', filters);
          
          try {
            // İlk import denemesi
            console.log('[MCP API] [DEBUG] get-customers - Import edilmeye çalışılıyor: @/services/db/customer');
            const { getCustomersFromDb } = await import('@/services/db/customer');
            console.log('[MCP API] [DEBUG] get-customers - Import başarılı');
            
            // Sunucu tarafı servisi çağır
            const result = await getCustomersFromDb(filters);
            
            console.log('[MCP API] get-customers servis sonucu:', {
              success: result.success,
              error: result.error || null,
              recordCount: result.data?.length || 0
            });
            
            return NextResponse.json(result, { 
              status: result.success ? 200 : 500 
            });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] get-customers - İlk import yolu hata verdi:', importError.message);
            console.error('[MCP API] [DEBUG] get-customers - Hata detayları:', {
              message: importError.message,
              stack: importError.stack?.split('\n').slice(0, 3).join('\n')
            });
            
            try {
              // Alternatif import yolu
              console.log('[MCP API] [DEBUG] get-customers - Alternatif yol deneniyor: @/services/db/customer/crudService');
              const { getCustomersFromDb } = await import('@/services/db/customer/crudService');
              console.log('[MCP API] [DEBUG] get-customers - Alternatif import başarılı');
              
              const result = await getCustomersFromDb(filters);
              return NextResponse.json(result, { 
                status: result.success ? 200 : 500 
              });
            } catch (secondImportError) {
              console.error('[MCP API] [DEBUG] get-customers - Alternatif import yolu da hata verdi:', secondImportError.message);
              
              return NextResponse.json(
                { 
                  success: false, 
                  error: `Müşteri servisi yüklenemedi: ${secondImportError.message}` 
                }, 
                { status: 500 }
              );
            }
          }
        } catch (error) {
          console.error('[MCP API] get-customers işleminde beklenmeyen hata:', error);
          console.error('[MCP API] get-customers hata detayları:', {
            message: error.message,
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
          });
          
          return NextResponse.json(
            { 
              success: false, 
              error: 'Müşteri listesi alınırken beklenmeyen bir hata oluştu',
              details: error.message 
            }, 
            { status: 500 }
          );
        }

      case 'get-customer-by-id':
        // Sunucu tarafı müşteri detayı getirme
        const { getCustomerByIdFromDb } = await import('@/services/db/customer');
        
        try {
          if (!toolArgs.id) {
            console.error('[MCP API] get-customer-by-id parametre hatası: id eksik');
            return NextResponse.json(
              { success: false, error: 'Müşteri ID bilgisi gerekli' },
              { status: 400 }
            );
          }
          
          console.log(`[MCP API] get-customer-by-id çağrılıyor, id: ${toolArgs.id}`);
          
          // Sunucu tarafı servisi çağır
          const customerResult = await getCustomerByIdFromDb(toolArgs.id);
          
          console.log(`[MCP API] get-customer-by-id sonucu: başarılı: ${customerResult.success}${customerResult.success ? ', veri bulundu' : ', hata: ' + customerResult.error}`);
          
          return NextResponse.json(customerResult, {
            status: customerResult.success ? 200 : (customerResult.error === 'Müşteri bulunamadı' ? 404 : 500)
          });
        } catch (error) {
          console.error('[MCP API] get-customer-by-id işleminde beklenmeyen hata:', error);
          return NextResponse.json(
            { success: false, error: 'Müşteri detayı alınırken beklenmeyen bir hata oluştu' },
            { status: 500 }
          );
        }

      case 'create-customer':
        const { createCustomerInDb } = await import('@/services/db/customer');
        const createResult = await createCustomerInDb(toolArgs);
        return NextResponse.json(createResult, { status: createResult.success ? 200 : 400 });

      case 'update-customer':
        const { updateCustomerInDb } = await import('@/services/db/customer');
        const updateResult = await updateCustomerInDb(toolArgs.id, {
          name: toolArgs.name,
          phone: toolArgs.phone,
          email: toolArgs.email,
          notes: toolArgs.notes
        });
        return NextResponse.json(updateResult, { status: updateResult.success ? 200 : 400 });

      case 'delete-customer':
        const { deleteCustomerFromDb } = await import('@/services/db/customer');
        const deleteResult = await deleteCustomerFromDb(toolArgs.id);
        return NextResponse.json(deleteResult, { status: deleteResult.success ? 200 : 400 });

      // Paket Satışları
      case 'get-package-sales-by-customer':
        console.log('[MCP API] get-package-sales-by-customer tool çağrıldı, argümanlar:', toolArgs);
        try {
          const { getPackageSalesByCustomerFromDb } = await import('@/services/db/packageSale');
          const salesResult = await getPackageSalesByCustomerFromDb(toolArgs.customerId, toolArgs.includeDeleted);

          // Paket satışlarındaki services alanını düzelt
          if (salesResult.success && salesResult.data && Array.isArray(salesResult.data)) {
            // Package tipini import et
            const { Package } = await import('@/services/db/package/types');
            
            salesResult.data = salesResult.data.map(sale => {
              if (sale.package) {
                // Doğru tipleme ile paket nesnesini işle
                const packageData = sale.package as Package;
                
                if (!packageData.services && packageData.packageServices) {
                  console.log(`[MCP API] [DEBUG] Müşteri paket satışındaki (${sale.id}) paket services alanı düzeltiliyor...`);
                  return {
                    ...sale,
                    package: {
                      ...packageData,
                      services: packageData.packageServices.map(ps => ({
                        id: ps.serviceId,
                        name: ps.service?.name || 'Bilinmeyen Hizmet',
                        duration: ps.service?.duration || 0,
                        price: ps.service?.price || 0
                      }))
                    }
                  };
                }
              }
              return sale;
            });
          }

          return NextResponse.json(salesResult, { status: salesResult.success ? 200 : 500 });
        } catch (error) {
          console.error('[MCP API] Müşteri paket satışları getirme hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Müşteri paket satışları alınırken bir hata oluştu: ${error.message || error}` 
          }, { status: 500 });
        }

      // Ürün Satışları
      case 'get-product-sales-by-customer':
        console.log('[MCP API] get-product-sales-by-customer tool çağrıldı, argümanlar:', toolArgs);
        try {
          try {
            const { getProductSalesByCustomerFromDb } = await import('@/services/db/productSale');
            const salesResult = await getProductSalesByCustomerFromDb(toolArgs.customerId, toolArgs.includeStaff);
            return NextResponse.json(salesResult, { status: salesResult.success ? 200 : 500 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            const { getProductSalesByCustomerFromDb } = await import('@/services/db/productSale/crudService');
            const salesResult = await getProductSalesByCustomerFromDb(toolArgs.customerId, toolArgs.includeStaff);
            return NextResponse.json(salesResult, { status: salesResult.success ? 200 : 500 });
          }
        } catch (error) {
          console.error('[MCP API] Müşteri ürün satışları getirme hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Müşteri ürün satışları alınırken bir hata oluştu: ${error.message || error}` 
          }, { status: 500 });
        }

      default:
        console.log(`[MCP API] Bilinmeyen müşteri işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen müşteri işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Müşteri işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Müşteri işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}