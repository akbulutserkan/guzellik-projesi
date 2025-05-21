import { NextRequest, NextResponse } from 'next/server';
import { codeTestingService } from '@/services/api/codeTestingService';

export async function GET(req: NextRequest) {
  try {
    console.log('[GET-VERIFIED-CODES API] GET isteği alındı');
    
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : [];
    
    console.log(`[GET-VERIFIED-CODES API] Limit: ${limit}, Etiketler:`, tags);
    
    const result = await codeTestingService.getVerifiedCodes(limit, tags.length > 0 ? tags : undefined);
    
    if (result.success) {
      console.log(`[GET-VERIFIED-CODES API] ${result.data.length} kod bulundu`);
      return NextResponse.json(result.data);
    } else {
      console.log('[GET-VERIFIED-CODES API] Hata:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[GET-VERIFIED-CODES API] Hata:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}