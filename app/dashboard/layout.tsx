/**
 * @fileoverview Enterprise Layout wrapper for the Admin Dashboard portal.
 *
 * Implements an industry-standard layout featuring a fixed desktop sidebar rail,
 * responsive slide-over mobile drawer, sticky top header bar with live Manila clock,
 * dynamic breadcrumbs, single-click theme toggle, bottleneck alerts, user chip,
 * and role-guarded session validation.
 *
 * @module app/dashboard/layout
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardBG from '@/components/backgrounds/DashboardBg';
import { DashSideNavigation } from './components/navigation/DashSideNavigation';
import { DashboardHeader } from './components/navigation/DashboardHeader';
import { HistoricalSummaryProvider } from '@/app/dashboard/context/HistoricalSummaryContext';
import { DASH } from '@/app/dashboard/constants/styles';
import { DASHBOARD_NAV_TEXTS } from '@/app/dashboard/constants/dashNavTexts';

/**
 * Layout properties for DashboardLayout.
 */
export interface DashboardLayoutProps {
  /** Page content rendered within the enterprise shell. */
  children: React.ReactNode;
}

/**
 * Enterprise Admin Dashboard layout orchestrator.
 *
 * @param props - Layout properties containing page children.
 * @returns JSX element wrapping the administrative workspace.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const D = DASH.drawer;
  const T = DASHBOARD_NAV_TEXTS.system;

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0d] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-[#f5f5f5]">
              {T.verifyingSession}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
              {T.verifyingSubtext}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <HistoricalSummaryProvider>
      <DashboardBG>
        <div className="w-full flex min-h-screen">
          {/* 1. Desktop Fixed Left Rail */}
          <Suspense
            fallback={
              <div className="hidden lg:block w-64 bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#2e2e2e] h-screen" />
            }
          >
            <DashSideNavigation />
          </Suspense>

          {/* 2. Responsive Mobile Drawer */}
          {mobileDrawerOpen && (
            <div
              className={D.backdrop}
              onClick={() => setMobileDrawerOpen(false)}
            >
              <div
                className={D.panel}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="p-4 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {T.menuDrawerTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={D.closeButton}
                    aria-label={DASHBOARD_NAV_TEXTS.actions.closeDrawer}
                  >
                    <i className="bx bx-x text-2xl" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Suspense fallback={null}>
                    <DashSideNavigation
                      isMobileDrawer
                      onNavigate={() => setMobileDrawerOpen(false)}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          )}

          {/* 3. Main Stage Area */}
          <div className={DASH.layout.stage}>
            <Suspense
              fallback={
                <div className="h-16 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-[#2e2e2e]" />
              }
            >
              <DashboardHeader
                onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
              />
            </Suspense>

            <main className={DASH.layout.main}>
              <Suspense
                fallback={
                  <div className="p-8 text-center text-xs text-slate-400">
                    {T.loadingWorkspace}
                  </div>
                }
              >
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </DashboardBG>
    </HistoricalSummaryProvider>
  );
}