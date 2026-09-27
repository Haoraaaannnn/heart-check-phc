'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Props for the global `BackButton` component.
 */
export interface BackButtonProps {
  /** Optional custom click handler executed before or instead of navigation. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  /** Optional explicit destination URL to navigate to if provided. */
  href?: string;
  /** Optional text label displayed alongside the back icon. */
  label?: string;
  /** Optional additional CSS class names. */
  className?: string;
  /** Accessible label for screen readers. Defaults to "Go back". */
  ariaLabel?: string;
}

/**
 * Global reusable navigation button with priority order: `onClick` -> `href` -> `router.back()`.
 *
 * @remarks
 * Features a minimum 44px touch target compliant with mobile/tablet touch guidelines,
 * smooth hover states, and seamless keyboard accessibility.
 *
 * @param props - Configuration options for the BackButton.
 * @returns The rendered accessible back button or link.
 */
export function BackButton({
  onClick,
  href,
  label,
  className = '',
  ariaLabel = 'Go back',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
      return;
    }

    if (href) {
      return;
    }

    e.preventDefault();
    router.back();
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl
    text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100
    border border-gray-200 hover:border-gray-300
    shadow-xs hover:shadow-sm
    font-medium text-sm transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-[#cc3535]/30
    cursor-pointer select-none
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (href && !onClick) {
    return (
      <Link href={href} className={baseClasses} aria-label={ariaLabel}>
        <i className="bx bx-arrow-back text-lg text-gray-700" aria-hidden="true" />
        {label && <span>{label}</span>}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={baseClasses}
      aria-label={ariaLabel}
    >
      <i className="bx bx-arrow-back text-lg text-gray-700" aria-hidden="true" />
      {label && <span>{label}</span>}
    </button>
  );
}

export default BackButton;
