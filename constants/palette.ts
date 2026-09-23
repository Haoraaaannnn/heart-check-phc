/**
 * Chart/accent colors per PHC service.
 * Hex literals on purpose: Recharts and conic-gradients need real color
 * strings, not Tailwind classes.
 */

/** Keys match `patients.service` / CATEGORIES exactly. */
export const SERVICE_COLORS: Record<string, string> = {
  Consultation: '#be123c',
  'OPD Screening': '#f9a8b4',
  'OPD Card': '#f59e0b',
  'Refill Prescription': '#14b8a6',
  ECG: '#8b5cf6',
  Warfarin: '#3b82f6',
  'OPD Reschedule': '#ec4899',
  Benzathine: '#64748b',
};

/** Used for services not listed above (e.g. the 'General' fallback). */
export const FALLBACK_SERVICE_COLORS = ['#f97316', '#0ea5e9', '#84cc16', '#a855f7'] as const;

/**
 * Returns the color for a service.
 *
 * @param service - Service name as stored in `patients.service`.
 * @param fallbackIndex - Position used to pick a fallback color for unknown services.
 */
export function getServiceColor(service: string, fallbackIndex = 0): string {
  return (
    SERVICE_COLORS[service] ??
    FALLBACK_SERVICE_COLORS[fallbackIndex % FALLBACK_SERVICE_COLORS.length]
  );
}