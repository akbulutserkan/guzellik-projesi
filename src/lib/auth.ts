"use client";

import { useSession } from 'next-auth/react';
import { Permission, UserRole } from '@prisma/client';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import type { ComponentType } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from "@/components/ui/use-toast";

// URL path'lerine göre izinler
export const PATH_PERMISSIONS = {
  '/staff': 'VIEW_STAFF',
  '/services': 'VIEW_SERVICES',
  '/customers': 'VIEW_CUSTOMERS',
  '/appointments': 'VIEW_APPOINTMENTS',
  '/packages': 'VIEW_PACKAGES',
  '/products': 'VIEW_PRODUCTS',
  '/payments': 'VIEW_PAYMENTS',
  '/payments/new': 'EDIT_PAYMENTS'
} as const;

// Client-side yetki kontrolü
function hasRequiredPermission(session: any, pathname: string) {
  if (!session) return false;
  if (session.user.role === UserRole.ADMIN) return true;
  
  // Special case for dynamic routes like /payments/[id]
  if (pathname.match(/^\/payments\/[\w-]+$/) && pathname !== '/payments/new') {
    return session.user.permissions?.includes('EDIT_PAYMENTS' as Permission) || false;
  }
  
  const requiredPermission = PATH_PERMISSIONS[pathname as keyof typeof PATH_PERMISSIONS];
  if (!requiredPermission) return true;
  
  return session.user.permissions?.includes(requiredPermission as Permission) || false;
}

// withPageAuth HOC
export function withPageAuth<P extends object>(Component: ComponentType<P>) {
  return function WithPageAuthComponent(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    useEffect(() => {
      if (status === 'unauthenticated') {
        router.replace('/auth/login');
      } else if (status === 'authenticated' && !hasRequiredPermission(session, pathname)) {
        router.replace('/');
        toast({
          variant: "destructive",
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya erişim yetkiniz bulunmamaktadır."
        });
      }
    }, [status, session, router, pathname]);

    if (status === 'loading') {
      return React.createElement(LoadingSpinner);
    }

    return React.createElement(Component, props);
  };
}

// Hooks
export function usePermission(permission: Permission) {
  const { data: session } = useSession();
  if (!session) return false;
  if (session.user.role === UserRole.ADMIN) return true;
  return session.user.permissions?.includes(permission) || false;
}

export function usePermissions(permissions: Permission[]) {
  const { data: session } = useSession();
  if (!session) return false;
  if (session.user.role === UserRole.ADMIN) return true;
  return permissions.every(p => session.user.permissions?.includes(p));
}