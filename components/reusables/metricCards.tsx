/**
 * @fileoverview Reusable metric card wrapper component.
 *
 * @module components/reusables/metricCards
 */

import { darkTheme, lightTheme } from "@/constants/themes";

/**
 * Metric card container component.
 *
 * @param props - Children nodes.
 * @returns JSX element.
 */
export default function MetricCards({ children }: { children?: React.ReactNode }) {
  return (
    <div className={`${lightTheme} p-6 w-full h-36 flex flex-col justify-between ${darkTheme}`}>
      {children}
    </div>
  );
}