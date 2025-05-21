import { NextResponse } from 'next/server';
import { ApiService } from '@/services/api';

// API Route Handler
export async function GET() {
  try {
    // Merkezi API'yi kullan
    const response = await ApiService.settings.getBusinessDays();
    
    if (!response.success) {
      return NextResponse.json({ error: response.error || 'İş günleri alınamadı' }, { status: 500 });
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('İş günleri alınırken hata:', error);
    return NextResponse.json({ error: 'İş günleri alınamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Merkezi API'yi kullan
    const response = await ApiService.settings.updateBusinessDays(data);
    
    if (!response.success) {
      return NextResponse.json({ error: response.error || 'İş günleri güncellenemedi' }, { status: 500 });
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('İş günleri güncellenirken hata:', error);
    return NextResponse.json({ error: 'İş günleri güncellenemedi' }, { status: 500 });
  }
}