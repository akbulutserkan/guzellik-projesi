/**
 * Paket işlemleri için merkezi işlem fonksiyonu
 * Tüm paket ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns API yanıtı ve durum kodu
 */
export async function handlePackageOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Paket işlemi çağrıldı: ${toolName}`, toolArgs);
    
    let result, statusCode;
    
    switch (toolName) {
      case 'get-packages':
        try {
          console.log('[MCP API] [DEBUG] get-packages çağrısı başlıyor, parametreler:', toolArgs);
          console.log('[MCP API] [DEBUG] Detaylı debug modu aktif - tüm işlemler loglanacak');
          
          // Package modülünü import et - veritabanı bağlantısını kontrol et
          console.log('[MCP API] [DEBUG] package DB servisini import etmeye çalışıyor...');
          
          // Burada olası import yollarını deniyoruz
          try {
            console.log('[MCP API] [DEBUG] İlk yol deneniyor: @/services/db/package');
            const { getPackagesFromDb } = await import('@/services/db/package');
            console.log('[MCP API] [DEBUG] İlk yol başarılı!');
            
            // Paketleri getir
            console.log('[MCP API] [DEBUG] getPackagesFromDb fonksiyonu çağrılıyor...');
            result = await getPackagesFromDb({
              includeDeleted: toolArgs?.includeDeleted
            });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            console.error('[MCP API] [DEBUG] İlk import hatası detayları:', importError.stack);
            
            try {
              console.log('[MCP API] [DEBUG] İkinci yol deneniyor: @/services/db/package/packageDbService');
              const { getPackagesFromDb } = await import('@/services/db/package/packageDbService');
              console.log('[MCP API] [DEBUG] İkinci yol başarılı!');
              
              // Paketleri getir
              console.log('[MCP API] [DEBUG] getPackagesFromDb fonksiyonu çağrılıyor...');
              result = await getPackagesFromDb({
                includeDeleted: toolArgs?.includeDeleted
              });
            } catch (secondImportError) {
              console.error('[MCP API] [DEBUG] İkinci import yolu da hata verdi:', secondImportError.message);
              console.error('[MCP API] [DEBUG] İkinci import hatası detayları:', secondImportError.stack);
              throw new Error(`Package modülü import edilemedi: İlk hata: ${importError.message}, İkinci hata: ${secondImportError.message}`);
            }
          }
          
          console.log('[MCP API] [DEBUG] getPackagesFromDb sonucu:', { 
            success: result.success, 
            error: result.error || null,
            dataCount: result.data ? result.data.length : 0
          });
          
          // Ham veri logu ekle
          console.log('[MCP API] [DEBUG] Veritabanından ham veri:', JSON.stringify(result, null, 2));
          
          // Veritabanı bağlantı hatasını özel olarak kontrol et
          if (result.dbConnectionError) {
            console.error('[MCP API] [KRITIK] Veritabanı bağlantı hatası tespit edildi!');
          }
          
          // "services" alanı yoksa formatı düzelt
          if (result.success && result.data && Array.isArray(result.data)) {
            console.log(`[MCP API] [DEBUG] Paket verilerini düzenleme işlemi başlıyor, ${result.data.length} paket var`);
            
            // Paket içeriği kontrolü
            if (result.data.length > 0) {
              console.log('[MCP API] [DEBUG] İlk paket örneği:', JSON.stringify(result.data[0], null, 2));
              const firstPackage = result.data[0];
              console.log('[MCP API] [DEBUG] Paket alanları:', Object.keys(firstPackage));
              console.log('[MCP API] [DEBUG] packageServices var mı?', !!firstPackage.packageServices);
              console.log('[MCP API] [DEBUG] services var mı?', !!firstPackage.services);
              
              if (firstPackage.packageServices) {
                console.log('[MCP API] [DEBUG] packageServices tipi:', typeof firstPackage.packageServices);
                console.log('[MCP API] [DEBUG] packageServices array mi?', Array.isArray(firstPackage.packageServices));
                console.log('[MCP API] [DEBUG] packageServices uzunluğu:', 
                  Array.isArray(firstPackage.packageServices) ? firstPackage.packageServices.length : 'array değil');
                
                if (Array.isArray(firstPackage.packageServices) && firstPackage.packageServices.length > 0) {
                  console.log('[MCP API] [DEBUG] İlk packageService örneği:', 
                    JSON.stringify(firstPackage.packageServices[0], null, 2));
                }
              }
            }
            
            // Import Package tipini
            const { Package } = await import('@/services/db/package/types');
            
            result.data = result.data.map(pkg => {
              // Paketi doğru tipe dönüştür
              const typedPkg = pkg as Package;
              
              // Güvenlik kontrolü ekle
              if (!typedPkg) {
                console.error('[MCP API] [DEBUG] NULL ya da tanımsız paket bulundu!');
                return pkg;
              }
              
              console.log(`[MCP API] [DEBUG] Paket işleniyor, ID: ${typedPkg.id}, isim: ${typedPkg.name}`);
              
              // Eğer services alanı yok ama packageServices array'i varsa düzelt
              if (!typedPkg.services && typedPkg.packageServices && Array.isArray(typedPkg.packageServices)) {
                console.log(`[MCP API] [DEBUG] Paket (${typedPkg.id}) için services alanı düzeltiliyor...`);
                console.log(`[MCP API] [DEBUG] packageServices: ${typedPkg.packageServices.length} hizmet var`);
                
                // Hizmet içeriği kontrolü
                if (typedPkg.packageServices.length > 0) {
                  const firstService = typedPkg.packageServices[0];
                  console.log('[MCP API] [DEBUG] İlk packageService içeriği:', JSON.stringify(firstService, null, 2));
                  console.log('[MCP API] [DEBUG] service özelliği var mı?', !!firstService.service);
                  
                  if (firstService.service) {
                    console.log('[MCP API] [DEBUG] service içeriği:', JSON.stringify(firstService.service, null, 2));
                  }
                }
                
                try {
                  const transformedServices = typedPkg.packageServices.map(ps => {
                    if (!ps) {
                      console.error('[MCP API] [DEBUG] NULL packageService bulundu!');
                      return {
                        id: 'unknown',
                        name: 'Bilinmeyen Hizmet',
                        duration: 0,
                        price: 0
                      };
                    }
                    
                    // service özelliği null olabilir, kontrol et
                    if (!ps.service) {
                      console.warn(`[MCP API] [DEBUG] Paket (${typedPkg.id}) - Hizmet (${ps.serviceId}) için service bilgisi yok!`);
                    }
                    
                    return {
                      id: ps.serviceId,
                      name: ps.service?.name || 'Bilinmeyen Hizmet',
                      duration: ps.service?.duration || 0,
                      price: ps.service?.price || 0
                    };
                  });
                  
                  console.log(`[MCP API] [DEBUG] Dönüştürülmüş hizmetler:`, JSON.stringify(transformedServices, null, 2));
                  
                  return {
                    ...typedPkg,
                    services: transformedServices
                  };
                } catch (transformError) {
                  console.error(`[MCP API] [DEBUG] Hizmet dönüşümü sırasında hata: ${transformError.message}`);
                  console.error(transformError.stack);
                  return typedPkg;
                }
              }
              return typedPkg;
            });
            console.log(`[MCP API] [DEBUG] Paket verileri düzenlendi, sonuç: ${result.data.length} paket`);
            console.log('[MCP API] [DEBUG] Dönüştürülmüş paket verileri (ilk 2):', 
              JSON.stringify(result.data.slice(0, 2), null, 2));
          }
          
          statusCode = result.success ? 200 : 500;
          
          // Son API yanıtını detaylı logla
          console.log('[MCP API] [DEBUG] API yanıtı:', {
            success: result.success,
            statusCode: statusCode,
            error: result.error || null,
            dataCount: result.data ? result.data.length : 0,
            categories: result.data && result.data.length > 0 ?
              [...new Set(result.data.map(pkg => pkg.category?.name || 'Kategorisiz'))] : [],
            servicesCount: result.data && result.data.length > 0 ?
              result.data.reduce((total, pkg) => total + (pkg.services?.length || 0), 0) : 0
          });
        } catch (error) {
          console.error('[MCP API] [ERROR] get-packages çağrısında ciddi hata:', error);
          result = { 
            success: false, 
            error: `Paketler getirilirken beklenmeyen bir hata oluştu: ${error.message || error}`,
            stackTrace: error.stack
          };
          statusCode = 500;
        }
        break;
        
      case 'get-package-by-id':
        const { getPackageByIdFromDb } = await import('@/services/db/package');
        result = await getPackageByIdFromDb(toolArgs.id);
        statusCode = result.success ? 200 : (result.error === 'Paket bulunamadı' ? 404 : 500);
        break;
        
      case 'add-package':
      case 'create-package': // API adlandırma standardına uygun alternatif
        try {
          console.log('[MCP API] [DEBUG] Paket oluşturma işlemi başlatılıyor...');
          const { createPackageInDb } = await import('@/services/db/package');
          console.log('[MCP API] [DEBUG] İlk import yolu başarılı!');
          result = await createPackageInDb(toolArgs);
        } catch (importError) {
          console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
          
          try {
            console.log('[MCP API] [DEBUG] İkinci yol deneniyor: @/services/db/package/packageDbService');
            const { createPackageInDb } = await import('@/services/db/package/packageDbService');
            console.log('[MCP API] [DEBUG] İkinci yol başarılı!');
            
            // Paket oluştur
            console.log('[MCP API] [DEBUG] createPackageInDb fonksiyonu çağrılıyor...');
            result = await createPackageInDb(toolArgs);
          } catch (secondImportError) {
            console.error('[MCP API] [DEBUG] İkinci import yolu da hata verdi:', secondImportError.message);
            throw new Error(`Paket modülü import edilemedi: İlk hata: ${importError.message}, İkinci hata: ${secondImportError.message}`);
          }
        }
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'update-package':
        try {
          console.log('[MCP API] [DEBUG] Paket güncelleme işlemi başlatılıyor...');
          const { updatePackageInDb } = await import('@/services/db/package');
          console.log('[MCP API] [DEBUG] İlk import yolu başarılı!');
          result = await updatePackageInDb(toolArgs.id, {
            name: toolArgs.name,
            sessionCount: toolArgs.sessionCount,
            price: toolArgs.price,
            categoryId: toolArgs.categoryId,
            serviceIds: toolArgs.serviceIds
          });
        } catch (importError) {
          console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
          
          console.log('[MCP API] [DEBUG] İkinci yol deneniyor: @/services/db/package/packageDbService');
          const { updatePackageInDb } = await import('@/services/db/package/packageDbService');
          console.log('[MCP API] [DEBUG] İkinci yol başarılı!');
          
          result = await updatePackageInDb(toolArgs.id, {
            name: toolArgs.name,
            sessionCount: toolArgs.sessionCount,
            price: toolArgs.price,
            categoryId: toolArgs.categoryId,
            serviceIds: toolArgs.serviceIds
          });
        }
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'delete-package':
        try {
          console.log('[MCP API] [DEBUG] Paket silme işlemi başlatılıyor...');
          const { deletePackageFromDb } = await import('@/services/db/package');
          console.log('[MCP API] [DEBUG] İlk import yolu başarılı!');
          result = await deletePackageFromDb(toolArgs.id);
        } catch (importError) {
          console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
          
          console.log('[MCP API] [DEBUG] İkinci yol deneniyor: @/services/db/package/packageDbService');
          const { deletePackageFromDb } = await import('@/services/db/package/packageDbService');
          console.log('[MCP API] [DEBUG] İkinci yol başarılı!');
          
          result = await deletePackageFromDb(toolArgs.id);
        }
        statusCode = result.success ? 200 : 400;
        break;
        
      // Paket kategorileri
      case 'get-package-categories':
        try {
          console.log('[MCP API] [DEBUG] Paket kategorileri getiriliyor...');
          const { getPackageCategoriesFromDb } = await import('@/services/db/package/packageCategoryDbService');
          console.log('[MCP API] [DEBUG] Kategori servisi başarıyla import edildi!');
          result = await getPackageCategoriesFromDb();
        } catch (importError) {
          console.error('[MCP API] [DEBUG] Kategori servisi import hatası:', importError.message);
          throw new Error(`Paket kategori servisi import edilemedi: ${importError.message}`);
        }
        statusCode = result.success ? 200 : 500;
        break;
        
      case 'add-package-category':
      case 'create-package-category': // API adlandırma standardına uygun alternatif
        try {
          console.log('[MCP API] [DEBUG] Paket kategorisi oluşturma işlemi başlatılıyor...');
          const { createPackageCategoryInDb } = await import('@/services/db/package/packageCategoryDbService');
          console.log('[MCP API] [DEBUG] Kategori servisi başarıyla import edildi!');
          result = await createPackageCategoryInDb(toolArgs.name);
        } catch (importError) {
          console.error('[MCP API] [DEBUG] Kategori servisi import hatası:', importError.message);
          throw new Error(`Paket kategori servisi import edilemedi: ${importError.message}`);
        }
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'update-package-category':
        try {
          console.log('[MCP API] [DEBUG] Paket kategorisi güncelleme işlemi başlatılıyor...');
          const { updatePackageCategoryInDb } = await import('@/services/db/package/packageCategoryDbService');
          console.log('[MCP API] [DEBUG] Kategori servisi başarıyla import edildi!');
          result = await updatePackageCategoryInDb(toolArgs.id, toolArgs.name);
        } catch (importError) {
          console.error('[MCP API] [DEBUG] Kategori servisi import hatası:', importError.message);
          throw new Error(`Paket kategori servisi import edilemedi: ${importError.message}`);
        }
        statusCode = result.success ? 200 : 400;
        break;
        
      case 'delete-package-category':
        try {
          console.log('[MCP API] [DEBUG] Paket kategorisi silme işlemi başlatılıyor...');
          const { deletePackageCategoryFromDb } = await import('@/services/db/package/packageCategoryDbService');
          console.log('[MCP API] [DEBUG] Kategori servisi başarıyla import edildi!');
          result = await deletePackageCategoryFromDb(toolArgs.id);
        } catch (importError) {
          console.error('[MCP API] [DEBUG] Kategori servisi import hatası:', importError.message);
          throw new Error(`Paket kategori servisi import edilemedi: ${importError.message}`);
        }
        statusCode = result.success ? 200 : 400;
        break;
        
      default:
        result = { success: false, error: 'Bilinmeyen paket işlemi' };
        statusCode = 400;
    }
    
    console.log(`[MCP API] Paket işlemi sonucu:`, result.success ? 'başarılı' : `hata: ${result.error}`);  
    return { result, statusCode };
  } catch (error) {
    console.error(`[MCP API] Paket işlemi sırasında hata:`, error);
    return { 
      result: { 
        success: false, 
        error: `Paket işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
      }, 
      statusCode: 500 
    };
  }
}