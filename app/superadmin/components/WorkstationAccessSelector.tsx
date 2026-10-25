/**
 * @fileoverview Workstation Access Permissions selector component for SuperAdmin User Modal.
 *
 * Allows SuperAdmins to configure which operational workstations and pages
 * an account can access (e.g. selectively disabling Transfer or Nurse workstations
 * even for Superadmin or Admin accounts upon initial account creation).
 *
 * Adheres strictly to AGENTS.md standards:
 * - Enterprise solid surfaces with 1px crisp borders
 * - Flawless dual-theme compatibility
 * - Zero emojis in comments or UI
 *
 * @module app/superadmin/components/WorkstationAccessSelector
 */

import React from 'react';
import { WORKSTATION_CATALOG, WorkstationId } from '@/constants/workstations';

interface WorkstationAccessSelectorProps {
  /** Currently selected workstation IDs. */
  selectedWorkstations: string[];
  /** Callback when toggling a workstation access checkbox. */
  onToggleWorkstation: (id: WorkstationId) => void;
  /** Current role selected in the form. */
  currentRole: string;
}

/**
 * Renders the workstation permission toggles in the SuperAdmin User Modal.
 *
 * @param props - Component properties.
 * @returns JSX Element.
 */
export const WorkstationAccessSelector: React.FC<WorkstationAccessSelectorProps> = ({
  selectedWorkstations,
  onToggleWorkstation,
  currentRole,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50/70 dark:bg-[#1a1a1a] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#f5f5f5] flex items-center gap-1.5">
            <i className="bx bx-shield-quarter text-[#a8071a] dark:text-[#f87171] text-base" aria-hidden="true" />
            <span>Workstation & Role Access Permissions</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">
            Specify which operational stations this account can access. You can disable or enable access to specific workstations.
          </p>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-[#282828] text-slate-700 dark:text-[#e0e0e0]">
          {selectedWorkstations.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {WORKSTATION_CATALOG.map((station) => {
          const isSelected = selectedWorkstations.includes(station.id);
          const isSuperadminOnly = station.id === 'superadmin' && currentRole !== 'superadmin';

          return (
            <label
              key={station.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer select-none ${
                isSuperadminOnly
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-[#141414] border-slate-200 dark:border-[#262626]'
                  : isSelected
                  ? 'bg-white dark:bg-[#202020] border-[#a8071a]/50 dark:border-[#f87171]/50 shadow-xs'
                  : 'bg-white dark:bg-[#1f1f1f] border-slate-200 dark:border-[#2a2a2a] hover:border-slate-300 dark:hover:border-[#383838]'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isSuperadminOnly}
                onChange={() => onToggleWorkstation(station.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-[#404040] text-[#a8071a] focus:ring-[#a8071a]/30"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <i className={`bx ${station.icon} text-sm ${isSelected ? 'text-[#a8071a] dark:text-[#f87171]' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f5]">
                    {station.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5 line-clamp-2 leading-tight">
                  {station.description}
                </p>
                <span className="inline-block mt-1 text-[9px] font-mono text-slate-400 dark:text-[#888]">
                  {station.route}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {selectedWorkstations.length === 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <i className="bx bx-error text-base shrink-0" aria-hidden="true" />
          <span>Warning: Account has no active workstations enabled. They will only see public terminal displays.</span>
        </div>
      )}
    </div>
  );
};
