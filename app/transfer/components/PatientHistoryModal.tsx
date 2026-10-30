/**
 * @fileoverview Patient History & Stage Progression Inspection Modal.
 *
 * Full modal dialog allowing workstation staff to quickly look up any patient ticket issued today,
 * verify what stage their number is currently in, inspect exact milestone timestamps,
 * and view queue turnaround duration.
 *
 * Adheres strictly to AGENTS.md:
 * - Enterprise solid surfaces (bg-white dark:bg-[#161616], 1px crisp borders, zero glassmorphism)
 * - Zero emojis in icons or labels
 * - Natural text wrapping without truncate
 *
 * @module app/transfer/components/PatientHistoryModal
 */

'use client';

import React, { useEffect, useState } from 'react';
import { EnrichedHistoryPatient, PatientJourneyStage } from '@/app/transfer/types/history';
import { PatientStageProgress } from '@/app/transfer/components/PatientStageProgress';
import { HistoryStageFilter, UsePatientHistoryReturn } from '@/app/transfer/hooks/usePatientHistory';
import { formatManilaTime } from '@/utils/formatDateTime';

export interface PatientHistoryModalProps {
  /** Controls modal visibility. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Patient history state. */
  historyState: UsePatientHistoryReturn;
  /** Optional pre-selected patient to inspect. */
  initialSelectedPatient?: EnrichedHistoryPatient | null;
}

const MODAL_FILTER_PILLS: readonly { key: HistoryStageFilter; label: string }[] = [
  { key: 'all', label: 'All Tickets' },
  { key: 'done', label: 'Completed' },
  { key: 'in_service', label: 'In Service' },
  { key: 'queued', label: 'Waiting Queue' },
  { key: 'registration', label: 'Registration' },
  { key: 'idle', label: 'On Hold (Idle)' },
] as const;

/**
 * Patient History & Stage Progression Inspection Modal component.
 */
export function PatientHistoryModal({
  isOpen,
  onClose,
  historyState,
  initialSelectedPatient = null,
}: PatientHistoryModalProps) {
  const {
    filteredPatients,
    counts,
    loading,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
  } = historyState;

  const [selectedItem, setSelectedItem] = useState<EnrichedHistoryPatient | null>(
    initialSelectedPatient
  );

  // Sync selected item on open or when filter changes
  useEffect(() => {
    if (!isOpen) return;
    if (initialSelectedPatient) {
      setSelectedItem(initialSelectedPatient);
      return;
    }
    if (filteredPatients.length > 0) {
      const stillExists = filteredPatients.some(
        (p) => p.patient.id === selectedItem?.patient.id
      );
      if (!stillExists) {
        setSelectedItem(filteredPatients[0]);
      }
    } else {
      setSelectedItem(null);
    }
  }, [isOpen, initialSelectedPatient, filteredPatients, selectedItem]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 p-3 sm:p-6 flex items-start justify-center">
      <div
        className="relative w-full max-w-5xl h-[86vh] max-h-[750px] my-auto flex flex-col rounded-2xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-[#2b2b2b] flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#1a1a1a]/70">
          <div className="min-w-0">
            <h2 id="history-modal-title" className="text-base font-bold text-slate-900 dark:text-[#f5f5f5] tracking-tight whitespace-nowrap">
              Patient Journey & Stage History
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#888888] whitespace-nowrap mt-0.5">
              Real-time tracking of today’s patient ticket progress across clinical stages
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#333333] hover:bg-slate-100 dark:hover:bg-[#252525] flex items-center justify-center text-slate-500 dark:text-[#999999] transition cursor-pointer shrink-0"
            aria-label="Close patient history modal"
          >
            <i className="bx bx-x text-lg" aria-hidden="true" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="shrink-0 px-6 py-3 border-b border-slate-200 dark:border-[#2b2b2b] bg-slate-50/30 dark:bg-[#181818]/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <i
              className="bx bx-search absolute left-3 top-2.5 text-slate-400 dark:text-[#737373] text-sm pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by ticket # (e.g. C001) or service..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-[#f5f5f5] placeholder-slate-400 dark:placeholder-[#666666] focus:outline-hidden focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-[#cccccc] text-xs cursor-pointer"
              >
                <i className="bx bx-x" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Quick Stage Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto phc-scroll pb-1 sm:pb-0">
            {MODAL_FILTER_PILLS.map((pill) => {
              const isSelected = stageFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setStageFilter(pill.key)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#333333] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#282828]'
                  }`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Guaranteed Two-column layout (Left: List, Right: Stage Inspector) */}
        <div className="flex-1 min-h-0 flex flex-row divide-x divide-slate-200 dark:divide-[#2e2e2e]">
          {/* Left Column: Tickets List with dedicated fixed width */}
          <div className="w-80 sm:w-96 shrink-0 flex flex-col min-h-0 overflow-y-auto p-3.5 space-y-2 phc-scroll bg-slate-50/50 dark:bg-[#151515]/50">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-[#737373]">
                <div className="w-5 h-5 border-2 border-slate-300 dark:border-[#444444] border-t-[#cc3535] rounded-full animate-spin mx-auto mb-2" />
                Loading today’s tickets...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-[#737373]">
                No matching tickets found.
              </div>
            ) : (
              filteredPatients.map((item) => {
                const isSelected = selectedItem?.patient.id === item.patient.id;
                return (
                  <div
                    key={item.patient.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-xl border transition flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-500 shadow-xs'
                        : 'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] hover:border-slate-300 dark:hover:border-[#3a3a3a]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-base font-black text-slate-900 dark:text-[#f5f5f5] whitespace-nowrap">
                          {item.patient.patientNum}
                        </span>
                        {item.patient.service && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#252525] text-slate-700 dark:text-[#cccccc] border border-slate-200 dark:border-[#333333] whitespace-nowrap">
                            {item.patient.service}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400 dark:text-[#737373] whitespace-nowrap shrink-0">
                        {item.registeredTimeFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-slate-100 dark:border-[#222222]">
                      <span className="font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {item.stageInfo.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-[#888888] whitespace-nowrap shrink-0">
                        {item.elapsedWaitMinutes}m elapsed
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Stage Progression Inspector (Full remaining width) */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto p-5 sm:p-7 phc-scroll bg-white dark:bg-[#161616]">
            {selectedItem ? (
              <div className="flex flex-col gap-5">
                {/* Patient Summary Header */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2b2b2b] pb-4">
                  <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#888888] block whitespace-nowrap">
                      Ticket Stage Overview
                    </span>
                    <h3 className="text-3xl font-black font-mono text-slate-900 dark:text-[#f5f5f5] tracking-tight whitespace-nowrap mt-0.5">
                      {selectedItem.patient.patientNum}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#888888] block whitespace-nowrap">
                      Department
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-[#d4d4d4] whitespace-nowrap mt-0.5 block">
                      {selectedItem.patient.service || 'General Service'}
                      {selectedItem.patient.subcategory ? ` (${selectedItem.patient.subcategory})` : ''}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper on What Stage Is Their Number */}
                <PatientStageProgress
                  patient={selectedItem.patient}
                  stageInfo={selectedItem.stageInfo}
                  compact={false}
                />

                {/* Milestones Timeline */}
                <div className="rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50/70 dark:bg-[#1a1a1a]/70 p-4 sm:p-5 flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#d4d4d4] whitespace-nowrap">
                    Recorded Milestone Timestamps
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/70 dark:border-[#262626] gap-3">
                      <span className="text-slate-600 dark:text-[#a0a0a0] font-medium whitespace-nowrap">
                        1. Ticket Intake / Registration Start:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-[#f0f0f0] whitespace-nowrap shrink-0">
                        {selectedItem.patient.created_at
                          ? formatManilaTime(new Date(selectedItem.patient.created_at), true)
                          : '--:--:--'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/70 dark:border-[#262626] gap-3">
                      <span className="text-slate-600 dark:text-[#a0a0a0] font-medium whitespace-nowrap">
                        2. Registration Window Assigned:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-[#f0f0f0] whitespace-nowrap shrink-0">
                        {selectedItem.patient.counter
                          ? `Counter ${selectedItem.patient.counter}`
                          : 'Not assigned to counter'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/70 dark:border-[#262626] gap-3">
                      <span className="text-slate-600 dark:text-[#a0a0a0] font-medium whitespace-nowrap">
                        3. Clinical Station / Cubicle:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-[#f0f0f0] whitespace-nowrap shrink-0">
                        {selectedItem.patient.cubicleNum
                          ? `Cubicle ${selectedItem.patient.cubicleNum}`
                          : 'Waiting in queue'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 gap-3">
                      <span className="text-slate-600 dark:text-[#a0a0a0] font-medium whitespace-nowrap">
                        4. Consultation Finished / Done:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-[#f0f0f0] whitespace-nowrap shrink-0">
                        {selectedItem.patient.consult_end || selectedItem.patient.carryout_end
                          ? formatManilaTime(
                              new Date(
                                (selectedItem.patient.consult_end || selectedItem.patient.carryout_end)!
                              ),
                              true
                            )
                          : selectedItem.stageInfo.stage === 'done'
                          ? 'Completed today'
                          : 'In progress'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-[#737373] py-20 text-center whitespace-nowrap">
                Select a ticket from the left list to inspect its detailed stage progression.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientHistoryModal;
