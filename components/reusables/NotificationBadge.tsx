'use client';

import React from 'react';

/**
 * Visual variant of the NotificationBadge.
 */
export type NotificationBadgeVariant = 'count' | 'dot';

/**
 * Color themes supported by NotificationBadge.
 */
export type NotificationBadgeColor = 'brand' | 'amber' | 'blue' | 'gray' | 'emerald';

/**
 * Props for `NotificationBadge`.
 */
export interface NotificationBadgeProps {
  /** Numeric count to display when variant is 'count'. */
  count?: number;
  /** Display variant: 'count' (shows formatted number) or 'dot' (small indicator). */
  variant?: NotificationBadgeVariant;
  /** Whether to show a continuous animated pulsing ring. Defaults to false. */
  pulse?: boolean;
  /** Maximum number to display before showing e.g. "99+". Defaults to 99. */
  max?: number;
  /** Color theme token. Defaults to 'brand'. */
  color?: NotificationBadgeColor;
  /** Optional custom class name. */
  className?: string;
}

/**
 * High-contrast character-only text colors for numeric count badges.
 * Strictly adheres to AGENTS.md: zero background boxes, only the character is colored.
 */
const countTextColors: Record<NotificationBadgeColor, string> = {
  brand: 'text-[#cc3535] dark:text-[#f87171]',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  gray: 'text-slate-500 dark:text-[#a3a3a3]',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

/**
 * Functional status dot colors for collapsed sidebar rails.
 */
const dotStyles: Record<NotificationBadgeColor, { bg: string; ring: string }> = {
  brand: {
    bg: 'bg-[#cc3535]',
    ring: 'ring-white dark:ring-[#141414]',
  },
  amber: {
    bg: 'bg-amber-500',
    ring: 'ring-white dark:ring-[#141414]',
  },
  blue: {
    bg: 'bg-blue-600',
    ring: 'ring-white dark:ring-[#141414]',
  },
  gray: {
    bg: 'bg-gray-400 dark:bg-[#525252]',
    ring: 'ring-white dark:ring-[#141414]',
  },
  emerald: {
    bg: 'bg-emerald-600',
    ring: 'ring-white dark:ring-[#141414]',
  },
};

/**
 * Global reusable notification badge rendering either a bare colored count character
 * or a compact status dot indicator.
 *
 * @param props - Configuration props for the badge.
 * @returns The rendered badge element or null if count is 0 and variant is count.
 */
export function NotificationBadge({
  count = 0,
  variant = 'count',
  pulse = false,
  max = 99,
  color = 'brand',
  className = '',
}: NotificationBadgeProps) {
  if (variant === 'count' && count <= 0) {
    return null;
  }

  if (variant === 'dot') {
    const { bg, ring } = dotStyles[color];
    const pulseClass = pulse ? 'phc-badge-pulse' : '';
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${bg} ${ring} ring-2 ${pulseClass} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  const displayCount = count > max ? `${max}+` : `${count}`;
  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <span
      className={`inline-flex items-center justify-center font-mono text-xs font-extrabold leading-none ${countTextColors[color]} ${pulseClass} ${className}`.trim()}
    >
      {displayCount}
    </span>
  );
}

export default NotificationBadge;
