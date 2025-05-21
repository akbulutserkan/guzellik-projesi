import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Ödeme işlemleri için merkezi işlem fonksiyonu
 * Tüm ödeme ile ilgili API çağrılarını yönetir
 * @param toolName Çağrılan aracın adı
 * @param toolArgs Araç argümanları
 * @returns NextResponse
 */
export async function handlePaymentOperations(toolName: string, toolArgs: any) {
  try {
    console.log(`[MCP API] Ödeme işlemi çağrıldı: ${toolName}`, toolArgs);

    switch (toolName) {
      case 'get-payments':
        const { getPaymentsFromDb } = await import('@/services/db/payment');
        const paymentsResult = await getPaymentsFromDb(toolArgs);
        return NextResponse.json(paymentsResult, { status: paymentsResult.success ? 200 : 500 });

      case 'get-payment-by-id':
        const { getPaymentByIdFromDb } = await import('@/services/db/payment');
        const paymentResult = await getPaymentByIdFromDb(toolArgs.id);
        return NextResponse.json(paymentResult, { status: paymentResult.success ? 200 : 404 });

      case 'create-payment':
      case 'add-payment':
        // Ödeme türüne göre doğru servisi çağır
        if (toolArgs.packageSaleId) {
          console.log('[MCP API] add-payment (paket satışı) tool çağrıldı, argümanlar:', toolArgs);
          const { createPaymentInDb: createPackagePaymentInDb } = await import('@/services/db/packageSale');
          const packagePaymentResult = await createPackagePaymentInDb(toolArgs);
          return NextResponse.json(packagePaymentResult, { status: packagePaymentResult.success ? 200 : 400 });
        } else if (toolArgs.productSaleId) {
          console.log('[MCP API] add-payment (ürün satışı) tool çağrıldı, argümanlar:', toolArgs);
          const { createPaymentInDb: createProductPaymentInDb } = await import('@/services/db/productSale');
          const productPaymentResult = await createProductPaymentInDb(toolArgs);
          return NextResponse.json(productPaymentResult, { status: productPaymentResult.success ? 200 : 400 });
        } else {
          // Diğer ödeme türleri için genel ödeme servisi kullan
          const { createPaymentInDb } = await import('@/services/db/payment');
          const paymentCreateResult = await createPaymentInDb(toolArgs);
          return NextResponse.json(paymentCreateResult, { status: paymentCreateResult.success ? 200 : 400 });
        }

      case 'update-payment-status':
        const { updatePaymentStatusInDb } = await import('@/services/db/payment');
        const statusResult = await updatePaymentStatusInDb(toolArgs);
        return NextResponse.json(statusResult, { status: statusResult.success ? 200 : 400 });

      case 'delete-payment':
        // Ödeme türünü belirlemek için önce ödemeyi getir
        try {
          // Ödemede productSaleId veya packageSaleId varsa ilgili servisi çağır
          const payment = await prisma.payment.findUnique({
            where: { id: toolArgs.id },
            select: { productSaleId: true, packageSaleId: true }
          });
          
          if (payment && payment.productSaleId) {
            console.log('[MCP API] delete-payment (ürün satışı) tool çağrıldı, argümanlar:', toolArgs);
            const { deletePaymentFromDb } = await import('@/services/db/productSale');
            const productDeleteResult = await deletePaymentFromDb(toolArgs.id);
            return NextResponse.json(productDeleteResult, { status: productDeleteResult.success ? 200 : 400 });
          } else if (payment && payment.packageSaleId) {
            console.log('[MCP API] delete-payment (paket satışı) tool çağrıldı, argümanlar:', toolArgs);
            const { deletePaymentFromDb } = await import('@/services/db/packageSale');
            const packageDeleteResult = await deletePaymentFromDb(toolArgs.id);
            return NextResponse.json(packageDeleteResult, { status: packageDeleteResult.success ? 200 : 400 });
          }
        } catch (error) {
          console.error('[MCP API] Ödeme kontrol hatası:', error);
        }
        
        // Diğer ödeme türleri için genel ödeme servisi kullan
        const { deletePaymentFromDb } = await import('@/services/db/payment');
        const deleteResult = await deletePaymentFromDb(toolArgs.id);
        return NextResponse.json(deleteResult, { status: deleteResult.success ? 200 : 400 });

      case 'get-payments-by-product-sale':
        console.log('[MCP API] get-payments-by-product-sale tool çağrıldı, argümanlar:', toolArgs);
        try {
          try {
            const { getPaymentsByProductSaleFromDb } = await import('@/services/db/productSale');
            const productPaymentsResult = await getPaymentsByProductSaleFromDb(toolArgs.productSaleId);
            return NextResponse.json(productPaymentsResult, { status: productPaymentsResult.success ? 200 : 400 });
          } catch (importError) {
            console.error('[MCP API] [DEBUG] İlk import yolu hata verdi:', importError.message);
            
            const { getPaymentsByProductSaleFromDb } = await import('@/services/db/productSale/paymentService');
            const productPaymentsResult = await getPaymentsByProductSaleFromDb(toolArgs.productSaleId);
            return NextResponse.json(productPaymentsResult, { status: productPaymentsResult.success ? 200 : 400 });
          }
        } catch (error) {
          console.error('[MCP API] Ödeme bilgileri getirme hatası:', error);
          return NextResponse.json({ 
            success: false, 
            error: `Ödeme bilgileri alınırken bir hata oluştu: ${error.message || error}` 
          }, { status: 400 });
        }

      default:
        console.log(`[MCP API] Bilinmeyen ödeme işlemi: ${toolName}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Bilinmeyen ödeme işlemi' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[MCP API] Ödeme işlemi sırasında hata:`, error);
    return NextResponse.json({ 
      success: false, 
      error: `Ödeme işlemi sırasında beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}` 
    }, { status: 500 });
  }
}