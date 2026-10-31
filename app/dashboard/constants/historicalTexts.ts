/**
 * @fileoverview Centralized text copy definitions for the Historical Data Breakdown component.
 *
 * All user-facing strings, labels, accessibility attributes, and descriptive copy
 * are defined here to maintain strict separation of concerns.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: no hardcoded strings in components, and zero emojis.
 *
 * @module app/dashboard/constants/historicalTexts
 */

export const HISTORICAL_TEXTS = {
  header: {
    titleIdle: 'No Live Queue Activity Recorded Today',
    titleOnDemand: 'Historical System Intelligence & Baseline',
    subtitle:
      'Long-term operational capacity, bottleneck patterns, and monthly throughput derived from Philippine Heart Center archive.',
    badgeLabel: 'System Status:',
    collapseButton: 'Hide Breakdown',
    expandButton: 'View Historical Performance Breakdown',
    expandSubtitle:
      'Inspect longitudinal bottleneck distributions, patient journey durations, and monthly archive throughput',
  },

  statusLabels: {
    Normal: 'Optimal Capacity',
    Elevated: 'Elevated Queue Delay',
    Overwhelmed: 'Capacity Threshold Exceeded',
    'No Data': 'Baseline Ingestion Pending',
  },

  statusShortLabels: {
    Normal: 'Optimal',
    Elevated: 'Elevated Delay',
    Overwhelmed: 'Capacity Threshold Exceeded',
    'No Data': 'No Data',
  },

  statusDescriptions: {
    Normal: 'Optimal Operating Capacity: Average wait times remain within <= 30 min target.',
    Elevated: 'Elevated Queue Congestion: Average wait times between 30 and 60 minutes.',
    Overwhelmed:
      'Capacity Threshold Exceeded: Average patient wait exceeds 60 minutes (2x baseline target), exceeding departmental capacity.',
    'No Data': 'Longitudinal baseline data ingestion pending.',
  },

  statusLegend: {
    title: 'Operational System Status Key & Directives',
    subtitle:
      'Quantitative wait thresholds and standard operational directives for hospital staff',
    toggleButton: 'Status Legend & Directives',
    hideButton: 'Hide Status Legend',
    columnInfo: 'Operating status determined by average patient wait time against PHC targets',
    items: [
      {
        key: 'Normal',
        title: 'Optimal Operating Capacity',
        badge: 'Optimal',
        criteria: 'Average wait <= 30 mins (Within baseline target)',
        direction:
          'Routine clinical throughput. Standard cubicle allocation is sufficient; proceed with standard patient intake.',
      },
      {
        key: 'Elevated',
        title: 'Elevated Queue Delay',
        badge: 'Elevated Delay',
        criteria: 'Average wait 30 - 60 mins (1x to 2x baseline threshold)',
        direction:
          'Moderate queue congestion. Monitor intake rates, alert consulting physicians to expedite chart reviews, and prepare standby cubicles.',
      },
      {
        key: 'Overwhelmed',
        title: 'Capacity Threshold Exceeded',
        badge: 'Capacity Threshold Exceeded',
        criteria: 'Average wait > 60 mins (>2x baseline) or total journey > 90 mins',
        direction:
          'Critical queue backlog. Mobilize relief staff immediately, activate overflow consultation cubicles, and expedite doctor orders / carryout.',
      },
    ],
  },

  cards: {
    bottleneck: {
      label: 'Historical Primary Bottleneck',
      subtitle: 'Workflow stage with highest queue retention time',
      fallback: 'None Identified',
    },
    journey: {
      label: 'Avg. Total Patient Journey',
      subtitle: 'Intake registration to final consultation',
      fallback: '--',
    },
    forecast: {
      label: 'Next-Day Projected Intake',
      modelPrefix: 'via',
      patientsUnit: 'patients',
      fallback: 'Model calibration pending',
    },
    serviceMix: {
      label: 'Primary Clinical Service',
      subtitle: 'Highest historical outpatient volume share',
      fallback: 'Outpatient Department',
    },
  },

  monthlySection: {
    title: 'Monthly Performance & Intake Breakdown',
    subtitle:
      'Patient intake volumes, primary bottleneck stages, and journey durations by calendar month',
    yearSelectorLabel: 'Operating Year:',
    loadingYears: 'Loading archive years...',
    loadingMonths: 'Loading monthly breakdown...',
    emptyMonths: 'No records available for the selected year.',
    errorPrefix: 'Unable to retrieve monthly breakdown:',
  },

  table: {
    columns: {
      month: 'Month',
      patients: 'Patient Intake',
      bottleneck: 'Primary Bottleneck',
      journey: 'Avg. Journey Time',
      status: 'Operational Status',
    },
  },

  footer: {
    notice:
      'Derived from longitudinal Philippine Heart Center intake records. Real-time live queue metrics resume automatically upon patient ticket creation.',
    loadingNotice: 'Retrieving longitudinal system intelligence from PHC archive...',
  },
} as const;
