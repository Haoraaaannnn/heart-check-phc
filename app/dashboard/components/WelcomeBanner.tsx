import { BANNER, DASHBOARD_USER } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getManilaHour } from '@/utils/formatDateTime';

const S = DASH.banner;

interface WelcomeBannerProps {
  /** Current time (updated by the page). Null before the first client render. */
  currentTime: Date | null;
  /** False during SSR/first paint, when the time-based greeting isn't known yet. */
  isMounted: boolean;
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
export default function WelcomeBanner({ currentTime, isMounted }: WelcomeBannerProps) {
  const greeting =
    isMounted && currentTime ? getGreeting(currentTime) : BANNER.fallbackGreeting;

  return (
    <section className={S.root}>
      <div className={S.decor} />
      <div className={S.content}>
        <p className={S.eyebrow}>{BANNER.eyebrow}</p>
        <h1 className={S.title}>
          {greeting}, {DASHBOARD_USER.name}
        </h1>
        <p className={S.subtitle}>{BANNER.subtitle}</p>
      </div>
    </section>
  );
}