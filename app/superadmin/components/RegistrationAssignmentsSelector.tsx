/**
 * @fileoverview Subcomponent for selecting desk and service scopes assigned to registration officers.
 *
 * Provides structured multi-select toggles for Kiosk Services, Consultation Rooms
 * (scoped to selected services), and Physical Intake Counters (1 to 5).
 *
 * @module app/superadmin/components/RegistrationAssignmentsSelector
 */

import React from 'react';
import { AccessOptions, AssignedRoom } from '../types/superadmin';
import { roomKey } from '../hooks/useUserModalState';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface RegistrationAssignmentsSelectorProps {
  /** Access options payload from the server. */
  accessOptions: AccessOptions;
  /** Currently selected service names. */
  selectedServices: string[];
  /** Currently selected room configurations. */
  selectedRooms: AssignedRoom[];
  /** Currently selected registration counter numbers. */
  selectedCounters: number[];
  /** Handler callback for toggling service selection. */
  onToggleService: (service: string) => void;
  /** Handler callback for toggling room selection. */
  onToggleRoom: (room: AssignedRoom) => void;
  /** Handler callback for toggling counter selection. */
  onToggleCounter: (counter: number) => void;
}

/**
 * Renders registration scope selector for front-desk staff.
 *
 * @param props - Component properties.
 * @returns JSX element containing services, rooms, and counter station selectors.
 */
export const RegistrationAssignmentsSelector: React.FC<RegistrationAssignmentsSelectorProps> = ({
  accessOptions,
  selectedServices,
  selectedRooms,
  selectedCounters,
  onToggleService,
  onToggleRoom,
  onToggleCounter,
}) => {
  const S = SUPERADMIN_STYLES.modal;
  const T = SUPERADMIN_TEXTS.modal;

  return (
    <div className={S.assignmentSection}>
      <div>
        <label className="block text-sm font-bold text-slate-900 dark:text-[#f5f5f5]">
          {T.registrationSectionTitle}
        </label>
        <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
          {T.registrationSectionDesc}
        </p>
      </div>

      {/* 1. Kiosk Services */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-[#a3a3a3] uppercase tracking-wider">
          {T.assignedServicesLabel}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {accessOptions.services.map((service) => {
            const isSelected = selectedServices.includes(service);
            return (
              <button
                key={service}
                type="button"
                onClick={() => onToggleService(service)}
                className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#a8071a]/50 bg-[#a8071a]/10 dark:bg-[#a8071a]/20 text-[#a8071a] dark:text-[#f87171] shadow-xs'
                    : 'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-[#a3a3a3] hover:border-[#a8071a]/40 hover:bg-[#a8071a]/5 dark:hover:bg-[#a8071a]/10'
                }`}
              >
                <span>{service}</span>
                {isSelected && <i className="bx bx-check text-[#a8071a] dark:text-[#f87171] text-base" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Consultation Rooms (Filtered by selected services) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-[#a3a3a3] uppercase tracking-wider">
          {T.assignedRoomsLabel}
        </label>
        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#1a1a1a] p-3 space-y-3 phc-scroll">
          {selectedServices.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-[#737373] italic py-2">{T.assignedRoomsHint}</p>
          ) : (
            selectedServices.map((service) => {
              const roomsForService = accessOptions.availableRooms.filter(
                (r) => r.service === service
              );
              const subcategories = [
                ...new Set(roomsForService.map((r) => r.subcategory ?? '__none__')),
              ];

              return (
                <div key={service} className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#f5f5f5]">
                    {service}
                  </div>
                  {subcategories.map((subKey) => {
                    const subcategory = subKey === '__none__' ? null : subKey;
                    const rooms = roomsForService.filter(
                      (r) => (r.subcategory ?? null) === subcategory
                    );

                    return (
                      <div key={subKey} className="pl-2 border-l-2 border-slate-200 dark:border-[#2e2e2e] space-y-1.5">
                        {subcategory && (
                          <div className="text-[11px] font-medium text-slate-500 dark:text-[#a3a3a3]">
                            {subcategory}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {rooms.map((room) => {
                            const isSelected = selectedRooms.some(
                              (sel) => roomKey(sel) === roomKey(room)
                            );
                            return (
                              <button
                                key={roomKey(room)}
                                type="button"
                                onClick={() => onToggleRoom(room)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                                  isSelected
                                    ? 'border-[#a8071a] bg-[#a8071a] text-white shadow-xs'
                                    : 'border-slate-300 dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] text-slate-700 dark:text-[#a3a3a3] hover:border-[#a8071a] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20'
                                }`}
                              >
                                Room {room.room}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Registration Counter Stations */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-[#a3a3a3] uppercase tracking-wider">
          {T.assignedCountersLabel}
        </label>
        <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">
          {T.assignedCountersHint}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {accessOptions.counters.map((counter) => {
            const isSelected = selectedCounters.includes(counter);
            return (
              <button
                key={counter}
                type="button"
                onClick={() => onToggleCounter(counter)}
                className={`w-11 h-11 rounded-xl border text-sm font-bold flex items-center justify-center transition cursor-pointer ${
                  isSelected
                    ? 'border-[#a8071a] bg-[#a8071a] text-white shadow-xs'
                    : 'border-slate-300 dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] text-slate-700 dark:text-[#a3a3a3] hover:border-[#a8071a] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20'
                }`}
              >
                {counter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
