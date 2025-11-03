'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { CircularProgress } from '@/components/ui/circular-progress';
import { xanoClient } from '@/lib/xano-client';
import type { MonthReport } from '@/lib/types';

export default function MonthReportPage() {
  const [monthReport, setMonthReport] = useState<MonthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);

  useEffect(() => {
    loadMonthReport();
  }, [selectedYear, selectedMonth]);

  const loadMonthReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await xanoClient.getMonthReport(selectedYear, selectedMonth);

      // Transform old API response to new structure if needed
      const transformedReport: MonthReport = {
        ...report,
        summary: report.summary || {
          total_worked: (report as any).total_hours || 0,
          total_should: (report as any).expected_hours || 0,
          difference: (report as any).overtime_delta || 0,
        }
      };

      setMonthReport(transformedReport);
    } catch (err: any) {
      console.error('Failed to load month report:', err);
      setError(err.message || 'Fehler beim Laden des Monatsberichts');
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
      'Monday': 'Mo',
      'Tuesday': 'Di',
      'Wednesday': 'Mi',
      'Thursday': 'Do',
      'Friday': 'Fr',
      'Saturday': 'Sa',
      'Sunday': 'So'
    };
    return days[weekday] || weekday;
  };

  const getProgressPercentage = (worked: number, should: number) => {
    if (should === 0) return worked > 0 ? 100 : 0;
    return Math.min((worked / should) * 100, 100);
  };

  // Calculate Easter Sunday using Gauss algorithm
  const calculateEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  // Get public holidays for Baden-Württemberg
  const getHolidays = (year: number): Record<string, string> => {
    const holidays: Record<string, string> = {};

    // Fixed holidays
    holidays[`${year}-01-01`] = 'Neujahr';
    holidays[`${year}-01-06`] = 'Heilige Drei Könige';
    holidays[`${year}-05-01`] = 'Tag der Arbeit';
    holidays[`${year}-10-03`] = 'Tag der Deutschen Einheit';
    holidays[`${year}-11-01`] = 'Allerheiligen';
    holidays[`${year}-12-25`] = '1. Weihnachtstag';
    holidays[`${year}-12-26`] = '2. Weihnachtstag';

    // Calculate Easter and related holidays
    const easter = calculateEaster(year);

    // Good Friday (2 days before Easter)
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays[goodFriday.toISOString().split('T')[0]] = 'Karfreitag';

    // Easter Monday (1 day after Easter)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays[easterMonday.toISOString().split('T')[0]] = 'Ostermontag';

    // Ascension Day (39 days after Easter)
    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays[ascension.toISOString().split('T')[0]] = 'Christi Himmelfahrt';

    // Whit Monday (50 days after Easter)
    const whitMonday = new Date(easter);
    whitMonday.setDate(easter.getDate() + 50);
    holidays[whitMonday.toISOString().split('T')[0]] = 'Pfingstmontag';

    // Corpus Christi (60 days after Easter)
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    holidays[corpusChristi.toISOString().split('T')[0]] = 'Fronleichnam';

    return holidays;
  };

  const isHoliday = (dateString: string): string | null => {
    const year = parseInt(dateString.split('-')[0]);
    const holidays = getHolidays(year);
    return holidays[dateString] || null;
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
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
              <GlowIcon icon="calendar" size={80} variant="pulse" color="gradient" />
            </div>
            <h2 className="text-title-1 gradient-text mb-4">Fehler</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">{error}</p>
            <p className="text-xs text-text-tertiary mb-4">
              Hinweis: Der Xano Month-Endpoint hat möglicherweise einen SQL-Fehler. Bitte prüfe die Xano-Konfiguration.
            </p>
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
            <h1 className="text-title-1 gradient-text mb-2">Monatsbericht</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={goToPreviousMonth}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              ← Vorheriger Monat
            </button>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleDateString('de-DE', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary w-24"
                min="2000"
                max="2100"
              />
            </div>
            <button
              onClick={goToNextMonth}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              Nächster Monat →
            </button>
          </div>
        </div>

        {/* Summary Card with Progress */}
        {monthReport && (
          <motion.div
            className="card-bento card-glow relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ParticleBackground />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <GlowIcon icon="calendar" size={24} />
                <div className="text-label">Monatszusammenfassung</div>
              </div>

              {/* Main Stats with Large Circular Progress */}
              <div className="flex flex-col items-center justify-center mb-8">
                <CircularProgress
                  value={getProgressPercentage(monthReport.summary.total_worked, monthReport.summary.total_should)}
                  size={280}
                  strokeWidth={16}
                  color={monthReport.summary.difference >= 0 ? 'green' : 'gradient'}
                  label={formatHours(monthReport.summary.total_worked)}
                  sublabel={`von ${formatHours(monthReport.summary.total_should)}`}
                  showPercentage={true}
                />

                {/* Difference Below Circle */}
                <div className={`text-2xl font-bold mt-6 ${
                  monthReport.summary.difference >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {monthReport.summary.difference >= 0 ? '+ ' : ''}
                  {formatHours(Math.abs(monthReport.summary.difference))} {monthReport.summary.difference >= 0 ? 'Überstunden' : 'Fehlstunden'}
                </div>
              </div>

              {/* Compact Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg border border-border-primary">
                  <div className="text-xs text-text-tertiary mb-1">Gearbeitet</div>
                  <div className="text-2xl font-bold gradient-text">
                    {monthReport.summary.total_worked.toFixed(1)}h
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg border border-border-primary">
                  <div className="text-xs text-text-tertiary mb-1">Soll</div>
                  <div className="text-2xl font-bold text-text-secondary">
                    {monthReport.summary.total_should.toFixed(1)}h
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg border border-border-primary">
                  <div className="text-xs text-text-tertiary mb-1">Differenz</div>
                  <div className={`text-2xl font-bold ${
                    monthReport.summary.difference >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {monthReport.summary.difference >= 0 ? '+' : ''}
                    {monthReport.summary.difference.toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-tertiary">Fortschritt</span>
                  <span className="text-text-secondary">
                    {getProgressPercentage(monthReport.summary.total_worked, monthReport.summary.total_should).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      monthReport.summary.difference >= 0 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-purple-400 to-blue-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${getProgressPercentage(monthReport.summary.total_worked, monthReport.summary.total_should)}%`
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Days Grid - Compact Calendar View */}
        {monthReport && monthReport.days && monthReport.days.length > 0 && (
          <div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="text-center text-xs text-text-tertiary font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid with proper alignment */}
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                // Get first day of month to calculate offset
                const firstDay = monthReport.days[0];
                const weekdayMap: Record<string, number> = {
                  'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                  'Friday': 4, 'Saturday': 5, 'Sunday': 6
                };
                const offset = weekdayMap[firstDay.weekday] || 0;

                // Create array with empty cells for offset
                const calendarDays = Array(offset).fill(null).concat(monthReport.days);

                return calendarDays.map((day, index) => {
                  if (!day) {
                    // Empty cell for offset
                    return <div key={`empty-${index}`} className="h-24" />;
                  }

                  const progress = getProgressPercentage(day.worked_hours, day.should_hours);
                  const isWeekend = day.weekday === 'Saturday' || day.weekday === 'Sunday';
                  const hasEntries = day.entries && day.entries.length > 0;
                  const holidayName = isHoliday(day.date);
                  const isHolidayDay = holidayName !== null;

              return (
                <motion.div
                  key={day.date}
                  className={`card-bento relative overflow-hidden p-3 ${
                    hasEntries ? 'card-glow' : ''
                  } ${isWeekend || isHolidayDay ? 'opacity-60' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: (isWeekend || isHolidayDay) ? 0.6 : 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.01 }}
                >
                  {hasEntries && <ParticleBackground />}

                  <div className="relative z-10">
                    {/* Day Header */}
                    <div className="text-center mb-2">
                      <div className="text-xs text-text-tertiary mb-1">
                        {formatWeekday(day.weekday)}
                      </div>
                      <div className="text-lg font-bold gradient-text">
                        {new Date(day.date + 'T00:00:00').getDate()}
                      </div>
                      {isHolidayDay && (
                        <div className="text-xs text-yellow-400 mt-1 font-medium">
                          {holidayName}
                        </div>
                      )}
                    </div>

                    {/* Hours - Compact for all days */}
                    {day.should_hours > 0 && (
                      <div className="text-center space-y-2">
                        <div>
                          <div className="text-sm font-bold text-text-primary">
                            {day.worked_hours.toFixed(1)}h
                          </div>
                          <div className="text-xs text-text-tertiary">
                            / {day.should_hours}h
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              progress >= 100
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : progress >= 75
                                ? 'bg-gradient-to-r from-blue-500 to-novu-500'
                                : progress >= 50
                                ? 'bg-gradient-to-r from-novu-500 to-purple-500'
                                : 'bg-gradient-to-r from-red-500 to-orange-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 0.5, delay: index * 0.02 }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Weekend/Holiday/No Work Indicator */}
                    {day.should_hours === 0 && day.worked_hours === 0 && (
                      <div className="text-center text-xs text-text-tertiary">
                        -
                      </div>
                    )}

                    {/* Overtime Work on Weekend */}
                    {day.should_hours === 0 && day.worked_hours > 0 && (
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-400">
                          {day.worked_hours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-green-400">
                          Extra
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
