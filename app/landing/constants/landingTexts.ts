/**
 * @fileoverview Text dictionary and content definitions for the Public Landing Page.
 *
 * Provides all enterprise copy, department headers, navigation labels, feature
 * descriptions, workflow step explanations, and legal disclaimers.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: zero hardcoded strings in UI components,
 * zero emojis, professional clinical terminology, and no truncated labels.
 *
 * @module app/landing/constants/landingTexts
 */

export const LANDING_TEXTS = {
  /** Top navigation bar texts */
  header: {
    brandName: 'Heart Check',
    brandTag: 'PHC',
    subBrand: 'Out-Patient Department',
    statusLive: 'Clinic Operations Online',
    staffLoginBtn: 'Staff Login',
    toggleThemeLight: 'Switch to light mode',
    toggleThemeDark: 'Switch to dark mode',
  },

  /** Hero section texts */
  hero: {
    mainTitle: 'Heart Check',
    mainTitleAccent: 'PHC',
    subheading:
      'A Queueing Management System for the Out-Patient Department of Philippine Heart Center. Orchestrating self-service patient check-in, triage intake, front-desk transfer, consultation Kanban, synchronized public monitors, and predictive patient volume analytics.',
    primaryCta: 'Staff Login',
    livePillTitle: 'Queue Management Active',
    livePillSubtitle: 'Manila Standard Time',
    operationalHours: 'OPD Hours: Monday to Friday 7:00 AM – 5:00 PM PHT',
  },

  /** Architecture and platform capabilities catalog */
  features: {
    sectionTag: 'Integrated Clinical Subsystems',
    sectionTitle: 'Complete Out-Patient Department Coordination Suite',
    sectionSubtitle:
      'Engineered to eliminate patient congestion, automate FIFO queue discipline, and deliver real-time operational visibility across all clinical stations.',
    items: [
      {
        id: 'kiosk',
        title: 'Self-Service Touchscreen Kiosk',
        subtitle: 'Patient Intake & Ticketing',
        description:
          'High-accessibility touchscreen terminals for new and returning cardiac patients, multi-service routing, mobile phone SMS alert enrollment, and high-speed thermal receipt printing.',
        icon: 'bx-devices',
        badge: 'Public Kiosk',
      },
      {
        id: 'transfer',
        title: 'Patient Transfer & Triage Station',
        subtitle: 'Registration Counter Release',
        description:
          'Strict FIFO queue discipline with pointer-based patient movement, automated counter rotation rules, and dynamic doctor consultation room assignment.',
        icon: 'bx-transfer-alt',
        badge: 'Front Desk',
      },
      {
        id: 'nurse',
        title: 'Consultation Nurse Station',
        subtitle: 'Clinical Kanban Coordination',
        description:
          'Interactive 3-column clinical board (Waiting, Called, Serving), multi-language chime voice synthesis, and local IndexedDB offline outbox resilience.',
        icon: 'bx-plus-medical',
        badge: 'Clinical Workstation',
      },
      {
        id: 'monitor',
        title: 'High-Contrast Public Monitors',
        subtitle: 'Synchronized Display Roster',
        description:
          'Large-screen dual-column display panels for waiting halls, paired cubicle calling alerts, room rosters, and audible chime gating for patient guidance.',
        icon: 'bx-tv',
        badge: 'Waiting Hall',
      },
      {
        id: 'analytics',
        title: 'Executive Analytics & Forecasting',
        subtitle: 'ARIMA Bottleneck Predictions',
        description:
          'Real-time clinic telemetry, historical arrival trend tracking, predictive queue bottleneck models, and one-click regulatory Excel reports.',
        icon: 'bx-bar-chart-alt-2',
        badge: 'Administration',
      },
      {
        id: 'superadmin',
        title: 'SuperAdmin Governance Portal',
        subtitle: 'Access Control & Topology',
        description:
          'Centralized staff account provisioning, counter and room topology mappings, service catalog customization, and security audit logs.',
        icon: 'bx-shield-quarter',
        badge: 'Governance',
      },
    ],
  },

  /** Four-stage clinical workflow progression */
  workflow: {
    sectionTag: 'End-to-End Operational Pipeline',
    sectionTitle: 'Streamlined Patient Journey from Arrival to Discharge',
    sectionSubtitle:
      'Standardized clinical sequence ensuring transparent patient tracking and minimum waiting times.',
    steps: [
      {
        stepNumber: '01',
        title: 'Self-Service Intake',
        description:
          'Patients check in at kiosk touchscreens, select OPD clinical services, enter mobile contact numbers for alerts, and receive numbered tickets.',
        icon: 'bx-touch',
      },
      {
        stepNumber: '02',
        title: 'Registration & Transfer',
        description:
          'Front-desk staff verify patient documents, manage FIFO registration queues, and route tickets to designated consultation rooms.',
        icon: 'bx-git-merge',
      },
      {
        stepNumber: '03',
        title: 'Clinical Consultation',
        description:
          'Physicians and nursing staff call patients via live Kanban boards with synchronized public screen banners and audio voice announcements.',
        icon: 'bx-user-check',
      },
      {
        stepNumber: '04',
        title: 'Discharge & Telemetry',
        description:
          'Completed visits update hospital operational telemetry in real time, feeding continuous ARIMA arrival forecasting and wait-time models.',
        icon: 'bx-line-chart',
      },
    ],
  },

  /** Footer and legal texts */
  footer: {
    brandName: 'Heart Check PHC',
    institutionFull: 'Philippine Heart Center — Out-Patient Department',
    address: 'East Avenue, Diliman, Quezon City, Metro Manila, Philippines',
    versionBadge: 'v2.4 Enterprise Edition',
    copyright: 'Philippine Heart Center. All rights reserved.',
    disclaimer:
      'This clinical queue management platform is an authorized internal system of the Philippine Heart Center Out-Patient Department. Unauthorized access or tampering is strictly prohibited under Philippine Republic Act No. 10173 (Data Privacy Act of 2012).',
    loginLink: 'Staff Login',
    documentationLink: 'System Documentation',
  },
} as const;
