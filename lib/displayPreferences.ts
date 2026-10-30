/** @fileoverview Bounded browser display preferences and staff-only route scoping. */
export const DISPLAY_STORAGE_KEY = 'hc-staff-display-v1';
export const FONT_PERCENT_OPTIONS = [90, 100, 110, 125, 150] as const;
export const ZOOM_PERCENT_OPTIONS = [80, 90, 100, 110, 125] as const;

/** Independent text and whole-page magnification percentages. */
export interface DisplayPreferences { fontPercent: number; zoomPercent: number }
export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = { fontPercent: 100, zoomPercent: 100 };

/** @returns Whether display preferences are allowed on this page; public display routes never inherit them. */
export function allowsDisplayPreferences(pathname: string): boolean {
  return !/^\/(kiosk|monitor)(\/|$)/.test(pathname);
}

/** @returns Validated preferences or safe defaults for malformed, outdated or out-of-range storage. */
export function parseDisplayPreferences(value: unknown): DisplayPreferences {
  if (typeof value !== 'object' || value === null || !('fontPercent' in value) || !('zoomPercent' in value)) return { ...DEFAULT_DISPLAY_PREFERENCES };
  const fontPercent = value.fontPercent;
  const zoomPercent = value.zoomPercent;
  return {
    fontPercent: typeof fontPercent === 'number' && FONT_PERCENT_OPTIONS.some(option => option === fontPercent) ? fontPercent : 100,
    zoomPercent: typeof zoomPercent === 'number' && ZOOM_PERCENT_OPTIONS.some(option => option === zoomPercent) ? zoomPercent : 100,
  };
}

/** @returns Parsed browser storage without accepting injected CSS or arbitrary magnification. */
export function readDisplayPreferences(value: string | null): DisplayPreferences {
  if (!value) return { ...DEFAULT_DISPLAY_PREFERENCES };
  try { const parsed: unknown = JSON.parse(value); return parseDisplayPreferences(parsed); }
  catch { return { ...DEFAULT_DISPLAY_PREFERENCES }; }
}

/** @returns The current validated CSS scale for converting viewport pointers into zoomed fixed-position coordinates. */
export function staffPageScale(): number {
  if (typeof document === 'undefined') return 1;
  const value = Number(document.documentElement.dataset.staffPageScale);
  return Number.isFinite(value) && value >= 0.8 && value <= 1.25 ? value : 1;
}
