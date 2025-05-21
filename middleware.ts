// middleware.ts
import { NextResponse } from 'next/server';
// Next.js 15 ile uyumlu hale getirmek için config düzenlendi
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware';
import { Permission, UserRole } from '@prisma/client';

type PermissionCheck = {
  path: string;
  prefix: keyof typeof Permission;
};

const PERMISSION_CHECKS: PermissionCheck[] = [
  { path: '/(protected)/staff', prefix: 'VIEW_STAFF' },
  { path: '/(protected)/services', prefix: 'VIEW_SERVICES' },
  { path: '/(protected)/customers', prefix: 'VIEW_CUSTOMERS' },
  { path: '/(protected)/appointments', prefix: 'VIEW_APPOINTMENTS' },
  { path: '/(protected)/packages', prefix: 'VIEW_PACKAGES' },
  { path: '/(protected)/products', prefix: 'VIEW_PRODUCTS' },
  { path: '/(protected)/payments', prefix: 'VIEW_PAYMENTS' }
];

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const token = request.nextauth.token;
    const path = request.nextUrl.pathname;

    // Token kontrolü
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Admin tüm sayfalara erişebilir
    if (token.role === UserRole.ADMIN) {
      return NextResponse.next();
    }

    // İzin kontrolü
    const permissionCheck = PERMISSION_CHECKS.find(check => {
      const pathPattern = new RegExp(`^${check.path}(?:/.*)?$`);
      return pathPattern.test(path) || 
             pathPattern.test(path.replace('/api', ''));
    });

    if (permissionCheck) {
      const requiredPermission = permissionCheck.prefix;
      if (!token.permissions?.includes(requiredPermission)) {
        if (path.startsWith('/api')) {
          return NextResponse.json(
            { error: 'Bu işlem için yetkiniz bulunmamaktadır' }, 
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/api/:path*',
    '/(protected)/:path*',
    '/api/mcapi/:path*' // mcapi üzerinden gelen istekleri de işlemesi için
  ]
};