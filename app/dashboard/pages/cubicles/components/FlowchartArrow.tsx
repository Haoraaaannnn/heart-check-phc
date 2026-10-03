/**
 * @fileoverview Directional pipeline flow connector component linking adjacent stages.
 *
 * Visualizes stage progression transitions with animated indicators and action descriptors.
 *
 * @module app/dashboard/pages/cubicles/components/FlowchartArrow
 */

'use client';

import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';

interface FlowchartArrowProps {
  /** Text label describing the clinical transition (e.g. "Call Next", "Exam Done"). */
  label: string;
}

/**
 * Directional connector arrow linking workflow stages.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function FlowchartArrow({ label }: FlowchartArrowProps) {
  const S = CUBICLES_STYLES.flowchart;

  return (
    <div className={S.connector} aria-hidden="true">
      <div className={S.connectorCircle}>
        <i className="bx bx-right-arrow-alt text-brand-accent animate-pulse" />
      </div>
      <span className={S.connectorText}>{label}</span>
    </div>
  );
}
