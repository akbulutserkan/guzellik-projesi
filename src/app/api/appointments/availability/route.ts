import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Belirli bir gün için personelin çalışma saati ve randevu bilgilerini getir
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')

    if (!date) {
      return NextResponse.json(
        { error: 'Tarih parametresi gereklidir' },
        { status: 400 }
      )
    }

    // Tarih için başlangıç ve bitiş değerlerini hesapla
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // İş yeri çalışma saatlerini getir
    const businessHours = await prisma.businessDay.findMany({
      orderBy: { dayOfWeek: 'asc' }
    })

    // Randevuları getir (personel filtresi varsa uygula)
    let appointmentsWhereClause: any = {
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED'] // Sadece aktif randevuları göster
      }
    }

    if (staffId) {
      appointmentsWhereClause.staffId = staffId
    }

    const appointments = await prisma.appointment.findMany({
      where: appointmentsWhereClause,
      include: {
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
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Personel çalışma saatlerini getir (eğer staffId verilmişse)
    let staffSchedule = null
    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { workingHours: true }
      })
      staffSchedule = staff?.workingHours
    }

    // Tarih için istisnaları kontrol et
    const exceptions = await prisma.holidayException.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    return NextResponse.json({
      businessHours,
      staffSchedule,
      appointments,
      exceptions
    })
  } catch (error) {
    console.error('Müsaitlik bilgileri alma hatası:', error)
    return NextResponse.json(
      { error: 'Müsaitlik bilgileri alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}