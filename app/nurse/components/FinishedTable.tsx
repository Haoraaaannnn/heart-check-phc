/**
 * @fileoverview Corrected 5-column completed patient table for the Nurse Dashboard.
 *
 * Resolves the historical column misalignment bug by ensuring headers match body cells
 * for Queue No., Service, Cubicle, Consult Finished, Carryout Finished, and Duration.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Patient } from '@/types/Types';
import { nurseTexts } from '../constants/nurseTexts';

/**
 * Props for the FinishedTable component.
 */
export interface FinishedTableProps {
  /** List of completed patients retrieved for today. */
  patients: Patient[];
  /** Optional container CSS class name. */
  className?: string;
}

/**
 * Safely formats an ISO timestamp string into a 12-hour/24-hour localized time string.
 *
 * @param isoString - Timestamp string.
 * @returns Localized time string or '-' if null or invalid.
 */
function formatTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

/**
 * Calculates total session duration in minutes between start and completion.
 *
 * @param start - Starting ISO timestamp.
 * @param end - Completion ISO timestamp.
 * @returns Formatted duration string (e.g. '18 min') or '-'.
 */
function calculateDuration(start?: string | null, end?: string | null): string {
  if (!start || !end) return '-';
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return '-';
    const totalMinutes = Math.round((e - s) / 60000);
    return `${totalMinutes} min`;
  } catch {
    return '-';
  }
}

/**
 * Renders the tabular ledger of patients whose care sessions finished today.
 *
 * @param props - Patient dataset.
 * @returns Rendered table element.
 */
export function FinishedTable({ patients, className = '' }: FinishedTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((patient) => {
      const numMatch = patient.patientNum?.toLowerCase().includes(term);
      const serviceMatch = patient.service?.toLowerCase().includes(term);
      const cubicleMatch = patient.cubicleNum?.toLowerCase().includes(term);
      return numMatch || serviceMatch || cubicleMatch;
    });
  }, [patients, searchTerm]);

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      {/* Search Filter Input */}
      {patients.length > 5 && (
        <div className="relative">
          <i
            className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={nurseTexts.searchFinishedPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#cc3535]/30 focus:border-[#cc3535] transition"
          />
        </div>
      )}

      {/* Table Content */}
      {filteredPatients.length === 0 ? (
        <div className="py-12 text-center">
          <i className="bx bx-file-blank text-3xl text-slate-300 mb-2" aria-hidden="true" />
          <p className="text-xs text-slate-400 font-medium">
            {searchTerm ? 'No matching patients found' : nurseTexts.emptyFinished}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-3.5 py-3">
                  {nurseTexts.tableQueueNo}
                </th>
                <th scope="col" className="px-3.5 py-3">
                  {nurseTexts.tableService}
                </th>
                <th scope="col" className="px-3.5 py-3">
                  {nurseTexts.tableCubicle}
                </th>
                <th scope="col" className="px-3.5 py-3">
                  {nurseTexts.tableConsultEnd}
                </th>
                <th scope="col" className="px-3.5 py-3">
                  {nurseTexts.tableCarryoutEnd}
                </th>
                <th scope="col" className="px-3.5 py-3 text-right">
                  {nurseTexts.tableTotalTime}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPatients.map((patient) => {
                const totalDuration = calculateDuration(
                  patient.consult_start || patient.created_at,
                  patient.carryout_end || patient.updated_at
                );

                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-3.5 py-2.5 font-black text-[#cc3535]">
                      {patient.patientNum}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-slate-700">
                      {patient.service}
                      {patient.subcategory ? ` · ${patient.subcategory}` : ''}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 font-semibold">
                      {patient.cubicleNum || '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500">
                      {formatTime(patient.consult_end)}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500">
                      {formatTime(patient.carryout_end)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                      {totalDuration}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FinishedTable;