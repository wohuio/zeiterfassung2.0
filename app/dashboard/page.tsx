'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';

export default function MainDashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  // Role-based access control
  const canAccessCRM = user.role === 'office' || user.role === 'admin';
  const canAccessAdmin = user.role === 'admin';

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
              <h1 className="text-title-1 gradient-text">Dashboard</h1>
              <p className="text-sm text-text-secondary mt-1">
                Willkommen, <span className="gradient-text-purple">{user.name}</span>!
              </p>
            </div>
            <div>
              <Button onClick={handleLogout} className="btn btn-primary">
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-figma py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h2 className="text-title-1 gradient-text mb-4">
            Was möchten Sie tun?
          </h2>
          <p className="text-body-md text-text-secondary">
            Wählen Sie einen Bereich aus, um fortzufahren
          </p>
        </motion.div>

        {/* Main Navigation Cards */}
        <div className={`grid grid-cols-1 ${canAccessCRM || canAccessAdmin ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1'} gap-8 max-w-6xl mx-auto`}>
          {/* Zeiterfassung Card - ALLE ROLLEN */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/time-tracking"
              className="group card-bento card-glow block h-full relative overflow-hidden min-h-[300px]"
            >
              <ParticleBackground />

              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <GlowIcon icon="clock" size={64} variant="pulse" color="gradient" />
                </div>

                <h3 className="text-title-2 mb-3 group-hover:gradient-text transition-all">
                  Zeiterfassung
                </h3>

                <p className="text-body-md text-text-secondary mb-6 flex-1">
                  Erfassen Sie Ihre Arbeitszeit mit der Stoppuhr, erstellen Sie manuelle Einträge und sehen Sie Ihre Berichte ein.
                </p>

                <div className="space-y-2 text-body-sm text-text-tertiary mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Timer starten/stoppen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Zeiteinträge verwalten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Wochen- und Monatsberichte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Überstunden-Tracking</span>
                  </div>
                </div>

                <motion.div
                  className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  Zur Zeiterfassung
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </div>
            </Link>
          </motion.div>

          {/* CRM Card - NUR OFFICE & ADMIN */}
          {canAccessCRM && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Link
                href="/crm"
                className="group card-bento card-glow block h-full relative overflow-hidden min-h-[300px]"
              >
                <ParticleBackground />

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <GlowIcon icon="users" size={64} variant="pulse" color="gradient" />
                </div>

                <h3 className="text-title-2 mb-3 group-hover:gradient-text transition-all">
                  CRM System
                </h3>

                <p className="text-body-md text-text-secondary mb-6 flex-1">
                  Verwalten Sie Ihre Kunden, Kontakte und Adressen zentral an einem Ort.
                </p>

                <div className="space-y-2 text-body-sm text-text-tertiary mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Organisationen verwalten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Kontaktpersonen pflegen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Adressen zuordnen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Kundendaten zentral</span>
                  </div>
                </div>

                <motion.div
                  className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  Zum CRM System
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </div>
            </Link>
          </motion.div>
          )}

          {/* Admin Card - NUR ADMIN */}
          {canAccessAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Link
                href="/admin"
                className="group card-bento card-glow block h-full relative overflow-hidden min-h-[300px]"
              >
                <ParticleBackground />

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6">
                    <GlowIcon icon="settings" size={64} variant="pulse" color="gradient" />
                  </div>

                  <h3 className="text-title-2 mb-3 group-hover:gradient-text transition-all">
                    Administration
                  </h3>

                  <p className="text-body-md text-text-secondary mb-6 flex-1">
                    Verwalten Sie Benutzer, Einstellungen und System-Konfigurationen.
                  </p>

                  <div className="space-y-2 text-body-sm text-text-tertiary mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Benutzerverwaltung</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Rollen & Berechtigungen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>System-Berichte</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Team-Übersicht</span>
                    </div>
                  </div>

                  <motion.div
                    className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    Zur Administration
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {/* Role Card */}
          <div className="card-bento card-glow text-center">
            <ParticleBackground />
            <div className="relative z-10">
              <div className="text-label mb-2">Ihre Rolle</div>
              <div className="text-title-3 capitalize gradient-text-purple">{user.role}</div>
            </div>
          </div>

          {/* Status Card */}
          <div className="card-bento card-glow text-center">
            <ParticleBackground />
            <div className="relative z-10">
              <div className="text-label mb-2">Status</div>
              <div className="flex items-center justify-center gap-2">
                <motion.span
                  className={`status-dot ${user.is_active ? 'status-dot-active' : 'status-dot-inactive'}`}
                  animate={user.is_active ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-title-3">{user.is_active ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
            </div>
          </div>

          {/* Overtime Card */}
          <div className="card-bento card-glow text-center">
            <ParticleBackground />
            <div className="relative z-10">
              <div className="text-label mb-2">Überstunden</div>
              {user.overtime_account ? (
                <div className="text-title-3 gradient-text">
                  {user.overtime_account.current_balance.toFixed(1)}h
                </div>
              ) : (
                <div className="text-body-sm text-text-tertiary">
                  Nicht konfiguriert
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
