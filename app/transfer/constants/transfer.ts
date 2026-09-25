/**
 * @fileoverview Architectural constants, theme tokens, and inline style dictionaries
 * for the Patient Transfer dashboard (`app/transfer/`).
 *
 * Adheres strictly to AGENTS.md separation-of-concerns guidelines.
 */

import { CSSProperties } from 'react';
import { themeColors } from '@/constants/colors';

// Re-export text copy for unified feature-level access
export { transferTexts } from './transferTexts';

/** Dimension and layout tokens for transfer dashboard */
export const transferLayoutTokens = {
  sidebarWidth: '16rem', // 256px
  sidebarWidthCollapsed: '4.5rem', // 72px
  maxCardWidth: '780px',
  counterMinHeight: '120px',
  cubicleMinHeight: '130px',
  queueMaxHeight: '440px',
  touchTargetMin: '44px',
} as const;

/** Color tokens specific to transfer dashboard status indicators */
export const transferColorTokens = {
  brandRed: '#cc3535',
  brandRedLight: '#fee2e2',
  brandRedDark: '#991b1b',
  activeGreen: '#16a34a',
  activeGreenLight: '#dcfce7',
  warningAmber: '#d97706',
  warningAmberLight: '#fef3c7',
  counterBlue: '#2563eb',
  counterBlueLight: '#dbeafe',
  neutralBg: '#f8fafc',
  borderNeutral: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
} as const;

/**
 * CSSProperties dictionaries for layout panels and components.
 */
export const TransferStyle = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    position: 'relative',
    overflowX: 'hidden',
  } as CSSProperties,

  mainContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
  } as CSSProperties,

  twoColumnBoard: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 380px) 1fr',
    gap: '1.5rem',
    alignItems: 'start',
  } as CSSProperties,

  panelCard: {
    backgroundColor: '#ffffff',
    borderRadius: '1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  } as CSSProperties,

  activeDropzone: {
    borderColor: '#cc3535',
    backgroundColor: '#fff1f2',
    boxShadow: '0 0 0 3px rgba(204, 53, 53, 0.2)',
  } as CSSProperties,

  lockedPatientRow: {
    opacity: 0.65,
    cursor: 'not-allowed',
    filter: 'grayscale(0.2)',
  } as CSSProperties,

  unlockedPatientRow: {
    opacity: 1,
    cursor: 'grab',
  } as CSSProperties,
} as const;
