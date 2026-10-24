/** @fileoverview Staff break controls for explicitly assigned nursing and doctor cubicles. */
'use client';
import { useStationBreaks } from '@/hooks/useStationBreaks';
import { StationBreakButton } from '@/components/reusables/StationBreakButton';
import { useState } from 'react';

/**
 * Shows break controls for the selected cubicle, or a selector when several are assigned.
 * @param props - The nurse page's selected cubicle filter.
 * @returns Compact station controls scoped by server-side assignment authorization.
 */
export function NurseBreakControls({ selectedCubicleNum }: { selectedCubicleNum: string | null }) {
  const breaks = useStationBreaks();
  const [selectedId, setSelectedId] = useState('');
  const stations = breaks.stations.filter(station => station.kind === 'cubicle' &&
    (!selectedCubicleNum || station.label === selectedCubicleNum));
  if (!stations.length && !breaks.error) return null;
  const station = stations.find(item => String(item.id) === selectedId) ?? stations[0];
  return (
    <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-40 overflow-y-auto">
      {station && <>
        {stations.length > 1 ? <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          Station availability
          <select aria-label="Station for break control" value={station.id} onChange={event => setSelectedId(event.target.value)}
            className="max-w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5">
            {stations.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label> : <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-normal break-words">{station.label}</span>}
        <StationBreakButton station={station} busy={breaks.busy !== null} onToggle={() => void breaks.toggle(station)} />
      </>}
      {breaks.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{breaks.error}</p>}
    </div>
  );
}
