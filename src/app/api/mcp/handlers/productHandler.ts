/**
 * Ürün işlemleri için merkezi işlem fonksiyonu
 * Tüm ürün ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns API yanıtı ve durum kodu
 */
export async function handleProductOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Ürün işlemi çağrıldı: ${toolName}`, toolArgs);
    
    const { 
      getProductsFromDb, 
      getProductByIdFromDb, 
      createProductInDb, 
      updateProductInDb, 
      updateProductStockInDb, 
      deleteProductFromDb 
    } = await import('@/services/db/product');
    
    let result, statusCode;
    
    switch (toolName) {
      case 'get-products':
        result = await getProductsFromDb({
          includeDeleted: toolArgs.includeDeleted,
          context: toolArgs.context
        });
        statusCode = result.success ? 200 : 500;
        break;
        
      case 'get-product-by-id':
        result = await getProductByIdFromDb(toolArgs.id);
        statusCode = result.success ? 200 : 404;
        break;
        
      case 'create-product':
        result = await createProductInDb(toolArgs);
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'update-product':
        result = await updateProductInDb(toolArgs.id, {
          name: toolArgs.name,
          price: toolArgs.price,
          stock: toolArgs.stock,
          description: toolArgs.description
        });
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'update-product-stock':
        result = await updateProductStockInDb(toolArgs.id, toolArgs.newStock);
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'delete-product':
        result = await deleteProductFromDb(toolArgs.id);
        statusCode = result.success ? 200 : 400;
        break;
        
      default:
        result = { success: false, error: 'Bilinmeyen ürün işlemi' };
        statusCode = 400;
    }
    
    console.log(`[MCP API] Ürün işlemi sonucu:`, result.success ? 'başarılı' : `hata: ${result.error}`);  
    return { result, statusCode };
  } catch (error) {
    console.error(`[MCP API] Ürün işlemi sırasında hata:`, error);
    return { 
      result: { 
        success: false, 
        error: `Ürün işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
      }, 
      statusCode: 500 
    };
  }
}