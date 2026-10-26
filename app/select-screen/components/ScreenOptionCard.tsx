/**
 * @fileoverview Card component rendering a single screen display mode or workstation option.
 *
 * Handles navigation to the target route, dynamic desk assignment presentation,
 * 1-click launch for configured counters/cubicles, and station setup triggers.
 *
 * @remarks
 * Conforms to AGENTS.md: high-contrast solid surface styling, crisp 1-pixel borders,
 * flawless dual-theme compatibility, and zero emojis.
 *
 * @module app/select-screen/components/ScreenOptionCard
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleSignOut } from '@/lib/supabase/signOut';
import { ScreenOption } from '@/app/select-screen/types/selectScreen';
import { SELECT_SCREEN_STYLES } from '@/app/select-screen/constants/selectScreen';
import { SELECT_SCREEN_TEXTS } from '@/app/select-screen/constants/selectScreenTexts';

interface ScreenOptionCardProps {
  /** Screen display configuration details. */
  option: ScreenOption;
  /** Single assigned counter number if applicable. */
  assignedCounter?: number | null;
  /** Single assigned cubicle designation if applicable. */
  assignedCubicleNum?: string | null;
  /** Configured service category subscriptions for the station. */
  assignedServices?: string[];
  /** Callback fired to launch station configuration modal. */
  onOpenStationModal?: (workstation: 'registration' | 'nurse') => void;
}

/**
 * Screen option card with interactive action triggers and safety sign out handling.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ScreenOptionCard({
  option,
  assignedCounter,
  assignedCubicleNum,
  assignedServices = [],
  onOpenStationModal,
}: ScreenOptionCardProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const S = SELECT_SCREEN_STYLES.card;

  const isRegistration = option.id === 'transfer';
  const isNurse = option.id === 'nurse';

  const hasConfiguredStation =
    (isRegistration && assignedCounter != null) ||
    (isNurse && assignedCubicleNum != null);

  const handlePrimaryAction = async () => {
    if (navigating) return;

    // If workstation requires initial setup and has no saved desk, open setup modal
    if (isRegistration && !assignedCounter && onOpenStationModal) {
      onOpenStationModal('registration');
      return;
    }

    if (isNurse && !assignedCubicleNum && onOpenStationModal) {
      onOpenStationModal('nurse');
      return;
    }

    setNavigating(true);

    try {
      if (option.requiresSignOut) {
        // Fully terminate authenticated staff session and destroy cookies before launching kiosk
        await handleSignOut(option.route);
        return;
      }
      router.push(option.route);
    } catch (err) {
      console.error('Navigation error during display setup:', err);
      setNavigating(false);
    }
  };

  // Determine dynamic button label
  let buttonLabel = option.actionLabel;
  if (isRegistration) {
    buttonLabel = assignedCounter
      ? `Launch Counter ${assignedCounter}`
      : 'Set Up Counter & Enter';
  } else if (isNurse) {
    buttonLabel = assignedCubicleNum
      ? `Launch Cubicle ${assignedCubicleNum}`
      : 'Set Up Cubicle & Enter';
  }

  return (
    <div className={S.root}>
      <div>
        {/* Top Header Row with Icon and Badge */}
        <div className={S.topRow}>
          <div className={S.iconWrap}>
            <i className={`bx ${option.icon}`} aria-hidden="true" />
          </div>
          <span className={S.badge}>{option.badge}</span>
        </div>

        {/* Title and Description */}
        <h3 className={S.title}>{option.title}</h3>
        <p className={S.description}>{option.description}</p>

        {/* Dynamic Station Assignment Banner */}
        {hasConfiguredStation && (
          <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-[#202020] border border-slate-200 dark:border-[#2e2e2e] flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a8071a] dark:text-[#f87171]">
                {isRegistration
                  ? `Active: Counter ${assignedCounter}`
                  : `Active: Cubicle ${assignedCubicleNum}`}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#a3a3a3]">
                {assignedServices.length} service{assignedServices.length === 1 ? '' : 's'}
              </span>
            </div>
            {assignedServices.length > 0 && (
              <p className="text-[11px] text-slate-600 dark:text-[#a3a3a3] leading-relaxed break-words whitespace-normal">
                {assignedServices.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Notice Alert (e.g. for Kiosk session security or TV display notes) */}
        {option.notice && (
          <div className={S.noticeBox}>
            <i className={`bx bx-info-circle ${S.noticeIcon}`} />
            <span>{option.notice}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={navigating}
          className={S.button}
        >
          {navigating ? (
            <>
              <i className="bx bx-loader-alt animate-spin text-base" />
              <span>{SELECT_SCREEN_TEXTS.loading.launching}</span>
            </>
          ) : (
            <>
              <span>{buttonLabel}</span>
              <i className="bx bx-right-arrow-alt text-base" />
            </>
          )}
        </button>

        {/* Secondary Change Desk / Services Trigger */}
        {(isRegistration || isNurse) && onOpenStationModal && (
          <button
            type="button"
            onClick={() => onOpenStationModal(isRegistration ? 'registration' : 'nurse')}
            className="w-full py-1.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] transition cursor-pointer"
          >
            {hasConfiguredStation ? 'Change Desk or Services' : 'Configure Station'}
          </button>
        )}
      </div>
    </div>
  );
}
