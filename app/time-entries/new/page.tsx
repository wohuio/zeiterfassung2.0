'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { xanoClient } from '@/lib/xano-client';
import { useRouter } from 'next/navigation';

export default function NewTimeEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endTime, setEndTime] = useState('17:00');
  const [isBreak, setIsBreak] = useState(false);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Combine date and time into timestamps
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Validate
      if (endDateTime <= startDateTime) {
        throw new Error('Endzeit muss nach der Startzeit liegen');
      }

      // Convert to Xano timestamps (milliseconds)
      const startTimestamp = startDateTime.getTime();
      const endTimestamp = endDateTime.getTime();

      // Create time entry - only include comment if it's not empty
      const payload: any = {
        start: startTimestamp,
        end: endTimestamp,
        is_break: isBreak,
      };

      if (comment && comment.trim()) {
        payload.comment = comment.trim();
      }

      await xanoClient.createTimeEntry(payload);

      setSuccess(true);

      // Reset form
      setTimeout(() => {
        router.push('/time-entries');
      }, 1500);

    } catch (err: any) {
      console.error('Failed to create time entry:', err);
      setError(err.message || 'Fehler beim Erstellen des Zeiteintrags');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (endDateTime <= startDateTime) return null;

      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const hours = Math.floor(diffHours);
      const minutes = Math.round((diffHours - hours) * 60);

      return `${hours}h ${minutes}m`;
    } catch {
      return null;
    }
  };

  const duration = calculateDuration();

  return (
    <DashboardLayout activeTab="time-entries">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="card-bento card-glow relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ParticleBackground />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <GlowIcon icon="file" size={48} variant="pulse" color="gradient" />
                <div>
                  <h2 className="text-title-1 gradient-text">
                    Manueller Zeiteintrag
                  </h2>
                  <p className="text-text-secondary text-sm mt-1">
                    Erstelle einen Zeiteintrag mit Start- und Endzeit
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="text-green-400 font-medium">Zeiteintrag erstellt!</div>
                    <div className="text-sm text-text-tertiary">Weiterleitung...</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <div className="text-red-400 font-medium">Fehler</div>
                    <div className="text-sm text-text-secondary">{error}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-novu-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Startzeit
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-novu-500 transition-all"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-novu-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Endzeit
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-novu-500 transition-all"
                  />
                </div>
              </div>

              {/* Duration Display */}
              {duration && (
                <motion.div
                  className="p-4 bg-bg-tertiary border border-border-primary rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary text-sm">Dauer</span>
                    <span className="text-xl font-bold gradient-text">{duration}</span>
                  </div>
                </motion.div>
              )}

              {/* Break Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreak}
                    onChange={(e) => setIsBreak(e.target.checked)}
                    className="w-5 h-5 rounded border-border-primary bg-bg-secondary text-novu-500 focus:ring-2 focus:ring-novu-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all"
                  />
                  <div>
                    <div className="text-text-primary font-medium">Pause</div>
                    <div className="text-text-tertiary text-sm">Dieser Eintrag ist eine Pause</div>
                  </div>
                </label>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Kommentar (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Was hast du gemacht?"
                  rows={3}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-novu-500 transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/time-entries')}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading || !duration}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-novu-500 to-blue-500 rounded-lg text-white font-medium hover:from-novu-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Wird erstellt...' : 'Zeiteintrag erstellen'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
