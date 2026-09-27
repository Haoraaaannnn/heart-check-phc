/**
 * @fileoverview Text definitions and copy strings for the Screen Display Selector module.
 *
 * All user-facing titles, descriptions, button labels, and security notices
 * are centralized here to maintain strict separation of concerns.
 *
 * @module app/select-screen/constants/selectScreenTexts
 */

export const SELECT_SCREEN_TEXTS = {
  header: {
    brandName: 'Heart Check',
    brandTag: 'PHC',
    pageTitle: 'Screen Display Selector',
    pageSubtitle: 'Select what this terminal will display according to your staff role and current station setup.',
    signOutButton: 'Sign Out',
    signedInAs: 'Signed in as',
    rolePrefix: 'Role:',
  },
  sections: {
    displaysTitle: 'Public & Terminal Displays',
    displaysSubtitle: 'Configure this screen for patient-facing self-service or waiting area queue display.',
    workstationsTitle: 'Staff Operational Workstations',
    workstationsSubtitle: 'Launch your authorized clinical, registration, or administrative workstation.',
  },
  options: {
    kiosk: {
      title: 'Patient Kiosk',
      badge: 'Self-Service',
      description: 'Interactive touch-screen kiosk for patient queue ticket registration and age-bracket triage.',
      notice: 'Staff session will be automatically signed out before launch to preserve patient privacy and system security.',
      actionButton: 'Launch Patient Kiosk',
    },
    monitor: {
      title: 'Queue Monitor',
      badge: 'Waiting Area TV',
      description: 'Public overhead display showing active calling numbers, cubicle assignments, and clinic queues.',
      notice: 'Optimized for continuous wall-mounted or television display without session timeouts.',
      actionButton: 'Launch Queue Monitor',
    },
    transfer: {
      title: 'Registration & Transfer',
      badge: 'Front Desk / Triage',
      description: 'Patient queue intake, triage routing, counter assignments, and inter-service transfers.',
      actionButton: 'Open Registration Desk',
    },
    nurse: {
      title: 'Nurse Station',
      badge: 'Clinical Queue',
      description: 'Call patients to cubicles, update consultation progress, and log clinical service stages.',
      actionButton: 'Open Nurse Station',
    },
    dashboard: {
      title: 'Operations Dashboard',
      badge: 'Analytics & Management',
      description: 'Live clinic metrics, queue volume trends, wait-time analytics, and historical reports.',
      actionButton: 'Open Dashboard',
    },
    superadmin: {
      title: 'Super Admin Console',
      badge: 'System Governance',
      description: 'Manage staff accounts, assign roles and cubicles, update system configuration, and audit access.',
      actionButton: 'Open Super Admin',
    },
  },
  loading: {
    verifyingAuth: 'Verifying staff credentials and loading authorized screens...',
  },
  errors: {
    unauthorized: 'You do not have permission to access any operational workstations.',
    loadFailed: 'Failed to load staff account information. Please try signing in again.',
  },
  empty: {
    noWorkstations: 'No operational workstations are assigned to your role. You may still launch public terminal displays.',
  },
} as const;
