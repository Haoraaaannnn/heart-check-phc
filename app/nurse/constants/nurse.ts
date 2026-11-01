/**
 * @fileoverview Architectural constants, theme tokens, and inline style dictionaries
 * for the Nurse Dashboard (`app/nurse/`).
 *
 * Adheres strictly to AGENTS.md separation-of-concerns guidelines.
 * All styling dictionaries, dimension tokens, and color maps are centralized here.
 * Zero emojis in accordance with repository standards.
 */

import { CSSProperties } from 'react';
import { StageConfig } from '@/app/nurse/types/nurse';

// Re-export text copy for unified feature-level access
export { nurseTexts } from '@/app/nurse/constants/nurseTexts';

/** Dimension and layout tokens for nurse dashboard */
export const nurseLayoutTokens = {
  sidebarWidthExpanded: '280px',
  sidebarWidthCollapsed: '64px',
  headerHeight: '64px',
  touchTargetMin: '44px',
  columnMinWidth: '320px',
  drawerWidth: '640px',
} as const;

/** Color tokens specific to nurse dashboard clinical indicators */
export const nurseColorTokens = {
  brandRed: '#cc3535',
  brandRedLight: '#fee2e2',
  brandRedDark: '#991b1b',
  assignedBlue: '#2563eb',
  assignedBlueBg: '#eff6ff',
  assignedBlueBorder: '#bfdbfe',
  doctorPurple: '#7c3aed',
  doctorPurpleBg: '#f5f3ff',
  doctorPurpleBorder: '#ddd6fe',
  carryoutOrange: '#ea580c',
  carryoutOrangeBg: '#fff7ed',
  carryoutOrangeBorder: '#fed7aa',
  doneGreen: '#16a34a',
  doneGreenBg: '#f0fdf4',
  doneGreenBorder: '#bbf7d0',
  warningAmber: '#d97706',
  warningAmberLight: '#fef3c7',
  borderSubtle: '#e2e8f0',
  cardBg: '#ffffff',
} as const;

/**
 * Stage configuration descriptors for clinical pipeline columns.
 */
export const STAGE_CONFIGS: Record<'assigned' | 'with_doctor' | 'carryout', StageConfig> = {
  assigned: {
    id: 'assigned',
    titleKey: 'stageAssignedHeading',
    badgeColor: 'text-blue-600 dark:text-blue-400 font-extrabold',
    borderColor: 'border-blue-200 dark:border-blue-900/60',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
    emptyStateTextKey: 'emptyAssigned',
    warnAfterSeconds: 900, // 15 minutes
    nextStageId: 'with_doctor',
  },
  with_doctor: {
    id: 'with_doctor',
    titleKey: 'stageWithDoctorHeading',
    badgeColor: 'text-purple-600 dark:text-purple-400 font-extrabold',
    borderColor: 'border-purple-200 dark:border-purple-900/60',
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
    emptyStateTextKey: 'emptyWithDoctor',
    warnAfterSeconds: 600, // 10 minutes
    nextStageId: 'carryout',
    previousStageId: 'assigned',
  },
  carryout: {
    id: 'carryout',
    titleKey: 'stageCarryoutHeading',
    badgeColor: 'text-orange-600 dark:text-orange-400 font-extrabold',
    borderColor: 'border-orange-200 dark:border-orange-900/60',
    bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
    emptyStateTextKey: 'emptyCarryout',
    warnAfterSeconds: 600, // 10 minutes
    nextStageId: 'done',
    previousStageId: 'with_doctor',
  },
};

/**
 * CSSProperties dictionaries for layout panels and components.
 */
export const NurseStyle = {
  viewportContainer: {
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  } as CSSProperties,

  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
    transition: 'margin-left 300ms ease-in-out',
  } as CSSProperties,

  headerBar: {
    height: nurseLayoutTokens.headerHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    flexShrink: 0,
    zIndex: 20,
  } as CSSProperties,

  boardContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.25rem',
    minHeight: 0,
    overflow: 'hidden',
  } as CSSProperties,

  stageColumn: {
    borderRadius: '0',
    borderStyle: 'solid',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    boxShadow: 'none',
    transition: 'all 200ms ease',
  } as CSSProperties,

  stageColumnHeader: {
    padding: '0.875rem 1.25rem',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  } as CSSProperties,

  stageColumnContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    minHeight: 0,
  } as CSSProperties,

  activeDropzone: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#10b981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
  } as CSSProperties,

  assignTargetCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#10b981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
  } as CSSProperties,

  selectedPatientRow: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#cc3535',
    boxShadow: '0 0 0 2px rgba(204, 53, 53, 0.25)',
  } as CSSProperties,

  selectionBanner: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  } as CSSProperties,

  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 40,
    display: 'flex',
    justifyContent: 'flex-end',
  } as CSSProperties,

  drawerContent: {
    width: '100%',
    maxWidth: nurseLayoutTokens.drawerWidth,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 50,
  } as CSSProperties,
} as const;

/**
 * Standard semantic styles for the NurseQuickActionDropdown modal dialog and action cards.
 * Conforms strictly to AGENTS.md Rule 2 and Rule 10 (high-contrast solid surfaces).
 */
export const nurseQuickActionStyles = {
  backdrop:
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150',
  panel:
    'w-full max-w-sm sm:max-w-md bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-150',
  header:
    'px-5 py-3.5 bg-surface-muted border-b border-line flex items-center justify-between',
  ticketNumber:
    'font-black text-xl text-[#cc3535] dark:text-[#f87171] tracking-tight shrink-0',
  title: 'text-base font-bold text-content truncate',
  subtitle: 'text-xs text-content-muted truncate mt-0.5',
  closeHeaderBtn:
    'w-8 h-8 rounded-lg text-content-muted hover:text-content hover:bg-surface border border-transparent hover:border-line flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40',
  body: 'p-3.5 space-y-2',
  actionBtnIdle:
    'w-full flex items-center justify-between p-3 rounded-xl border border-line bg-surface-muted hover:bg-surface dark:hover:bg-[#202020] transition-all text-left select-none cursor-pointer active:scale-[0.99] group shadow-2xs',
  actionBtnDisabled:
    'w-full flex items-center justify-between p-3 rounded-xl border border-line bg-surface-muted/50 opacity-40 cursor-not-allowed text-left select-none',
  actionTitle: 'text-base font-bold text-content transition-colors',
  actionDesc: 'text-sm text-content-muted transition-colors',
  footer:
    'px-5 py-3 bg-surface-muted border-t border-line flex items-center justify-between',
  footerHint: 'text-xs text-content-muted font-medium',
  closeFooterBtn:
    'px-4 py-2 rounded-xl text-sm font-bold min-h-[38px] text-content bg-surface hover:bg-surface-muted border border-line shadow-2xs hover:shadow-xs transition cursor-pointer disabled:opacity-40',
} as const;
