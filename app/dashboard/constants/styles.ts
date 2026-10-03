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
    tile: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40',
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  blue: {
    tile: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  green: {
    tile: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40',
    icon: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300',
  },
  purple: {
    tile: 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/40',
    icon: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
  amber: {
    tile: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  },
};

export const DASH = {
  /** Page-level structure adhering to the enterprise left-rail layout standard. */
  layout: {
    shell: 'min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-200',
    stage: 'flex-1 flex flex-col min-w-0 min-h-screen',
    body: 'flex min-h-0 flex-1',
    main: 'flex-1 overflow-y-auto p-4 md:p-6 phc-scroll',
    page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',
    /** Main column + right rail (stacks below xl). */
    grid: 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]',
    column: 'flex min-w-0 flex-col gap-6',
    twoUp: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
    metricGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
  },

  /** Timeframe date filter pill bar adhering to the enterprise solid surfaces standard. */
  dateFilter: {
    root: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl border border-line bg-surface shadow-2xs',
    group: 'flex items-center gap-1.5 flex-wrap',
    labelWrap: 'flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-muted px-1.5 select-none',
    labelIcon: 'text-sm text-content-subtle',
    pill: 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer outline-none select-none',
    pillActive: 'bg-rose-600 text-white shadow-2xs font-bold border border-rose-600',
    pillIdle:
      'bg-surface-muted text-content-muted border border-line hover:bg-surface hover:text-content hover:border-slate-300 dark:hover:border-slate-700',
    badgeLive:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 select-none',
    badgeLiveDot: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse',
    badgeHistorical:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 select-none',
    badgeHistoricalIcon: 'text-xs text-slate-400',
    spinner: 'h-3 w-3 animate-spin text-current',
  },

  /** Responsive mobile slide-over drawer */
  drawer: {
    backdrop: 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity',
    panel: 'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl transition-transform lg:hidden',
    closeButton: 'p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
  },

  /** Top sticky header bar with breadcrumbs, Manila clock, and profile chip. */
  header: {
    root: 'sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs',
    leftGroup: 'flex items-center gap-3 min-w-0',
    hamburgerButton: 'lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer',
    breadcrumbs: 'flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:flex truncate',
    breadcrumbActive: 'text-slate-900 dark:text-white font-semibold truncate',
    breadcrumbSeparator: 'text-slate-300 dark:text-slate-600 shrink-0',
    rightGroup: 'flex items-center gap-2.5 sm:gap-3 shrink-0',
    searchWrap: 'hidden xl:flex items-center mx-4 max-w-xs w-full',
    searchInner: 'relative w-full',
    searchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400',
    searchInput:
      'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 pl-8 pr-16 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-rose-500 dark:focus:border-rose-500 focus:outline-none transition',
    searchKbd:
      'absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400',
    clock: 'hidden md:flex flex-col items-end pr-3 border-r border-slate-200 dark:border-slate-800',
    clockContainer: 'hidden md:flex flex-col items-end pr-3 border-r border-slate-200 dark:border-slate-800',
    clockDate: 'text-[11px] text-slate-500 dark:text-slate-400 font-medium',
    clockTime: 'text-xs font-mono font-bold text-slate-800 dark:text-slate-200',
    themeButton:
      'p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700',
    userChip:
      'flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700',
    userAvatar:
      'w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold text-xs',
    userEmail: 'text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[140px] truncate',
    roleTag: 'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white',
    signOutButton:
      'p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition cursor-pointer text-lg',
    // Legacy header keys for backwards compatibility
    brand: 'flex shrink-0 items-center gap-3 md:w-[232px]',
    logo: 'flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-2xl text-white shadow-md',
    brandTitle: 'text-base font-extrabold leading-tight text-content',
    brandTagline: 'hidden text-xs text-content-muted sm:block',
    actions: 'ml-auto flex shrink-0 items-center gap-3',
    iconButton:
      'relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-xl text-content-muted transition hover:bg-surface-muted',
    user: 'flex items-center gap-3 border-l border-line pl-4',
    avatar: 'flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-xl text-white',
    userText: 'hidden text-left sm:block',
    userName: 'text-sm font-semibold text-content',
    userRole: 'text-xs text-content-muted',
    logout:
      'flex h-10 w-10 items-center justify-center rounded-full text-xl text-content-muted transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10',
  },

  /** Left navigation. Solid surface with crisp right border and categorized groups. */
  sidebar: {
    root: 'hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen sticky top-0 h-screen select-none transition-colors duration-200',
    brandHeader: 'p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3',
    brandBadge:
      'w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 tracking-wide',
    brandTitle: 'text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider',
    brandSubtitle: 'text-[11px] font-semibold text-rose-600 dark:text-rose-400',
    navScrollArea: 'flex-1 overflow-y-auto p-4 space-y-6 phc-scroll',
    groupSection: 'space-y-1',
    groupTitle: 'px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5',
    navLink: 'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
    navLinkActive:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold shadow-2xs border border-rose-200/60 dark:border-rose-900/60',
    navLinkIdle:
      'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60',
    navIcon: 'text-base shrink-0 transition-transform group-hover:scale-110',
    navIconActive: 'text-rose-600 dark:text-rose-400',
    footer: 'p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/30',
    statusBadge:
      'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold',
    statusDot: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse',
    footerText: 'px-1 text-[10px] text-slate-400 dark:text-slate-500',
    // Legacy keys kept for safety
    nav: 'flex flex-col gap-1',
    item: 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors',
    itemIdle: 'text-content-muted hover:bg-surface-muted hover:text-content',
    itemActive: 'bg-brand-gradient font-semibold text-white shadow-sm',
    itemGroupActive: 'bg-surface-muted font-semibold text-brand-accent',
    icon: 'text-xl',
    chevron: 'ml-auto text-lg transition-transform',
    chevronOpen: 'rotate-180',
    subList: 'ml-5 mt-1 flex flex-col gap-0.5 border-l border-line pl-3',
    subItem: 'block rounded-lg px-3 py-2 text-sm transition-colors',
    subIdle: 'text-content-muted hover:text-content',
    subActive: 'font-semibold text-brand-accent',
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

  /** Welcome banner. Solid professional surface. */
  banner: {
    root: 'relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm',
    decor: 'hidden',
    content: 'relative z-10',
    eyebrow: 'text-xs font-bold uppercase tracking-widest text-brand-accent',
    title: 'mt-1 text-3xl font-extrabold text-content',
    subtitle: 'mt-1 text-sm text-content-muted',
  },

  /** Top-row metric cards. Solid tiles with subtle elevation. */
  metric: {
    tile: 'flex items-center gap-4 rounded-2xl border p-5 shadow-sm',
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
      'inline-block rounded-lg bg-red-50 border border-red-200 px-3 py-1 text-sm font-extrabold text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300',
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