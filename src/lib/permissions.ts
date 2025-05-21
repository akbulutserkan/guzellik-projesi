// src/lib/permissions.ts
export function hasPermission(session: Session | null, permission: Permission): boolean {
    if (!session) return false;
    if (session.user.role === 'ADMIN') return true;
    return session.user.permissions?.includes(permission) || false;
  }