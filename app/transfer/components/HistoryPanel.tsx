/**
 * @fileoverview Left-column History tab panel displaying today's patient journey list.
 *
 * Sized to fill the tab body of QueuePanel. Offers search, stage filtering, and visual
 * stage progression for all tickets issued today.
 *
 * Adheres strictly to AGENTS.md:
 * - Enterprise solid surfaces with 1px borders
 * - Zero emojis in icons or labels
 * - Natural text wrapping without truncate
 *
 * @module app/transfer/components/HistoryPanel
 */

'use client';

import React from 'react';
import { EnrichedHistoryPatient, PatientJourneyStage } from '@/app/transfer/types/history';
import { PatientStageProgress } from '@/app/transfer/components/PatientStageProgress';
import { HistoryStageFilter, UsePatientHistoryReturn } from '@/app/transfer/hooks/usePatientHistory';

export interface HistoryPanelProps {
  /** Hook state managing today's patient history. */
  historyState: UsePatientHistoryReturn;
  /** Optional callback to open full inspection modal for a patient. */
  onSelectPatient?: (item: EnrichedHistoryPatient) => void;
}

const FILTER_PILLS: readonly { key: HistoryStageFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'done', label: 'Done' },
  { key: 'in_service', label: 'Service' },
  { key: 'queued', label: 'Queued' },
  { key: 'registration', label: 'Reg' },
  { key: 'idle', label: 'Idle' },
] as const;

/**
 * Renders the History tab panel with search, filters, and stage progress cards.
 */
export function HistoryPanel({ historyState, onSelectPatient }: HistoryPanelProps) {
  const {
    filteredPatients,
    counts,
    loading,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
  } = historyState;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search Bar & Stage Filter Header */}
      <div className="shrink-0 p-2.5 border-b border-slate-200 dark:border-[#2e2e2e] bg-slate-50/50 dark:bg-[#1a1a1a]/50 flex flex-col gap-2">
        {/* Search Input */}
        <div className="relative flex items-center">
          <i
            className="bx bx-search absolute left-2.5 text-slate-400 dark:text-[#737373] text-sm pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket # or service..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#202020] text-slate-800 dark:text-[#f5f5f5] placeholder-slate-400 dark:placeholder-[#666666] focus:outline-hidden focus:border-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-[#cccccc] text-xs cursor-pointer"
              title="Clear search"
            >
              <i className="bx bx-x" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 phc-scroll">
          {FILTER_PILLS.map((pill) => {
            const isSelected = stageFilter === pill.key;
            const count =
              pill.key === 'all'
                ? counts.total
                : pill.key === 'done'
                ? counts.done
                : pill.key === 'in_service'
                ? counts.inService
                : pill.key === 'queued'
                ? counts.queued
                : pill.key === 'registration'
                ? counts.registration
                : counts.idle;

            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setStageFilter(pill.key)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#333333] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[9px] px-1 rounded-full ${
                    isSelected
                      ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-[#2e2e2e] text-slate-500 dark:text-[#888888]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Patient List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 phc-scroll">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 dark:text-[#737373] text-xs">
            <div className="w-5 h-5 border-2 border-slate-300 dark:border-[#444444] border-t-[#cc3535] rounded-full animate-spin mr-2" />
            Loading history...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-[#737373] text-xs">
            <i className="bx bx-history text-2xl mb-1 block" aria-hidden="true" />
            {searchTerm
              ? `No tickets match "${searchTerm}"`
              : 'No patient history recorded for today yet.'}
          </div>
        ) : (
          filteredPatients.map((item) => (
            <div
              key={item.patient.id}
              onClick={() => onSelectPatient?.(item)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] hover:border-slate-300 dark:hover:border-[#404040] transition flex flex-col gap-2 shadow-xs cursor-pointer group"
            >
              {/* Ticket Header */}
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-sm font-black text-slate-800 dark:text-[#f5f5f5] tracking-tight">
                    {item.patient.patientNum}
                  </span>
                  {item.patient.service && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-[#cccccc] border border-slate-200 dark:border-[#333333] whitespace-normal">
                      {item.patient.service}
                      {item.patient.subcategory ? ` · ${item.patient.subcategory}` : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-400 dark:text-[#737373] font-mono">
                  <i className="bx bx-time text-xs" aria-hidden="true" />
                  <span>{item.registeredTimeFormatted}</span>
                </div>
              </div>

              {/* Progress Indicator */}
              <PatientStageProgress patient={item.patient} stageInfo={item.stageInfo} compact={true} />

              {/* Location Tag if applicable */}
              {item.stageInfo.currentLocation && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#888888] pt-1 border-t border-slate-100 dark:border-[#242424]">
                  <span>Station:</span>
                  <span className="font-semibold text-slate-700 dark:text-[#d4d4d4]">
                    {item.stageInfo.currentLocation}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HistoryPanel;
