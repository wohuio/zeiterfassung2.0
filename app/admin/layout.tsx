'use client';

import { useRoleProtection } from '@/lib/use-role-protection';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, hasAccess } = useRoleProtection({
    requiredRoles: ['admin'],
    redirectTo: '/dashboard'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-body text-muted-foreground">Überprüfe Admin-Berechtigung...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirect wird vom Hook gehandhabt
  }

  return <>{children}</>;
}
