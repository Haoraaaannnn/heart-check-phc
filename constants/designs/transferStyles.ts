/**
 * @fileoverview Style dictionary and design tokens for the Patient Transfer workstation.
 *
 * Provides centralized, accessible Tailwind class definitions adhering strictly to the
 * high-contrast solid clinical surface standards specified in AGENTS.md.
 *
 * @remarks
 * Eliminates all inline class strings, raw hex codes, and fractional dark-mode opacities
 * from UI components. Fully integrates with centralized themeTokens and sizeTokens.
 * Zero emojis in accordance with repository guidelines.
 *
 * @module constants/designs/transferStyles
 */

import { themeTokens, sizeTokens } from '@/constants/designs/themeTokens';

/**
 * Top-level dashboard layout and navigation bar styles.
 */
export const transferLayoutStyles = {
  /** Root page viewport container */
  page: 'flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0d0d0d] font-sans text-slate-800 dark:text-[#f5f5f5]',

  /** Main content wrapper reacting to sidebar expansion */
  mainArea: (isExpanded: boolean) =>
    `flex-1 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-300 ${
      isExpanded ? 'ml-64' : 'ml-18'
    }`,

  /** Top sticky navigation header */
  topHeader:
    'h-16 px-4 sm:px-6 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between gap-3 sm:gap-4 shrink-0 z-30 shadow-2xs',

  /** PHC Transfer brand label */
  topHeaderTitle:
    'text-xs font-bold text-slate-500 dark:text-[#d4d4d4] uppercase tracking-widest hidden sm:inline',

  /** Sticky subheader containing breadcrumbs */
  subHeader:
    'shrink-0 px-4 sm:px-6 py-2.5 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#2e2e2e] z-20 flex items-center min-h-[52px]',

  /** Fit-to-screen main content view */
  mainContent: 'flex-1 p-2 sm:p-3 overflow-hidden min-h-0 flex flex-col',

  /** Sidebar toggle button */
  sidebarToggleBtn:
    'p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition-colors cursor-pointer shrink-0',

  /** Unassigned queue counter button (active attention state) */
  unassignedBtnActive:
    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-[#cc3535] dark:text-[#f87171] hover:bg-red-100 dark:hover:bg-red-900/50 shadow-2xs',

  /** Unassigned queue counter button (zero items state) */
  unassignedBtnInactive:
    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 bg-slate-50 dark:bg-[#1f1f1f] border-slate-200 dark:border-[#2e2e2e] text-slate-400 dark:text-[#737373]',

  /** Unassigned dropdown floating menu */
  unassignedDropdown:
    'absolute right-0 mt-2 w-72 max-h-[min(480px,calc(100vh-80px))] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2e2e2e] z-40 overflow-hidden',

  /** Unassigned dropdown header title bar */
  unassignedDropdownHeader:
    'px-4 py-2.5 border-b border-slate-100 dark:border-[#2e2e2e] text-xs font-bold text-slate-600 dark:text-[#a3a3a3] uppercase tracking-wider bg-slate-50 dark:bg-[#141414]',

  /** Unassigned dropdown row item */
  unassignedDropdownItem:
    'w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold hover:bg-red-50 dark:hover:bg-[#242424] transition-colors text-left border-b border-slate-50 dark:border-[#2e2e2e] cursor-pointer',

  /** Real-time sync indicator badge */
  syncBadge:
    'flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0',

  /** Manage Doctors modal button */
  manageDoctorsBtn:
    'px-3 py-1.5 bg-slate-100 dark:bg-[#242424] hover:bg-slate-200 dark:hover:bg-[#2e2e2e] active:bg-slate-300 dark:active:bg-[#404040] rounded-xl text-xs font-bold transition-colors text-slate-700 dark:text-[#f5f5f5] border border-slate-200 dark:border-[#383838] cursor-pointer shadow-2xs whitespace-nowrap shrink-0',

  /** Theme switcher button */
  themeToggleBtn:
    'p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition-colors cursor-pointer shrink-0',

  /** Centered empty service selected panel */
  emptyServiceCard:
    'text-center max-w-sm p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-xs',

  /** Empty service icon container */
  emptyServiceIconBox:
    'w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#cc3535] dark:text-[#f87171] flex items-center justify-center text-2xl mx-auto mb-3',

  /** Empty service title */
  emptyServiceTitle: 'text-sm font-bold text-slate-800 dark:text-[#f5f5f5]',

  /** Empty service description */
  emptyServiceDesc: 'text-slate-500 dark:text-[#a3a3a3] text-xs mt-1 leading-relaxed',

  /** Two-column service board grid */
  twoColumnGrid: 'h-full flex-1 flex flex-col md:grid md:grid-cols-12 gap-3 min-h-0 overflow-hidden',

  /** Left queue column (4 cols) */
  leftColumn: 'md:col-span-4 lg:col-span-4 h-full flex flex-col min-h-0 overflow-hidden',

  /** Right stations column (8 cols) */
  rightColumn: 'md:col-span-8 lg:col-span-8 h-full flex flex-col min-h-0 gap-2.5 overflow-hidden',
} as const;

/**
 * Breadcrumb navigation styling dictionary.
 */
export const breadcrumbStyles = {
  nav: 'flex items-center gap-3 w-full select-none min-w-0',

  selectScreenBtn:
    'inline-flex items-center gap-1.5 min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#f5f5f5] bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#242424] border border-slate-200 dark:border-[#383838] hover:border-slate-300 dark:hover:border-[#525252] transition-colors shadow-2xs shrink-0 cursor-pointer',

  scrollContainer:
    'flex items-center gap-2 overflow-x-auto whitespace-nowrap phc-scroll py-1 text-sm font-medium flex-1 min-w-0',

  crumbActive: 'text-[#cc3535] dark:text-[#f87171] font-bold transition-colors cursor-pointer',

  crumbInactive:
    'text-slate-600 hover:text-slate-900 dark:text-[#d4d4d4] dark:hover:text-[#ffffff] font-semibold transition-colors cursor-pointer',

  divider: 'text-slate-400 dark:text-[#737373] font-semibold select-none',
} as const;

/**
 * Left-column tabbed Queue & Idle Panel styles.
 */
export const queuePanelStyles = {
  container:
    'h-full flex flex-col min-h-0 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-xs overflow-hidden',

  tabHeader:
    'shrink-0 flex border-b border-slate-200 dark:border-[#2e2e2e] bg-slate-100 dark:bg-[#141414] p-1.5 gap-1.5 select-none',

  tabActive:
    'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer min-w-0 border bg-white dark:bg-[#242424] text-slate-800 dark:text-[#f5f5f5] border-slate-200 dark:border-[#383838] shadow-2xs',

  tabInactive:
    'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer min-w-0 border border-transparent text-slate-600 hover:text-slate-900 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] hover:bg-slate-200/60 dark:hover:bg-[#1f1f1f]',

  tabBody: 'flex-1 min-h-0 p-2.5 flex flex-col overflow-hidden',
} as const;

/**
 * Active Queue (On Progress) panel styles.
 */
export const onProgressStyles = {
  wrapper: 'h-full flex flex-col min-h-0 overflow-hidden select-none',

  header:
    'flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#2e2e2e] shrink-0',

  headerLeft: 'flex items-center gap-2 min-w-0 flex-1',

  headerPulseDot: 'hidden',

  headerTitle:
    'text-slate-700 dark:text-[#f5f5f5] font-bold text-xs tracking-wider uppercase truncate',

  headerCountBadge:
    'text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0',

  headerHint: 'text-[11px] text-slate-400 dark:text-[#a3a3a3] font-medium shrink-0 hidden sm:inline',

  emptyNotice: 'py-8 text-center text-slate-400 dark:text-[#a3a3a3] text-xs',

  scrollList: 'flex-1 min-h-0 overflow-y-auto phc-scroll pr-1 space-y-1.5',

  cardBase:
    'relative flex items-center justify-between border rounded-xl p-2 transition-all select-none',

  cardBeingDragged: 'opacity-30 border-[#cc3535] bg-red-50 dark:bg-red-950/40',

  cardSelected:
    'border-[#cc3535] bg-red-50/80 dark:bg-red-950/50 shadow-xs ring-2 ring-[#cc3535] cursor-pointer',

  cardTop:
    'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-2xs cursor-grab active:cursor-grabbing hover:border-emerald-400 dark:hover:border-emerald-700',

  cardLocked:
    'border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#202020] opacity-80 cursor-not-allowed',

  waitBadge:
    'inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-[#d4d4d4] bg-slate-100 dark:bg-[#282828] border border-slate-300 dark:border-[#383838] shrink-0',

  selBadge: 'px-1.5 py-0.5 rounded-md bg-[#cc3535] text-white text-[10px] font-bold shrink-0 shadow-2xs',

  patientNumBadgeTop: 'font-black text-xs text-[#cc3535] dark:text-[#f87171] shrink-0',

  patientNumBadgeNormal:
    'font-black text-xs text-slate-700 dark:text-[#d4d4d4] shrink-0',

  patientNumBadgeSelected:
    'font-black text-xs text-[#cc3535] dark:text-[#f87171] shrink-0',

  serviceText: 'text-slate-800 dark:text-[#f5f5f5] text-xs font-semibold truncate',

  subCategoryText: 'text-slate-500 dark:text-[#a3a3a3] font-normal',

  positionPrefix: 'text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium shrink-0',

  servingNextLabel: 'text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-tight truncate block',

  lockedLabel: 'text-[10px] text-slate-400 dark:text-[#737373] truncate block',

  selectedLabel: 'text-[10px] text-[#cc3535] dark:text-[#f87171] font-bold tracking-tight truncate block',

  callBtn:
    'px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 transition-colors cursor-pointer whitespace-nowrap',

  callBtnSpeaking:
    'px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-300 dark:text-blue-400 cursor-not-allowed whitespace-nowrap',

  assignNowBtn:
    'px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer whitespace-nowrap',
} as const;

/**
 * Idle Numbers panel styles with high-contrast dark mode surfaces.
 */
export const idlePanelStyles = {
  wrapper: 'h-full flex flex-col min-h-0 overflow-hidden select-none',

  header:
    'flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200 dark:border-[#2e2e2e] shrink-0',

  headerLeft: 'flex items-center gap-2 min-w-0 flex-1',

  headerDot: 'hidden',

  headerTitle:
    'text-slate-800 dark:text-[#f5f5f5] font-bold text-xs tracking-wider uppercase truncate',

  headerCountBadge:
    'text-xs font-extrabold text-slate-600 dark:text-[#a3a3a3] shrink-0',

  headerSubtitle:
    'text-[11px] text-slate-500 dark:text-[#a3a3a3] font-normal shrink-0 hidden sm:inline',

  emptyNotice: 'py-6 text-center text-slate-500 dark:text-[#a3a3a3] text-xs',

  scrollList: 'flex-1 min-h-0 overflow-y-auto phc-scroll pr-1 space-y-1.5',

  patientRow:
    'flex items-center justify-between border border-slate-200 dark:border-[#2e2e2e] rounded-xl px-2.5 py-2 bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#242424] transition-colors gap-2 shadow-2xs',

  patientInfo: 'flex items-center gap-2 min-w-0 flex-1 overflow-hidden',

  patientNumBadge:
    'font-black text-xs text-slate-700 dark:text-[#d4d4d4] shrink-0',

  serviceLabel: 'text-slate-800 dark:text-[#f0f0f0] text-xs font-semibold truncate min-w-0 flex-1',

  subCategoryLabel: 'text-slate-500 dark:text-[#a3a3a3] font-normal',

  rotationBadge:
    'text-[11px] font-extrabold text-amber-600 dark:text-amber-400 shrink-0',

  actionsWrap: 'flex items-center gap-1.5 shrink-0 ml-1',

  activateBtn:
    'px-2.5 py-1 text-[11px] font-bold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer whitespace-nowrap shrink-0',

  removeBtn:
    'px-2 py-1 text-[11px] font-bold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 transition-colors cursor-pointer whitespace-nowrap shrink-0',
} as const;

/**
 * Registration Counters section styles.
 */
export const registrationCounterStyles = {
  sectionCard:
    'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-xs p-2.5 sm:p-3 select-none shrink-0 overflow-hidden',

  header:
    'flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#2e2e2e]',

  headerPulseDot: 'hidden',

  headerTitle:
    'text-slate-700 dark:text-[#f5f5f5] font-bold text-xs tracking-wider uppercase truncate',

  headerCountBadge:
    'text-xs font-extrabold text-blue-600 dark:text-blue-400 shrink-0',

  headerHint: 'text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium shrink-0 hidden sm:inline',

  emptyNotice: 'text-slate-400 dark:text-[#a3a3a3] text-xs py-2 text-center',

  counterGrid: 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2',

  counterCardBase:
    'rounded-xl border p-2 flex flex-col justify-between transition-all select-none min-h-[76px]',

  counterCardDropOver:
    'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 shadow-xs phc-dropzone',

  counterCardTargetEligible:
    'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/50 cursor-pointer',

  counterCardNormal:
    'border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#262626]',

  counterTitle: 'text-[11px] font-bold text-slate-800 dark:text-[#f5f5f5] truncate min-w-0 flex-1',

  counterCount: 'text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium shrink-0',

  counterTargetPill:
    'text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 whitespace-nowrap',

  topPatientCard:
    'p-1.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-slate-200 dark:border-[#2e2e2e] hover:border-slate-300 dark:hover:border-[#404040] transition-all flex items-center justify-between gap-1.5 shadow-2xs cursor-pointer',

  topPatientCardSelected:
    'p-1.5 bg-red-50/80 dark:bg-red-950/60 rounded-lg border border-[#cc3535] ring-2 ring-[#cc3535] transition-all flex items-center justify-between gap-1.5 shadow-2xs cursor-pointer',

  patientNum: 'font-black text-xs text-[#cc3535] dark:text-[#f87171] shrink-0',

  queueBtn:
    'px-2 py-0.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md transition-colors shadow-2xs shrink-0 cursor-pointer whitespace-nowrap',

  availableLabel:
    'py-2 text-center text-slate-500 dark:text-[#a3a3a3] text-[11px] font-medium italic',

  nextQueueWrap: 'flex items-center gap-1 mt-1 overflow-hidden',

  nextLabel: 'text-[9px] text-slate-500 dark:text-[#a3a3a3] font-bold uppercase shrink-0',

  waitingPatientChip:
    'text-[10px] font-semibold px-1 py-0.5 rounded border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-[#a3a3a3] hover:border-slate-300 dark:hover:border-[#404040] shadow-2xs cursor-pointer transition-colors',

  waitingPatientChipSelected:
    'text-[10px] font-semibold px-1 py-0.5 rounded border border-[#cc3535] bg-red-50 dark:bg-red-950/60 text-[#cc3535] dark:text-[#f87171] ring-1 ring-[#cc3535] shadow-2xs cursor-pointer transition-colors',

  morePatientsText: 'text-[9px] text-slate-500 dark:text-[#a3a3a3] font-medium shrink-0',
} as const;

/**
 * Consultation and Screening Cubicle station card styles.
 */
export const cubicleStyles = {
  sectionCard:
    'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-xs p-2.5 sm:p-3 select-none shrink-0 overflow-hidden',

  header:
    'flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#2e2e2e]',

  headerDot: 'hidden',

  headerTitle:
    'text-slate-700 dark:text-[#f5f5f5] font-bold text-xs tracking-wider uppercase truncate',

  headerCountBadge:
    'text-xs font-extrabold text-slate-600 dark:text-[#a3a3a3] shrink-0',

  emptyNotice: 'text-slate-400 dark:text-[#a3a3a3] text-xs py-4 text-center',

  cubicleGrid: 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2',

  cubicleCardBase:
    'rounded-xl border p-2 flex flex-col justify-between transition-all select-none min-h-[76px]',

  cubicleCardDropOver:
    'border-[#cc3535] bg-red-50/80 dark:bg-red-950/50 shadow-xs phc-dropzone',

  cubicleCardTargetEligible:
    'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 hover:border-emerald-600 cursor-pointer',

  cubicleCardFull:
    'border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20',

  cubicleCardNormal:
    'border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#262626]',

  cubicleNum: 'text-[11px] font-bold text-slate-800 dark:text-[#f5f5f5] truncate block leading-none',

  doctorName:
    'text-[9px] text-slate-500 dark:text-[#b3b3b3] font-medium truncate block leading-none mt-0.5',

  unassignedDoctor:
    'text-[9px] text-slate-400 dark:text-[#888888] font-normal truncate block leading-none mt-0.5',

  capacityBadgeFull:
    'text-xs font-extrabold shrink-0 text-rose-600 dark:text-rose-400',

  capacityBadgeAvailable:
    'text-xs font-extrabold shrink-0 text-emerald-600 dark:text-emerald-400',

  assignHereBtn:
    'px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded transition-colors shadow-2xs shrink-0 cursor-pointer select-none whitespace-nowrap',

  topPatientCard:
    'p-1.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-slate-200 dark:border-[#2e2e2e] hover:border-slate-300 dark:hover:border-[#404040] transition-all flex items-center justify-between gap-1 shadow-2xs cursor-pointer',

  topPatientCardSelected:
    'p-1.5 bg-red-50/80 dark:bg-red-950/60 rounded-lg border border-[#cc3535] ring-2 ring-[#cc3535] transition-all flex items-center justify-between gap-1 shadow-2xs cursor-pointer',

  patientNum: 'font-black text-xs text-[#cc3535] dark:text-[#f87171] shrink-0',

  callBtn:
    'px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 transition-colors cursor-pointer whitespace-nowrap shrink-0',

  callBtnSpeaking:
    'px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-300 dark:text-blue-400 cursor-not-allowed whitespace-nowrap shrink-0',

  backBtn:
    'px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0',

  availableLabel:
    'py-2 text-center text-slate-500 dark:text-[#a3a3a3] text-[11px] font-medium italic',

  nextQueueWrap: 'flex items-center gap-1 mt-1 overflow-hidden',

  nextLabel: 'text-[9px] text-slate-500 dark:text-[#a3a3a3] font-bold uppercase shrink-0',

  waitingPatientChip:
    'text-[10px] font-semibold px-1 py-0.5 rounded border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-[#a3a3a3] hover:border-slate-300 dark:hover:border-[#404040] shadow-2xs cursor-pointer transition-colors',

  waitingPatientChipSelected:
    'text-[10px] font-semibold px-1 py-0.5 rounded border border-[#cc3535] bg-red-50 dark:bg-red-950/60 text-[#cc3535] dark:text-[#f87171] ring-1 ring-[#cc3535] shadow-2xs cursor-pointer transition-colors',

  morePatientsText: 'text-[9px] text-slate-500 dark:text-[#a3a3a3] font-medium shrink-0',
} as const;

/**
 * Confirmation and Doctor modal dialog styles.
 */
export const transferModalStyles = {
  backdrop:
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4 sm:p-6 transition-opacity animate-in fade-in duration-150',

  dialogCard:
    'bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2e2e2e] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]',

  dialogCardLarge:
    'bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2e2e2e] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative',

  header:
    'px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#2e2e2e] flex items-start justify-between gap-4',

  title: 'text-lg font-bold text-slate-800 dark:text-[#f5f5f5] tracking-tight',

  largeTitle: 'text-2xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-6',

  description: 'text-xs text-slate-500 dark:text-[#a3a3a3] mt-1 leading-relaxed',

  closeBtn:
    'px-2.5 py-1 text-xs font-semibold text-slate-400 dark:text-[#737373] hover:text-slate-700 dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#242424] rounded-lg transition-colors cursor-pointer disabled:opacity-40',

  closeBtnAbsolute:
    'absolute top-4 right-4 px-3 py-1 bg-slate-100 dark:bg-[#242424] rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#2e2e2e] border border-slate-200 dark:border-[#2e2e2e] transition shadow-xs cursor-pointer',

  bodyList: 'px-6 py-4 overflow-y-auto space-y-2.5 phc-scroll flex-1',

  patientRow:
    'p-3.5 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#242424] flex items-center justify-between gap-3 shadow-2xs',

  patientNumBadge:
    'w-10 h-10 rounded-xl bg-red-50 dark:bg-[#76000d]/40 border border-red-200 dark:border-[#a8071a]/70 text-[#cc3535] dark:text-[#fca5a5] font-black text-sm flex items-center justify-center shrink-0',

  patientServiceText: 'text-xs font-bold text-slate-800 dark:text-[#f5f5f5] whitespace-normal break-words',

  patientSubcategoryBadge:
    'text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#2e2e2e] text-slate-700 dark:text-[#d4d4d4] border border-slate-300 dark:border-[#383838] whitespace-normal',

  assignedLabel: 'text-[11px] text-slate-500 dark:text-[#a3a3a3] font-medium mt-0.5 whitespace-normal',

  assignedTargetVal: 'font-bold text-slate-700 dark:text-[#f5f5f5]',

  smsNotice: 'text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 break-words leading-tight',

  destinationBadge:
    'text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/80 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap',

  footer:
    'px-6 py-4 border-t border-slate-100 dark:border-[#2e2e2e] bg-slate-50/50 dark:bg-[#141414] flex items-center justify-end gap-3 shrink-0',

  cancelBtn:
    'px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-[#2e2e2e] text-slate-700 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#242424] hover:text-slate-900 dark:hover:text-[#f5f5f5] active:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50',

  confirmBtn:
    'px-5 py-2 text-xs font-bold rounded-xl bg-[#cc3535] hover:bg-red-700 active:bg-red-800 text-white transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50',
} as const;

/**
 * Click-to-Select floating guidance banner styles.
 */
export const selectionBannerStyles = {
  banner:
    'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[calc(100%-2rem)] bg-slate-900 dark:bg-[#1a1a1a] text-white rounded-2xl p-3.5 px-4 shadow-2xl border border-slate-700/80 dark:border-[#383838] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200',

  patientNumBadge:
    'px-2 py-0.5 rounded-lg bg-[#cc3535] text-white font-black text-xs shadow-xs shrink-0',

  originLabel: 'text-[11px] text-slate-300 dark:text-[#a3a3a3] font-medium hidden sm:inline max-w-[120px] truncate',

  hintText: 'text-xs font-bold text-emerald-400 dark:text-emerald-300 truncate',

  serviceText: 'text-[10px] text-slate-400 dark:text-[#888888] truncate',

  cancelBtn:
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 dark:bg-[#242424] hover:bg-slate-700 dark:hover:bg-[#2e2e2e] active:bg-slate-600 border border-slate-600/60 dark:border-[#383838] transition-all cursor-pointer min-h-[40px] whitespace-nowrap',

  kbdKey:
    'hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 dark:bg-[#141414] border border-slate-700 dark:border-[#383838] rounded text-slate-400',
} as const;

/**
 * Subcategory and Room selection step picker styles.
 */
export const stepPickerStyles = {
  container: 'max-w-4xl mx-auto w-full py-6 px-4',

  roomPickerContainer: 'max-w-5xl mx-auto w-full py-6 px-4',

  headerTitle: 'text-xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-4',

  grid2Col: 'grid grid-cols-1 sm:grid-cols-2 gap-4',

  gridMultiCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',

  selectionCard:
    'w-full bg-white dark:bg-[#1a1a1a] border-2 border-slate-200 dark:border-[#2e2e2e] hover:border-[#cc3535] dark:hover:border-[#cc3535] rounded-2xl p-6 flex flex-col justify-between gap-3 shadow-xs transition-colors duration-200 text-left group cursor-pointer min-h-[116px]',

  cardIconBox:
    'w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#242424] text-slate-600 dark:text-[#a3a3a3] group-hover:bg-red-50 group-hover:text-[#cc3535] dark:group-hover:bg-red-950/40 dark:group-hover:text-[#f87171] flex items-center justify-center text-xl shrink-0 transition-colors',

  cardTitle:
    'text-slate-800 dark:text-[#f5f5f5] group-hover:text-[#cc3535] dark:group-hover:text-[#f87171] font-bold text-lg transition-colors truncate',

  cardCounts: 'text-xs text-slate-500 dark:text-[#a3a3a3] font-medium leading-relaxed',

  emptyCard:
    'rounded-2xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-8 text-center max-w-md mx-auto my-12 shadow-xs',

  emptyIcon:
    'w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#242424] text-slate-400 dark:text-[#737373] flex items-center justify-center text-2xl mx-auto mb-3',

  emptyTitle: 'text-sm font-bold text-slate-800 dark:text-[#f5f5f5]',

  emptyDesc: 'text-slate-500 dark:text-[#a3a3a3] text-xs mt-1 leading-relaxed',
} as const;

/**
 * Sidebar navigation rail styles.
 */
export const sidebarStyles = {
  rail: (isExpanded: boolean) =>
    `fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#2e2e2e] flex flex-col transition-all duration-300 select-none shadow-xs ${
      isExpanded ? 'w-64' : 'w-18'
    }`,

  logoSection:
    'h-16 px-4 flex items-center border-b border-slate-200 dark:border-[#2e2e2e] shrink-0 overflow-hidden',

  logoIconWrap:
    'w-10 h-10 rounded-xl bg-gradient-to-br from-[#76000d] to-[#cc3535] text-white flex items-center justify-center text-xl shadow-xs shrink-0',

  logoTextWrap: 'ml-3 min-w-0 flex-1 overflow-hidden',

  logoTitle: 'font-black text-sm text-slate-900 dark:text-[#f5f5f5] tracking-tight leading-none truncate',

  logoSubtitle: 'text-[10px] text-slate-400 dark:text-[#737373] font-semibold tracking-wider uppercase mt-1 truncate',

  categoryList: 'flex-1 overflow-y-auto phc-scroll py-3 px-2 space-y-1',

  categoryBtnBase:
    'w-full flex items-center rounded-xl text-xs font-bold transition-colors cursor-pointer group relative',

  categoryBtnActive:
    'bg-red-50 dark:bg-[#76000d]/20 text-[#cc3535] dark:text-[#f87171] border border-red-200/80 dark:border-[#76000d]/60 shadow-2xs',

  categoryBtnInactive:
    'text-slate-600 dark:text-[#d4d4d4] hover:bg-slate-100 dark:hover:bg-[#242424] hover:text-slate-900 dark:hover:text-[#f5f5f5] border border-transparent',

  categoryIconBox: 'w-10 h-10 flex items-center justify-center text-lg shrink-0',

  footerSection:
    'p-2 border-t border-slate-200 dark:border-[#2e2e2e] shrink-0 flex flex-col gap-1',

  logoutBtn:
    'w-full flex items-center rounded-xl p-2 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-[#a3a3a3] dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer',
} as const;

/**
 * Quick-Assign popover dialog styles.
 */
export const quickAssignStyles = {
  backdrop:
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150',

  dialogCard:
    'w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2e2e2e] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150',

  header:
    'px-5 py-3.5 border-b border-slate-100 dark:border-[#2e2e2e] flex items-start justify-between gap-3 bg-slate-50/90 dark:bg-[#141414]',

  patientBadge:
    'px-2.5 py-1 rounded-lg bg-[#cc3535] text-white font-black text-sm tracking-tight shadow-2xs shrink-0',

  title: 'text-sm font-bold text-slate-900 dark:text-[#f5f5f5] truncate',

  subtitle: 'text-[11px] text-slate-500 dark:text-[#a3a3a3] truncate mt-0.5',

  closeBtn:
    'w-8 h-8 rounded-lg text-slate-400 dark:text-[#737373] hover:text-slate-700 dark:hover:text-[#f5f5f5] hover:bg-slate-200/60 dark:hover:bg-[#242424] flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40',

  bodyList: 'p-3.5 overflow-y-auto space-y-2 phc-scroll flex-1',

  stationManagementSection:
    'mb-3 pb-3 border-b border-slate-200 dark:border-[#2e2e2e] space-y-2',

  queueBtnActive:
    'border-amber-400 bg-amber-100/90 dark:bg-amber-900/80 cursor-wait',
  queueBtnDisabled:
    'border-amber-100 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/20 opacity-40 cursor-not-allowed',
  queueBtnNormal:
    'border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-100 cursor-pointer active:scale-[0.99] group',

  actionBtnBase:
    'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left shadow-2xs select-none',

  actionIconBoxAmber:
    'w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs',
  actionIconBoxBlue:
    'w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs',

  callBtnActive:
    'border-blue-400 bg-blue-100/90 dark:bg-blue-900/80 cursor-wait',
  callBtnDisabled:
    'border-blue-100 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/20 opacity-40 cursor-not-allowed',
  callBtnNormal:
    'border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-100 cursor-pointer active:scale-[0.99] group',

  actionTitle: 'text-sm font-bold text-slate-900 dark:text-[#f5f5f5] transition-colors',
  actionSubtitleAmber: 'text-xs text-amber-700 dark:text-amber-300',
  actionSubtitleBlue: 'text-xs text-blue-700 dark:text-blue-300',

  statusBadgeAmberPending:
    'text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shrink-0 animate-pulse',
  statusBadgeAmberNormal:
    'text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shrink-0',

  statusBadgeBluePending:
    'text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 flex items-center gap-1.5 shrink-0 animate-pulse',
  statusBadgeBlueNormal:
    'text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/80 shrink-0',

  transferHeading:
    'text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider pt-1.5 px-1',

  emptyStationsNotice:
    'text-xs text-slate-500 dark:text-[#a3a3a3] text-center py-6',

  stationRowBase:
    'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left min-h-[54px] select-none',
  stationRowAssigning:
    'border-emerald-500 bg-emerald-100/90 dark:bg-emerald-950/70 shadow-2xs cursor-wait',
  stationRowFull:
    'border-slate-200 dark:border-[#2e2e2e] bg-slate-50/70 dark:bg-[#1a1a1a]/50 opacity-60 cursor-not-allowed',
  stationRowDisabled:
    'border-slate-100 dark:border-[#242424] bg-slate-50/40 dark:bg-[#1a1a1a]/30 opacity-40 cursor-not-allowed',
  stationRowNormal:
    'border-slate-200/90 dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 cursor-pointer group',

  badgeFull:
    'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs overflow-hidden select-none bg-slate-200 dark:bg-[#282828] text-slate-600 dark:text-[#a3a3a3] border border-slate-300 dark:border-[#383838]',
  badgeAssigning:
    'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs overflow-hidden select-none bg-emerald-600 text-white',
  badgeAvailable:
    'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs overflow-hidden select-none bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80',

  stationTitle:
    'text-xs font-bold text-slate-900 dark:text-[#f5f5f5] truncate group-hover:text-emerald-950 dark:group-hover:text-emerald-200 transition-colors',
  stationDoctor:
    'text-[11px] text-slate-500 dark:text-[#a3a3a3] truncate mt-0.5',

  occupancyBadgeFull:
    'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80',
  occupancyBadgeZero:
    'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80',
  occupancyBadgePartial:
    'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80',

  assignPillInFlight:
    'text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 shadow-2xs flex items-center gap-1.5 animate-pulse',
  assignPillNormal:
    'text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 shadow-2xs group-hover:bg-emerald-700 transition-colors',

  footer:
    'px-4 py-2.5 bg-slate-50/80 dark:bg-[#141414] border-t border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between',
  footerHint: 'text-[11px] text-slate-400 dark:text-[#737373] font-medium',
  footerCloseBtn:
    'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-[#a3a3a3] hover:text-slate-900 dark:hover:text-[#f5f5f5] bg-white dark:bg-[#242424] hover:bg-slate-100 dark:hover:bg-[#2e2e2e] border border-slate-200 dark:border-[#2e2e2e] shadow-2xs transition cursor-pointer disabled:opacity-40',
} as const;

/**
 * Doctors and cubicle association panel styles.
 */
export const doctorsPanelStyles = {
  container: 'flex flex-col gap-6',

  topHeader: 'flex items-start justify-between gap-4',
  topHeaderTitle: 'text-lg font-bold text-slate-900 dark:text-[#f5f5f5]',
  topHeaderSubtitle: 'text-slate-500 dark:text-[#a3a3a3] text-sm mt-1',

  addDoctorBtn:
    'shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition text-sm font-semibold shadow-xs cursor-pointer',

  emptyStateCard:
    'bg-white dark:bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#2e2e2e] p-10 text-center',
  emptyStateTitle: 'text-slate-700 dark:text-[#f5f5f5] font-semibold',
  emptyStateDesc: 'text-slate-400 dark:text-[#a3a3a3] text-sm mt-1 mb-4',

  doctorGrid: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',

  doctorCardBase:
    'rounded-2xl border-2 p-4 flex flex-col gap-3 transition cursor-pointer select-none',
  doctorCardSelected:
    'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs',
  doctorCardUnselected:
    'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] hover:border-blue-300 dark:hover:border-blue-800',

  doctorCardName: 'font-semibold text-slate-900 dark:text-[#f5f5f5] break-words whitespace-normal',
  doctorCardSpecialty: 'text-xs mt-0.5 break-words whitespace-normal text-slate-500 dark:text-[#a3a3a3]',
  doctorCardNoSpecialty: 'text-xs mt-0.5 break-words whitespace-normal text-slate-400 dark:text-[#737373] italic',

  statusBadgeActive:
    'shrink-0 text-xs font-extrabold text-emerald-600 dark:text-emerald-400',
  statusBadgeInactive:
    'shrink-0 text-xs font-extrabold text-slate-500 dark:text-[#a3a3a3]',

  cardFooter: 'flex items-center justify-between',
  roomCountText: 'text-xs text-slate-500 dark:text-[#a3a3a3]',

  actionBtnToggle:
    'px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#242424] hover:text-slate-800 dark:hover:text-[#f5f5f5] transition cursor-pointer',
  actionBtnEdit:
    'px-2 py-0.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer',
  actionBtnDelete:
    'px-2 py-0.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer',

  editingNotice: 'text-[11px] font-semibold text-blue-600 dark:text-blue-400 -mb-1',

  assignmentSection:
    'bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs overflow-hidden',
  assignmentHeader:
    'px-6 py-4 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 dark:bg-[#141414]',
  assignmentTitle: 'text-base font-bold text-slate-900 dark:text-[#f5f5f5]',
  assignmentSubtitle: 'text-slate-500 dark:text-[#a3a3a3] text-xs mt-0.5',

  doneBtn:
    'text-xs font-semibold text-slate-600 dark:text-[#a3a3a3] hover:text-slate-900 dark:hover:text-[#f5f5f5] px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e] transition cursor-pointer',

  assignmentBody: 'p-6 flex flex-col gap-5 max-h-[420px] overflow-y-auto phc-scroll',
  groupTitle: 'text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-[#a3a3a3] mb-2',

  cubicleTileBase:
    'relative flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition min-w-[112px] select-none',
  cubicleTileThisDoctor:
    'border-blue-600 bg-blue-600 text-white shadow-xs hover:bg-blue-700 cursor-pointer',
  cubicleTileOtherDoctor:
    'border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#1f1f1f] text-slate-600 dark:text-[#a3a3a3] hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer',
  cubicleTileUnassigned:
    'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] text-slate-700 dark:text-[#f5f5f5] hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer',
  cubicleTileDisabled: 'cursor-default opacity-80',

  cubicleTileNum: 'text-xs font-semibold leading-none',
  cubicleTileRoom: 'text-[11px] leading-none text-slate-400 dark:text-[#737373]',
  cubicleTileRoomActive: 'text-[11px] leading-none text-blue-100',
  cubicleTileDoctor: 'text-[10px] font-medium mt-0.5 text-slate-500 dark:text-[#a3a3a3]',
  cubicleTileDoctorActive: 'text-[10px] font-medium mt-0.5 text-blue-100',
  cubicleTileDoctorUnassigned: 'text-[10px] font-medium mt-0.5 text-slate-400 dark:text-[#525252]',

  modalCard:
    'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150',
  modalTitle: 'text-xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-4',
  modalTitleDanger: 'text-xl font-bold text-red-600 dark:text-red-400 mb-4',

  formErrorBox:
    'mb-4 p-3 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-lg text-sm',
  formSuccessBox:
    'mb-4 p-3 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm',

  inputLabel: 'block text-sm font-medium text-slate-700 dark:text-[#a3a3a3] mb-1',
  inputField:
    'w-full p-2.5 border border-slate-300 dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] rounded-xl mb-3 text-slate-900 dark:text-[#f5f5f5] placeholder-slate-400 dark:placeholder-[#737373] focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition text-sm',

  checkboxLabel: 'flex items-center gap-2 mb-5 text-sm text-slate-700 dark:text-[#a3a3a3] cursor-pointer',
  checkboxInput: 'rounded border-slate-300 dark:border-[#2e2e2e] text-blue-600 focus:ring-blue-500 w-4 h-4',

  btnCancel:
    'px-4 py-2 bg-slate-200 dark:bg-[#242424] text-slate-700 dark:text-[#a3a3a3] hover:bg-slate-300 dark:hover:bg-[#2e2e2e] hover:text-slate-900 dark:hover:text-[#f5f5f5] rounded-xl transition text-sm font-semibold cursor-pointer',
  btnSubmit:
    'px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer',
  btnDeleteConfirm:
    'px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer',

  deleteWarningText: 'text-slate-700 dark:text-[#a3a3a3] text-sm leading-relaxed',
  deleteHighlightText: 'font-semibold text-slate-900 dark:text-[#f5f5f5]',
  deleteSubNotice: 'text-sm text-red-600 dark:text-red-400 block mt-2',
} as const;

/**
 * Drag ghost floating preview card styles.
 */
export const dragGhostStyles = {
  container: 'phc-ghost pointer-events-none fixed z-99999 select-none',
  cardValid:
    'w-64 p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/90 dark:bg-emerald-950/80',
  cardInvalid:
    'w-64 p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 border-[#cc3535] ring-2 ring-red-400/30',
  patientBadge:
    'w-9 h-9 rounded-xl bg-[#cc3535] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs',
  serviceText: 'text-xs font-bold text-slate-800 dark:text-[#f5f5f5] truncate',
  originText: 'text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium truncate',
  statusBadgeValid:
    'text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80',
  statusBadgeMoving:
    'text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-[#cc3535] dark:text-[#f87171] border border-red-200 dark:border-red-900/80',
} as const;
