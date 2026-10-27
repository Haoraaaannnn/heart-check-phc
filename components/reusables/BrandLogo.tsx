/**
 * @fileoverview Reusable institutional BrandLogo component.
 *
 * Renders the official Philippine Heart Center (PHC) vector emblem and brand identity.
 * Automatically switches between colored assets for institutional light mode and crisp
 * white vector assets for dark mode environments using zero-flash CSS media/class selectors.
 *
 * Supports two distinct display variants:
 * - 'full': Complete brand logo combining the Heart Check emblem and PHC acronym.
 * - 'icon': Standalone Heart Check emblem for compact rails, badges, and icon buttons.
 *
 * @remarks
 * Strictly adheres to AGENTS.md:
 * - Zero emojis in all documentation and code comments.
 * - Solid surfaces and enterprise standard vector rendering.
 *
 * @module components/reusables/BrandLogo
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Configuration props for the BrandLogo component.
 */
export interface BrandLogoProps {
  /**
   * Display mode for the brand mark:
   * - 'full': Heart Check emblem + 'PHC' acronym mark.
   * - 'icon': Standalone Heart Check emblem only.
   * @default 'full'
   */
  variant?: 'full' | 'icon';
  /**
   * Optional custom styling classes for sizing, alignment, or spacing.
   * When omitted, defaults to balanced sizing ('h-12 w-auto').
   */
  className?: string;
  /**
   * Accessible alternative description for screen readers and search engines.
   * @default 'Philippine Heart Center - Heart Check PHC'
   */
  alt?: string;
  /**
   * Optional image loading strategy.
   * @default 'eager'
   */
  loading?: 'eager' | 'lazy';
}

/**
 * Official Philippine Heart Center institutional brand mark.
 *
 * Renders exactly one image element at a time, displaying the high-contrast white asset
 * in dark mode and the official colored asset in light mode.
 *
 * @param props - Variant, format, and layout customization properties.
 * @returns JSX element rendering the single active brand mark.
 */
export function BrandLogo({
  variant = 'full',
  className,
  alt = 'Philippine Heart Center - Heart Check PHC',
  loading = 'eager',
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const coloredSrc =
    variant === 'full' ? '/icons/logo-full-colored.png' : '/icons/logo-icon-colored.png';
  const whiteSrc =
    variant === 'full' ? '/icons/logo-full-white.png' : '/icons/logo-icon-white.png';

  const src = isDark ? whiteSrc : coloredSrc;

  const defaultClasses = 'h-12 w-auto';
  const imageClass = className ?? defaultClasses;

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain aspect-auto shrink-0 select-none ${imageClass}`}
      loading={loading}
      suppressHydrationWarning
    />
  );
}
