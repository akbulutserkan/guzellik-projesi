import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomersFromDb,
  createCustomerInDb
} from '@/services/db/customerDbService';

// GET - Tüm müşterileri getir
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Query parametrelerini filtre olarak al
  const filters: any = {};
  
  // Örnek: ?name=John şeklinde filtreleme için
  if (searchParams.has('name')) {
    filters.name = { contains: searchParams.get('name') };
  }
  
  if (searchParams.has('email')) {
    filters.email = { contains: searchParams.get('email') };
  }
  
  if (searchParams.has('phone')) {
    filters.phone = { contains: searchParams.get('phone') };
  }
  
  // includeDeleted parametresi kontrolü
  if (searchParams.has('includeDeleted')) {
    filters.includeDeleted = searchParams.get('includeDeleted') === 'true';
  }
  
  console.log('[API] /api/customers GET çağrıldı, filtreler:', filters);
  
  try {
    const result = await getCustomersFromDb(filters);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      console.error('[API] /api/customers hata:', result.error);
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('[API] /api/customers işlenmeyen hata:', error);
    return NextResponse.json(
      { success: false, error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni müşteri oluştur
export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json();
    
    if (!customerData || !customerData.name) {
      return NextResponse.json(
        { success: false, error: 'Geçerli müşteri bilgisi gerekli' },
        { status: 400 }
      );
    }
    
    const result = await createCustomerInDb(customerData);
    
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Müşteri oluşturulurken hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Geçersiz veri formatı' },
      { status: 400 }
    );
  }
}