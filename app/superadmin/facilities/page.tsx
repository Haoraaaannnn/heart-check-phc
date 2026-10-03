/**
 * @fileoverview Facilities and Stations page for the SuperAdmin portal.
 *
 * Provides tabbed administrative management for hospital consultation rooms,
 * cubicles, and physical front-desk registration counters.
 *
 * @module app/superadmin/facilities/page
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RoomsPanel } from '../components/RoomsPanel';
import { CountersPanel } from '../components/CountersPanel';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { FACILITIES_TEXTS } from './constants/facilitiesTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

/**
 * Inner facilities content component synchronized with URL search parameters.
 */
function FacilitiesContent() {
  const checking = useRequireAuth();
  useIdleTimeout();

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [tab, setTab] = useState<'rooms' | 'counters'>('rooms');

  useEffect(() => {
    if (urlTab === 'counters') {
      setTab('counters');
    } else {
      setTab('rooms');
    }
  }, [urlTab]);

  const handleTabChange = (newTab: 'rooms' | 'counters') => {
    setTab(newTab);
    router.push(`/superadmin/facilities?tab=${newTab}`);
  };

  const S = SUPERADMIN_STYLES;
  const T = FACILITIES_TEXTS.header;

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans">
        <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={S.layout.container}>
      <div className={S.layout.mainWrapper}>
        {/* Header */}
        <div className={S.layout.headerRow}>
          <div className={S.layout.titleSection}>
            <h1 className={S.layout.heading}>{T.pageTitle}</h1>
            <p className={S.layout.subheading}>{T.pageDescription}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={S.tabs.container} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'rooms'}
            onClick={() => handleTabChange('rooms')}
            className={`${S.tabs.tab} ${
              tab === 'rooms' ? S.tabs.tabActive : S.tabs.tabIdle
            }`}
          >
            <i className="bx bx-door-open text-base" aria-hidden="true" />
            <span>{T.tabRooms}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'counters'}
            onClick={() => handleTabChange('counters')}
            className={`${S.tabs.tab} ${
              tab === 'counters' ? S.tabs.tabActive : S.tabs.tabIdle
            }`}
          >
            <i className="bx bx-id-card text-base" aria-hidden="true" />
            <span>{T.tabCounters}</span>
          </button>
        </div>

        {/* Tab Panels */}
        {tab === 'rooms' ? <RoomsPanel /> : <CountersPanel />}
      </div>
    </div>
  );
}

/**
 * Superadmin facilities administration view wrapped in a Suspense boundary.
 *
 * @returns JSX element containing the facilities page.
 */
export default function FacilitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center font-sans">
          <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        </div>
      }
    >
      <FacilitiesContent />
    </Suspense>
  );
}