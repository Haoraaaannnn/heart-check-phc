/**
 * @fileoverview Accessible text strings and ARIA labels for SuperAdmin skeleton loaders.
 *
 * Defines screen reader announcements and placeholder descriptors
 * conforming strictly to the zero-emoji rule and separation of concerns.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: zero emojis, professional healthcare tone.
 *
 * @module app/superadmin/constants/superadminSkeletonTexts
 */

export const SUPERADMIN_SKELETON_TEXTS = {
  aria: {
    loadingSuperAdmin: 'Loading SuperAdmin workstation and credentials...',
    loadingStats: 'Loading user account statistics...',
    loadingTable: 'Loading staff user accounts table...',
    loadingSettings: 'Loading system automation and security settings...',
  },
} as const;
