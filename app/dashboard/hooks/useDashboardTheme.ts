'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { CHART_PALETTES, type ChartPalette } from '@/app/dashboard/constants/charts';

interface DashboardTheme {
  /** True once mounted AND the resolved theme is dark. False during SSR/first paint. */
  isDark: boolean;
  /** Literal chart colors for the active theme. */
  chartColors: ChartPalette;
}

/**
 * Exposes the active theme to code that cannot use Tailwind classes (Recharts).
 *
 * `resolvedTheme` is undefined on the server and on the first client render,
 * so we wait for mount before switching to dark; this avoids a hydration mismatch.
 */
export function useDashboardTheme(): DashboardTheme {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  return { isDark, chartColors: isDark ? CHART_PALETTES.dark : CHART_PALETTES.light };
}