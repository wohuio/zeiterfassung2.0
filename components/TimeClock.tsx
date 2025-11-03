'use client';

import { useState, useEffect, useCallback } from 'react';
import { xanoClient } from '@/lib/xano-client';
import type { TimeClock as TimeClockType } from '@/lib/types';
import { CircularProgress } from '@/components/ui/circular-progress';
import { motion } from 'framer-motion';

export default function TimeClock() {
  const [timer, setTimer] = useState<TimeClockType | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [comment, setComment] = useState('');
  const [isBreak, setIsBreak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load current timer from server
  const loadCurrentTimer = useCallback(async () => {
    try {
      const currentTimer = await xanoClient.getCurrentTimer();
      if (currentTimer) {
        setTimer(currentTimer);
        setComment(currentTimer.comment || '');
        setIsBreak(currentTimer.is_break);
      } else {
        // Important: Set to null if no timer exists
        setTimer(null);
      }
    } catch (err: any) {
      console.error('Failed to load timer:', err);
      // On error, assume no timer
      setTimer(null);
    }
  }, []);

  // Load current timer on mount
  useEffect(() => {
    loadCurrentTimer();
  }, [loadCurrentTimer]);

  // Reload timer when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCurrentTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadCurrentTimer]);

  // Update elapsed time - persists across tab switches
  useEffect(() => {
    if (!timer) return;

    // Function to calculate elapsed time from server timestamp
    const updateElapsedTime = () => {
      const now = Date.now();
      // Convert started_at to number if it's a string
      const startedAt = typeof timer.started_at === 'string'
        ? parseInt(timer.started_at, 10)
        : timer.started_at;
      const elapsed = Math.floor((now - startedAt) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Initial calculation
    updateElapsedTime();

    // Update every second, but always recalculate from server time
    // This ensures accuracy even if setInterval is throttled
    const interval = setInterval(updateElapsedTime, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timer]);

  const handleStart = async () => {
    setError('');
    setLoading(true);

    try {
      const newTimer = await xanoClient.startTimer({
        is_break: isBreak,
        comment: comment.trim() || undefined,
      });
      setTimer(newTimer);
    } catch (err: any) {
      console.error('Start timer error:', err);
      if (err.status === 404) {
        setError('Xano Endpoint noch nicht konfiguriert. Bitte erstelle /time-clock/start in Xano.');
      } else {
        setError(err.message || 'Timer konnte nicht gestartet werden');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setError('');
    setLoading(true);

    try {
      await xanoClient.stopTimer({
        comment: comment.trim() || undefined,
      });
      setTimer(null);
      setComment('');
      setElapsedSeconds(0);
    } catch (err: any) {
      setError(err.message || 'Timer konnte nicht gestoppt werden');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600;
    return hours.toFixed(1);
  };

  const getProgressPercentage = (seconds: number) => {
    const targetHours = 8; // 8-hour workday
    const currentHours = seconds / 3600;
    return Math.min((currentHours / targetHours) * 100, 100);
  };

  return (
    <div>
      <h2 className="text-title-2 gradient-text mb-6">
        Stoppuhr
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171'
        }}>
          {error}
        </div>
      )}

      {timer ? (
        <div className="space-y-6">
          {/* Circular Progress with Live Timer */}
          <div className="flex flex-col items-center justify-center">
            <CircularProgress
              value={getProgressPercentage(elapsedSeconds)}
              size={220}
              strokeWidth={14}
              color={isBreak ? 'orange' : 'gradient'}
              label={formatTime(elapsedSeconds)}
              sublabel={`${formatHours(elapsedSeconds)}h / 8h`}
              showPercentage={false}
            />
            <motion.div
              className="flex items-center justify-center gap-2 text-body mt-6"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="status-dot status-dot-active"></span>
              <span className="text-text-secondary font-medium">
                {isBreak ? '☕ Pause läuft' : '💼 Timer läuft'}
              </span>
            </motion.div>
          </div>

          <div>
            <label className="text-label mb-2 block">
              Kommentar (optional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input"
              placeholder="Was machst du gerade?"
            />
          </div>

          <button
            onClick={handleStop}
            disabled={loading}
            className="btn w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-0.5 transition-all"
          >
            {loading ? 'Stoppt...' : 'Timer stoppen'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="text-label mb-2 block">
              Kommentar (optional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input"
              placeholder="Was arbeitest du?"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isBreak}
              onChange={(e) => setIsBreak(e.target.checked)}
              className="w-5 h-5 rounded border border-border-primary bg-bg-card checked:bg-gradient-to-r checked:from-novu-500 checked:to-blue-500 focus:ring-2 focus:ring-novu-500 transition-all"
            />
            <span className="text-body text-text-secondary group-hover:text-novu-400 transition-colors">Als Pause markieren</span>
          </label>

          <button
            onClick={handleStart}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Startet...' : 'Timer starten'}
          </button>
        </div>
      )}
    </div>
  );
}
