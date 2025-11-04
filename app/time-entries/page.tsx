'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Button } from '@/components/ui/button';
import { xanoClient } from '@/lib/xano-client';
import { useAuth } from '@/lib/auth-context';
import type { TimeEntry } from '@/lib/types';

// Memoized TimeEntryCard component for better performance
const TimeEntryCard = memo(({ entry, index }: { entry: TimeEntry; index: number }) => {
  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatDateTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const isSameDay = useCallback((timestamp1: number, timestamp2: number) => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  const calculateDuration = useCallback((start: number, end: number) => {
    return Math.floor((end - start) / 1000);
  }, []);

  return (
    <motion.div
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
            {!isSameDay(entry.start, entry.end) && (
              <>
                <br />
                <span className="text-xs text-text-tertiary">bis {formatDate(entry.end)}</span>
              </>
            )}
          </div>
        </div>

        {/* Time Range */}
        <div>
          <div className="text-label mb-1">Zeitraum</div>
          <div className="text-body">
            {isSameDay(entry.start, entry.end) ? (
              <>{formatTime(entry.start)} - {formatTime(entry.end)}</>
            ) : (
              <>
                {formatDateTime(entry.start)}
                <br />
                <span className="text-xs">bis</span>
                <br />
                {formatDateTime(entry.end)}
              </>
            )}
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
  );
});

TimeEntryCard.displayName = 'TimeEntryCard';

export default function TimeEntriesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Check if user is admin or office
  const isAdminOrOffice = useMemo(() =>
    user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'office',
    [user?.role]
  );

  // SWR fetcher function
  const fetcher = useCallback(async ([key, page]: [string, number]) => {
    if (!user) return { items: [], itemsTotal: 0 };

    if (isAdminOrOffice) {
      return await xanoClient.getAllTimeEntries(page, ITEMS_PER_PAGE);
    } else {
      const response = await xanoClient.getTimeEntries({
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE
      });
      return response;
    }
  }, [user, isAdminOrOffice]);

  // Use SWR for data fetching with caching
  const { data, error, isLoading } = useSWR(
    user ? ['time-entries', page] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

  const entries = data?.items || [];
  const totalItems = data?.itemsTotal || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handleLoadMore = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const handlePrevious = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  if (isLoading) {
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
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              {error.message || 'Fehler beim Laden der Zeiteinträge'}
            </p>
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
              {totalItems} {totalItems === 1 ? 'Eintrag' : 'Einträge'} gesamt
              {totalPages > 1 && ` • Seite ${page} von ${totalPages}`}
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
          <>
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <TimeEntryCard key={entry.id} entry={entry} index={index} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <Button
                  onClick={handlePrevious}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  ← Zurück
                </Button>
                <span className="text-body text-text-secondary">
                  Seite {page} von {totalPages}
                </span>
                <Button
                  onClick={handleLoadMore}
                  disabled={page >= totalPages}
                  className="btn btn-primary"
                >
                  Weiter →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
