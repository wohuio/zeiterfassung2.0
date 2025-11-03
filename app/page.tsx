'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Effects */}
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="text-display gradient-text text-neon mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Zeiterfassung
          </motion.h1>
          <motion.p
            className="text-title-2 text-text-secondary mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Moderne Zeiterfassungs-App mit Xano Backend
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/auth/login"
              className="btn btn-primary px-8 py-4 text-lg"
            >
              Anmelden
            </Link>
            <Link
              href="/auth/signup"
              className="btn btn-secondary px-8 py-4 text-lg"
            >
              Registrieren
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: 'clock' as const,
              title: 'Zeiterfassung',
              desc: 'Stoppuhr-Modus oder manuelle Zeiteinträge',
              delay: 0.4,
            },
            {
              icon: 'chart' as const,
              title: 'Berichte',
              desc: 'Wochen- und Monatsberichte mit Überstunden',
              delay: 0.45,
            },
            {
              icon: 'users' as const,
              title: 'Multi-User',
              desc: 'Benutzerverwaltung mit verschiedenen Rollen',
              delay: 0.5,
            },
            {
              icon: 'settings' as const,
              title: 'Sicher',
              desc: 'Xano Authentication mit JWT-Tokens',
              delay: 0.55,
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              className="card-bento card-glow relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: feature.delay }}
              whileHover={{ scale: 1.02 }}
            >
              <ParticleBackground />
              <div className="relative z-10">
                <div className="mb-4">
                  <GlowIcon
                    icon={feature.icon}
                    size={48}
                    variant="pulse"
                    color="gradient"
                  />
                </div>
                <h2 className="text-title-2 font-semibold mb-2 gradient-text-purple">
                  {feature.title}
                </h2>
                <p className="text-text-tertiary text-sm">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-text-tertiary text-sm">
            Demo: Melde dich an und starte mit der Zeiterfassung!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
