'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { xanoClient } from '@/lib/xano-client';
import { useAuth } from '@/lib/auth-context';
import { Absence } from '@/lib/types';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowIcon } from '@/components/ui/glow-icon';

export default function AdminAbsencesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (!authLoading && user && user.role !== 'admin' && user.role !== 'office') {
      router.push('/dashboard');
    } else if (user) {
      loadAbsences();
    }
  }, [user, authLoading, router]);

  const loadAbsences = async () => {
    try {
      setLoading(true);
      const data = await xanoClient.getAbsences();
      setAbsences(data.items || []);
    } catch (err: any) {
      console.error('Error loading absences:', err);
      alert('Fehler beim Laden der Abwesenheiten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Möchten Sie diesen Antrag genehmigen?')) return;

    try {
      await xanoClient.updateAbsence(id, { status: 'approved' });
      alert('Antrag genehmigt!');
      await loadAbsences();
    } catch (err: any) {
      console.error('Error approving absence:', err);
      alert('Fehler beim Genehmigen: ' + err.message);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Möchten Sie diesen Antrag ablehnen?')) return;

    try {
      await xanoClient.updateAbsence(id, { status: 'rejected' });
      alert('Antrag abgelehnt');
      await loadAbsences();
    } catch (err: any) {
      console.error('Error rejecting absence:', err);
      alert('Fehler beim Ablehnen: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'pending': return 'Ausstehend';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Urlaub';
      case 'sick': return 'Krankheit';
      case 'other': return 'Sonstiges';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const filteredAbsences = absences.filter(absence => {
    if (filter === 'all') return true;
    return absence.status === filter;
  });

  const pendingCount = absences.filter(a => a.status === 'pending').length;

  if (authLoading || loading) {
    return (
      <DashboardLayout activeTab="admin">
        <div className="flex items-center justify-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'office')) {
    return null;
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
            <h1 className="text-h1 font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Abwesenheiten-Verwaltung
            </h1>
            <Button onClick={() => router.push('/admin')} variant="ghost">
              <GlowIcon icon="arrow-left" size="sm" className="mr-2" />
              Zurück
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <Card className="p-4 flex-1">
              <div className="text-body-sm text-muted-foreground mb-1">Ausstehend</div>
              <div className="text-h2 font-bold text-yellow-400">{pendingCount}</div>
            </Card>
            <Card className="p-4 flex-1">
              <div className="text-body-sm text-muted-foreground mb-1">Gesamt</div>
              <div className="text-h2 font-bold">{absences.length}</div>
            </Card>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Alle' },
              { value: 'pending', label: 'Ausstehend' },
              { value: 'approved', label: 'Genehmigt' },
              { value: 'rejected', label: 'Abgelehnt' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all ${
                  filter === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-card hover:bg-card/80 text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Absences List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            {filteredAbsences.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GlowIcon icon="calendar" size="lg" className="mx-auto mb-4 opacity-50" />
                <p>Keine Abwesenheiten in dieser Kategorie</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAbsences.map((absence) => (
                  <motion.div
                    key={absence.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-body font-semibold">{getTypeLabel(absence.type)}</h3>
                          <span className={`px-3 py-1 rounded-full text-body-sm border ${getStatusBadge(absence.status)}`}>
                            {getStatusLabel(absence.status)}
                          </span>
                        </div>
                        <p className="text-body text-muted-foreground mb-2">
                          Mitarbeiter-ID: {absence.user_id}
                        </p>
                        <p className="text-body-sm text-muted-foreground mb-2">
                          {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                          <span className="ml-2">
                            ({calculateDays(absence.start_date, absence.end_date)} {calculateDays(absence.start_date, absence.end_date) === 1 ? 'Tag' : 'Tage'})
                          </span>
                        </p>
                        {absence.comment && (
                          <p className="text-body-sm text-muted-foreground italic">
                            Kommentar: {absence.comment}
                          </p>
                        )}
                      </div>

                      {absence.status === 'pending' && user.role === 'admin' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(absence.id)}
                            className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20"
                          >
                            <GlowIcon icon="check-circle" size="sm" className="mr-2" />
                            Genehmigen
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(absence.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <GlowIcon icon="x-circle" size="sm" className="mr-2" />
                            Ablehnen
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
