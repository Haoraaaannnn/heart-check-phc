"use client";

import { AnalyticsRange } from "@/app/dashboard/analytics/hooks/useAnalyticsData";

interface Props {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
  isLoading?: boolean;
}

const PRESETS: { label: string; value: AnalyticsRange }[] = [
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 6 Months", value: "180d" },
  { label: "Last Year", value: "365d" },
  { label: "All Time", value: "all" },
];

export default function DateRangeSelector({ value, onChange, isLoading }: Props) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {PRESETS.map((preset) => {
        const isActive = value === preset.value;
        const isActiveLoading = isLoading && isActive;

        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            disabled={isLoading}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
              isActive
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isActiveLoading && (
              <svg
                className="animate-spin h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}