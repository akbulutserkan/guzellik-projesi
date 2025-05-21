// src/lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export type ApiHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse>;

export type RouteConfig = {
  GET?: Permission;
  POST?: Permission;
  PUT?: Permission;
  DELETE?: Permission;
};

export type MultiPermissionRouteConfig = {
  GET?: Permission | Permission[];
  POST?: Permission | Permission[];
  PUT?: Permission | Permission[];
  DELETE?: Permission | Permission[];
};

export function withProtectedRoute(handler: ApiHandler, permissions: RouteConfig) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // HTTP metoduna göre gerekli permission'ı al
      const method = req.method as keyof RouteConfig;
      const requiredPermission = permissions[method];

      // Admin tüm işlemleri yapabilir
      if (session.user.role === 'ADMIN') {
        return handler(req, context);
      }

      // Gerekli yetki varsa kontrol et
      if (requiredPermission && !session.user.permissions?.includes(requiredPermission)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      return handler(req, context);
    } catch (error: any) {
      console.error(`API Error: ${req.method} ${req.url}`, error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: error.status || 500 }
      );
    }
  };
}

export function withMultiPermissionRoute(handler: ApiHandler, permissions: MultiPermissionRouteConfig) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const method = req.method as keyof MultiPermissionRouteConfig;
      const requiredPermissions = permissions[method];

      if (session.user.role === 'ADMIN') {
        return handler(req, context);
      }

      if (requiredPermissions) {
        const userPermissions = session.user.permissions || [];
        const hasRequiredPermission = Array.isArray(requiredPermissions)
          ? requiredPermissions.some(permission => userPermissions.includes(permission))
          : userPermissions.includes(requiredPermissions);

        if (!hasRequiredPermission) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
      }

      return handler(req, context);
    } catch (error: any) {
      console.error(`API Error: ${req.method} ${req.url}`, error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: error.status || 500 }
      );
    }
  };
}