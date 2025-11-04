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

export default function CRMPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-title-1 gradient-text animate-fade-in">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Effects */}
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-display gradient-text mb-4">
            CRM System
          </h1>
          <p className="text-body-md text-text-secondary">
            Verwalten Sie Ihre Kunden, Kontakte und Adressen zentral an einem Ort
          </p>
        </motion.div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Organizations Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/crm/organizations"
              className="group card-bento card-glow block h-full relative overflow-hidden min-h-[300px]"
            >
              <ParticleBackground />

              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <GlowIcon icon="users" size={64} variant="pulse" color="gradient" />
                </div>

                <h3 className="text-title-2 mb-3 group-hover:gradient-text transition-all">
                  Organisationen
                </h3>

                <p className="text-body-md text-text-secondary mb-6 flex-1">
                  Verwalten Sie Ihre Kunden, Partner und Lieferanten mit allen wichtigen Stammdaten.
                </p>

                <div className="space-y-2 text-body-sm text-text-tertiary mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Firmenstammdaten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Zahlungskonditionen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Steuerinformationen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Notizen & Historie</span>
                  </div>
                </div>

                <motion.div
                  className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  Zu Organisationen
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

          {/* Persons Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/crm/persons"
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
                  Kontaktpersonen
                </h3>

                <p className="text-body-md text-text-secondary mb-6 flex-1">
                  Verwalten Sie Ansprechpartner mit Kontaktdaten, Position und Verantwortlichkeiten.
                </p>

                <div className="space-y-2 text-body-sm text-text-tertiary mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Ansprechpartner pflegen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Kontaktdaten verwalten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Primärkontakte markieren</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Organisationen zuordnen</span>
                  </div>
                </div>

                <motion.div
                  className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  Zu Kontaktpersonen
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

          {/* Addresses Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/crm/addresses"
              className="group card-bento card-glow block h-full relative overflow-hidden min-h-[300px]"
            >
              <ParticleBackground />

              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <GlowIcon icon="settings" size={64} variant="pulse" color="gradient" />
                </div>

                <h3 className="text-title-2 mb-3 group-hover:gradient-text transition-all">
                  Adressen
                </h3>

                <p className="text-body-md text-text-secondary mb-6 flex-1">
                  Übersicht über alle Adressen von Organisationen und Personen an einem Ort.
                </p>

                <div className="space-y-2 text-body-sm text-text-tertiary mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Rechnungsadressen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Lieferadressen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Zentrale Verwaltung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Filter & Suche</span>
                  </div>
                </div>

                <motion.div
                  className="inline-flex items-center gap-2 text-body font-semibold gradient-text"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  Zu Adressen
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
        </div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={() => router.push('/dashboard')}
            variant="secondary"
            className="border-border-primary hover:border-accent-purple/50"
          >
            Zurück zum Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
