/**
 * @fileoverview Clinical and administrative elapsed timer component.
 *
 * Displays formatted HH:MM:SS or MM:SS elapsed duration since a clinical or queue
 * stage commenced. Supports live ticking per second for active stages, frozen durations
 * for completed stages (via endedAt or durationSeconds), and clinical urgency warning styling.
 *
 * Adheres strictly to AGENTS.md guidelines: full JSDoc, zero emojis, and solid surfaces.
 *
 * @module components/reusables/ElapsedTimer
 */

'use client';

import React, { useState, useEffect } from 'react';

/**
 * Properties for the ElapsedTimer component.
 */
export interface ElapsedTimerProps {
  /** Start timestamp as ISO string, epoch ms, Date object, or null/undefined. */
  startedAt?: string | number | Date | null;
  /** End timestamp as ISO string, epoch ms, Date object, or null/undefined. When provided, timer freezes at endedAt - startedAt. */
  endedAt?: string | number | Date | null;
  /** Direct elapsed duration in seconds. Overrides timestamp diff when provided. */
  durationSeconds?: number | null;
  /** Duration in seconds after which the timer displays warning styling (optional). */
  warnAfterSeconds?: number;
  /**
   * Whether to format with hours:
   * - true: Always shows hours (HH:MM:SS or HH:MM), e.g. 00:15:23 or 01:05:40.
   * - false: Shows MM:SS or MM.
   * - undefined (auto): Shows HH:MM:SS if hours > 0, otherwise MM:SS.
   */
  showHours?: boolean;
  /** Whether to include seconds. Defaults to true. If false, formats as HH:MM or MM. */
  includeSeconds?: boolean;
  /** Custom warning CSS class when warnAfterSeconds threshold is exceeded. */
  warningClassName?: string;
  /** Custom normal CSS class when within threshold. */
  normalClassName?: string;
  /** Optional additional CSS class names applied to the container. */
  className?: string;
  /** Fallback string displayed when timestamp is missing or invalid. Defaults to '--:--:--' (or '--:--'). */
  fallbackText?: string;
}

/**
 * Safely parses any supported timestamp format into an epoch millisecond number.
 *
 * @param ts - Raw timestamp representation.
 * @returns Epoch millisecond number or null if invalid or absent.
 */
function parseTimestamp(ts: string | number | Date | null | undefined): number | null {
  if (ts === null || ts === undefined) return null;
  if (typeof ts === 'number') return isNaN(ts) ? null : ts;
  if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts.getTime();
  const parsed = new Date(ts).getTime();
  return isNaN(parsed) ? null : parsed;
}

/**
 * Enterprise elapsed timer component for queue tables, workstation cards, and KPI panels.
 *
 * @param props - Component configuration properties.
 * @returns Formatted live ticking or frozen time display.
 */
export function ElapsedTimer({
  startedAt,
  endedAt,
  durationSeconds,
  warnAfterSeconds,
  showHours,
  includeSeconds = true,
  warningClassName,
  normalClassName,
  className = '',
  fallbackText,
}: ElapsedTimerProps) {
  const startMs = parseTimestamp(startedAt);
  const endMs = parseTimestamp(endedAt);

  const calculateInitialElapsed = (): number => {
    if (durationSeconds !== undefined && durationSeconds !== null) {
      return Math.max(0, Math.floor(durationSeconds));
    }
    if (startMs === null) return 0;
    if (endMs !== null) {
      return Math.max(0, Math.floor((endMs - startMs) / 1000));
    }
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  };

  const [elapsed, setElapsed] = useState<number>(calculateInitialElapsed);

  useEffect(() => {
    // If static duration or no start time, set once and avoid setting up an interval
    if (durationSeconds !== undefined && durationSeconds !== null) {
      setElapsed(Math.max(0, Math.floor(durationSeconds)));
      return;
    }

    if (startMs === null) {
      setElapsed(0);
      return;
    }

    if (endMs !== null) {
      setElapsed(Math.max(0, Math.floor((endMs - startMs) / 1000)));
      return;
    }

    // Active live ticking
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startMs, endMs, durationSeconds]);

  const defaultFallback = includeSeconds
    ? (showHours ? '--:--:--' : '--:--')
    : (showHours ? '--:--' : '--');

  if (startMs === null && (durationSeconds === undefined || durationSeconds === null)) {
    return (
      <span className={`text-xs font-mono text-content-muted ${className}`.trim()}>
        {fallbackText ?? defaultFallback}
      </span>
    );
  }

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const shouldDisplayHours = showHours === true || (showHours === undefined && hrs > 0);

  let formattedTime: string;
  if (includeSeconds) {
    if (shouldDisplayHours) {
      formattedTime = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } else {
      formattedTime = `${pad(mins)}:${pad(secs)}`;
    }
  } else {
    if (shouldDisplayHours) {
      formattedTime = `${pad(hrs)}:${pad(mins)}`;
    } else {
      formattedTime = `${pad(mins)}`;
    }
  }

  const isOverdue = warnAfterSeconds !== undefined && elapsed > warnAfterSeconds;

  let colorClass = '';
  if (warnAfterSeconds !== undefined) {
    if (isOverdue) {
      colorClass = warningClassName ?? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900 animate-pulse';
    } else {
      colorClass = normalClassName ?? 'text-emerald-600 dark:text-emerald-400';
    }
  }

  return (
    <span
      className={`inline-flex items-center font-mono tabular-nums font-semibold transition-colors ${colorClass} ${className}`.trim()}
      title={isOverdue ? `Duration exceeds ${Math.floor(warnAfterSeconds / 60)} minutes` : 'Duration'}
    >
      {formattedTime}
    </span>
  );
}

export default ElapsedTimer;
