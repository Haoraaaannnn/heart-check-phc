/**
 * @fileoverview Text definitions and copy strings for the Screen Display Selector module.
 *
 * Centralizes all user-facing headers, section titles, card descriptions,
 * badge labels, security notices, and accessibility announcements.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: zero hardcoded strings in UI components,
 * zero emojis, professional clinical terminology, and no truncated labels.
 *
 * @module app/select-screen/constants/selectScreenTexts
 */

export const SELECT_SCREEN_TEXTS = {
  /** Top enterprise header navigation texts */
  header: {
    brandName: 'Heart Check',
    brandTag: 'PHC',
    subBrand: 'Screen Gateway & Station Selector',
    pageTitle: 'Select Workstation or Display Terminal',
    pageSubtitle:
      'Choose the operational mode for this physical terminal. Available modules are scoped to your authenticated staff permissions.',
    tagPill: 'Department Station Selector',
    signOutButton: 'Sign Out',
    signedInAs: 'Signed in as',
    rolePrefix: 'Role:',
    toggleThemeLight: 'Switch to light mode',
    toggleThemeDark: 'Switch to dark mode',
  },

  /** Section categorization titles and subtitles */
  sections: {
    displaysTitle: 'Public & Terminal Displays',
    displaysSubtitle:
      'Configure this terminal for patient-facing self-service check-in or waiting hall queue display.',
    workstationsTitle: 'Staff Operational Workstations',
    workstationsSubtitle:
      'Launch your authorized clinical consultation, front-desk registration, or administrative workstation.',
  },

  /** Master catalog card copy for each screen destination */
  options: {
    kiosk: {
      title: 'Patient Self-Service Kiosk',
      badge: 'Public Kiosk',
      description:
        'Interactive touchscreen kiosk for patient queue ticket registration, service selection, and SMS notification opt-in.',
      notice:
        'Staff session will be automatically signed out before launch to preserve patient privacy and prevent unauthorized access.',
      actionButton: 'Launch Patient Kiosk',
    },
    monitor: {
      title: 'Public Queue Display Monitor',
      badge: 'Waiting Hall TV',
      description:
        'Overhead high-contrast display showing live calling numbers, paired consultation cubicles, and clinic roster updates.',
      notice:
        'Optimized for continuous wall-mounted television presentation with automatic chime alert audio gating.',
      actionButton: 'Launch Display Monitor',
    },
    transfer: {
      title: 'Patient Transfer & Triage Station',
      badge: 'Front Desk',
      description:
        'Patient intake verification, strict FIFO registration queue rotation, and consultation room ticket distribution.',
      actionButton: 'Open Transfer Station',
    },
    nurse: {
      title: 'Consultation Nurse Station',
      badge: 'Clinical Workstation',
      description:
        '3-column clinical Kanban board (Waiting, Called, Serving), patient voice calling chimes, and offline outbox resilience.',
      actionButton: 'Open Nurse Station',
    },
    dashboard: {
      title: 'Operations & Analytics Dashboard',
      badge: 'Administration',
      description:
        'Live hospital queue metrics, hourly arrival trends, ARIMA bottleneck forecasting, and regulatory Excel report exports.',
      actionButton: 'Open Analytics Dashboard',
    },
    superadmin: {
      title: 'SuperAdmin Governance Portal',
      badge: 'System Governance',
      description:
        'Manage staff user accounts, assign cubicles and counters, customize kiosk service catalogs, and audit security events.',
      actionButton: 'Open SuperAdmin Portal',
    },
  },

  /** Loading and synchronization status messages */
  loading: {
    verifyingAuth: 'Verifying staff credentials and loading authorized stations',
    launching: 'Launching station',
  },

  /** Error notifications */
  errors: {
    unauthorized: 'You do not have permission to access any operational workstations.',
    loadFailed: 'Failed to load staff account information. Please try signing in again.',
  },

  /** Empty state messaging */
  empty: {
    noWorkstations:
      'No operational workstations are assigned to your staff role. You may still configure this terminal for public displays.',
  },
} as const;
