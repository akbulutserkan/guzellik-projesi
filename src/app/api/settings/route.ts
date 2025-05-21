import { NextResponse } from 'next/server';
import { ApiService } from '@/services/api';

export async function GET() {
  try {
    // Merkezi API'yi kullan
    const response = await ApiService.settings.getSystemSettings();
    
    if (!response.success) {
      return NextResponse.json({ error: response.error || 'Ayarlar alınamadı' }, { status: 500 });
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Ayarlar alınırken hata:', error);
    return NextResponse.json({ error: 'Ayarlar alınamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Merkezi API'yi kullan
    const response = await ApiService.settings.updateSystemSettings(data);
    
    if (!response.success) {
      return NextResponse.json({ error: response.error || 'Ayarlar kaydedilemedi' }, { status: 500 });
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Ayarlar kaydedilirken hata:', error);
    return NextResponse.json({ error: 'Ayarlar kaydedilemedi' }, { status: 500 });
  }
}