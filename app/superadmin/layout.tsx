/**
 * @fileoverview Enterprise Layout wrapper for the SuperAdmin portal.
 *
 * Implements an industry-standard layout featuring a fixed desktop sidebar rail,
 * responsive slide-over mobile drawer, top header bar with live Manila clock,
 * breadcrumbs, theme toggle, solid background surface, and role-guarded session validation.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens, sizeTokens,
 * and DashboardBG wrapper, aligning visual presentation with the Admin Dashboard workspace.
 *
 * @module app/superadmin/layout
 */

'use client';

import React, { useState, Suspense } from 'react';
import { useStaffAuthorization } from '@/hooks/useStaffAuthorization';
import { WorkstationLoading } from '@/components/auth/WorkstationLoading';
import DashboardBG from '@/components/backgrounds/DashboardBg';
import { SuperAdminSidebar } from '@/app/superadmin/components/navigation/SuperAdminSidebar';
import { SuperAdminHeader } from '@/app/superadmin/components/navigation/SuperAdminHeader';
import { SUPERADMIN_NAV_STYLES } from '@/app/superadmin/constants/superadminNavStyles';

interface SuperAdminLayoutProps {
  /** Page content rendered within the enterprise shell. */
  children?: React.ReactNode;
}

/**
 * Superadmin enterprise layout component.
 *
 * @param props - Layout properties containing children.
 * @returns JSX element wrapping the superadmin dashboard.
 */
export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const isLoading = useStaffAuthorization(['superadmin']);
  const isAuthorized = !isLoading;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const D = SUPERADMIN_NAV_STYLES.drawer;
  const L = SUPERADMIN_NAV_STYLES.layout;


  if (isLoading) {
    return <WorkstationLoading title="Verifying SuperAdmin credentials..." />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <DashboardBG>
      <div className="w-full flex min-h-screen">
        {/* 1. Desktop Fixed Sidebar */}
        <Suspense
          fallback={
            <div className="hidden lg:block w-64 bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#2e2e2e] h-screen" />
          }
        >
          <SuperAdminSidebar />
        </Suspense>

        {/* 2. Responsive Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className={D.backdrop} onClick={() => setMobileDrawerOpen(false)}>
            <div
              className={D.panel}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="p-4 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Navigation Menu
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={D.closeButton}
                  aria-label="Close navigation drawer"
                >
                  <i className="bx bx-x text-2xl" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Suspense fallback={null}>
                  <SuperAdminSidebar
                    isMobileDrawer
                    onNavigate={() => setMobileDrawerOpen(false)}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Stage Area */}
        <div className={L.stage}>
          <Suspense
            fallback={
              <div className="h-16 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-[#2e2e2e]" />
            }
          >
            <SuperAdminHeader
              onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
            />
          </Suspense>

          <main className={L.main}>
            <Suspense
              fallback={
                <div className="p-8 text-center text-xs text-slate-400 dark:text-[#737373]">
                  Loading workspace
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </DashboardBG>
  );
}
