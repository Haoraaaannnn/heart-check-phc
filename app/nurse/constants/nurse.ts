/**
 * @fileoverview Architectural constants, theme tokens, and inline style dictionaries
 * for the Nurse Dashboard (`app/nurse/`).
 *
 * Adheres strictly to AGENTS.md separation-of-concerns guidelines.
 * All styling dictionaries, dimension tokens, and color maps are centralized here.
 * Zero emojis in accordance with repository standards.
 */

import { CSSProperties } from 'react';
import { StageConfig } from '../types/nurse';

// Re-export text copy for unified feature-level access
export { nurseTexts } from './nurseTexts';

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
    badgeColor: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50/50',
    emptyStateTextKey: 'emptyAssigned',
    warnAfterSeconds: 900, // 15 minutes
    nextStageId: 'with_doctor',
  },
  with_doctor: {
    id: 'with_doctor',
    titleKey: 'stageWithDoctorHeading',
    badgeColor: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50/50',
    emptyStateTextKey: 'emptyWithDoctor',
    warnAfterSeconds: 600, // 10 minutes
    nextStageId: 'carryout',
    previousStageId: 'assigned',
  },
  carryout: {
    id: 'carryout',
    titleKey: 'stageCarryoutHeading',
    badgeColor: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50/50',
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
    backgroundColor: '#f8fafc',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    flexShrink: 0,
    zIndex: 20,
  } as CSSProperties,

  boardContainer: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '1rem',
    padding: '1rem 1.5rem',
    minHeight: 0,
    overflow: 'hidden',
  } as CSSProperties,

  stageColumn: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 200ms ease',
  } as CSSProperties,

  stageColumnHeader: {
    padding: '0.875rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  } as CSSProperties,

  stageColumnContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
  } as CSSProperties,

  activeDropzone: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(236, 253, 245, 0.6)',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
  } as CSSProperties,

  assignTargetCard: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(236, 253, 245, 0.4)',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
  } as CSSProperties,

  selectedPatientRow: {
    borderColor: '#cc3535',
    backgroundColor: '#fff1f2',
    boxShadow: '0 0 0 2px rgba(204, 53, 53, 0.25)',
  } as CSSProperties,

  selectionBanner: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  } as CSSProperties,

  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 40,
    display: 'flex',
    justifyContent: 'flex-end',
  } as CSSProperties,

  drawerContent: {
    width: '100%',
    maxWidth: nurseLayoutTokens.drawerWidth,
    height: '100%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 50,
  } as CSSProperties,
} as const;
