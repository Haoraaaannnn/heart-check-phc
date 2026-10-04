/**
 * @fileoverview Text definitions and copy strings for the Patients dashboard page.
 *
 * All user-facing labels, headings, descriptions, table headers, placeholders,
 * and empty state messages are centralized here to adhere strictly to the
 * repository's separation of concerns guidelines.
 *
 * @module app/dashboard/pages/patients/constants/patientsTexts
 */

export const PATIENTS_TEXTS = {
  header: {
    defaultTitle: 'Patient Dashboard',
    defaultSubtitle: 'Patient statistics and queue management overview',
    serviceSubtitlePrefix: 'Live queue and statistics for',
    errorPrefix: '⚠️',
  },
  filterBar: {
    ariaLabel: 'Filter by service',
    allServices: 'All Services',
  },
  metrics: {
    totalToday: {
      label: 'Total Today',
      subtitle: 'Registrations today',
    },
    inQueue: {
      label: 'In Queue',
      subtitle: 'Awaiting consultation',
    },
    inService: {
      label: 'In Service',
      subtitle: 'Currently attending',
    },
    servedToday: {
      label: 'Served Today',
      subtitle: 'Completed visits',
    },
    avgWaitTime: {
      label: 'Avg Wait Time',
      unit: 'm',
      subtitle: 'Mean duration in queue',
    },
  },
  charts: {
    distribution: {
      title: 'Service Distribution',
      subtitle: 'Patient share by medical department',
      historicalFallbackNote: 'No patients today — showing historical service mix',
      empty: 'No service data available.',
    },
    hourlyFlow: {
      title: 'Hourly Patient Flow',
      subtitle: 'Patient intake distribution across clinic hours',
      empty: 'No hourly flow recorded today.',
      patientsLabel: 'Patients',
    },
  },
  recentTable: {
    title: 'All Recent Patients',
    subtitle: 'Patients from the last 30 days',
    showingPrefix: 'Showing',
    toText: 'to',
    ofText: 'of',
    patientsSuffix: 'patients',
    emptyTitle: 'No recent patients found.',
    emptySubtitle: 'Patient data will appear here as registrations occur.',
    headers: {
      patientNum: 'Patient #',
      service: 'Service',
      status: 'Status',
      time: 'Time',
      waitTime: 'Wait Time',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
    },
    fallbackTicket: '---',
  },
  serviceQueue: {
    statusActive: 'Active',
    statusStandby: 'Standby',
    roomsLabel: 'Rooms:',
    upNextTitle: 'Up Next Queue',
    upNextSubtitle: 'Next patients prioritized for consultation',
    emptyQueue: 'No patients waiting in queue.',
    waitingPrefix: 'Waiting for',
    servingBadge: 'Serving',
    overdueWarning: 'Delayed',
    hourlyTrendTitle: 'Hourly Intake Trend',
    hourlyTrendSubtitle: 'Volume trend for this service today',
  },
} as const;
