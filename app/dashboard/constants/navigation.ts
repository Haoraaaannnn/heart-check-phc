/**
 * Sidebar navigation for the admin dashboard.
 * Adding, renaming or reordering a menu entry is a change to this file only.
 *
 * The dashboard is read-only/informational, so there are intentionally no
 * User Management or Settings entries here (those belong to superadmin).
 */

/** Route of the dashboard home page (matched exactly, not by prefix). */
export const DASHBOARD_HOME = '/dashboard';

const SERVICES_BASE = '/dashboard/servicesPHC';

/** A single link. */
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
    // The previous sidebar had Cubicles commented out. Remove this group if the page isn't ready.
    children: [{ label: 'Cubicles', href: '/dashboard/cubicles' }],
  },
  { key: 'patients', label: 'Patients', icon: 'bx-male-female', href: '/dashboard/patients' },
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
    href: '/dashboard/analytics',
  },
];