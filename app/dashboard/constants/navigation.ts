/**
 * @fileoverview Navigation configuration and route definitions for the Admin Dashboard.
 *
 * Implements categorized navigation groups adhering to the Enterprise Navigation Standard
 * defined in AGENTS.md. Defines routes, active route matching patterns, and legacy compatibility
 * contracts.
 *
 * @module app/dashboard/constants/navigation
 */

import { DASHBOARD_NAV_TEXTS } from './dashNavTexts';

/** Canonical route paths across the admin dashboard. */
export const DASHBOARD_ROUTES = {
  /** Admin dashboard root overview. */
  HOME: '/dashboard',
  /** Real-time cubicle monitoring and examination room status. */
  CUBICLES: '/dashboard/pages/cubicles',
  /** Patient volume trends, queue breakdowns, and 30-day logs. */
  PATIENTS: '/dashboard/pages/patients',
  /** Direct drag-and-drop file ingestion interface. */
  IMPORT: '/dashboard/pages/import',
  /** Advanced bottleneck analysis and algorithmic forecasting. */
  ANALYTICS: '/dashboard/pages/analytics',
} as const;

/** Route of the dashboard home page (matched exactly, not by prefix). */
export const DASHBOARD_HOME = DASHBOARD_ROUTES.HOME;

/** Base path for legacy services routes */
const SERVICES_BASE = '/dashboard/servicesPHC';

/** Query parameter match contract for deep-linking */
export interface QueryParamMatch {
  key: string;
  value: string;
}

/**
 * Enterprise navigation link definition.
 */
export interface DashboardNavLink {
  /** Unique key for React reconciliation */
  key: string;
  /** User-visible label string */
  label: string;
  /** Boxicons class name without the `bx` prefix */
  icon: string;
  /** Destination pathname or relative link */
  href: string;
  /** Optional route path prefix for active highlighting */
  matchPrefix?: string;
  /** Optional query parameter required for active state */
  matchQueryParam?: QueryParamMatch;
}

/**
 * Categorized navigation group section.
 */
export interface DashboardNavGroup {
  /** Unique key for the category section */
  key: string;
  /** Category section header label */
  title: string;
  /** Nested navigation links */
  items: DashboardNavLink[];
}

/**
 * Centralized Enterprise navigation hierarchy categorized by functional domain.
 */
export const DASHBOARD_NAV_GROUPS: readonly DashboardNavGroup[] = [
  {
    key: 'overview',
    title: DASHBOARD_NAV_TEXTS.categories.overview,
    items: [
      {
        key: 'overview',
        label: DASHBOARD_NAV_TEXTS.links.dashboard,
        icon: 'bxs-dashboard',
        href: DASHBOARD_ROUTES.HOME,
        matchPrefix: '/dashboard',
      },
    ],
  },
  {
    key: 'operations',
    title: DASHBOARD_NAV_TEXTS.categories.operations,
    items: [
      {
        key: 'cubicles',
        label: DASHBOARD_NAV_TEXTS.links.cubicles,
        icon: 'bx-desktop',
        href: DASHBOARD_ROUTES.CUBICLES,
        matchPrefix: '/dashboard/pages/cubicles',
      },
      {
        key: 'patients',
        label: DASHBOARD_NAV_TEXTS.links.patients,
        icon: 'bx-male-female',
        href: DASHBOARD_ROUTES.PATIENTS,
        matchPrefix: '/dashboard/pages/patients',
      },
      {
        key: 'import',
        label: DASHBOARD_NAV_TEXTS.links.import,
        icon: 'bx-cloud-upload',
        href: DASHBOARD_ROUTES.IMPORT,
        matchPrefix: '/dashboard/pages/import',
      },
    ],
  },
  {
    key: 'services',
    title: DASHBOARD_NAV_TEXTS.categories.services,
    items: [
      {
        key: 'svc-consultation',
        label: DASHBOARD_NAV_TEXTS.links.consultation,
        icon: 'bx-chat',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=Consultation`,
        matchQueryParam: { key: 'service', value: 'Consultation' },
      },
      {
        key: 'svc-screening',
        label: DASHBOARD_NAV_TEXTS.links.opdScreening,
        icon: 'bx-search-alt-2',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=OPD%20Screening`,
        matchQueryParam: { key: 'service', value: 'OPD Screening' },
      },
      {
        key: 'svc-ecg',
        label: DASHBOARD_NAV_TEXTS.links.ecg,
        icon: 'bx-pulse',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=ECG`,
        matchQueryParam: { key: 'service', value: 'ECG' },
      },
      {
        key: 'svc-warfarin',
        label: DASHBOARD_NAV_TEXTS.links.warfarin,
        icon: 'bx-heart',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=Warfarin`,
        matchQueryParam: { key: 'service', value: 'Warfarin' },
      },
      {
        key: 'svc-opd-card',
        label: DASHBOARD_NAV_TEXTS.links.opdCard,
        icon: 'bx-id-card',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=OPD%20Card`,
        matchQueryParam: { key: 'service', value: 'OPD Card' },
      },
      {
        key: 'svc-refill',
        label: DASHBOARD_NAV_TEXTS.links.refillPrescription,
        icon: 'bx-capsule',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=Refill%20Prescription`,
        matchQueryParam: { key: 'service', value: 'Refill Prescription' },
      },
      {
        key: 'svc-reschedule',
        label: DASHBOARD_NAV_TEXTS.links.opdReschedule,
        icon: 'bx-calendar',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=OPD%20Reschedule`,
        matchQueryParam: { key: 'service', value: 'OPD Reschedule' },
      },
      {
        key: 'svc-benzathine',
        label: DASHBOARD_NAV_TEXTS.links.benzathine,
        icon: 'bx-first-aid',
        href: `${DASHBOARD_ROUTES.PATIENTS}?service=Benzathine`,
        matchQueryParam: { key: 'service', value: 'Benzathine' },
      },
    ],
  },
  {
    key: 'intelligence',
    title: DASHBOARD_NAV_TEXTS.categories.intelligence,
    items: [
      {
        key: 'analytics',
        label: DASHBOARD_NAV_TEXTS.links.analytics,
        icon: 'bx-bar-chart-alt-2',
        href: DASHBOARD_ROUTES.ANALYTICS,
        matchPrefix: '/dashboard/pages/analytics',
      },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Backward-compatibility exports for legacy components
// ---------------------------------------------------------------------------

/** A single navigation link for legacy consumers. */
export interface NavLink {
  key: string;
  label: string;
  icon: string;
  href: string;
}

/** A child entry inside a dropdown group for legacy consumers. */
export interface NavChild {
  label: string;
  href: string;
}

/** A collapsible group of links for legacy consumers. */
export interface NavGroup {
  key: string;
  label: string;
  icon: string;
  children: readonly NavChild[];
}

export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bxs-dashboard', href: DASHBOARD_HOME },
  {
    key: 'queue',
    label: 'Queue Management',
    icon: 'bx-message-square-detail',
    children: [{ label: 'Cubicles', href: DASHBOARD_ROUTES.CUBICLES }],
  },
  { key: 'patients', label: 'Patients', icon: 'bx-male-female', href: DASHBOARD_ROUTES.PATIENTS },
  {
    key: 'services',
    label: 'Services',
    icon: 'bx-plus-medical',
    children: [
      { label: 'Consultation', href: `${SERVICES_BASE}/consultation` },
      { label: 'OPD Card', href: `${SERVICES_BASE}/opdCard` },
      { label: 'Refill Prescription', href: `${SERVICES_BASE}/refillPrescription` },
      { label: 'ECG', href: `${SERVICES_BASE}/ecg` },
      { label: 'Warfarin', href: `${SERVICES_BASE}/warfarin` },
      { label: 'OPD Reschedule', href: `${SERVICES_BASE}/opdReschedule` },
      { label: 'Benzathine', href: `${SERVICES_BASE}/benzathine` },
      { label: 'OPD Screening', href: `${SERVICES_BASE}/opdScreening` },
    ],
  },
  {
    key: 'analytics',
    label: 'Reports & Analytics',
    icon: 'bx-bar-chart-alt-2',
    href: DASHBOARD_ROUTES.ANALYTICS,
  },
];