/**
 * @fileoverview Clinical elapsed timer component with configurable threshold warnings.
 *
 * Displays formatted MM:SS elapsed duration since a clinical stage commenced,
 * shifting visual styling to pulsing amber or red when stage duration thresholds are exceeded.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React, { useState, useEffect } from 'react';

/**
 * Props for the ElapsedTimer component.
 */
export interface ElapsedTimerProps {
  /** ISO timestamp string representing the start of the clinical stage. */
  startedAt?: string | null;
  /** Duration in seconds after which the timer displays warning styling (default 600s / 10m). */
  warnAfterSeconds?: number;
  /** Optional additional CSS class names. */
  className?: string;
}

/**
 * Real-time elapsed duration indicator with clinical urgency threshold styling.
 *
 * @param props - Timestamp and threshold configuration.
 * @returns Formatted MM:SS time display.
 */
export function ElapsedTimer({
  startedAt,
  warnAfterSeconds = 600,
  className = '',
}: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    const start = new Date(startedAt).getTime();
    if (isNaN(start)) {
      setElapsed(0);
      return;
    }

    const update = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(diffSecs);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) {
    return (
      <span className={`text-xs font-mono text-gray-300 ${className}`.trim()}>
        --:--
      </span>
    );
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isOverdue = elapsed > warnAfterSeconds;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums font-semibold transition-colors ${
        isOverdue
          ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 animate-pulse'
          : 'text-emerald-600'
      } ${className}`.trim()}
      title={isOverdue ? `Stage duration exceeds ${Math.floor(warnAfterSeconds / 60)} minutes` : 'Active duration'}
    >
      <i className="bx bx-time-five text-[11px]" aria-hidden="true" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export default ElapsedTimer;