/**
 * @fileoverview Next.js route-level loading boundary for the SuperAdmin portal.
 *
 * Automatically rendered by Next.js App Router during route transitions and server streaming,
 * providing immediate skeletal feedback matching the SuperAdmin layout.
 *
 * @remarks
 * Conforms strictly to AGENTS.md standards: zero emojis, separation of concerns.
 *
 * @module app/superadmin/loading
 */

import React from 'react';
import { SuperAdminPageSkeleton } from './components/SuperAdminPageSkeleton';

/**
 * Route-level loading component for SuperAdmin.
 *
 * @returns Rendered JSX element containing the skeleton screen.
 */
export default function SuperAdminLoading(): React.ReactElement {
  return <SuperAdminPageSkeleton />;
}
