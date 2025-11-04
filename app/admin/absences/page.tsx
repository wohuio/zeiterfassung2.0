'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Button } from '@/components/ui/button';

export default function AdminAbsencesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && user.role !== 'admin') {
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

  return (
    <DashboardLayout activeTab="admin">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-title-1 gradient-text">Abwesenheiten-Verwaltung</h1>
            <Button onClick={() => router.push('/admin')}>
              ← Zurück zur Admin-Übersicht
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-bento card-glow relative overflow-hidden"
        >
          <ParticleBackground />
          <div className="relative z-10 text-center py-16">
            <GlowIcon icon="calendar" size={80} variant="pulse" color="gradient" />
            <h2 className="text-title-2 gradient-text mt-6 mb-4">
              In Entwicklung
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Diese Funktion wird in Kürze verfügbar sein. Hier können Sie Urlaubsanträge
              und Krankmeldungen genehmigen oder ablehnen.
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
