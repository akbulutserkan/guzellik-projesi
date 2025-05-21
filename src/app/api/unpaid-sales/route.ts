// src/app/api/unpaid-sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Permission } from "@prisma/client";
import { withProtectedRoute, withMultiPermissionRoute } from "@/lib/api-middleware";

/**
 * Ödenmemiş ürün satışlarını getiren API endpoint'i
 */
async function getUnpaidSales(req: NextRequest) {
  try {
    // Ödenmemiş satışları getir
    const unpaidSales = await prisma.productSale.findMany({
      where: {
        isFullyPaid: false,
        paymentStatus: "PENDING"
      },
      include: {
        product: {
          select: {
            name: true,
            price: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        payments: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Ödemesi yapılmış miktarları hesapla
    const formattedUnpaidSales = unpaidSales.map(sale => {
      // Satış için yapılmış toplam ödeme miktarını hesapla
      const paidAmount = sale.payments.reduce((total, payment) => {
        return total + (payment.status === 'COMPLETED' ? payment.amount : 0);
      }, 0);

      // Kalan borç miktarını hesapla
      const remainingAmount = sale.totalPrice - paidAmount;

      return {
        id: sale.id,
        date: sale.date.toISOString(),
        product: {
          id: sale.productId,
          name: sale.product.name,
          price: sale.product.price
        },
        customer: {
          id: sale.customerId,
          name: sale.customer.name,
          phone: sale.customer.phone
        },
        staff: {
          id: sale.staffId,
          name: sale.staff.name
        },
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalPrice: sale.totalPrice,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paymentStatus: sale.paymentStatus,
        paymentType: sale.paymentType,
        notes: sale.notes
      };
    });

    return NextResponse.json(formattedUnpaidSales);
  } catch (error) {
    console.error("Ödenmemiş satışları getirme hatası:", error);
    return NextResponse.json(
      { error: "Ödenmemiş satışlar yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * Ödeme yapma API endpoint'i
 */
async function makeSalePayment(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      productSaleId,
      amount,
      paymentMethod,
      staffId,
      notes
    } = data;

    // Satışı kontrol et
    const sale = await prisma.productSale.findUnique({
      where: { id: productSaleId },
      include: { payments: true }
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Satış bulunamadı" },
        { status: 404 }
      );
    }

    const paidAmount = sale.payments.reduce((total, payment) => {
      return total + (payment.status === 'COMPLETED' ? payment.amount : 0);
    }, 0);

    const remainingAmount = sale.totalPrice - paidAmount;

    // Ödeme miktarını kontrol et
    if (parseFloat(amount) > remainingAmount) {
      return NextResponse.json(
        { error: "Ödeme tutarı kalan miktardan büyük olamaz" },
        { status: 400 }
      );
    }

    // Ödeme kaydı oluştur
    const payment = await prisma.payment.create({
      data: {
        customerId: sale.customerId,
        amount: parseFloat(amount),
        paymentType: "PRODUCT_SALE",
        paymentMethod,
        productSaleId,
        processedBy: staffId,
        status: "COMPLETED",
        notes: notes || "Satış için tahsilat"
      }
    });

    // Tüm ödeme yapıldıysa satış durumunu güncelle
    const newTotalPaid = paidAmount + parseFloat(amount);
    const isFullyPaid = newTotalPaid >= sale.totalPrice;

    if (isFullyPaid) {
      await prisma.productSale.update({
        where: { id: productSaleId },
        data: {
          paymentStatus: "PAID",
          isFullyPaid: true
        }
      });
    }

    return NextResponse.json({
      payment,
      isFullyPaid,
      remainingAmount: sale.totalPrice - newTotalPaid
    });
  } catch (error) {
    console.error("Ödeme hatası:", error);
    return NextResponse.json(
      { error: "Ödeme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yetki kontrollü endpoint'ler
export const GET = withMultiPermissionRoute(getUnpaidSales, {
  GET: [Permission.VIEW_PRODUCT_SALES, Permission.VIEW_PAYMENTS]
});

export const POST = withMultiPermissionRoute(makeSalePayment, {
  POST: [Permission.EDIT_PAYMENTS]
});