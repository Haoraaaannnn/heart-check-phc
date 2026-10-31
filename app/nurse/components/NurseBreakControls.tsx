/** @fileoverview Staff break controls for explicitly assigned nursing and doctor cubicles. */
'use client';
import { useStationBreaks } from '@/hooks/useStationBreaks';
import { StationBreakButton } from '@/components/reusables/StationBreakButton';
import { StationOwnerBadge } from '@/components/reusables/StationOwnerBadge';
import { useState } from 'react';

/**
 * Shows break controls for the selected cubicle, or a selector when several are assigned.
 * @param props - The nurse page's selected cubicle filter.
 * @returns Compact station controls scoped by server-side assignment authorization.
 */
export function NurseBreakControls({ selectedCubicleNum }: { selectedCubicleNum: string | null }) {
  const breaks = useStationBreaks();
  const [selectedId, setSelectedId] = useState('');
  const myStations = breaks.stations.filter(station => station.kind === 'cubicle' && station.owners?.some(owner => owner.isCurrentUser));
  const myUsername = myStations[0]?.owners?.find(owner => owner.isCurrentUser)?.username;
  const stations = breaks.stations.filter(station => station.kind === 'cubicle' &&
    (!selectedCubicleNum || station.label === selectedCubicleNum));
  if (!stations.length && !myStations.length && !breaks.error) return null;
  const station = stations.find(item => String(item.id) === selectedId)
    ?? stations.find(item => item.owners?.some(owner => owner.isCurrentUser)) ?? stations[0];
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] px-4 sm:px-6 py-2 min-h-[48px] max-h-36 overflow-y-auto">
      {myStations.length > 0 && <p className="min-w-0 text-xs sm:text-sm font-medium text-slate-600 dark:text-[#a3a3a3] whitespace-normal break-words">
        Your stations{myUsername ? ` (${myUsername})` : ''}: <span className="font-bold text-slate-900 dark:text-[#f5f5f5]">{myStations.map(item => item.label).join(', ')}</span>
      </p>}
      {station && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {stations.length > 1 ? (
            <label className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-[#d4d4d4]">
              <span>Station availability</span>
              <select
                aria-label="Station for break control"
                value={station.id}
                onChange={event => setSelectedId(event.target.value)}
                className="max-w-full rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#1a1a1a] px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#f5f5f5] shadow-2xs cursor-pointer outline-none"
              >
                {stations.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}{item.owners?.length ? ` — ${item.owners.map(owner => `${owner.username}${owner.isCurrentUser ? ' (You)' : ''}`).join(', ')}` : ' — Unassigned'}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#f5f5f5] whitespace-normal break-words">{station.label}</span>
          )}
          <div className="shrink-0">
            <StationOwnerBadge
              owners={station.owners}
              className="rounded-lg px-3 py-1.5 text-sm font-bold shadow-2xs"
            />
          </div>
          <div className="shrink-0 [&>button]:min-h-[34px] [&>button]:px-3.5 [&>button]:py-1.5 [&>button]:rounded-lg [&>button]:text-xs sm:[&>button]:text-sm [&>button]:font-semibold [&>button]:shadow-2xs">
            <StationBreakButton station={station} busy={breaks.busy !== null} onToggle={() => void breaks.toggle(station)} />
          </div>
        </div>
      )}
      {breaks.error && <p role="alert" className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300 w-full">{breaks.error}</p>}
    </div>
  );
}
