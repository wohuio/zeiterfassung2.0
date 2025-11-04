'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export type Role = 'user' | 'office' | 'admin';

interface RoleProtectionOptions {
  requiredRoles: Role[];
  redirectTo?: string;
}

/**
 * Hook für rollenbasierte Zugriffskontrolle
 *
 * @param options - Konfiguration mit erforderlichen Rollen und Redirect-Pfad
 * @returns Loading-Status und ob Zugriff erlaubt ist
 *
 * @example
 * // Nur Admin
 * const { loading, hasAccess } = useRoleProtection({ requiredRoles: ['admin'] });
 *
 * @example
 * // Office und Admin
 * const { loading, hasAccess } = useRoleProtection({ requiredRoles: ['office', 'admin'] });
 */
export function useRoleProtection({ requiredRoles, redirectTo = '/dashboard' }: RoleProtectionOptions) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const hasAccess = user && requiredRoles.includes(user.role as Role);

  useEffect(() => {
    if (!loading && !user) {
      // Nicht eingeloggt -> zum Login
      router.push('/auth/login');
    } else if (!loading && user && !hasAccess) {
      // Eingeloggt aber keine Berechtigung -> zum Dashboard
      console.warn(`Access denied: User role "${user.role}" not in required roles [${requiredRoles.join(', ')}]`);
      router.push(redirectTo);
    }
  }, [user, loading, hasAccess, router, redirectTo, requiredRoles]);

  return {
    loading,
    hasAccess: !!hasAccess,
    user
  };
}
