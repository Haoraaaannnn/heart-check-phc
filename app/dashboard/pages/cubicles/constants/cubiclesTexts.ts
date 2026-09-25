/**
 * @fileoverview Text definitions and copy strings for the Cubicles dashboard page.
 *
 * All user-facing labels, headings, descriptions, status badges, and empty messages
 * are centralized here adhering to the repository's separation of concerns guidelines.
 *
 * @module app/dashboard/pages/cubicles/constants/cubiclesTexts
 */

export const CUBICLES_TEXTS = {
  header: {
    title: 'Live Cubicle Dashboard',
    subtitle: 'Real-time status of examination cubicles and active consultations',
    lastUpdatedPrefix: 'Last updated:',
    loading: 'Loading cubicle data...',
    errorPrefix: 'Error loading cubicles:',
  },
  metrics: {
    total: {
      label: 'Total Cubicles',
      subtitle: 'Configured examination units',
    },
    available: {
      label: 'Available',
      subtitle: 'Ready for next patient',
    },
    occupied: {
      label: 'Occupied',
      subtitle: 'Consultation in progress',
    },
    unavailable: {
      label: 'Unavailable',
      subtitle: 'Maintenance or cleaning',
    },
  },
  grid: {
    title: 'Cubicle Status',
    subtitle: 'Physical exam rooms and real-time patient occupancy',
    emptyTitle: 'No cubicles configured in the system.',
    emptySubtitle: 'Contact system administrator to configure clinical cubicles.',
  },
  card: {
    patientPrefix: 'Patient:',
    servicePrefix: 'Service:',
    sincePrefix: 'Since:',
    estEndPrefix: 'Est. end:',
    lessThanMinute: '<1m',
  },
  legend: {
    title: 'Status Legend',
    subtitle: 'Operational state definitions for clinical rooms',
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
    cleaning: 'Cleaning',
  },
} as const;
