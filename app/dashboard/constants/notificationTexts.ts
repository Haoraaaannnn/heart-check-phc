/**
 * @fileoverview Centralized dictionary of UI copy, filter labels, status tags,
 * and parameterized notification message builders for Heart Check PHC.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - Full JSDoc documentation
 * - Separation of concerns (all copy isolated from UI components and hooks)
 * - Zero emojis standard (clean plain-text formatting)
 * - Prohibition of text truncation on operational or medical metadata
 *
 * @module app/dashboard/constants/notificationTexts
 */

export const NOTIFICATION_TEXTS = {
  /** Dropdown panel headers and action controls */
  header: {
    title: 'System Notifications',
    markAllRead: 'Mark all as read',
    clearAll: 'Clear all',
    emptyTitle: 'No active notifications',
    emptyDesc: 'All clinical queues, stations, and operations are running normally.',
    bellAria: 'Notifications',
    alertsLabel: 'Alerts',
    totalLabel: 'Total',
  },

  /** Severity and category filter labels */
  filters: {
    all: 'All',
    alerts: 'Alerts',
    warnings: 'Warnings',
    notices: 'Notices',
  },

  /** Action buttons within notification items */
  actions: {
    read: 'Read',
    dismiss: 'Dismiss',
    close: 'Close',
  },

  /** Text badge indicators rendered beside notification titles */
  tags: {
    bottleneck: '[Alert]',
    warning: '[Warning]',
    info: '[Info]',
    notice: '[Notice]',
  },

  /** Parameterized message builders for system events */
  templates: {
    /** Extended consultation duration with doctor */
    consultationBottleneck: {
      title: 'Extended Consultation Time',
      buildMessage: (ticket: string, cubicle: string, mins: number): string =>
        `Patient ticket ${ticket} in ${cubicle} has been with the physician for ${mins} minutes (exceeds 15-minute consultation threshold).`,
    },

    /** Severe queue waiting time without assignment */
    longWaitBottleneck: {
      title: 'Prolonged Queue Wait Time',
      buildMessage: (ticket: string, service: string, mins: number): string =>
        `Patient ticket ${ticket} in ${service} has been waiting in queue for ${mins} minutes without station assignment.`,
    },

    /** Moderate queue waiting time */
    longWaitWarning: {
      title: 'Extended Queue Waiting Time',
      buildMessage: (ticket: string, service: string, mins: number): string =>
        `Patient ticket ${ticket} in ${service} has been waiting in queue for ${mins} minutes.`,
    },

    /** Department-level queue congestion threshold exceeded */
    highCongestion: {
      title: 'Queue Congestion Alert',
      buildMessage: (service: string, count: number): string =>
        `${service}: High volume detected with ${count} patients currently waiting in queue. Congestion threshold exceeded.`,
    },

    /** Department-level queue volume surge */
    queueSurge: {
      title: 'Queue Volume Surge',
      buildMessage: (service: string, count: number): string =>
        `${service}: ${count} patients are currently queued for service.`,
    },

    /** Unattended idle or skipped patient tickets */
    idleTickets: {
      title: 'Unattended Idle Tickets',
      buildMessage: (count: number): string =>
        `${count} patient ticket(s) are currently marked as idle or skipped. Staff action required to reactivate or triage.`,
    },

    /** Examination cubicle ready with doctor while queue waiting */
    stationAvailable: {
      title: 'Available Clinical Station',
      buildMessage: (cubicle: string, service: string, doctorName: string): string =>
        `${cubicle} (${service}) is available with ${doctorName} while patients are waiting in queue.`,
    },

    /** Daily patient intake count milestone */
    intakeMilestone: {
      title: 'Daily Intake Milestone',
      buildMessage: (count: number): string =>
        `${count} patient tickets have been registered today across outpatient clinic services.`,
    },

    /** Daily completed consultations milestone */
    completedMilestone: {
      title: 'Daily Service Milestone',
      buildMessage: (count: number): string =>
        `${count} patients have completed clinical consultation and service today.`,
    },

    /** Network connection lost */
    networkOffline: {
      title: 'System Offline Mode',
      message:
        'Network connection unavailable. Operating in local offline cache mode. Operations will synchronize automatically when connection is restored.',
    },

    /** Network connection restored */
    networkOnline: {
      title: 'System Online Synchronized',
      message:
        'Network connection restored. Real-time queue updates and background synchronizer are active.',
    },
  },
} as const;

export default NOTIFICATION_TEXTS;
