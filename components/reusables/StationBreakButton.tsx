/** @fileoverview Compact staff break toggle shared by transfer and nursing workstations. */
'use client';
import { StaffStation } from '@/hooks/useStationBreaks';

/**
 * Renders an authorized station's persisted break status and return-to-work action.
 * @param props - Station, save state, and callback supplied by useStationBreaks.
 * @returns Accessible station control with a visible break indicator.
 */
export function StationBreakButton({ station, busy, onToggle, compact = false }: {
  station: StaffStation; busy: boolean; onToggle: () => void; compact?: boolean;
}) {
  return (
    <button type="button" aria-label={`${station.onBreak ? 'End break for' : 'Start break for'} ${station.label}`}
      aria-pressed={station.onBreak} disabled={busy || !station.active}
      onPointerDown={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}
      onClick={event => { event.stopPropagation(); onToggle(); }}
      className={`inline-flex items-center justify-center gap-1.5 border font-semibold whitespace-normal cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${compact
        ? 'rounded-md px-2 py-1 text-xs' : 'px-2.5 py-1.5 rounded-lg text-sm'} ${station.onBreak
        ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
        : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>
      {compact && <i className={`bx ${station.onBreak ? 'bx-play-circle' : 'bx-coffee'} text-sm`} aria-hidden="true" />}
      {busy ? 'Saving...' : station.onBreak ? 'On break · Resume' : 'On break'}
    </button>
  );
}
