import { NextResponse } from 'next/server';
import { callMcpApi } from '@/lib/mcp/helpers';

export async function GET() {
  console.log('[API] GET /api/package-categories çağrıldı');
  const result = await callMcpApi('get-package-categories');
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Kategoriler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  try {
    console.log('[API] POST /api/package-categories çağrıldı');
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      );
    }
    
    const result = await callMcpApi('add-package-category', { name: data.name });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Kategori oluşturulurken bir hata oluştu' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Kategori oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}