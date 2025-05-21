import { NextResponse, NextRequest } from 'next/server'
import { withProtectedRoute } from '@/lib/api-middleware'
import { Permission } from '@prisma/client'
import { callMcpApi } from '@/lib/mcp/helpers';

// Belirli bir paket satışına ait ödemeleri getiren API endpoint
async function getPaymentsByPackage(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Paket satış ID'sini URL'den al
    const packageSaleId = url.searchParams.get('packageSaleId');
    
    if (!packageSaleId) {
      return NextResponse.json(
        { error: 'packageSaleId parametresi gereklidir' },
        { status: 400 }
      );
    }
    
    console.log(`PackageSaleId: ${packageSaleId} için ödemeler aranıyor...`);

    // MCP API'yi kullanarak ödemeleri getir
    const result = await callMcpApi('get-payments-by-package-sale', { packageSaleId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Paket ödemeleri yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    console.log(`Bulunan ödeme sayısı: ${result.data ? result.data.length : 0}`);

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Package payments fetch error:', error);
    return NextResponse.json(
      { error: 'Paket ödemeleri yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Route tanımları
export const GET = withProtectedRoute(getPaymentsByPackage, {
  GET: Permission.VIEW_PAYMENTS
});
