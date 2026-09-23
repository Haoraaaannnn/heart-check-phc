import { DASH } from '@/app/dashboard/constants/styles';
import { DONUT } from '@/app/dashboard/constants/charts';

const S = DASH.breakdown;

/** One slice of the donut. */
export interface DonutSegment {
  /** Stable key (e.g. status group or service name). */
  key: string;
  /** Slice size; only the proportion to the other slices matters. Zero/negative slices are skipped. */
  value: number;
  /** Any CSS color (hex from the palette constants). */
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  /** Big number/text in the middle. */
  centerValue: string | number;
  /** Small caption under the center value. */
  centerLabel: string;
  /** Outer diameter in px. Defaults to DONUT.size. */
  size?: number;
  /** Ring thickness in px. Defaults to DONUT.thickness. */
  thickness?: number;
  /** Accessible description of the chart. */
  ariaLabel?: string;
}

/**
 * Lightweight donut chart built from a CSS conic-gradient (no chart library).
 *
 * The ring is cut out with a CSS mask, so the center stays transparent and the
 * glass card surface shows through in both light and dark mode. With no
 * positive values, an empty track-colored ring is drawn.
 */
export default function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = DONUT.size,
  thickness = DONUT.thickness,
  ariaLabel,
}: DonutChartProps) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);

  // Build "color start% end%" stops for the conic gradient.
  let cursor = 0;
  const stops = visible.map((segment) => {
    const start = (cursor / total) * 100;
    cursor += segment.value;
    const end = (cursor / total) * 100;
    return `${segment.color} ${start}% ${end}%`;
  });

  const ringBackground = total > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--track)';
  const ringMask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness - 1}px))`;

  return (
    <div
      className={S.donutWrap}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className={S.donutRing}
        style={{ background: ringBackground, WebkitMaskImage: ringMask, maskImage: ringMask }}
      />
      <div className={S.donutCenter}>
        <span className={S.donutValue}>{centerValue}</span>
        <span className={S.donutLabel}>{centerLabel}</span>
      </div>
    </div>
  );
}