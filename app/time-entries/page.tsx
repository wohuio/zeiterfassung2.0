'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { xanoClient } from '@/lib/xano-client';
import type { TimeEntry } from '@/lib/types';

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await xanoClient.getTimeEntries({ limit: 50, offset: 0 });
      // Response from Xano list endpoint: { entries, pagination }
      setEntries((response as any).entries || response.items || []);
    } catch (err: any) {
      console.error('Failed to load time entries:', err);
      setError(err.message || 'Fehler beim Laden der Zeiteinträge');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Show hours only if > 0
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    // Show minutes and seconds
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    // Only seconds
    return `${secs}s`;
  };

  const calculateDuration = (start: number, end: number) => {
    // start and end are Xano timestamps in milliseconds
    return Math.floor((end - start) / 1000); // Convert to seconds
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="time-entries">
        <div className="flex items-center justify-center py-16">
          <div className="text-xl gradient-text">Lädt...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeTab="time-entries">
        <motion.div
          className="card-bento card-glass card-glow relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ParticleBackground />
          <div className="relative z-10 text-center py-16">
            <div className="mb-6">
              <GlowIcon icon="clock" size={80} variant="pulse" color="gradient" />
            </div>
            <h2 className="text-title-1 gradient-text mb-4">Fehler</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">{error}</p>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="time-entries">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-title-1 gradient-text mb-2">Zeiteinträge</h1>
            <p className="text-text-secondary">
              {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
            </p>
          </div>
        </div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <motion.div
            className="card-bento card-glass card-glow relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ParticleBackground />
            <div className="relative z-10 text-center py-16">
              <div className="mb-6">
                <GlowIcon icon="clock" size={80} variant="pulse" color="gradient" />
              </div>
              <h2 className="text-title-2 gradient-text mb-4">
                Keine Zeiteinträge vorhanden
              </h2>
              <p className="text-text-secondary">
                Starte einen Timer auf dem Dashboard, um Zeiteinträge zu erstellen.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="card-bento card-glow relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <ParticleBackground />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Date */}
                  <div>
                    <div className="text-label mb-1">Datum</div>
                    <div className="text-body font-semibold">
                      {formatDate(entry.start)}
                    </div>
                  </div>

                  {/* Time Range */}
                  <div>
                    <div className="text-label mb-1">Zeitraum</div>
                    <div className="text-body">
                      {formatTime(entry.start)} - {formatTime(entry.end)}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <div className="text-label mb-1">Dauer</div>
                    <div className="text-body font-semibold gradient-text">
                      {formatDuration(calculateDuration(entry.start, entry.end))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <div className="text-label mb-1">Kommentar</div>
                    <div className="text-body text-text-tertiary">
                      {entry.comment || '-'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
