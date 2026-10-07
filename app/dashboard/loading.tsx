/**
 * @fileoverview Next.js route-level loading boundary for the Admin Dashboard.
 *
 * Automatically rendered by Next.js App Router during route transitions and server streaming,
 * providing immediate skeletal feedback matching the Admin Dashboard layout.
 *
 * @remarks
 * Conforms strictly to AGENTS.md standards: zero emojis, separation of concerns.
 *
 * @module app/dashboard/loading
 */

import React from 'react';
import { DashboardOverviewSkeleton } from './components/DashboardOverviewSkeleton';

/**
 * Route-level loading component for Admin Dashboard.
 *
 * @returns Rendered JSX element containing the skeleton screen.
 */
export default function DashboardLoading(): React.ReactElement {
  return <DashboardOverviewSkeleton />;
}
