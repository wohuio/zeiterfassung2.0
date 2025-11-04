'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { xanoClient } from '@/lib/xano-client';
import { User, TimeEntry, Absence, TimeClock } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowIcon } from '@/components/ui/glow-icon';

function UserDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);

  const [user, setUser] = useState<User | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users list and find our user
      const usersData = await xanoClient.getUsers({ page: 1, per_page: 100 });
      const foundUser = usersData.items.find(u => u.id === userId);

      if (!foundUser) {
        throw new Error('Benutzer nicht gefunden');
      }

      setUser(foundUser);

      // Load recent time entries
      try {
        const entriesData = await xanoClient.getUserTimeEntries(userId, {
          page: '1',
          per_page: '10'
        });
        setTimeEntries(entriesData.items || []);
      } catch (err) {
        console.warn('Could not load time entries:', err);
      }

      // Load absences
      try {
        const absencesData = await xanoClient.getAbsences();
        setAbsences(absencesData.items || []);
      } catch (err) {
        console.warn('Could not load absences:', err);
      }

    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Benutzerdaten');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/users');
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    if (!confirm(`Möchten Sie den Status wirklich ändern?`)) return;

    try {
      await xanoClient.updateUser(user.id, { is_active: !user.is_active });
      await loadUserData();
    } catch (err: any) {
      alert('Fehler beim Ändern des Status: ' + err.message);
    }
  };

  const handleChangeRole = async () => {
    if (!user) return;
    const newRole = prompt('Neue Rolle (user, office, admin):', user.role);
    if (!newRole || !['user', 'office', 'admin'].includes(newRole)) return;

    try {
      await xanoClient.updateUser(user.id, { role: newRole as any });
      await loadUserData();
    } catch (err: any) {
      alert('Fehler beim Ändern der Rolle: ' + err.message);
    }
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'office':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'office': return 'Büro';
      default: return 'Benutzer';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-body text-muted-foreground">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <GlowIcon icon="alert-circle" size="lg" className="mx-auto mb-4 text-red-400" />
          <h2 className="text-h2 font-semibold mb-2">Fehler</h2>
          <p className="text-body text-muted-foreground mb-4">{error || 'Benutzer nicht gefunden'}</p>
          <Button onClick={handleBack} variant="secondary">
            Zurück zur Übersicht
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            onClick={handleBack}
            variant="ghost"
            className="mb-4"
          >
            <GlowIcon icon="arrow-left" size="sm" className="mr-2" />
            Zurück zur Übersicht
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                  <GlowIcon icon="user" size="lg" className="text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-h1 font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {user.name}
                </h1>
                <p className="text-body text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-body-sm border ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-body-sm border ${
                    user.is_active
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {user.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleChangeRole} variant="secondary">
                <GlowIcon icon="shield" size="sm" className="mr-2" />
                Rolle ändern
              </Button>
              <Button
                onClick={handleToggleStatus}
                variant={user.is_active ? 'ghost' : 'secondary'}
              >
                <GlowIcon icon={user.is_active ? 'x-circle' : 'check-circle'} size="sm" className="mr-2" />
                {user.is_active ? 'Deaktivieren' : 'Aktivieren'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/0 border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <GlowIcon icon="clock" size="md" className="text-blue-400" />
                <h3 className="text-h3 font-semibold text-blue-400">Überstunden</h3>
              </div>
              <p className="text-h2 font-bold">
                {user.overtime_balance ? formatDuration(user.overtime_balance) : '0h 0m'}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/0 border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <GlowIcon icon="calendar" size="md" className="text-purple-400" />
                <h3 className="text-h3 font-semibold text-purple-400">Zeiteinträge</h3>
              </div>
              <p className="text-h2 font-bold">{timeEntries.length}</p>
              <p className="text-body-sm text-muted-foreground">Letzte 10 Einträge</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/0 border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <GlowIcon icon="briefcase" size="md" className="text-green-400" />
                <h3 className="text-h3 font-semibold text-green-400">Mitarbeiter-ID</h3>
              </div>
              <p className="text-h2 font-bold">{user.employee_id || '-'}</p>
            </Card>
          </motion.div>
        </div>

        {/* Recent Time Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2 font-semibold">Letzte Zeiteinträge</h2>
              <Button
                onClick={() => router.push(`/admin/time-entries?user_id=${userId}`)}
                variant="ghost"
              >
                Alle anzeigen
                <GlowIcon icon="arrow-right" size="sm" className="ml-2" />
              </Button>
            </div>

            {timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GlowIcon icon="clock" size="lg" className="mx-auto mb-2 opacity-50" />
                <p>Keine Zeiteinträge vorhanden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-body font-medium">{entry.description || 'Keine Beschreibung'}</p>
                      <p className="text-body-sm text-muted-foreground">
                        {formatDateTime(entry.start)} - {formatTime(entry.end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body font-bold">{formatDuration(entry.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Absences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-h2 font-semibold mb-4">Abwesenheiten</h2>

            {absences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GlowIcon icon="calendar" size="lg" className="mx-auto mb-2 opacity-50" />
                <p>Keine Abwesenheiten vorhanden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {absences.map((absence) => (
                  <div
                    key={absence.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex-1">
                      <p className="text-body font-medium capitalize">{absence.type}</p>
                      <p className="text-body-sm text-muted-foreground">
                        {new Date(absence.start_date).toLocaleDateString('de-DE')} - {new Date(absence.end_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`px-3 py-1 rounded-full text-body-sm border ${
                        absence.status === 'approved'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : absence.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {absence.status === 'approved' ? 'Genehmigt' : absence.status === 'pending' ? 'Ausstehend' : 'Abgelehnt'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <UserDetailPageContent />
    </Suspense>
  );
}
