import { NextRequest, NextResponse } from 'next/server';
import { handleProductOperations } from './handlers/productHandler';
import { handleStaffOperations } from './handlers/staffHandler';
import { handlePackageOperations } from './handlers/packageHandler';
import { handleServiceOperations } from './handlers/serviceHandler';
import { handleAppointmentOperations } from './handlers/appointmentHandler';
import { handleCustomerOperations } from './handlers/customerHandler';
import { handlePaymentOperations } from './handlers/paymentHandler';
import { handleProductSaleOperations } from './handlers/productSaleHandler';
import { handlePackageSaleOperations } from './handlers/packageSaleHandler';
import { handleSettingsOperations } from './handlers/settingsHandler';

/**
 * Merkezi Kontrol Paneli (MCP) API Route'u
 * Tüm API çağrılarını ilgili işleyicilere yönlendirir
 */

// API Route Handler
export async function POST(req: NextRequest) {
  try {
    console.log('[MCP API] POST isteği alındı');
    
    // İstek gövdesini oku
    const body = await req.json();
    
    console.log('[MCP API] İstek gövdesi:', body);
    
    // Hangi tool'un çağrıldığını belirleyelim
    if (body.method === 'call_tool' && body.params?.name) {
      const toolName = body.params.name;
      const toolArgs = body.params.arguments || {};
      
      console.log(`[MCP API] Tool çağrılıyor: ${toolName}`, toolArgs);

      // İş alanına göre uygun handler'a yönlendir
      if (toolName.startsWith('get-products') || 
          toolName.startsWith('create-product') || 
          toolName.startsWith('update-product') || 
          toolName.startsWith('delete-product')) {
        const { result, statusCode } = await handleProductOperations(toolName, toolArgs);
        return NextResponse.json(result, { status: statusCode });
      }
      
      // Hizmet işlemleri
      else if (toolName.includes('service') || 
              toolName === 'bulk-update-service-prices' || 
              toolName === 'bulk-update-preview' ||
              toolName === 'get-service-price-history' ||
              toolName === 'revert-price-history') {
        return await handleServiceOperations(toolName, toolArgs);
      }
      
      // Paket işlemleri
      else if (toolName.includes('package') && 
              !toolName.includes('package-sale')) {
        const { result, statusCode } = await handlePackageOperations(toolName, toolArgs);
        return NextResponse.json(result, { status: statusCode });
      }
      
      // Personel işlemleri
      else if (toolName.includes('staff') || 
              toolName === 'get-authorized-staff' ||
              toolName === 'validate-working-hours') {
        const { result, statusCode } = await handleStaffOperations(toolName, toolArgs);
        return NextResponse.json(result, { status: statusCode });
      }
      
      // Randevu işlemleri
      else if (toolName.includes('appointment') || 
              toolName === 'get-calendar-data' ||
              toolName === 'check-staff-availability' ||
              toolName === 'get-calendar-appointments') {
        return await handleAppointmentOperations(toolName, toolArgs);
      }
      
      // Müşteri işlemleri
      else if (toolName.includes('customer')) {
        return await handleCustomerOperations(toolName, toolArgs);
      }
      
      // Ödeme işlemleri
      else if (toolName.includes('payment')) {
        return await handlePaymentOperations(toolName, toolArgs);
      }
      
      // Ürün Satışları
      else if (toolName.includes('product-sale')) {
        return await handleProductSaleOperations(toolName, toolArgs);
      }
      
      // Paket Satışları
      else if (toolName.includes('package-sale')) {
        return await handlePackageSaleOperations(toolName, toolArgs);
      }
      
      // Ayarlar ve Çalışma Saatleri
      else if (toolName.includes('business-') || 
              toolName.includes('system-') ||
              toolName.includes('working-hour')) {
        return await handleSettingsOperations(toolName, toolArgs);
      }
      
      // Veri tabanı işlemleri
      else if (toolName === 'save-data' || 
              toolName === 'load-data' || 
              toolName === 'list-data' ||
              toolName === 'get-claude-context' ||
              toolName === 'save-claude-context' ||
              toolName === 'update-claude-context' ||
              toolName === 'list-claude-contexts') {
        // Geçici olarak hata mesajı döndür - servis bulunamadı
        return NextResponse.json({ 
          success: false, 
          error: "Bu özellik şu anda kullanılamıyor.",
          message: "projectDataService yükleme hatası"
        }, { status: 503 });
      }
    }
    
    // Bilinmeyen metod veya tool
    console.log(`[MCP API] Bilinmeyen metod veya tool: ${body.method || 'metod yok'}`);
    return NextResponse.json({ 
      success: false, 
      error: 'Bilinmeyen metod veya tool' 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error(`[MCP API] İstek işlenirken hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `İstek işlenirken hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}

// İstemcilere API durumunu bildirmek için
export async function GET(req: NextRequest) {
  return NextResponse.json({
    serverInfo: {
      name: 'nextjs15-ts-proje-mcp',
      version: '1.0',
      description: 'Next.js ve PostgreSQL ile entegre modüler API',
      status: 'running'
    }
  });
}