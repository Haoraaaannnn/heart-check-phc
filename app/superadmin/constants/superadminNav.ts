/**
 * @fileoverview Navigation configuration and routes for the SuperAdmin portal.
 *
 * Defines the enterprise navigation hierarchy, grouping clinical infrastructure,
 * user identity management, kiosk touchscreen customization, and system governance.
 *
 * @module app/superadmin/constants/superadminNav
 */

import { SUPERADMIN_TEXTS } from './superadminTexts';

export const SUPERADMIN_ROUTES = {
  USERS: '/superadmin',
  AUTOMATION: '/superadmin?tab=settings',
  SECURITY: '/superadmin?tab=security',
  FACILITIES_ROOMS: '/superadmin/facilities?tab=rooms',
  FACILITIES_COUNTERS: '/superadmin/facilities?tab=counters',
  KIOSK_SERVICES: '/superadmin/customization',
} as const;

export interface SuperadminNavLink {
  key: string;
  label: string;
  href: string;
  icon: string;
  matchPrefix?: string;
  matchTab?: string;
}

export interface SuperadminNavGroup {
  key: string;
  title: string;
  items: SuperadminNavLink[];
}

const T = SUPERADMIN_TEXTS.navigation;

export const SUPERADMIN_NAV_GROUPS: SuperadminNavGroup[] = [
  {
    key: 'access',
    title: T.groupAccess,
    items: [
      {
        key: 'users',
        label: T.navStaffAccounts,
        href: SUPERADMIN_ROUTES.USERS,
        icon: 'bx-user-pin',
        matchPrefix: '/superadmin',
        matchTab: 'users',
      },
    ],
  },
  {
    key: 'facilities',
    title: T.groupFacilities,
    items: [
      {
        key: 'rooms',
        label: T.navRooms,
        href: SUPERADMIN_ROUTES.FACILITIES_ROOMS,
        icon: 'bx-door-open',
        matchPrefix: '/superadmin/facilities',
        matchTab: 'rooms',
      },
      {
        key: 'counters',
        label: T.navCounters,
        href: SUPERADMIN_ROUTES.FACILITIES_COUNTERS,
        icon: 'bx-id-card',
        matchPrefix: '/superadmin/facilities',
        matchTab: 'counters',
      },
    ],
  },
  {
    key: 'kiosk',
    title: T.groupKiosk,
    items: [
      {
        key: 'kiosk_services',
        label: T.navKioskServices,
        href: SUPERADMIN_ROUTES.KIOSK_SERVICES,
        icon: 'bx-slider-alt',
        matchPrefix: '/superadmin/customization',
      },
    ],
  },
  {
    key: 'governance',
    title: T.groupGovernance,
    items: [
      {
        key: 'automation',
        label: T.navAutomation,
        href: SUPERADMIN_ROUTES.AUTOMATION,
        icon: 'bx-cog',
        matchPrefix: '/superadmin',
        matchTab: 'settings',
      },
      {
        key: 'security',
        label: T.navSecurity,
        href: SUPERADMIN_ROUTES.SECURITY,
        icon: 'bx-shield-quarter',
        matchPrefix: '/superadmin',
        matchTab: 'security',
      },
    ],
  },
];
