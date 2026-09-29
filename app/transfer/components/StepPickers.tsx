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
  /** Optional icon identifier (retained for backward compatibility). */
  icon?: string;
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
  totalCount = 0,
  counts,
  onClick,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white border-2 border-slate-200 hover:border-[#cc3535] rounded-2xl p-6 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group cursor-pointer min-h-[116px]"
    >
      <div className="flex items-center justify-between gap-4 w-full">
        <h3 className="text-slate-800 group-hover:text-[#cc3535] font-bold text-lg transition-colors">
          {title}
        </h3>
        {totalCount > 0 && (
          <NotificationBadge
            count={totalCount}
            color="brand"
            pulse={totalCount > 5}
          />
        )}
      </div>

      {counts && (
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {counts.queue !== undefined && counts.queue > 0 && `${counts.queue} ${transferTexts.inQueueSuffix}`}
          {counts.queue !== undefined && counts.queue > 0 && (counts.registration || counts.idle) ? ' · ' : ''}
          {counts.registration !== undefined && counts.registration > 0 && `${counts.registration} ${transferTexts.atCounterSuffix}`}
          {counts.registration !== undefined && counts.registration > 0 && counts.idle ? ' · ' : ''}
          {counts.idle !== undefined && counts.idle > 0 && `${counts.idle} ${transferTexts.idleSuffix}`}
        </p>
      )}
    </button>
  );
}

/**
 * Props for `SubcategoryPicker`.
 */
export interface SubcategoryPickerProps {
  /** Available subcategories list. */
  subcategories: Array<{ sub: string; icon?: string }>;
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
        <h4 className="text-slate-700 font-bold text-sm">{emptyTitle}</h4>
        <p className="text-slate-500 text-xs mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 text-center">
        {transferTexts.selectSubcategoryTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {subcategories.map(({ sub }) => {
          const counts = countFor(sub);
          const total = counts.queue + counts.registration + counts.idle;

          return (
            <SelectionCard
              key={sub}
              title={sub}
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
        <h4 className="text-slate-700 font-bold text-sm">
          {transferTexts.noRoomsConfiguredTitle} {serviceContext ? `(${serviceContext})` : ''}
        </h4>
        <p className="text-slate-500 text-xs mt-1">
          {transferTexts.noRoomsConfiguredDesc}
        </p>
      </div>
    );
  }

  const isTwoRooms = rooms.length === 2;

  return (
    <div className={`w-full ${isTwoRooms ? 'max-w-4xl' : 'max-w-5xl'} mx-auto mt-8 px-4`}>
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 text-center">
        {transferTexts.selectRoomTitle}
      </h2>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isTwoRooms ? '' : 'lg:grid-cols-3'} gap-6`}>
        {rooms.map(room => {
          const safeCubicles = Array.isArray(visibleCubicles) ? visibleCubicles : [];
          const safeAssignedPatients = assignedPatients || {};
          const roomCubicles = safeCubicles.filter(c => c.room === room);
          const roomCubicleNums = new Set(roomCubicles.map(c => c.cubicleNum));

          const totalAssigned = roomCubicles.reduce(
            (sum, c) => sum + (safeAssignedPatients[c.cubicleNum]?.length || 0),
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
              className="w-full bg-white border-2 border-slate-200 hover:border-[#cc3535] rounded-2xl p-6 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group cursor-pointer min-h-[116px]"
            >
              <div className="flex items-center justify-between gap-4 w-full">
                <h3 className="text-slate-800 group-hover:text-[#cc3535] font-bold text-lg transition-colors">
                  {transferTexts.roomPrefix} {room}
                </h3>
                {totalCount > 0 && (
                  <NotificationBadge
                    count={totalCount}
                    color={totalQueued > 0 ? 'brand' : 'amber'}
                    pulse={totalQueued > 0}
                  />
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {roomCubicles.length} {roomCubicles.length === 1 ? 'cubicle' : 'cubicles'}
                {totalQueued > 0 && ` · ${totalQueued} ${transferTexts.inQueueSuffix}`}
                {totalAssigned > 0 && ` · ${totalAssigned} ${transferTexts.assignedSuffix}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
