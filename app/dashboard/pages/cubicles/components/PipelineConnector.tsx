/**
 * @fileoverview Visual route connector component linking adjacent processing stage nodes.
 *
 * Implements real-time queue item visualization where each patient transitioning on the route
 * is rendered as an animated circular dot traveling along the path with individual process state,
 * elapsed transit timer, bottleneck detection, and click-to-inspect support.
 *
 * @module app/dashboard/pages/cubicles/components/PipelineConnector
 */

'use client';

import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { FlowchartPatientItem } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface PipelineConnectorProps {
  /** Route description (e.g. "Call Next", "Enter Room"). */
  label: string;
  /** Optional route index or sequential code (e.g. "Route 1"). */
  routeCode?: string;
  /** Real-time queued patient items actively traversing this route path. */
  items?: FlowchartPatientItem[];
  /** Target transit benchmark in minutes (e.g. 5m for room transit). */
  targetMinutes?: number;
  /** Callback when an animated queue item dot is clicked for deep inspection. */
  onSelectPatient?: (patient: FlowchartPatientItem) => void;
}

/**
 * Animated connecting route between rectangular stage nodes on the queue process map.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function PipelineConnector({
  label,
  routeCode,
  items = [],
  targetMinutes = 5,
  onSelectPatient,
}: PipelineConnectorProps) {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart.transitions;
  const hasItems = items.length > 0;

  return (
    <div className={S.routeWrap}>
      {/* Route Highway Track with Animated Queue Dots */}
      <div className={S.routeTrack}>
        <svg
          className="w-full h-6 overflow-visible"
          viewBox="0 0 140 24"
          preserveAspectRatio="none"
        >
          {/* Base Static Channel */}
          <line
            x1="0"
            y1="12"
            x2="132"
            y2="12"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-slate-200 dark:text-[#2e2e2e]"
          />

          {/* Flowing Traffic Line when actual items are active on route */}
          {hasItems && (
            <line
              x1="0"
              y1="12"
              x2="132"
              y2="12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              className="text-rose-500/80 dark:text-rose-400"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="22"
                to="0"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </line>
          )}

          {/* Directional Terminal Arrowhead pointing to input port */}
          <polygon
            points="138,12 131,8 131,16"
            fill="currentColor"
            className={
              hasItems
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-slate-300 dark:text-[#404040]'
            }
          />
        </svg>

        {/* Real-time Queued Item Dots (Each actual item gets its own animated dot) */}
        {hasItems &&
          items.map((item, index) => {
            const elapsed = item.elapsedMinutes || 0;
            const isStalled = item.isStalled || elapsed > targetMinutes;
            const staggerDelay = (index * 0.9) % 3.2;

            return (
              <div
                key={item.id}
                className={S.routeDotItemWrap}
                style={{
                  animationDelay: `${staggerDelay}s`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPatient?.(item);
                }}
                title={`${T.clickToInspectDot}: ${item.patientNum} (${elapsed}m in transit)`}
              >
                {/* Small Circular Dot with Process State */}
                <div
                  className={`${S.routeItemDot} ${
                    isStalled ? S.routeItemDotStalled : S.routeItemDotNormal
                  }`}
                >
                  <span className="scale-[0.8]">{index + 1}</span>
                </div>

                {/* Process State Hover Tooltip */}
                <div className={S.routeTooltip}>
                  <span className="font-bold">{item.patientNum}</span>
                  <span className="opacity-75">({elapsed}m)</span>
                  {isStalled && (
                    <span className="text-amber-300 font-bold">!</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Route Identity Label Capsule */}
      <div className={S.routeLabelCapsule} title={`Route: ${label}`}>
        <span className={hasItems ? S.routeDotActive : S.routeDotIdle} />
        {routeCode && (
          <span className="font-mono text-[8px] text-content-subtle">
            {routeCode}
          </span>
        )}
        <span className="truncate max-w-[70px]">{label}</span>
        {hasItems ? (
          <span className={S.routeItemBadge}>
            {items.length}
          </span>
        ) : (
          <span className="font-mono text-[7px] text-content-subtle opacity-70">
            0
          </span>
        )}
      </div>
    </div>
  );
}
