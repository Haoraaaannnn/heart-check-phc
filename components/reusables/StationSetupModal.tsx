/**
 * @fileoverview Compact, non-scrollable modal for selecting a single station
 * (Registration Counter or Nurse Cubicle) and configuring multi-service subscriptions.
 *
 * Implements a dual-column split view with Room filter tabs to eliminate excessive scrolling
 * and fit cleanly within standard workstation viewports.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Enterprise Solid Surfaces: crisp 1px borders, high-contrast solid backgrounds, no blurry glassmorphism
 * - No text ellipsis or truncated clinical text (natural wrapping)
 * - Zero emojis in copy, icons, or comments
 * - Clean TypeScript typing and accessible modal keyboard controls
 *
 * @module components/reusables/StationSetupModal
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AvailableCounter,
  AvailableCubicle,
  StationServiceOption,
  CurrentStationAssignment,
} from '@/hooks/useStationClaim';

export interface StationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workstation: 'registration' | 'nurse';
  currentAssignment: CurrentStationAssignment;
  counters: AvailableCounter[];
  cubicles: AvailableCubicle[];
  services: StationServiceOption[];
  onSave: (params: {
    workstation: 'registration' | 'nurse';
    counter?: number;
    cubicleId?: number;
    services: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
  onRemove?: () => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function StationSetupModal({
  isOpen,
  onClose,
  workstation,
  currentAssignment,
  counters,
  cubicles,
  services,
  onSave,
  onRemove,
  onSuccess,
}: StationSetupModalProps) {
  const isRegistration = workstation === 'registration';

  const [selectedCounter, setSelectedCounter] = useState<number | null>(null);
  const [selectedCubicleId, setSelectedCubicleId] = useState<number | null>(null);
  const [selectedRoomTab, setSelectedRoomTab] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasConfiguredStation = currentAssignment.counter !== null || currentAssignment.cubicleId !== null;

  // Display all available hospital services so staff can configure any service at their station
  const eligibleServices = useMemo(() => {
    return services;
  }, [services]);

  // Distinct room numbers available for cubicles
  const availableRooms = useMemo(() => {
    const set = new Set<number>();
    cubicles.forEach((c) => {
      if (c.room) set.add(c.room);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [cubicles]);

  // Sync state when modal opens or currentAssignment updates
  useEffect(() => {
    if (isOpen) {
      setSelectedCounter(currentAssignment.counter ?? null);
      setSelectedCubicleId(currentAssignment.cubicleId ?? null);

      // Auto-focus room tab of selected cubicle if assigned
      if (currentAssignment.cubicleId) {
        const found = cubicles.find((c) => c.id === currentAssignment.cubicleId);
        if (found && found.room) {
          setSelectedRoomTab(String(found.room));
        } else {
          setSelectedRoomTab('all');
        }
      } else {
        setSelectedRoomTab('all');
      }

      if (currentAssignment.services && currentAssignment.services.length > 0) {
        setSelectedServices(currentAssignment.services);
      } else {
        setSelectedServices([]);
      }
      setErrorMsg(null);
    }
  }, [isOpen, currentAssignment, eligibleServices, cubicles]);

  // Hooks must run even while the modal is closed so opening it preserves hook order.
  const displayedCubicles = useMemo(() => {
    if (selectedRoomTab === 'all') return cubicles;
    const roomNum = parseInt(selectedRoomTab, 10);
    return cubicles.filter((c) => c.room === roomNum);
  }, [cubicles, selectedRoomTab]);

  if (!isOpen) return null;

  const toggleService = (label: string) => {
    setSelectedServices((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleSelectAll = () => {
    setSelectedServices(eligibleServices.map((s) => s.label_en));
  };

  const handleClearAll = () => {
    setSelectedServices([]);
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    setErrorMsg(null);
    try {
      const res = await onRemove();
      if (res.ok) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'Failed to remove station configuration.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to remove station configuration.');
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirm = async () => {
    const noStationSelected =
      (isRegistration && !selectedCounter) || (!isRegistration && !selectedCubicleId);

    if (noStationSelected) {
      if (onRemove && hasConfiguredStation) {
        await handleRemove();
        return;
      }
      if (isRegistration) {
        setErrorMsg('Please select a registration counter.');
      } else {
        setErrorMsg('Please select a clinical cubicle.');
      }
      return;
    }

    if (selectedServices.length === 0) {
      setErrorMsg('Please select at least one service to accept at this station.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await onSave({
        workstation,
        counter: isRegistration && selectedCounter !== null ? selectedCounter : undefined,
        cubicleId: !isRegistration && selectedCubicleId !== null ? selectedCubicleId : undefined,
        services: selectedServices,
      });
      if (res.ok) {
        onClose();
        if (onSuccess) onSuccess();
      } else setErrorMsg(res.error || 'Failed to update desk settings.');
    } catch {
      setErrorMsg('Unable to save station settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#1a1a1a] shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5] tracking-tight">
              {isRegistration ? 'Registration Desk Setup' : 'Clinical Station Setup'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">
              {isRegistration
                ? 'Select 1 active counter and your accepted services.'
                : 'Select 1 active cubicle and your accepted services.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#242424] transition cursor-pointer"
            aria-label="Close modal"
          >
            <i className="bx bx-x text-2xl" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Two-Column Side-by-Side Body: Eliminates vertical scrolling */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-[#2e2e2e] flex-1 overflow-hidden">
          {/* Left Column: Station Selector (Counter or Cubicle) */}
          <div className="p-4 sm:p-5 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2.5 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#d4d4d4]">
                {isRegistration ? '1. Choose Counter' : '1. Choose Cubicle'}
              </span>
              <span className="text-[10px] font-semibold text-[#a8071a] dark:text-[#f87171] uppercase">
                1 Account = 1 Desk
              </span>
            </div>

            {/* Room Filter Tabs for Nurse/Doctor: Wrapping with ZERO scrollbars */}
            {!isRegistration && availableRooms.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedRoomTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer touch-manipulation active:scale-[0.98] ${
                    selectedRoomTab === 'all'
                      ? 'bg-[#a8071a] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#202020] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-200 dark:hover:bg-[#282828] active:bg-slate-300 dark:active:bg-[#333333]'
                  }`}
                >
                  All Rooms ({cubicles.length})
                </button>
                {availableRooms.map((r) => {
                  const countInRoom = cubicles.filter((c) => c.room === r).length;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRoomTab(String(r))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer touch-manipulation active:scale-[0.98] ${
                        selectedRoomTab === String(r)
                          ? 'bg-[#a8071a] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#202020] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-200 dark:hover:bg-[#282828] active:bg-slate-300 dark:active:bg-[#333333]'
                      }`}
                    >
                      Room {r} ({countInRoom})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Station Cards Grid / List */}
            <div className="flex-1 overflow-y-auto pr-1 phc-scroll space-y-2">
              {isRegistration ? (
                <div className="grid grid-cols-2 gap-2">
                  {counters.map((c) => {
                    const isSelected = selectedCounter === c.counter_number;
                    const isOccupiedByOther = c.occupiedBy != null;

                    return (
                      <button
                        key={c.counter_number}
                        type="button"
                        onClick={() =>
                          setSelectedCounter((prev) =>
                            prev === c.counter_number ? null : c.counter_number
                          )
                        }
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer min-h-[56px] touch-manipulation active:scale-[0.98] ${
                          isSelected
                            ? 'bg-[#a8071a] border-[#a8071a] text-white shadow-xs'
                            : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#2e2e2e] text-slate-800 dark:text-[#f5f5f5] hover:border-slate-300 dark:hover:border-[#404040]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold tracking-tight">
                            {c.label || `Counter ${c.counter_number}`}
                          </span>
                          {isSelected && <i className="bx bx-check-circle text-sm text-white" />}
                        </div>
                        {isOccupiedByOther && (
                          <span
                            className={`mt-1 text-[9px] leading-tight px-1 py-0.5 rounded font-medium ${
                              isSelected
                                ? 'bg-black/20 text-white/90'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                            }`}
                          >
                            In use: {c.occupiedBy?.username}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {displayedCubicles.map((cub) => {
                    const isSelected = selectedCubicleId === cub.id;
                    const isOccupiedByOther = cub.occupiedBy != null;

                    return (
                      <button
                        key={cub.id}
                        type="button"
                        onClick={() =>
                          setSelectedCubicleId((prev) => (prev === cub.id ? null : cub.id))
                        }
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer min-h-[58px] touch-manipulation active:scale-[0.98] ${
                          isSelected
                            ? 'bg-[#a8071a] border-[#a8071a] text-white shadow-xs'
                            : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#2e2e2e] text-slate-800 dark:text-[#f5f5f5] hover:border-slate-300 dark:hover:border-[#404040]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold tracking-tight">
                            Cubicle {cub.cubicleNum}
                          </span>
                          {isSelected && <i className="bx bx-check-circle text-sm text-white" />}
                        </div>
                        <span
                          className={`mt-0.5 text-[10px] break-words whitespace-normal leading-tight ${
                            isSelected ? 'text-white/80' : 'text-slate-400 dark:text-[#737373]'
                          }`}
                        >
                          Room {cub.room} · {cub.category}
                        </span>
                        {isOccupiedByOther && (
                          <span
                            className={`mt-1.5 text-[9px] leading-tight px-1 py-0.5 rounded font-medium ${
                              isSelected
                                ? 'bg-black/20 text-white/90'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                            }`}
                          >
                            In use: {cub.occupiedBy?.username}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Accepted Services Checklist */}
          <div className="p-4 sm:p-5 flex flex-col min-h-0 overflow-hidden bg-slate-50/30 dark:bg-[#171717]/30">
            <div className="flex items-center justify-between mb-2.5 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#d4d4d4]">
                2. Accepted Services
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-[#cc3535] dark:text-[#f87171] hover:underline font-bold cursor-pointer touch-manipulation"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-[#404040]">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-slate-500 dark:text-[#a3a3a3] hover:underline font-medium cursor-pointer touch-manipulation"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Compact Services List */}
            <div className="flex-1 overflow-y-auto pr-1 phc-scroll space-y-1.5">
              {eligibleServices.map((service) => {
                const isChecked = selectedServices.includes(service.label_en);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.label_en)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer min-h-[42px] touch-manipulation active:scale-[0.99] ${
                      isChecked
                        ? 'bg-red-50/80 dark:bg-red-950/40 border-[#cc3535]/50 dark:border-red-900/60 text-slate-900 dark:text-[#f5f5f5]'
                        : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#2e2e2e] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#202020]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 transition ${
                        isChecked
                          ? 'bg-[#cc3535] text-white font-bold'
                          : 'border border-slate-300 dark:border-[#404040]'
                      }`}
                    >
                      {isChecked && <i className="bx bx-check" />}
                    </div>
                    <span className="text-xs font-semibold leading-tight break-words whitespace-normal">
                      {service.label_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-[#2e2e2e] bg-slate-50/70 dark:bg-[#1a1a1a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {hasConfiguredStation && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving || removing}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition cursor-pointer flex items-center gap-1.5 touch-manipulation active:scale-[0.98]"
                title="Remove station configuration and restore global supervisor view"
              >
                {removing ? (
                  <>
                    <i className="bx bx-loader-alt animate-spin text-sm" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-trash text-sm" />
                    <span>Remove Configuration</span>
                  </>
                )}
              </button>
            )}
            <div className="text-[11px] text-slate-500 dark:text-[#a3a3a3] min-w-0 hidden sm:block">
              <span className="font-bold text-slate-800 dark:text-[#f5f5f5]">
                {selectedServices.length}
              </span>{' '}
              service{selectedServices.length === 1 ? '' : 's'} selected
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || removing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-200 dark:hover:bg-[#242424] transition cursor-pointer touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving || removing}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#cc3535] hover:bg-[#a8071a] dark:bg-[#a8071a] dark:hover:bg-[#cc3535] transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <i className="bx bx-loader-alt animate-spin text-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm & Enter</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StationSetupModal;
