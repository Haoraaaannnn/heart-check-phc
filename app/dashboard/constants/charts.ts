/**
 * Chart configuration for the dashboard.
 * Recharts cannot read CSS variables or Tailwind classes, so colors are
 * literal strings in one palette per theme (see useDashboardTheme).
 */

/** Literal colors Recharts needs, per theme. */
export interface ChartPalette {
  grid: string;
  axis: string;
  bar: string;
  cursor: string;
  tooltipBg: string;
  tooltipText: string;
}

export const CHART_PALETTES: Record<'light' | 'dark', ChartPalette> = {
  light: {
    grid: '#f3e4e6',
    axis: '#9ca3af',
    bar: '#cc3535',
    cursor: '#fdf2f2',
    tooltipBg: '#ffffff',
    tooltipText: '#111827',
  },
  dark: {
    grid: '#374151',
    axis: '#9ca3af',
    bar: '#f87171',
    cursor: 'rgba(255,255,255,0.06)',
    tooltipBg: '#1f2937',
    tooltipText: '#e5e7eb',
  },
};

/** Hourly arrivals bar chart sizing. */
export const HOURLY_CHART = {
  height: 240,
  margin: { top: 10, right: 10, left: -20, bottom: 0 },
  maxBarSize: 28,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  /** Minimum Y-axis maximum, so an empty day doesn't collapse the axis. */
  minYMax: 4,
  tickFontSize: 12,
};

/** Base tooltip box style (colors are added from the active palette). */
export const TOOLTIP_BASE_STYLE = {
  borderRadius: '8px',
  border: 'none',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

/** Donut chart dimensions in px (used by service overview and ticket breakdown). */
export const DONUT = {
  size: 132,
  thickness: 22,
};