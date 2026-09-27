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
 * Color mapping for NotificationBadge background and text tokens.
 */
const colorStyles: Record<NotificationBadgeColor, { bg: string; text: string; ring: string }> = {
  brand: {
    bg: 'bg-[#cc3535]',
    text: 'text-white',
    ring: 'ring-white',
  },
  amber: {
    bg: 'bg-amber-500',
    text: 'text-white',
    ring: 'ring-white',
  },
  blue: {
    bg: 'bg-blue-600',
    text: 'text-white',
    ring: 'ring-white',
  },
  gray: {
    bg: 'bg-gray-400',
    text: 'text-white',
    ring: 'ring-white',
  },
  emerald: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    ring: 'ring-white',
  },
};

/**
 * Global reusable notification badge rendering either a count badge or a pulsing dot indicator.
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

  const { bg, text, ring } = colorStyles[color];
  const pulseClass = pulse ? 'phc-badge-pulse' : '';

  if (variant === 'dot') {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${bg} ${ring} ring-2 ${pulseClass} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  const displayCount = count > max ? `${max}+` : `${count}`;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none ${bg} ${text} ${ring} ring-1 shadow-xs ${pulseClass} ${className}`.trim()}
    >
      {displayCount}
    </span>
  );
}

export default NotificationBadge;
