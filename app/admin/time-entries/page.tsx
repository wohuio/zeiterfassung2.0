'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Button } from '@/components/ui/button';
import { xanoClient } from '@/lib/xano-client';
import type { TimeEntry, User } from '@/lib/types';

export default function AdminTimeEntriesPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
    } else if (!authLoading && currentUser && currentUser.role !== 'admin') {
      router.push('/dashboard');
    } else if (currentUser && currentUser.role === 'admin') {
      loadData();
    }
  }, [currentUser, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users first
      const usersResponse = await xanoClient.getUsers({});
      const usersList = usersResponse.items || usersResponse as any;
      setUsers(usersList);

      // Load all time entries
      const entriesResponse = await xanoClient.getTimeEntries({ limit: 100, offset: 0 });
      const entriesList = (entriesResponse as any).entries || entriesResponse.items || [];
      setEntries(entriesList);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      // Show helpful error for missing Xano endpoints
      if (err.message.includes('Unable to locate request')) {
        setError('⚠️ Admin-Endpunkte fehlen in Xano\n\nDie Admin-Seiten benötigen folgende Xano-Endpunkte:\n\n' +
                 '📌 GET /admin/users - Liste aller Benutzer\n' +
                 '📌 PATCH /admin/users/{id} - Benutzer aktualisieren\n\n' +
                 'Bitte erstellen Sie diese Endpunkte in Xano, oder verwenden Sie die normalen\n' +
                 'Zeiteinträge-Seiten unter "Zeiteinträge" im Hauptmenü.');
      } else {
        setError(err.message || 'Fehler beim Laden der Daten');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) return;

    try {
      await xanoClient.deleteTimeEntry(entryId);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      alert('Fehler beim Löschen: ' + err.message);
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

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSameDay = (timestamp1: number, timestamp2: number) => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateDuration = (start: number, end: number) => {
    return Math.floor((end - start) / 1000);
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  };

  const filteredEntries = entries.filter(entry => {
    const matchesUser = selectedUserId === 'all' || entry.user_id === parseInt(selectedUserId);
    const matchesDate = !dateFilter || formatDate(entry.start).includes(dateFilter);
    return matchesUser && matchesDate;
  });

  if (authLoading || !currentUser || currentUser.role !== 'admin') {
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-title-1 gradient-text mb-2">Zeiteinträge (Alle Benutzer)</h1>
              <p className="text-body text-text-secondary">
                {filteredEntries.length} von {entries.length} Einträgen
              </p>
            </div>
            <Button onClick={() => router.push('/admin')}>
              ← Zurück zur Admin-Übersicht
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-bento p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
            >
              <option value="all">Alle Benutzer</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Datum Filter (z.B. 03.11.2025)"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple"
            />
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-xl gradient-text">Lädt Einträge...</div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-bento card-glow relative overflow-hidden"
          >
            <ParticleBackground />
            <div className="relative z-10 text-center py-16">
              <GlowIcon icon="clock" size={80} variant="pulse" color="gradient" />
              <h2 className="text-title-2 gradient-text mt-6 mb-4">
                Keine Zeiteinträge gefunden
              </h2>
              <p className="text-text-secondary">
                {selectedUserId !== 'all' || dateFilter
                  ? 'Versuchen Sie andere Filter'
                  : 'Keine Zeiteinträge vorhanden'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="card-bento card-glow relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <ParticleBackground />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* User */}
                  <div>
                    <div className="text-label mb-1">Benutzer</div>
                    <div className="text-body font-semibold">{getUserName(entry.user_id)}</div>
                  </div>

                  {/* Date */}
                  <div>
                    <div className="text-label mb-1">Datum</div>
                    <div className="text-body">
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
                    <div className="text-body text-body-sm">
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
                    {entry.is_break && (
                      <div className="text-xs text-orange-400 mt-1">☕ Pause</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="text-right">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-body-sm font-medium"
                    >
                      Löschen
                    </button>
                  </div>
                </div>

                {/* Comment */}
                {entry.comment && (
                  <div className="mt-4 pt-4 border-t border-border-primary">
                    <div className="text-label mb-1">Kommentar</div>
                    <div className="text-body text-text-tertiary">{entry.comment}</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
