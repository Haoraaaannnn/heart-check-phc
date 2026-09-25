/**
 * @fileoverview Navigation configuration and route definitions for the admin dashboard.
 * Adding, renaming, or reordering menu items is handled solely in this file.
 *
 * @module app/dashboard/constants/navigation
 */

/** Canonical route paths across the admin dashboard. */
export const DASHBOARD_ROUTES = {
  /** Admin dashboard root overview. */
  HOME: '/dashboard',
  /** Real-time cubicle monitoring and examination room status. */
  CUBICLES: '/dashboard/pages/cubicles',
  /** Patient volume trends, queue breakdowns, and 30-day logs. */
  PATIENTS: '/dashboard/pages/patients',
  /** Advanced bottleneck analysis and algorithmic forecasting. */
  ANALYTICS: '/dashboard/pages/analytics',
} as const;

/** Route of the dashboard home page (matched exactly, not by prefix). */
export const DASHBOARD_HOME = DASHBOARD_ROUTES.HOME;

const SERVICES_BASE = '/dashboard/servicesPHC';

/** A single navigation link. */
export interface NavLink {
  key: string;
  label: string;
  /** Boxicons class (used with the base `bx` class), e.g. 'bxs-dashboard'. */
  icon: string;
  href: string;
}

/** A child entry inside a dropdown group. */
export interface NavChild {
  label: string;
  href: string;
}

/** A collapsible group of links. */
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