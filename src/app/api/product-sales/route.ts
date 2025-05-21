import { NextRequest, NextResponse } from 'next/server';
import { getProductSalesFromDb, getProductSalesByCustomerFromDb, createProductSaleInDb } from '@/lib/product-sale-service';

/**
 * Product Sales API GET handler
 * 
 * @description Merkezi API yapısına uygun olarak doğrudan veritabanı servislerini kullanan handler
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeStaff = searchParams.get('includeStaff') === 'true';
    
    console.log('[API Route] Product Sales API GET request with params:', { 
      customerId, startDate, endDate, includeStaff 
    });
    
    // İstemci tarafı API çağrısı yerine doğrudan veritabanı servisini kullan
    if (customerId) {
      console.log(`[API Route] Fetching product sales for customer: ${customerId}`);
      
      const result = await getProductSalesByCustomerFromDb(customerId, includeStaff);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch customer product sales' }, 
          { status: 500 }
        );
      }
      
      console.log(`[API Route] Successfully retrieved ${result.data.length} product sales for customer`);
      return NextResponse.json(result.data, { status: 200 });
    }
    
    // Handle general product sales fetch (with optional date filters)
    console.log('[API Route] Fetching all product sales with filters:', { startDate, endDate });
    
    const result = await getProductSalesFromDb({
      startDate,
      endDate,
      includeStaff
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch product sales' }, 
        { status: 500 }
      );
    }
    
    console.log(`[API Route] Successfully retrieved ${result.data.length} product sales`);
    return NextResponse.json(result.data, { status: 200 });
    
  } catch (error) {
    console.error('[API Route] Product Sales API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product sales data' },
      { status: 500 }
    );
  }
}

/**
 * Product Sales POST API handler
 * 
 * @description Merkezi API yapısına uygun olarak doğrudan veritabanı servislerini kullanan handler
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('[API Route] Product Sales API POST request with data:', data);
    
    // İstemci tarafı API çağrısı yerine doğrudan veritabanı servisini kullan
    const result = await createProductSaleInDb(data);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create product sale' },
        { status: 400 }
      );
    }
    
    console.log('[API Route] Product sale created successfully, ID:', result.data.id);
    
    return NextResponse.json({ 
      success: true, 
      data: result.data 
    }, { status: 201 });
    
  } catch (error) {
    console.error('[API Route] Product Sales API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create product sale' },
      { status: 500 }
    );
  }
}
