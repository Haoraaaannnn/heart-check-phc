'use client';

import React, { forwardRef } from 'react';

/**
 * Orientation options for the `ScrollArea` component.
 */
export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

/**
 * Props for the `ScrollArea` component.
 */
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scroll orientation: vertical (default), horizontal, or both. */
  orientation?: ScrollAreaOrientation;
  /** When true, hides the scrollbar visual while preserving scroll functionality. */
  hideScrollbar?: boolean;
  /** Children elements to be contained inside the scrollable container. */
  children: React.ReactNode;
}

/**
 * Global reusable scrollable container applying uniform `.phc-scroll` styling.
 *
 * @remarks
 * Provides consistent, refined scrollbars across different browsers and platforms,
 * with customizable orientation and touch-friendly momentum scrolling.
 *
 * @param props - ScrollArea properties including orientation and scrollbar visibility.
 * @param ref - Optional forwarded HTMLDivElement ref.
 * @returns The rendered scrollable wrapper element.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { orientation = 'vertical', hideScrollbar = false, className = '', children, ...rest },
  ref
) {
  const orientationClass =
    orientation === 'vertical'
      ? 'overflow-y-auto overflow-x-hidden'
      : orientation === 'horizontal'
      ? 'overflow-x-auto overflow-y-hidden'
      : 'overflow-auto';

  const scrollbarClass = hideScrollbar
    ? 'scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
    : 'phc-scroll';

  return (
    <div
      ref={ref}
      className={`${orientationClass} ${scrollbarClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
});

export default ScrollArea;
