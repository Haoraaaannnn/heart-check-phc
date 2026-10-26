/** @fileoverview Compact inactivity countdown that does not rerender the surrounding workstation. */
'use client';
import { useStaffSession } from './StaffSessionProvider';
import { SETTINGS_TEXTS } from '@/app/superadmin/constants/settingsTexts';
import { SETTINGS_STYLES } from '@/app/superadmin/constants/settingsStyles';

/** @returns Remaining shared-session inactivity time, with screen-reader announcements disabled. */
export function SessionCountdown() {
  const { remainingSeconds } = useStaffSession();
  const T = SETTINGS_TEXTS.sessionTimeout;
  const seconds = Math.max(0, remainingSeconds ?? 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const formatted = [hours ? String(hours).padStart(2, '0') : null, String(minutes).padStart(2, '0'), String(seconds % 60).padStart(2, '0')].filter(value => value !== null).join(':');
  return (
    <span className={SETTINGS_STYLES.sessionCountdown} title={T.countdownHint} role="timer" aria-live="off">
      <span>{T.countdownLabel}</span>
      <span className={SETTINGS_STYLES.sessionCountdownTime}>{remainingSeconds === null ? T.loading : formatted}</span>
    </span>
  );
}
