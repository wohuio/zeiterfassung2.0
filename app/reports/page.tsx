'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { CircularProgress } from '@/components/ui/circular-progress';
import { xanoClient } from '@/lib/xano-client';
import type { WeekReport } from '@/lib/types';

export default function ReportsPage() {
  const [weekReport, setWeekReport] = useState<WeekReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    loadWeekReport();
  }, [selectedDate]);

  const loadWeekReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await xanoClient.getWeekReport(selectedDate);
      setWeekReport(report);
    } catch (err: any) {
      console.error('Failed to load week report:', err);
      setError(err.message || 'Fehler beim Laden des Wochenberichts');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0 && m === 0) return '0h';
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatWeekday = (weekday: string) => {
    const days: Record<string, string> = {
      'Monday': 'Montag',
      'Tuesday': 'Dienstag',
      'Wednesday': 'Mittwoch',
      'Thursday': 'Donnerstag',
      'Friday': 'Freitag',
      'Saturday': 'Samstag',
      'Sunday': 'Sonntag'
    };
    return days[weekday] || weekday;
  };

  const getProgressPercentage = (worked: number, should: number) => {
    if (should === 0) return worked > 0 ? 100 : 0;
    return Math.min((worked / should) * 100, 100);
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="reports">
        <div className="flex items-center justify-center py-16">
          <div className="text-xl gradient-text">Lädt...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeTab="reports">
        <motion.div
          className="card-bento card-glass card-glow relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ParticleBackground />
          <div className="relative z-10 text-center py-16">
            <div className="mb-6">
              <GlowIcon icon="chart" size={80} variant="pulse" color="gradient" />
            </div>
            <h2 className="text-title-1 gradient-text mb-4">Fehler</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">{error}</p>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="reports">
      <div className="space-y-6">
        {/* Header with Navigation */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-title-1 gradient-text mb-2">Wochenbericht</h1>
            <p className="text-text-secondary">
              {weekReport && (
                <>
                  {formatDate(weekReport.week_start)} - {formatDate(weekReport.week_end)}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 7);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              ← Vorherige Woche
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary"
            />
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 7);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              Nächste Woche →
            </button>
          </div>
        </div>

        {/* Summary Card with Progress */}
        {weekReport && (
          <motion.div
            className="card-bento card-glow relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ParticleBackground />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <GlowIcon icon="chart" size={24} />
                <div className="text-label">Wochenzusammenfassung</div>
              </div>

              {/* Main Stats with Large Circular Progress */}
              <div className="flex flex-col items-center justify-center mb-8">
                <CircularProgress
                  value={getProgressPercentage(weekReport.summary.total_worked, weekReport.summary.total_should)}
                  size={280}
                  strokeWidth={16}
                  color={weekReport.summary.difference >= 0 ? 'green' : 'gradient'}
                  label={formatHours(weekReport.summary.total_worked)}
                  sublabel={`von ${formatHours(weekReport.summary.total_should)}`}
                  showPercentage={true}
                />

                {/* Difference Below Circle */}
                <div className={`text-2xl font-bold mt-6 ${
                  weekReport.summary.difference >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {weekReport.summary.difference >= 0 ? '+ ' : ''}
                  {formatHours(Math.abs(weekReport.summary.difference))} {weekReport.summary.difference >= 0 ? 'Überstunden' : 'Fehlstunden'}
                </div>
              </div>

              {/* Compact Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg border border-border-primary">
                  <div className="text-xs text-text-tertiary mb-1">Gearbeitet</div>
                  <div className="text-2xl font-bold gradient-text">
                    {weekReport.summary.total_worked.toFixed(1)}h
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg border border-border-primary">
                  <div className="text-xs text-text-tertiary mb-1">Soll</div>
                  <div className="text-2xl font-bold text-text-secondary">
                    {weekReport.summary.total_should.toFixed(1)}h
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg border border-border-primary">
                  <div className="text-xs text-text-tertiary mb-1">Differenz</div>
                  <div className={`text-2xl font-bold ${
                    weekReport.summary.difference >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {weekReport.summary.difference >= 0 ? '+' : ''}
                    {weekReport.summary.difference.toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-tertiary">Fortschritt</span>
                  <span className="text-text-secondary">
                    {getProgressPercentage(weekReport.summary.total_worked, weekReport.summary.total_should).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      weekReport.summary.difference >= 0 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-purple-400 to-blue-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${getProgressPercentage(weekReport.summary.total_worked, weekReport.summary.total_should)}%`
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Days List with Enhanced Display */}
        {weekReport && (
          <div className="space-y-3">
            {weekReport.days.map((day, index) => {
              const progress = getProgressPercentage(day.worked_hours, day.should_hours);
              const isWeekend = day.weekday === 'Saturday' || day.weekday === 'Sunday';

              return (
                <motion.div
                  key={day.date}
                  className={`card-bento relative overflow-hidden ${
                    day.worked_hours > 0 ? 'card-glow' : ''
                  } ${isWeekend ? 'opacity-75' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isWeekend ? 0.75 : 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {day.worked_hours > 0 && <ParticleBackground />}

                  <div className="relative z-10">
                    {/* Day Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="text-xl font-bold gradient-text">
                            {formatWeekday(day.weekday)}
                          </div>
                          {isWeekend && (
                            <span className="text-xs px-2 py-1 bg-bg-tertiary rounded-full text-text-tertiary">
                              Wochenende
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text-tertiary">{formatDate(day.date)}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold gradient-text mb-1">
                          {formatHours(day.worked_hours)}
                        </div>
                        <div className="text-sm text-text-tertiary">
                          Soll: {formatHours(day.should_hours)}
                        </div>
                        {day.should_hours > 0 && (
                          <div className={`text-xs mt-1 ${
                            day.difference >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {day.difference >= 0 ? '+' : ''}{formatHours(Math.abs(day.difference))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Day */}
                    {day.should_hours > 0 && (
                      <div className="mb-4">
                        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              day.difference >= 0 ? 'bg-green-400' : 'bg-purple-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Entries */}
                    {day.entries.length > 0 && (
                      <div className="border-t border-border-primary pt-4">
                        <div className="text-sm text-text-tertiary mb-3 flex items-center gap-2">
                          <GlowIcon icon="clock" size={16} />
                          <span>Einträge ({day.entries.length})</span>
                        </div>
                        <div className="space-y-2">
                          {day.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-medium ${
                                    entry.is_break ? 'text-orange-400' : 'text-green-400'
                                  }`}>
                                    {entry.is_break ? '☕ Pause' : '💼 Arbeit'}
                                  </span>
                                  {entry.comment && (
                                    <span className="text-xs text-text-tertiary">
                                      · {entry.comment}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  {formatTime(entry.start)} - {formatTime(entry.end)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold gradient-text">
                                  {formatHours(entry.duration_hours)}
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  {entry.duration_hours.toFixed(2)}h
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {day.entries.length === 0 && !isWeekend && (
                      <div className="text-center py-4 text-text-tertiary text-sm">
                        Keine Einträge für diesen Tag
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
