/**
 * @fileoverview Centralized UI text strings and dictionary for the Admin Dashboard
 * navigation subsystem.
 *
 * Adheres strictly to the architectural standards defined in AGENTS.md by decoupling
 * all brand titles, menu labels, breadcrumb captions, tooltips, and accessibility strings
 * from presentation components.
 *
 * @module app/dashboard/constants/dashNavTexts
 */

export const DASHBOARD_NAV_TEXTS = {
  /** Brand identity tokens rendered in the sidebar header */
  brand: {
    badge: 'PHC',
    title: 'Philippine Heart Center',
    subtitle: 'Admin Console',
    hospitalName: 'Philippine Heart Center',
  },

  /** Navigation category headers */
  categories: {
    overview: 'Overview & Monitoring',
    operations: 'Queue Operations',
    services: 'Clinical Services',
    intelligence: 'Intelligence & Reports',
  },

  /** Sidebar route link labels */
  links: {
    dashboard: 'Dashboard Overview',
    cubicles: 'Live Cubicles',
    patients: 'Patient Flow & Records',
    import: 'Import Data',
    export: 'Export Data',
    analytics: 'Reports & Analytics',
    consultation: 'Consultation',
    opdScreening: 'OPD Screening',
    ecg: 'ECG',
    warfarin: 'Warfarin',
    opdCard: 'OPD Card',
    refillPrescription: 'Refill Prescription',
    opdReschedule: 'OPD Reschedule',
    benzathine: 'Benzathine',
  },

  /** Dynamic breadcrumb hierarchy labels */
  breadcrumbs: {
    root: 'Admin',
    sections: {
      overview: 'Overview',
      operations: 'Queue Operations',
      services: 'Clinical Services',
      intelligence: 'Intelligence',
    },
    pages: {
      dashboard: 'Dashboard',
      cubicles: 'Live Cubicles',
      patients: 'Patient Records',
      import: 'Import Data',
      export: 'Export Data',
      analytics: 'Reports & Analytics',
    },
  },

  /** System status and footer text */
  system: {
    statusOnline: 'System Online',
    footerAttribution: 'Philippine Heart Center',
    menuDrawerTitle: 'Navigation Menu',
    verifyingSession: 'Verifying Admin Credentials',
    verifyingSubtext: 'Philippine Heart Center Queue System',
    loadingWorkspace: 'Loading workspace...',
  },

  /** Action button labels and accessibility tooltips */
  actions: {
    toggleDrawer: 'Toggle navigation menu',
    closeDrawer: 'Close navigation drawer',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    signOut: 'Sign out of admin session',
    defaultRole: 'ADMIN',
    defaultUserName: 'Admin User',
  },
} as const;
