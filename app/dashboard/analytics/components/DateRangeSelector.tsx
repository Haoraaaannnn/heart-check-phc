"use client";

import { AnalyticsRange } from "@/app/dashboard/analytics/hooks/useAnalyticsData";

interface Props {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}

const PRESETS: { label: string; value: AnalyticsRange }[] = [
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 6 Months", value: "180d" },
  { label: "Last Year", value: "365d" },
  { label: "All Time", value: "all" },
];

export default function DateRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            value === preset.value
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}