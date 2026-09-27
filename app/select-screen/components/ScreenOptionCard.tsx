/**
 * @fileoverview Card component rendering a single screen display mode or workstation option.
 *
 * Handles navigation to the target route, including secure session teardown when
 * configuring public patient-facing displays (e.g. Patient Kiosk).
 *
 * @module app/select-screen/components/ScreenOptionCard
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ScreenOption } from '../types/selectScreen';
import { SELECT_SCREEN_STYLES } from '../constants/selectScreen';

interface ScreenOptionCardProps {
  /** Screen display configuration details. */
  option: ScreenOption;
}

/**
 * Screen option card with interactive action triggers and safety sign out handling.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ScreenOptionCard({ option }: ScreenOptionCardProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const S = SELECT_SCREEN_STYLES.card;

  const handleSelect = async () => {
    if (navigating) return;
    setNavigating(true);

    try {
      if (option.requiresSignOut) {
        // Sign out authenticated staff before launching patient-facing kiosk to prevent session misuse
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Session clearance error during display setup:', err);
    } finally {
      router.push(option.route);
    }
  };

  return (
    <div className={S.root}>
      <div>
        <div className={S.topRow}>
          <div className={S.iconWrap}>
            <i className={`bx ${option.icon} text-2xl`} />
          </div>
          <span className={S.badge}>{option.badge}</span>
        </div>

        <h3 className={S.title}>{option.title}</h3>
        <p className={S.description}>{option.description}</p>

        {option.notice && (
          <div className={S.noticeBox}>
            <p>{option.notice}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSelect}
        disabled={navigating}
        className={S.button}
      >
        <span>{option.actionLabel}</span>
        <i className="bx bx-right-arrow-alt text-lg" />
      </button>
    </div>
  );
}
