import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Mevcut oturum durumunu kontrol et
  const token = await getToken({ req: request as any });
  const isAuthenticated = !!token;

  // Eğer login sayfasındaysa ve kimlik doğrulanmışsa, customers sayfasına yönlendir
  if (request.nextUrl.pathname === '/auth/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/customers', request.url));
  }

  // Login sayfasında değilse ve kimlik doğrulanmamışsa, normal akışa devam et
  // AuthProvider zaten otomatik giriş işlemini halledecek
  return NextResponse.next();
}

// Sadece login sayfası için middleware'i çalıştır
export const config = {
  matcher: ['/auth/login']
};
