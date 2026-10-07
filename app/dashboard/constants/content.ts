import { APP_INFO } from '@/constants/app';
import type { StatusGroup } from '@/constants/queueStatus';
import type { ToneKey } from '@/app/dashboard/constants/styles';

/**
 * All user-visible copy and configuration for the admin dashboard.
 * Components read from here; none of them hard-code text, counts or limits.
 */

/** Static identity shown in the header (replace with session data later). */
export const DASHBOARD_USER = { name: 'Admin User', role: 'Administrator' } as const;

/** Header search box configuration and copy. */
export const HEADER_SEARCH = {
  placeholder: 'Search patient, ticket number, or service...',
  disabledPlaceholder: 'Search (coming soon)',
  shortcut: 'Ctrl + K',
  enabled: true,
} as const;

/** Welcome banner copy. Greeting is chosen by Manila hour (see WelcomeBanner). */
export const BANNER = {
  eyebrow: APP_INFO.hospitalName,
  subtitle: `Here's what's happening at the ${APP_INFO.hospitalName} today.`,
  fallbackGreeting: 'Welcome',
  greetings: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  },
  /** Hour (0-23, Manila) before which the morning / afternoon greeting applies. */
  morningUntil: 12,
  afternoonUntil: 18,
} as const;

/** Text shown next to the trend arrow on the "Total Patients" card. */
export const TREND_LABEL = 'vs. yesterday';

// ---------------------------------------------------------------------------
// Realtime streaming & connectivity resilience configuration
// ---------------------------------------------------------------------------

/**
 * Realtime subscription and fallback polling configuration for overview metrics.
 */
export const DASHBOARD_REALTIME = {
  /** Channel identifier for Supabase postgres_changes subscription */
  channelName: 'patients-dashboard-realtime',
  /** Debounce delay in milliseconds for reconciling batch events */
  debounceMs: 300,
  /** Fallback polling interval in milliseconds when WebSocket is degraded (30 seconds) */
  fallbackPollIntervalMs: 30_000,
} as const;

// ---------------------------------------------------------------------------
// Overview Date Range Filter presets & configurations
// ---------------------------------------------------------------------------

/**
 * Valid timeframe options for filtering overview executive metrics.
 */
export type OverviewDateRange = 'today' | 'yesterday' | '7d' | 'mtd';

/**
 * Configuration for an overview date range preset pill.
 */
export interface OverviewDatePreset {
  /** Identifier matching the range query key */
  id: OverviewDateRange;
  /** Primary label displayed on the pill button */
  label: string;
  /** Accessibility title and explanatory tooltip */
  description: string;
  /** Boxicons class name without the 'bx ' prefix */
  icon: string;
}

/**
 * Available timeframe presets displayed in the date filter pill bar.
 */
export const OVERVIEW_DATE_PRESETS: readonly OverviewDatePreset[] = [
  { id: 'today', label: 'Today', description: "Today's live queue and arrivals", icon: 'bx-time-five' },
  { id: 'yesterday', label: 'Yesterday', description: 'Previous full operational day', icon: 'bx-calendar-alt' },
  { id: '7d', label: 'Last 7 Days', description: 'Trailing 7-day operational period', icon: 'bx-calendar-week' },
  { id: 'mtd', label: 'Month-to-Date', description: 'Current month cumulative metrics', icon: 'bx-calendar' },
] as const;

/**
 * Static UI copy for the date filter pill bar.
 */
export const OVERVIEW_DATE_FILTER_TEXTS = {
  label: 'Timeframe:',
  liveBadge: 'Live Streaming',
  historicalBadge: 'Historical Snapshot',
  loadingAria: 'Loading range metrics',
} as const;

/**
 * Icon identifiers for the date filter pill bar.
 */
export const OVERVIEW_DATE_FILTER_ICONS = {
  filter: 'bx-slider-alt',
  history: 'bx-history',
} as const;

/**
 * Metric card label and subtitle overrides specific to each timeframe.
 */
export const METRIC_RANGE_CONFIG: Record<
  OverviewDateRange,
  {
    totalLabel: string;
    totalSubtitle?: string;
    trendLabel: string;
    onQueueLabel: string;
    onQueueSubtitle: string;
    servedLabel: string;
    servedSubtitle: string;
    avgWaitSubtitle: string;
  }
> = {
  today: {
    totalLabel: 'Total Patients Today',
    trendLabel: 'vs. yesterday',
    onQueueLabel: 'On Queue',
    onQueueSubtitle: 'Waiting to be served',
    servedLabel: 'Served',
    servedSubtitle: "Today's completed",
    avgWaitSubtitle: 'Active queue average',
  },
  yesterday: {
    totalLabel: 'Total Patients Yesterday',
    trendLabel: 'vs. prev day',
    onQueueLabel: 'Unserved at Close',
    onQueueSubtitle: 'Ended day waiting',
    servedLabel: 'Served Yesterday',
    servedSubtitle: 'Completed consultations',
    avgWaitSubtitle: 'Full day average',
  },
  '7d': {
    totalLabel: 'Total Patients (7 Days)',
    trendLabel: 'vs. prior 7d',
    onQueueLabel: 'Unserved Tickets',
    onQueueSubtitle: 'Cumulative pending',
    servedLabel: 'Total Served (7d)',
    servedSubtitle: 'Completed consultations',
    avgWaitSubtitle: '7-day rolling average',
  },
  mtd: {
    totalLabel: 'Total Patients (Month-to-Date)',
    trendLabel: 'vs. prior month',
    onQueueLabel: 'Unserved Tickets',
    onQueueSubtitle: 'Month pending tickets',
    servedLabel: 'Total Served (MTD)',
    servedSubtitle: 'Month completed consultations',
    avgWaitSubtitle: 'Month rolling average',
  },
};

// ---------------------------------------------------------------------------
// Metric cards
// ---------------------------------------------------------------------------

export type MetricKey = 'todayCount' | 'onQueue' | 'served' | 'avgWait';

export interface MetricCardConfig {
  key: MetricKey;
  label: string;
  /** Boxicons class, used with the base `bx` class. */
  icon: string;
  tone: ToneKey;
  subtitle?: string;
  /** Unit shown after the value when it is numeric. */
  unit?: string;
  /** Show the "vs. yesterday" trend under the value. */
  showTrend?: boolean;
}

export const METRIC_CARDS: readonly MetricCardConfig[] = [
  { key: 'todayCount', label: 'Total Patients Today', icon: 'bxs-group', tone: 'rose', showTrend: true },
  { key: 'onQueue', label: 'On Queue', icon: 'bxs-user', tone: 'blue', subtitle: 'Waiting to be served' },
  { key: 'served', label: 'Served', icon: 'bx-check', tone: 'green', subtitle: "Today's completed" },
  { key: 'avgWait', label: 'Avg. Waiting Time', icon: 'bx-hourglass', tone: 'purple', unit: 'min' },
];

// ---------------------------------------------------------------------------
// Section (card) headings
// ---------------------------------------------------------------------------

export const SECTIONS = {
  serviceQueue: {
    title: 'Service Queue Overview',
    subtitle: 'Patients in queue right now',
    icon: 'bx-bar-chart-alt-2',
    centerLabel: 'Patients',
  },
  ticketStatus: {
    title: 'Ticket Status Breakdown',
    subtitle: "Today's tickets by status",
    icon: 'bx-pie-chart-alt-2',
    centerLabel: 'Served',
  },
  quickLinks: {
    title: 'Quick Links',
    subtitle: 'Jump to reports and records',
    icon: 'bx-link-alt',
  },
  liveQueue: {
    title: 'Live Queue',
    subtitle: 'Real-time patient ticket status',
    icon: 'bxs-heart',
    emptyText: 'No patients in the queue today.',
    allServicesLabel: 'All Services',
    viewAllLabel: 'View All Queues',
    viewAllHref: '/dashboard/pages/patients',
    /** Max rows shown. */
    limit: 6,
  },
  hourlyArrivals: {
    title: 'Hourly Patient Arrivals',
    subtitle: 'Number of patients registered per hour today',
    icon: 'bx-bar-chart-alt-2',
    loadingText: 'Loading chart...',
    tooltipSeriesLabel: 'Arrivals',
  },
  recentActivity: {
    title: 'Recent Activity',
    subtitle: 'Latest ticket updates',
    icon: 'bx-time-five',
    emptyText: 'No activity yet today.',
    viewAllLabel: 'View All',
    viewAllHref: '/dashboard/pages/patients',
    /** Max entries shown. */
    limit: 5,
  },
} as const;

// ---------------------------------------------------------------------------
// Service queue overview
// ---------------------------------------------------------------------------

export const SERVICE_OVERVIEW = {
  emptyText: 'No patients currently in queue.',
  /** Label used for tickets whose `service` is empty (matches useOverviewData). */
  fallbackService: 'General',
} as const;

// ---------------------------------------------------------------------------
// Ticket status breakdown
// ---------------------------------------------------------------------------

/** Keys of DashboardStats that the breakdown rows read from. */
export type BreakdownStatKey = 'served' | 'inService' | 'onQueue' | 'idle';

export interface BreakdownRow {
  /** Status group - color and dot come from STATUS_STYLES[group]. */
  group: StatusGroup;
  label: string;
  statKey: BreakdownStatKey;
}

export const TICKET_BREAKDOWN_ROWS: readonly BreakdownRow[] = [
  { group: 'done', label: 'Served', statKey: 'served' },
  { group: 'serving', label: 'Serving', statKey: 'inService' },
  { group: 'waiting', label: 'Waiting', statKey: 'onQueue' },
  { group: 'idle', label: 'Idle', statKey: 'idle' },
];

// ---------------------------------------------------------------------------
// Live queue table
// ---------------------------------------------------------------------------

export type LiveQueueColumnKey = 'ticket' | 'service' | 'cubicle' | 'wait' | 'status';

export const LIVE_QUEUE_COLUMNS: readonly { key: LiveQueueColumnKey; label: string }[] = [
  { key: 'ticket', label: 'Ticket #' },
  { key: 'service', label: 'Service' },
  { key: 'cubicle', label: 'Cubicle' },
  { key: 'wait', label: 'Wait Time' },
  { key: 'status', label: 'Status' },
];

/** Placeholder text used in table cells with no value. */
export const EMPTY_CELL = '—';

// ---------------------------------------------------------------------------
// Quick links (navigation only)
// ---------------------------------------------------------------------------

export interface QuickLinkConfig {
  label: string;
  href: string;
  icon: string;
  tone: ToneKey;
}

export const QUICK_LINKS: readonly QuickLinkConfig[] = [
  { label: 'Reports & Analytics', href: '/dashboard/pages/analytics', icon: 'bxs-report', tone: 'blue' },
  { label: 'Patient Records', href: '/dashboard/pages/patients', icon: 'bx-male-female', tone: 'rose' },
  { label: 'Import Patient Data', href: '/dashboard/pages/import', icon: 'bx-cloud-upload', tone: 'emerald' },
  { label: 'Export Queue Data', href: '/dashboard/pages/export', icon: 'bx-download', tone: 'blue' },
  { label: 'Consultation', href: '/dashboard/servicesPHC/consultation', icon: 'bx-chat', tone: 'green' },
  { label: 'OPD Screening', href: '/dashboard/servicesPHC/opdScreening', icon: 'bx-search-alt-2', tone: 'purple' },
];

// ---------------------------------------------------------------------------
// Recent activity wording
// ---------------------------------------------------------------------------

/** Sentence fragment shown after "Ticket #### " for each status group. */
export const ACTIVITY_MESSAGES: Record<StatusGroup, string> = {
  waiting: 'is now in queue',
  serving: 'is now being served',
  idle: 'is now idle',
  done: 'was served',
  cancelled: 'was cancelled',
  unknown: 'was updated',
};

/** More specific wording for individual raw statuses (lowercase, trimmed). */
export const ACTIVITY_MESSAGE_OVERRIDES: Record<string, string> = {
  assigned: 'was assigned',
  'with doctor': 'is now with the doctor',
};