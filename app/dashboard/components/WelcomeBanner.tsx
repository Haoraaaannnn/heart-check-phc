'use client';

import { useEffect, useState } from 'react';
import { BANNER, DASHBOARD_USER } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getManilaHour } from '@/utils/formatDateTime';
import { supabase } from '@/lib/supabase';

const S = DASH.banner;

interface WelcomeBannerProps {
  /** Current time (updated by the page). Null before the first client render. */
  currentTime: Date | null;
  /** False during SSR/first paint, when the time-based greeting isn't known yet. */
  isMounted: boolean;
  /** Active staff username to display in greeting banner */
  userName?: string;
}

/**
 * Picks the greeting for the given moment using Manila time.
 * Cut-off hours are configured in BANNER (constants/content.ts).
 */
function getGreeting(date: Date): string {
  const hour = getManilaHour(date);
  if (hour < BANNER.morningUntil) return BANNER.greetings.morning;
  if (hour < BANNER.afternoonUntil) return BANNER.greetings.afternoon;
  return BANNER.greetings.evening;
}

/**
 * Welcome banner at the top of the main column.
 * Pure gradient design (no image), using the theme-aware `bg-banner-gradient`.
 */
export default function WelcomeBanner({ currentTime, isMounted, userName }: WelcomeBannerProps) {
  const [resolvedUsername, setResolvedUsername] = useState<string>(userName || '');

  useEffect(() => {
    if (userName) {
      setResolvedUsername(userName);
      return;
    }

    let isSubscribed = true;
    const loadUsername = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isSubscribed) return;

        let name = '';
        if (user.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('auth_id', user.id)
            .maybeSingle();
          if (userData?.username) name = userData.username;
        }

        if (!name && user.email) {
          const { data: userDataByEmail } = await supabase
            .from('users')
            .select('username')
            .ilike('email', user.email)
            .maybeSingle();
          if (userDataByEmail?.username) name = userDataByEmail.username;
        }

        if (!name) {
          name =
            (user.user_metadata?.username as string) ||
            (user.user_metadata?.name as string) ||
            (user.user_metadata?.full_name as string) ||
            (user.email ? user.email.split('@')[0] : '');
        }

        if (name && isSubscribed) {
          setResolvedUsername(name);
        }
      } catch {
        // Fallback silently to configured default
      }
    };

    loadUsername();
    return () => {
      isSubscribed = false;
    };
  }, [userName]);

  const greeting =
    isMounted && currentTime ? getGreeting(currentTime) : BANNER.fallbackGreeting;
  const displayName = resolvedUsername || userName || DASHBOARD_USER.name;

  return (
    <section className={S.root}>
      <div className={S.decor} />
      <div className={S.content}>
        <p className={S.eyebrow}>{BANNER.eyebrow}</p>
        <h1 className={S.title}>
          {greeting}, {displayName}
        </h1>
        <p className={S.subtitle}>{BANNER.subtitle}</p>
      </div>
      <div className={S.badgesWrap}>
        <div className={S.privacyBadge} title="Republic Act 10173 Data Privacy Compliance">
          <i className="bx bx-shield-quarter text-emerald-600 dark:text-emerald-400 text-sm" />
          <span className="font-semibold text-content">{BANNER.privacyBadge}</span>
          <span className="text-content-subtle font-mono text-[11px]">• {BANNER.privacyBadgeDesc}</span>
        </div>
      </div>
    </section>
  );
}