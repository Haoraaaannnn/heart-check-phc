import { cardSurface } from '@/constants/themes';

/**
 * Every Tailwind class string used by the admin dashboard lives here.
 * Components import DASH and reference keys - they contain no raw styling.
 *
 * Colors come from the semantic tokens in app/globals.css (bg-surface,
 * text-content, border-line, ...) so light/dark switching needs no `dark:`
 * variants here, except for tinted status/tone colors below.
 *
 * NOTE: the header is 72px tall. `h-[72px]` in `header.root` and the
 * `top-[72px]` / `h-[calc(100vh-72px)]` in `sidebar.root` must change together.
 */

/** Accent tones shared by metric cards and quick links. */
export type ToneKey = 'rose' | 'blue' | 'green' | 'purple' | 'amber';

export interface ToneStyle {
  /** Tinted tile background + border. */
  tile: string;
  /** Round icon badge. */
  icon: string;
}

export const TONES: Record<ToneKey, ToneStyle> = {
  rose: {
    tile: 'border-rose-100 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-500/10',
    icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
  },
  blue: {
    tile: 'border-blue-100 bg-blue-50/80 dark:border-blue-500/20 dark:bg-blue-500/10',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
  },
  green: {
    tile: 'border-green-100 bg-green-50/80 dark:border-green-500/20 dark:bg-green-500/10',
    icon: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300',
  },
  purple: {
    tile: 'border-purple-100 bg-purple-50/80 dark:border-purple-500/20 dark:bg-purple-500/10',
    icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
  },
  amber: {
    tile: 'border-amber-100 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  },
};

export const DASH = {
  /** Page-level structure. */
  layout: {
    shell: 'flex min-h-screen w-full flex-col',
    body: 'flex min-h-0 flex-1',
    main: 'min-w-0 flex-1 p-4 md:p-6',
    page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',
    /** Main column + right rail (stacks below xl). */
    grid: 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]',
    column: 'flex min-w-0 flex-col gap-6',
    twoUp: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
    metricGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
  },

  /** Top bar. */
  header: {
    root: 'sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-line bg-surface px-4 backdrop-blur-xl md:px-6',
    brand: 'flex shrink-0 items-center gap-3 md:w-[232px]',
    logo: 'flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-2xl text-white shadow-md',
    brandTitle: 'text-base font-extrabold leading-tight text-content',
    brandTagline: 'hidden text-xs text-content-muted sm:block',
    searchWrap: 'hidden flex-1 md:flex md:justify-center',
    searchInner: 'relative w-full max-w-xl',
    searchIcon: 'absolute left-4 top-1/2 -translate-y-1/2 text-lg text-content-subtle',
    searchInput:
      'w-full rounded-full border border-line bg-surface-muted py-2.5 pl-11 pr-24 text-sm text-content outline-none placeholder:text-content-subtle focus:border-brand-accent disabled:cursor-not-allowed disabled:opacity-70',
    searchKbd:
      'absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-line px-2 py-0.5 text-[11px] font-semibold text-content-subtle',
    actions: 'ml-auto flex shrink-0 items-center gap-3',
    iconButton:
      'relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-xl text-content-muted transition hover:bg-surface-muted',
    clock: 'hidden text-right lg:block',
    clockDate: 'text-xs text-content-muted',
    clockTime: 'text-lg font-bold leading-tight tabular-nums text-content',
    user: 'flex items-center gap-3 border-l border-line pl-4',
    avatar: 'flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-xl text-white',
    userText: 'hidden text-left sm:block',
    userName: 'text-sm font-semibold text-content',
    userRole: 'text-xs text-content-muted',
    logout:
      'flex h-10 w-10 items-center justify-center rounded-full text-xl text-content-muted transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10',
  },

  /** Left navigation. Color-only (no images). */
  sidebar: {
    root: 'sticky top-[72px] hidden h-[calc(100vh-72px)] w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-surface bg-[linear-gradient(to_top,rgba(251,113,133,0.22),transparent_35%)] p-4 backdrop-blur-xl dark:bg-[linear-gradient(to_top,rgba(159,18,57,0.25),transparent_35%)] md:flex',
    nav: 'flex flex-col gap-1',
    item: 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors',
    itemIdle: 'text-content-muted hover:bg-surface-muted hover:text-content',
    itemActive: 'bg-brand-gradient font-semibold text-white shadow-md',
    itemGroupActive: 'bg-surface-muted font-semibold text-brand-accent',
    icon: 'text-xl',
    chevron: 'ml-auto text-lg transition-transform',
    chevronOpen: 'rotate-180',
    subList: 'ml-5 mt-1 flex flex-col gap-0.5 border-l border-line pl-3',
    subItem: 'block rounded-lg px-3 py-2 text-sm transition-colors',
    subIdle: 'text-content-muted hover:text-content',
    subActive: 'font-semibold text-brand-accent',
    footer: 'px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-content-subtle',
  },

    /** Generic dashboard card (DashboardCard component). */
  card: {
    root: `${cardSurface} rounded-2xl p-6`,
    header: 'mb-5 flex items-start justify-between gap-3',
    headerLeft: 'flex items-center gap-3',
    iconBadge:
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xl text-white',
    title: 'text-base font-extrabold text-content',
    subtitle: 'text-xs text-content-muted',
    footerLink:'mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-content-muted transition hover:text-accent',
    empty: 'py-8 text-center text-sm text-content-subtle',
    filterSelect:'rounded-lg border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-content outline-none',
  },

  /** Welcome banner (gradient only, no image). */
  banner: {
    root: 'relative overflow-hidden rounded-2xl border border-line bg-banner-gradient p-6 shadow-card',
    decor:
      'pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rose-400/30 blur-2xl dark:bg-rose-600/30',
    content: 'relative z-10',
    eyebrow: 'text-xs font-bold uppercase tracking-widest text-brand-accent',
    title: 'mt-1 text-3xl font-extrabold text-content',
    subtitle: 'mt-1 text-sm text-content-muted',
  },

  /** Top-row metric cards. */
  metric: {
    tile: 'flex items-center gap-4 rounded-2xl border p-5 shadow-card',
    iconWrap: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
    label: 'text-xs font-semibold text-content-muted',
    value: 'text-3xl font-extrabold leading-tight text-content',
    unit: 'ml-1 text-lg font-bold',
    subtitle: 'text-xs text-content-muted',
    trendUp: 'text-xs font-semibold text-green-600 dark:text-green-400',
    trendDown: 'text-xs font-semibold text-red-600 dark:text-red-400',
    trendLabel: 'ml-1 font-normal text-content-muted',
  },

  /** Live queue table. */
  table: {
    wrap: 'overflow-x-auto',
    table: 'w-full border-collapse text-left',
    headRow: 'bg-surface-muted',
    th: 'px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-content-muted first:rounded-l-lg last:rounded-r-lg',
    row: 'border-b border-line transition last:border-0 hover:bg-surface-muted',
    td: 'px-3 py-3 text-sm text-content-muted',
    ticket:
      'inline-block rounded-lg bg-red-50 px-3 py-1 text-sm font-extrabold text-red-700 dark:bg-red-500/15 dark:text-red-300',
    select:
      'rounded-lg border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-content outline-none',
  },

  /** Status pill (StatusBadge). Color comes from STATUS_STYLES. */
  badge: {
    base: 'inline-flex w-max items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
    dot: 'h-2 w-2 rounded-full',
  },

  /** Donut + legend/bar rows (service overview, ticket breakdown). */
  breakdown: {
    split: 'flex flex-col items-center gap-6 sm:flex-row',
    list: 'flex w-full flex-1 flex-col gap-3',
    row: 'flex items-center gap-3 text-sm',
    rowLabel: 'flex min-w-0 flex-1 items-center gap-2 truncate font-semibold text-content-muted',
    dot: 'h-2.5 w-2.5 shrink-0 rounded-full',
    barTrack: 'h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-track',
    barFill: 'h-full rounded-full transition-all duration-500',
    count: 'w-8 shrink-0 text-right font-bold text-content',
    donutValue: 'text-2xl font-extrabold text-content',
    donutLabel: 'text-[10px] font-semibold uppercase tracking-wider text-content-muted',
    donutWrap: 'relative shrink-0',
    donutRing: 'absolute inset-0 rounded-full',
    donutCenter: 'absolute inset-0 flex flex-col items-center justify-center',
  },

  /** Quick link tiles (navigation only - the dashboard is read-only). */
  quickLink: {
    grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4',
    tile: 'group flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold text-content transition hover:-translate-y-0.5 hover:shadow-md',
    icon: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl',
    arrow: 'ml-auto text-lg text-content-subtle transition group-hover:translate-x-0.5',
  },

  /** Recent activity feed. */
  activity: {
    list: 'flex flex-col gap-3',
    item: 'flex items-start gap-3 text-sm',
    dot: 'mt-1.5 h-2 w-2 shrink-0 rounded-full',
    text: 'flex-1 text-content-muted',
    strong: 'font-semibold text-content',
    time: 'shrink-0 text-xs text-content-subtle',
  },
} as const;