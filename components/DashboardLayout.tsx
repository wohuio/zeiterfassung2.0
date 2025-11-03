'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: 'dashboard' | 'time-entries' | 'reports' | 'admin';
}

export function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-title-1 gradient-text animate-fade-in">Lädt...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Effects */}
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      {/* Header */}
      <header className="header-minimal sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-title-1 gradient-text glow-purple" style={{
                textShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)'
              }}>
                Zeiterfassung
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Willkommen, <span className="gradient-text-purple">{user.name}</span>!
              </p>
            </div>
            <div>
              <Button
                onClick={handleLogout}
                className="btn btn-primary"
              >
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border-primary relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Link
              href="/dashboard"
              className={`py-4 px-3 relative group block ${
                activeTab === 'dashboard' ? 'gradient-text font-semibold' : 'text-text-secondary'
              }`}
            >
              <span className="group-hover:text-novu-400 transition-colors text-body">Dashboard</span>
              {activeTab === 'dashboard' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-novu-500 via-blue-500 to-pink-500 rounded-t-full" />
              )}
              {activeTab !== 'dashboard' && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-novu-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-full" />
              )}
            </Link>

            <Link
              href="/time-entries"
              className={`py-4 px-3 relative group block ${
                activeTab === 'time-entries' ? 'gradient-text font-semibold' : 'text-text-secondary'
              }`}
            >
              <span className="group-hover:text-novu-400 transition-colors text-body">Zeiteinträge</span>
              {activeTab === 'time-entries' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-novu-500 via-blue-500 to-pink-500 rounded-t-full" />
              )}
              {activeTab !== 'time-entries' && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-novu-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-full" />
              )}
            </Link>

            <Link
              href="/reports"
              className={`py-4 px-3 relative group block ${
                activeTab === 'reports' ? 'gradient-text font-semibold' : 'text-text-secondary'
              }`}
            >
              <span className="group-hover:text-novu-400 transition-colors text-body">Berichte</span>
              {activeTab === 'reports' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-novu-500 via-blue-500 to-pink-500 rounded-t-full" />
              )}
              {activeTab !== 'reports' && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-novu-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-full" />
              )}
            </Link>

            {(user.role === 'admin' || user.role === 'office') && (
              <Link
                href="/admin"
                className={`py-4 px-3 relative group block ${
                  activeTab === 'admin' ? 'gradient-text font-semibold' : 'text-text-secondary'
                }`}
              >
                <span className="group-hover:text-novu-400 transition-colors text-body">Admin</span>
                {activeTab === 'admin' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-novu-500 via-blue-500 to-pink-500 rounded-t-full" />
                )}
                {activeTab !== 'admin' && (
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-novu-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-full" />
                )}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container-figma py-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
