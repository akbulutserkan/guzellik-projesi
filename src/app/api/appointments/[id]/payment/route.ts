import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import * as mcp from '@/lib/mcp'; // MCP API eklendi

/**
 * Randevu ödemesi kaydetme endpoint'i
 * Sadece ödeme işlemi ile ilgilenir, randevu durumundan bağımsızdır
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Randevu ID'sini güvenli şekilde al
    const appointmentId = params.id.toString();
    console.log(`[API-Payment-POST] Randevu ID: ${appointmentId} için ödeme işlemi başlatıldı`);
    
    // İstek verisini parse et
    const data = await request.json();
    
    // Gerekli alanların varlığını kontrol et
    if (!data.amount) {
      console.error('[API-Payment-POST] Ödeme tutarı belirtilmedi');
      return NextResponse.json(
        { error: 'Ödeme tutarı belirtilmelidir' },
        { status: 400 }
      );
    }
    
    // Tutarı sayısal değere dönüştür
    let amount: number;
    try {
      amount = parseFloat(data.amount.toString());
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Geçersiz tutar');
      }
    } catch (error) {
      console.error('[API-Payment-POST] Geçersiz tutar formatı:', data.amount);
      return NextResponse.json(
        { error: 'Geçerli bir ödeme tutarı sağlayınız' },
        { status: 400 }
      );
    }
    
    // İlgili randevuyu bul
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      }
    });
    
    if (!appointment) {
      console.error(`[API-Payment-POST] Randevu bulunamadı: ${appointmentId}`);
      return NextResponse.json(
        { error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }
    
    console.log(`[API-Payment-POST] Randevu bulundu, ödeme miktarı: ${amount}`);
    
    // Hata ayıklama için daha fazla log ekleyelim
    console.log(`[API-Payment-POST] Transaction başlatma öncesi, randevu:`, {
      id: appointment.id,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      serviceName: appointment.service?.name
    });
    
    // Ödeme yöntemini standardize et
    let standardPaymentMethod: string;
    if (data.paymentMethod === 'Nakit' || data.paymentMethod === 'CASH') {
      standardPaymentMethod = 'Nakit';
    } else if (data.paymentMethod === 'Kredi Kartı' || data.paymentMethod === 'CREDIT_CARD' || data.paymentMethod === 'Kart') {
      standardPaymentMethod = 'Kredi Kartı';
    } else if (data.paymentMethod === 'Havale/EFT' || data.paymentMethod === 'BANK_TRANSFER' || data.paymentMethod === 'Havale' || data.paymentMethod === 'EFT') {
      standardPaymentMethod = 'Havale/EFT';
    } else {
      standardPaymentMethod = 'Nakit'; // Varsayılan
    }
    
    // NOT: MCP API üzerinden ödeme kaydı yapalım
    try {
      // Transaction ile tüm işlemleri birlikte yap
      const [statusUpdate, updatedAppointment] = await prisma.$transaction([
        // 1. Randevu durumunu güncelle
        prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'COMPLETED',
            attendance: 'SHOWED'
          }
        }),
        
        // 2. Randevu tutar bilgisini güncelle
        prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            amount: amount,
            paymentMethod: standardPaymentMethod,
            paymentStatus: 'PAID',
            updatedAt: new Date()
          }
        })
      ]);
      
      // 3. MCP API üzerinden ödeme kaydı oluştur
      const paymentResult = await mcp.callMcpApi('create-payment', {
        customerId: appointment.customerId,
        amount: amount,
        paymentType: standardPaymentMethod, // Ödeme türü (Nakit, Kredi Kartı, vb)
        paymentMethod: 'Hizmet Ödemesi', // Ödeme şekli (sabit: Hizmet Ödemesi)
        notes: data.notes || `${appointment.service?.name || 'Hizmet'} için tahsilat`,
        processedBy: appointment.staffId,
        appointmentId: appointmentId,
        status: 'Tamamlandı'
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'MCP API ile ödeme kaydedilemedi');
      }
      
      console.log(`[API-Payment-POST] MCP API ile ödeme başarıyla kaydedildi, ödeme ID: ${paymentResult.data.id}`);
      
      // Başarılı yanıt dön
      return NextResponse.json({
        success: true,
        payment: paymentResult.data,
        appointment: {
          id: updatedAppointment.id,
          customerId: updatedAppointment.customerId,
          customerName: appointment.customer?.name,
          amount: updatedAppointment.amount,
          paymentMethod: updatedAppointment.paymentMethod,
          status: updatedAppointment.status
        },
        message: 'Ödeme başarıyla kaydedildi'
      });
    } catch (mcpError) {
      console.error('[API-Payment-POST] MCP API ile ödeme kaydedilirken hata:', mcpError);
      
      // Normal yöntemle ödeme kaydı yapmayı deneyelim
      console.log('[API-Payment-POST] Normal yöntemle ödeme kaydı yapılıyor...');
      
      const payment = await prisma.payment.create({
        data: {
          customerId: appointment.customerId,
          amount: amount,
          paymentType: standardPaymentMethod, // Ödeme türü (Nakit, Kredi Kartı, vb)
          paymentMethod: 'Hizmet Ödemesi', // Ödeme şekli (sabit: Hizmet Ödemesi)
          notes: data.notes || `${appointment.service?.name || 'Hizmet'} için tahsilat`,
          processedBy: appointment.staffId,
          status: 'Tamamlandı'
        }
      });
      
      console.log(`[API-Payment-POST] Normal yöntemle ödeme başarıyla kaydedildi, ödeme ID: ${payment.id}`);
      
      // Başarılı yanıt dön
      return NextResponse.json({
        success: true,
        payment: payment,
        appointment: {
          id: appointment.id,
          customerId: appointment.customerId,
          customerName: appointment.customer?.name,
          amount: amount,
          paymentMethod: standardPaymentMethod,
          status: 'COMPLETED'
        },
        message: 'Ödeme başarıyla kaydedildi'
      });
    }
    
  } catch (error) {
    console.error('[API-Payment-POST] Ödeme işlemi hatası:', error);
    
    // Hata detaylarını logla
    if (error instanceof Error) {
      console.error('Hata mesajı:', error.message);
      console.error('Hata yığını:', error.stack);
    }
    
    // Hata yanıtı dön
    return NextResponse.json(
      { 
        error: 'Ödeme işlemi sırasında bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}