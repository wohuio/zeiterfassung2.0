'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && user.role !== 'admin') {
      // Redirect non-admin users
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <DashboardLayout activeTab="admin">
        <div className="flex items-center justify-center py-16">
          <div className="text-xl gradient-text">Lädt...</div>
        </div>
      </DashboardLayout>
    );
  }

  const adminSections = [
    {
      title: 'Benutzerverwaltung',
      description: 'Benutzer anzeigen, bearbeiten, aktivieren/deaktivieren',
      icon: 'users',
      href: '/admin/users',
      color: 'from-blue-500 to-purple-500',
      features: ['Alle Benutzer', 'Rollen zuweisen', 'Status ändern', 'Profile bearbeiten']
    },
    {
      title: 'Zeiteinträge (Alle)',
      description: 'Zeiteinträge aller Benutzer anzeigen und verwalten',
      icon: 'clock',
      href: '/admin/time-entries',
      color: 'from-purple-500 to-pink-500',
      features: ['Alle Einträge', 'Bearbeiten', 'Löschen', 'Filtern']
    },
    {
      title: 'Arbeitszeiten',
      description: 'Sollarbeitszeiten für Benutzer konfigurieren',
      icon: 'settings',
      href: '/admin/working-times',
      color: 'from-green-500 to-teal-500',
      features: ['Wochenplan', 'Feiertage', 'Sonderregelungen', 'Historie']
    },
    {
      title: 'Überstunden',
      description: 'Überstundenkonten verwalten und anpassen',
      icon: 'chart',
      href: '/admin/overtime',
      color: 'from-orange-500 to-red-500',
      features: ['Kontostand', 'Manuelle Anpassung', 'Historie', 'Limits']
    },
    {
      title: 'Abwesenheiten',
      description: 'Urlaub und Krankheitstage genehmigen',
      icon: 'calendar',
      href: '/admin/absences',
      color: 'from-teal-500 to-cyan-500',
      features: ['Anträge', 'Genehmigen', 'Ablehnen', 'Übersicht']
    },
    {
      title: 'Berichte (Alle)',
      description: 'Team-Berichte und Auswertungen',
      icon: 'file',
      href: '/admin/reports',
      color: 'from-pink-500 to-purple-500',
      features: ['Team-Übersicht', 'Statistiken', 'Export', 'Analysen']
    },
  ];

  return (
    <DashboardLayout activeTab="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-display gradient-text mb-4">Admin-Bereich</h1>
          <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
            Zentrale Verwaltung für Benutzer, Zeiteinträge und Systemkonfiguration
          </p>
        </motion.div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={section.href}
                className="group card-bento card-glow block h-full relative overflow-hidden hover:scale-105 transition-transform"
              >
                <ParticleBackground />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${section.color} p-0.5`}>
                      <div className="w-full h-full bg-bg-card rounded-xl flex items-center justify-center">
                        <GlowIcon icon={section.icon as any} size={32} variant="pulse" color="gradient" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-title-2 mb-2 group-hover:gradient-text transition-all">
                    {section.title}
                  </h3>
                  <p className="text-body text-text-secondary mb-4">
                    {section.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {section.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-body-sm text-text-tertiary">
                        <span className="text-green-400">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Arrow */}
                  <motion.div
                    className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    Öffnen
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

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="card-bento card-glow relative overflow-hidden"
        >
          <ParticleBackground />
          <div className="relative z-10">
            <h3 className="text-title-2 mb-6">Schnellübersicht</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-title-1 gradient-text mb-2">-</div>
                <div className="text-body-sm text-text-tertiary">Aktive Benutzer</div>
              </div>
              <div className="text-center">
                <div className="text-title-1 gradient-text mb-2">-</div>
                <div className="text-body-sm text-text-tertiary">Offene Anträge</div>
              </div>
              <div className="text-center">
                <div className="text-title-1 gradient-text mb-2">-</div>
                <div className="text-body-sm text-text-tertiary">Heutige Einträge</div>
              </div>
              <div className="text-center">
                <div className="text-title-1 gradient-text mb-2">-</div>
                <div className="text-body-sm text-text-tertiary">Aktive Timer</div>
              </div>
            </div>
            <p className="text-center text-body-sm text-text-tertiary mt-6">
              Detaillierte Statistiken werden in den jeweiligen Bereichen angezeigt
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
