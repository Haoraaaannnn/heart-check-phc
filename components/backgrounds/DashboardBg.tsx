/**
 * @fileoverview Full-screen solid background container for the admin dashboard.
 *
 * Provides a clean, solid neutral background (slate-50 light / slate-950 dark)
 * that establishes contrast against crisp white and dark surface cards.
 *
 * @module components/backgrounds/DashboardBg
 */

import React from 'react';

/**
 * Props interface for DashboardBg.
 */
export interface DashboardBgProps {
  /** Page content rendered within the background container. */
  children: React.ReactNode;
}

/**
 * Shell background for the admin dashboard.
 *
 * @param props - Component properties containing children.
 * @returns Solid background container wrapping the dashboard layout.
 */
export default function DashboardBg({ children }: DashboardBgProps) {
  return (
    <div className="relative min-h-screen font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="relative z-10 flex min-h-screen w-full">
        {children}
      </div>
    </div>
  );
}