// src/lib/auth-utils.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Permission, UserRole } from '@prisma/client';

// Path bazlı permission eşleştirmeleri
const PATH_PERMISSIONS: Record<string, Permission> = {
  '/(protected)/staff': Permission.VIEW_STAFF,
  '/(protected)/services': Permission.VIEW_SERVICES,
  '/(protected)/customers': Permission.VIEW_CUSTOMERS,
  '/(protected)/appointments': Permission.VIEW_APPOINTMENTS,
  '/(protected)/packages': Permission.VIEW_PACKAGES,
  '/(protected)/products': Permission.VIEW_PRODUCTS,
  '/(protected)/payments': Permission.VIEW_PAYMENTS
};

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '/';

  // Admin kontrolü
  if (session.user.role === UserRole.ADMIN) {
    return session;
  }

  // Path permission kontrolü
  const permissionCheck = Object.entries(PATH_PERMISSIONS).find(([path]) => {
    const pathPattern = new RegExp(`^${path}(?:/.*)?$`);
    return pathPattern.test(pathname);
  });

  if (permissionCheck && !session.user.permissions?.includes(permissionCheck[1])) {
    redirect('/');
  }

  return session;
}