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

  statusDescriptions: {
    Normal: 'Optimal Operating Capacity',
    Elevated: 'Elevated Queue Congestion',
    Overwhelmed: 'Capacity Threshold Exceeded',
    'No Data': 'Baseline Ingestion Pending',
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
