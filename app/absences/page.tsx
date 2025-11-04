'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { xanoClient } from '@/lib/xano-client';
import { useAuth } from '@/lib/auth-context';
import { Absence, AbsenceCreateRequest } from '@/lib/types';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowIcon } from '@/components/ui/glow-icon';

export default function AbsencesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AbsenceCreateRequest>({
    start_date: '',
    end_date: '',
    type: 'vacation',
    comment: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date) {
      alert('Bitte Start- und Enddatum ausfüllen');
      return;
    }

    try {
      setSubmitting(true);
      await xanoClient.createAbsence(formData);
      alert('Urlaubsantrag erfolgreich eingereicht!');
      setShowForm(false);
      setFormData({
        start_date: '',
        end_date: '',
        type: 'vacation',
        comment: ''
      });
      await loadAbsences();
    } catch (err: any) {
      console.error('Error creating absence:', err);
      alert('Fehler beim Einreichen: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie diesen Antrag wirklich löschen?')) return;

    try {
      await xanoClient.deleteAbsence(id);
      alert('Antrag gelöscht');
      await loadAbsences();
    } catch (err: any) {
      console.error('Error deleting absence:', err);
      alert('Fehler beim Löschen: ' + err.message);
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

  if (authLoading || loading) {
    return (
      <DashboardLayout activeTab="absences">
        <div className="flex items-center justify-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="absences">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-h1 font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Abwesenheiten
          </h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? 'ghost' : 'default'}
          >
            <GlowIcon icon={showForm ? 'x-circle' : 'calendar'} size="sm" className="mr-2" />
            {showForm ? 'Abbrechen' : 'Neuer Antrag'}
          </Button>
        </motion.div>

        {/* New Absence Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-h2 font-semibold mb-4">Neuer Urlaubsantrag</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body-sm text-muted-foreground mb-2">
                        Von *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-body-sm text-muted-foreground mb-2">
                        Bis *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-sm text-muted-foreground mb-2">
                      Art *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="vacation">Urlaub</option>
                      <option value="sick">Krankheit</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-body-sm text-muted-foreground mb-2">
                      Kommentar (optional)
                    </label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      rows={3}
                      placeholder="Zusätzliche Informationen..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Wird eingereicht...' : 'Antrag einreichen'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absences List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="text-h2 font-semibold mb-4">Meine Anträge</h2>

            {absences.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GlowIcon icon="calendar" size="lg" className="mx-auto mb-4 opacity-50" />
                <p>Keine Abwesenheiten vorhanden</p>
                <p className="text-body-sm mt-2">Erstelle deinen ersten Urlaubsantrag</p>
              </div>
            ) : (
              <div className="space-y-3">
                {absences.map((absence) => (
                  <motion.div
                    key={absence.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-body font-semibold">{getTypeLabel(absence.type)}</h3>
                          <span className={`px-3 py-1 rounded-full text-body-sm border ${getStatusBadge(absence.status)}`}>
                            {getStatusLabel(absence.status)}
                          </span>
                        </div>
                        <p className="text-body-sm text-muted-foreground mb-2">
                          {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                          <span className="ml-2">
                            ({calculateDays(absence.start_date, absence.end_date)} {calculateDays(absence.start_date, absence.end_date) === 1 ? 'Tag' : 'Tage'})
                          </span>
                        </p>
                        {absence.comment && (
                          <p className="text-body-sm text-muted-foreground italic">
                            {absence.comment}
                          </p>
                        )}
                      </div>

                      {absence.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(absence.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <GlowIcon icon="x-circle" size="sm" />
                        </Button>
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
