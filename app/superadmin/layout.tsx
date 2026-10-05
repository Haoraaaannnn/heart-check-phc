/**
 * @fileoverview Enterprise Layout wrapper for the SuperAdmin portal.
 *
 * Implements an industry-standard layout featuring a fixed desktop sidebar rail,
 * responsive slide-over mobile drawer, top header bar with live Manila clock,
 * breadcrumbs, theme toggle, and role-guarded session validation.
 *
 * @module app/superadmin/layout
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SuperAdminSidebar } from './components/navigation/SuperAdminSidebar';
import { SuperAdminHeader } from './components/navigation/SuperAdminHeader';
import { SUPERADMIN_NAV_STYLES } from './constants/superadminNavStyles';

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const D = SUPERADMIN_NAV_STYLES.drawer;

  useEffect(() => {
    let active = true;

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        window.location.replace('/login');
        return;
      }

      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!active) return;

      const userRole = (userData?.role || '').toLowerCase().trim();

      if (roleError || !userData || userRole !== 'superadmin') {
        window.location.replace('/unauthorized');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    void checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.replace('/login');
      }
    });

    return () => {
      active = false;
      window.removeEventListener('pageshow', handlePageShow);
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0d] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-[#f5f5f5]">
              Verifying SuperAdmin Credentials
            </p>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
              Philippine Heart Center Queue System
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0d] text-slate-900 dark:text-[#f5f5f5] font-sans flex transition-colors duration-200">
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
      <div className="flex-1 flex flex-col min-w-0">
        <Suspense
          fallback={
            <div className="h-16 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-[#2e2e2e]" />
          }
        >
          <SuperAdminHeader
            onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          />
        </Suspense>

        <main className="flex-1 overflow-y-auto">
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
  );
}