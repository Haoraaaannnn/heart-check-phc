'use client';

import React from 'react';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { transferTexts } from '../constants/transferTexts';
import { Cubicle, Patient } from '@/types/Types';

/**
 * Props for `SelectionCard`.
 */
export interface SelectionCardProps {
  /** Card heading text. */
  title: string;
  /** Boxicon icon class name (e.g. 'bx-male'). */
  icon: string;
  /** Primary total count for badge. */
  totalCount?: number;
  /** Detailed breakdown counts. */
  counts?: {
    queue?: number;
    registration?: number;
    idle?: number;
  };
  /** Click event handler. */
  onClick: () => void;
}

/**
 * Reusable selection card for subcategories and rooms.
 */
export function SelectionCard({
  title,
  icon,
  totalCount = 0,
  counts,
  onClick,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border-2 border-slate-200 hover:border-[#cc3535] rounded-2xl p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-all duration-150 text-left group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-12 h-12 bg-red-50 group-hover:bg-[#cc3535] text-[#cc3535] group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
          <i className={`bx ${icon} text-2xl`} aria-hidden="true" />
        </div>
        {totalCount > 0 && (
          <NotificationBadge
            count={totalCount}
            color="brand"
            pulse={totalCount > 5}
          />
        )}
      </div>

      <div>
        <h3 className="text-slate-800 group-hover:text-[#cc3535] font-bold text-base transition-colors">
          {title}
        </h3>
        {counts && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
            {counts.queue !== undefined && counts.queue > 0 && `${counts.queue} ${transferTexts.inQueueSuffix}`}
            {counts.queue !== undefined && counts.queue > 0 && (counts.registration || counts.idle) ? ' · ' : ''}
            {counts.registration !== undefined && counts.registration > 0 && `${counts.registration} ${transferTexts.atCounterSuffix}`}
            {counts.registration !== undefined && counts.registration > 0 && counts.idle ? ' · ' : ''}
            {counts.idle !== undefined && counts.idle > 0 && `${counts.idle} ${transferTexts.idleSuffix}`}
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * Props for `SubcategoryPicker`.
 */
export interface SubcategoryPickerProps {
  /** Available subcategories list. */
  subcategories: Array<{ sub: string; icon: string }>;
  /** Callback when user selects a subcategory. */
  onSelect: (sub: string) => void;
  /** Function calculating counts for a given subcategory. */
  countFor: (sub: string) => { queue: number; registration: number; idle: number };
  /** Optional empty state title. */
  emptyTitle?: string;
  /** Optional empty state message. */
  emptyMessage?: string;
}

/**
 * Picker for selecting Adult, Pedia, or other service subcategories.
 */
export function SubcategoryPicker({
  subcategories,
  onSelect,
  countFor,
  emptyTitle = transferTexts.noAccountRoomsTitle,
  emptyMessage = transferTexts.noAccountRoomsDesc,
}: SubcategoryPickerProps) {
  if (subcategories.length === 0) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-8 shadow-xs">
        <i className="bx bx-info-circle text-4xl text-amber-500 mb-2 block" aria-hidden="true" />
        <h4 className="text-slate-700 font-bold text-sm">{emptyTitle}</h4>
        <p className="text-slate-500 text-xs mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 text-center">
        {transferTexts.selectSubcategoryTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subcategories.map(({ sub, icon }) => {
          const counts = countFor(sub);
          const total = counts.queue + counts.registration + counts.idle;

          return (
            <SelectionCard
              key={sub}
              title={sub}
              icon={icon}
              totalCount={total}
              counts={counts}
              onClick={() => onSelect(sub)}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Props for `RoomPicker`.
 */
export interface RoomPickerProps {
  /** Array of available room numbers. */
  rooms: number[];
  /** Cubicles list for calculating assigned counts. */
  visibleCubicles: Cubicle[];
  /** Map of assigned patients by cubicle number. */
  assignedPatients: Record<string, any[]>;
  /** Active queue patients list for counting queued persons. */
  onProgressPatients?: Patient[];
  /** Callback when user selects a room. */
  onSelectRoom: (room: number) => void;
  /** Optional service context string. */
  serviceContext?: string;
}

/**
 * Picker for selecting a specific consultation or screening room.
 */
export function RoomPicker({
  rooms,
  visibleCubicles,
  assignedPatients,
  onProgressPatients,
  onSelectRoom,
  serviceContext,
}: RoomPickerProps) {
  if (rooms.length === 0) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-8 shadow-xs">
        <i className="bx bx-info-circle text-4xl text-amber-500 mb-2 block" aria-hidden="true" />
        <h4 className="text-slate-700 font-bold text-sm">
          {transferTexts.noRoomsConfiguredTitle} {serviceContext ? `(${serviceContext})` : ''}
        </h4>
        <p className="text-slate-500 text-xs mt-1">
          {transferTexts.noRoomsConfiguredDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 text-center">
        {transferTexts.selectRoomTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {rooms.map(room => {
          const roomCubicles = visibleCubicles.filter(c => c.room === room);
          const roomCubicleNums = new Set(roomCubicles.map(c => c.cubicleNum));

          const totalAssigned = roomCubicles.reduce(
            (sum, c) => sum + (assignedPatients[c.cubicleNum]?.length || 0),
            0
          );

          // Count queued patients waiting for this room
          const totalQueued = (onProgressPatients || []).filter(p => {
            // Directly designated to a cubicle in this room
            if (p.cubicleNum && roomCubicleNums.has(p.cubicleNum)) return true;

            // Preferred cubicle belongs to this room (e.g. "Consultation R4 C1" contains R4 or matches cubicleNum)
            if (p.preferredCubicleNums && p.preferredCubicleNums.length > 0) {
              return p.preferredCubicleNums.some(
                num =>
                  roomCubicleNums.has(num) ||
                  num.includes(`R${room}`) ||
                  num.toLowerCase().includes(`room ${room}`) ||
                  num.toLowerCase().includes(`room${room}`)
              );
            }

            // If there is only one room, all general queued patients belong to it
            if (rooms.length === 1) {
              return true;
            }

            return false;
          }).length;

          const totalCount = totalQueued + totalAssigned;

          return (
            <button
              key={room}
              type="button"
              onClick={() => onSelectRoom(room)}
              className="bg-white border-2 border-slate-200 hover:border-[#cc3535] rounded-2xl p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-all duration-150 text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-red-50 group-hover:bg-[#cc3535] text-[#cc3535] group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                  <i className="bx bx-door-open text-2xl" aria-hidden="true" />
                </div>
                {totalCount > 0 && (
                  <NotificationBadge
                    count={totalCount}
                    color={totalQueued > 0 ? 'brand' : 'amber'}
                    pulse={totalQueued > 0}
                  />
                )}
              </div>

              <div>
                <h3 className="text-slate-800 group-hover:text-[#cc3535] font-bold text-base transition-colors">
                  {transferTexts.roomPrefix} {room}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {roomCubicles.length} {roomCubicles.length === 1 ? 'cubicle' : 'cubicles'}
                  {totalQueued > 0 && ` · ${totalQueued} ${transferTexts.inQueueSuffix}`}
                  {totalAssigned > 0 && ` · ${totalAssigned} ${transferTexts.assignedSuffix}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
