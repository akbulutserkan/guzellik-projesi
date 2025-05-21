import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerByIdFromDb,
  updateCustomerInDb,
  deleteCustomerFromDb
} from '@/services/db/customerDbService';

// GET - ID'ye göre müşteri getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Müşteri ID gerekli' },
      { status: 400 }
    );
  }
  
  const result = await getCustomerByIdFromDb(id);
  
  if (result.success) {
    return NextResponse.json(result);
  } else {
    if (result.error === 'Müşteri bulunamadı') {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result, { status: 500 });
  }
}

// PUT - Müşteri bilgilerini güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Müşteri ID gerekli' },
      { status: 400 }
    );
  }
  
  try {
    const customerData = await request.json();
    
    if (!customerData || Object.keys(customerData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek bilgi gerekli' },
        { status: 400 }
      );
    }
    
    const result = await updateCustomerInDb(id, customerData);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Müşteri güncellenirken hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Geçersiz veri formatı' },
      { status: 400 }
    );
  }
}

// DELETE - Müşteriyi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Müşteri ID gerekli' },
      { status: 400 }
    );
  }
  
  const result = await deleteCustomerFromDb(id);
  
  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}