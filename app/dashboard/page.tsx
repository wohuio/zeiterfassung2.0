'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import TimeClock from '@/components/TimeClock';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';

export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Effects */}
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      {/* Header - Minimalistisch & Schnell */}
      <header className="header-minimal sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-title-1 gradient-text">
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

      {/* Navigation with Glow */}
      <motion.nav
        className="border-b border-border-primary relative z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href="/dashboard"
                className="py-4 px-3 relative group block"
              >
                <span className="gradient-text font-semibold relative z-10 text-body">Dashboard</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-novu-500 via-blue-500 to-pink-500 rounded-t-full"
                  layoutId="activeTab"
                />
              </Link>
            </motion.div>

            {['Zeiteinträge', 'Berichte'].map((item, idx) => (
              <motion.div
                key={item}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item === 'Zeiteinträge' ? '/time-entries' : '/reports'}
                  className="py-4 px-3 relative group text-text-secondary block"
                >
                  <span className="group-hover:text-novu-400 transition-colors text-body">{item}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-novu-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}

            {(user.role === 'admin' || user.role === 'office') && (
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/admin"
                  className="py-4 px-3 relative group text-text-secondary block"
                >
                  <span className="group-hover:text-novu-400 transition-colors text-body">Admin</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-novu-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Main Content with Bento Grid */}
      <main className="container-figma py-12 relative z-10">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]">
          {/* Timer Card - Spans 2 rows */}
          <motion.div
            className="col-span-12 md:col-span-7 row-span-2 card-bento card-glass card-glow card-3d card-holographic relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
          >
            <ParticleBackground />
            <div className="relative z-10">
              <TimeClock />
            </div>
          </motion.div>

          {/* Overtime Card - Featured */}
          <motion.div
            className="col-span-12 md:col-span-5 row-span-1 card-bento card-glow relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
          >
            <ParticleBackground />

            {user.overtime_account ? (
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="text-label mb-4 flex items-center gap-3">
                  <GlowIcon icon="trending" size={18} variant="pulse" color="gradient" />
                  <span>Überstunden-Saldo</span>
                  <motion.span
                    className="inline-block px-2 py-0.5 text-xs rounded-full bg-novu-500/10 text-novu-400 border border-novu-500/20"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    Live
                  </motion.span>
                </div>
                <motion.div
                  className="text-6xl font-bold gradient-text mb-6"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
                >
                  {user.overtime_account.current_balance.toFixed(1)}<span className="text-3xl ml-2">h</span>
                </motion.div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-text-tertiary">
                    <span>Fortschritt</span>
                    <span>{Math.min((user.overtime_account.current_balance / user.overtime_account.max_allowed_overtime) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden bg-white/5">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-novu-500 via-blue-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((user.overtime_account.current_balance / user.overtime_account.max_allowed_overtime) * 100, 100)}%`
                      }}
                      transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-xs text-text-tertiary">
                    Maximal {user.overtime_account.max_allowed_overtime}h erlaubt
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="text-label mb-4 flex items-center gap-3">
                  <GlowIcon icon="trending" size={18} variant="pulse" color="gradient" />
                  <span>Überstunden-Saldo</span>
                </div>
                <div className="text-2xl font-bold gradient-text mb-4">
                  Nicht konfiguriert
                </div>
                <p className="text-sm text-text-tertiary mb-4">
                  Dein Überstunden-Konto wurde noch nicht eingerichtet. Bitte kontaktiere deinen Administrator.
                </p>
                <div className="inline-flex px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
                  ⚠️ Konto fehlt
                </div>
              </motion.div>
            )}

          </motion.div>

          {/* Role Card - Compact */}
          <motion.div
            className="col-span-6 md:col-span-3 card-bento card-glow relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
          >
            <ParticleBackground />
            <div className="relative z-10">
              <div className="text-label mb-2">Rolle</div>
            <div className="text-title-2 capitalize gradient-text-purple">{user.role}</div>
              <motion.div
                className="mt-4 inline-flex px-3 py-1 rounded-full bg-novu-500/10 text-novu-400 text-xs font-medium border border-novu-500/20"
                whileHover={{ scale: 1.1 }}
              >
                {user.role}
              </motion.div>
            </div>
          </motion.div>

          {/* Status Card - Compact */}
          <motion.div
            className="col-span-6 md:col-span-2 card-bento card-glow relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <ParticleBackground />
            <div className="relative z-10">
              <div className="text-label mb-2">Status</div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <motion.span
                  className={`status-dot ${user.is_active ? 'status-dot-active' : 'status-dot-inactive'}`}
                  animate={user.is_active ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-sm font-medium">
                  {user.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - Bento Grid Style */}
        <div className="mt-8 grid grid-cols-12 gap-6">
          {[
            { href: '/time-entries/new', iconType: 'file' as const, title: 'Manueller Eintrag', desc: 'Start- und Endzeit', cta: 'Erstellen', delay: 0.8, span: 'col-span-12 md:col-span-4' },
            { href: '/reports/week', iconType: 'chart' as const, title: 'Wochenbericht', desc: 'Aktuelle Woche', cta: 'Anzeigen', delay: 0.9, span: 'col-span-12 md:col-span-4' },
            { href: '/reports/month', iconType: 'calendar' as const, title: 'Monatsbericht', desc: 'Gesamter Monat', cta: 'Anzeigen', delay: 1.0, span: 'col-span-12 md:col-span-4' }
          ].map((action, idx) => (
            <motion.div
              key={action.href}
              className={action.span}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <Link
                href={action.href}
                className="group card-bento card-glow block h-full relative overflow-hidden"
              >
                <ParticleBackground />
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-novu-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="mb-4">
                    <GlowIcon icon={action.iconType} size={48} variant="pulse" color="gradient" />
                  </div>
                  <h3 className="text-xl font-bold mb-1 group-hover:gradient-text transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-text-tertiary mb-4">
                    {action.desc}
                  </p>
                  <motion.div
                    className="inline-flex items-center gap-2 text-sm font-semibold gradient-text"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {action.cta}
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
          ))}
        </div>
      </main>
    </div>
  );
}
