/**
 * @fileoverview Accessible text strings and ARIA labels for the Admin Dashboard skeleton loaders.
 *
 * Defines screen reader announcements, placeholder titles, and section descriptors
 * conforming strictly to the zero-emoji rule and separation of concerns.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: zero emojis, professional healthcare tone.
 *
 * @module app/dashboard/constants/skeletonTexts
 */

export const DASHBOARD_SKELETON_TEXTS = {
  aria: {
    loadingDashboard: 'Loading admin dashboard overview and live patient queue telemetry...',
    loadingMetrics: 'Loading executive metrics summary cards...',
    loadingServiceQueue: 'Loading service queue distribution breakdown...',
    loadingTicketBreakdown: 'Loading ticket status breakdown...',
    loadingQuickLinks: 'Loading quick shortcuts...',
    loadingLiveQueue: 'Loading live patient queue records...',
    loadingHourlyChart: 'Loading hourly patient arrivals chart...',
    loadingRecentActivity: 'Loading recent patient queue activity...',
  },
} as const;
