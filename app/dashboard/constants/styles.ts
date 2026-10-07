import { cardSurface } from '@/constants/themes';
import { themeTokens, sizeTokens } from '@/constants/themeTokens';

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
export type ToneKey = 'rose' | 'blue' | 'green' | 'purple' | 'amber' | 'emerald';

export interface ToneStyle {
  /** Tinted tile background + border. */
  tile: string;
  /** Round icon badge. */
  icon: string;
}

export const TONES: Record<ToneKey, ToneStyle> = {
  rose: {
    tile: 'border-rose-200 bg-rose-50 dark:border-[#76000d]/50 dark:bg-[#76000d]/20',
    icon: 'bg-rose-100 text-rose-700 dark:bg-[#76000d]/60 dark:text-[#f87171]',
  },
  blue: {
    tile: 'border-slate-200 bg-slate-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-slate-100 text-slate-700 dark:bg-[#242424] dark:text-[#f5f5f5]',
  },
  green: {
    tile: 'border-emerald-200 bg-emerald-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  emerald: {
    tile: 'border-emerald-200 bg-emerald-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  purple: {
    tile: 'border-purple-200 bg-purple-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  amber: {
    tile: 'border-amber-200 bg-amber-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
};

export const DASH = {
  /** Page-level structure adhering to the enterprise left-rail layout standard. */
  layout: {
    shell: `${themeTokens.page} flex`,
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
    pillActive: 'bg-[#a8071a] text-white shadow-2xs font-bold border border-[#a8071a]',
    pillIdle:
      `bg-surface-muted text-content-muted border ${themeTokens.border.default} hover:bg-surface hover:text-content`,
    badgeLive:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 select-none',
    badgeLiveDot: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse',
    badgeHistorical:
      `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-[#242424] border ${themeTokens.border.default} ${themeTokens.text.secondary} select-none`,
    badgeHistoricalIcon: 'text-xs text-slate-400',
    spinner: 'h-3 w-3 animate-spin text-current',
  },

  /** Responsive mobile slide-over drawer */
  drawer: {
    backdrop: `fixed inset-0 z-50 ${themeTokens.surface.backdrop} lg:hidden transition-opacity`,
    panel: `fixed inset-y-0 left-0 z-50 w-72 ${themeTokens.surface.drawerPanel} flex flex-col justify-between lg:hidden`,
    closeButton: `p-2 ${themeTokens.text.muted} hover:${themeTokens.text.primary} ${sizeTokens.radius.sm} hover:bg-slate-100 dark:hover:bg-[#242424]`,
  },

  /** Top sticky header bar with breadcrumbs, Manila clock, and profile chip. */
  header: {
    root: `${themeTokens.surface.header} flex items-center justify-between px-4 sm:px-6 lg:px-8`,
    leftGroup: 'flex items-center gap-3 min-w-0',
    hamburgerButton: `lg:hidden p-2 ${sizeTokens.radius.sm} ${themeTokens.text.secondary} hover:bg-slate-100 dark:hover:bg-[#242424] transition cursor-pointer`,
    breadcrumbs: `flex items-center gap-2 text-xs font-medium ${themeTokens.text.secondary} hidden sm:flex whitespace-nowrap`,
    breadcrumbActive: `${themeTokens.text.primary} font-semibold whitespace-nowrap`,
    breadcrumbSeparator: `${themeTokens.text.muted} shrink-0`,
    rightGroup: 'flex items-center gap-2.5 sm:gap-3 shrink-0',
    searchWrap: 'hidden xl:flex items-center mx-4 max-w-xs w-full',
    searchInner: 'relative w-full',
    searchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400',
    searchInput:
      `w-full ${sizeTokens.radius.md} border ${themeTokens.border.default} bg-slate-50 dark:bg-[#1f1f1f] py-1.5 pl-8 pr-16 text-xs ${themeTokens.text.primary} placeholder:text-slate-400 focus:border-[#a8071a] focus:outline-hidden transition`,
    searchKbd:
      `absolute right-2.5 top-1/2 -translate-y-1/2 rounded border ${themeTokens.border.default} px-1.5 py-0.5 text-[10px] font-semibold ${themeTokens.text.muted}`,
    clock: `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`,
    clockContainer: `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`,
    clockDate: `${sizeTokens.typography.micro} ${themeTokens.text.muted}`,
    clockTime: `text-xs font-mono font-bold ${themeTokens.text.primary}`,
    themeButton:
      `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer text-lg border border-transparent hover:${themeTokens.border.default}`,
    userChip:
      `flex items-center gap-2 px-2.5 py-1.5 ${sizeTokens.radius.md} bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default}`,
    userAvatar:
      `w-7 h-7 ${sizeTokens.radius.sm} bg-[#a8071a]/15 text-[#a8071a] dark:bg-[#a8071a]/30 dark:text-[#f87171] flex items-center justify-center font-bold text-xs`,
    userEmail: `text-xs font-semibold ${themeTokens.text.primary} hidden sm:inline whitespace-nowrap`,
    roleTag: 'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#a8071a] text-white',
    signOutButton:
      `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-[#a8071a] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 dark:hover:text-[#f87171] transition cursor-pointer text-lg`,
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
    root: `hidden lg:flex flex-col w-64 shrink-0 ${themeTokens.surface.sidebar} min-h-screen sticky top-0 h-screen select-none`,
    brandHeader: `p-5 border-b ${themeTokens.border.default} flex items-center gap-3`,
    brandBadge:
      `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-sm tracking-wide`,
    brandTitle: `text-xs font-bold ${themeTokens.text.primary} uppercase tracking-wider`,
    brandSubtitle: `text-[11px] font-semibold ${themeTokens.text.accent}`,
    navScrollArea: 'flex-1 overflow-y-auto p-4 space-y-6 phc-scroll',
    groupSection: 'space-y-1',
    groupTitle: `px-3 text-[10px] font-bold ${themeTokens.text.muted} uppercase tracking-widest mb-1.5`,
    navLink: `flex items-center gap-3 px-3 py-2 ${sizeTokens.radius.md} text-xs font-medium transition-all duration-150 group`,
    navLinkActive:
      `bg-[#a8071a]/10 text-[#a8071a] dark:bg-[#a8071a]/20 dark:text-[#f87171] font-semibold shadow-2xs border border-[#a8071a]/30`,
    navLinkIdle:
      `${themeTokens.text.secondary} hover:${themeTokens.text.primary} hover:bg-slate-100/80 dark:hover:bg-[#242424]`,
    navIcon: 'text-base shrink-0 transition-transform group-hover:scale-110',
    navIconActive: themeTokens.text.accent,
    footer: `p-4 border-t ${themeTokens.border.default} space-y-2 bg-slate-50/50 dark:bg-[#141414]/50`,
    statusBadge:
      'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold',
    statusDot: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse',
    footerText: `px-1 text-[10px] ${themeTokens.text.muted}`,
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
    filterSelect: `rounded-lg border ${themeTokens.border.default} bg-slate-50 dark:bg-[#1f1f1f] px-3 py-1.5 text-xs font-semibold ${themeTokens.text.primary} outline-none`,
    selectOption: themeTokens.surface.selectOption,
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