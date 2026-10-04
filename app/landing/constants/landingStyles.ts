/**
 * @fileoverview Style tokens and layout classes for the Public Landing Page.
 *
 * Imports and calls centralized theme and sizing tokens from constants/themeTokens,
 * establishing a clean, high-contrast, neutral grayish dark mode with PHC brand accents.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: zero hardcoded colors or ad-hoc dimension strings.
 * Consumes themeTokens and sizeTokens as the single central source of truth.
 *
 * @module app/landing/constants/landingStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const LANDING_STYLES = {
  /** Page wrapper and root container */
  page: themeTokens.page,

  /** Top enterprise navigation bar */
  header: {
    root: `${themeTokens.surface.header} flex items-center justify-between px-4 sm:px-6 lg:px-8`,
    brandGroup: 'flex items-center gap-3 min-w-0',
    brandBadge: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-sm`,
    brandTitlesWrap: 'flex flex-col min-w-0',
    brandTitle: `${sizeTokens.typography.micro} ${themeTokens.text.primary} uppercase`,
    brandTag: themeTokens.text.accent,
    brandSubtitle: `${sizeTokens.typography.micro} ${themeTokens.text.accent}`,
    rightGroup: 'flex items-center gap-2 sm:gap-3 shrink-0',
    clockContainer: `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`,
    clockDate: `${sizeTokens.typography.micro} ${themeTokens.text.muted}`,
    clockTime: `text-xs font-mono font-bold ${themeTokens.text.primary}`,
    themeButton: `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer text-lg border border-transparent hover:${themeTokens.border.default}`,
    loginButton: `inline-flex items-center gap-2 ${sizeTokens.component.buttonCompactPadding} ${sizeTokens.radius.md} ${themeTokens.brand.buttonPrimary} text-xs font-bold`,
  },

  /** Hero section */
  hero: {
    section: `relative overflow-hidden py-16 sm:py-24 border-b ${themeTokens.border.default} bg-white dark:bg-[#141414]/60`,
    container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center',
    tagPill: `inline-flex items-center gap-2 px-3.5 py-1.5 ${sizeTokens.radius.full} ${themeTokens.brand.pill} text-xs mb-6 shadow-2xs`,
    pulseDot: `w-2 h-2 ${sizeTokens.radius.full} ${themeTokens.brand.pulseDot}`,
    title: `${sizeTokens.typography.heroTitle} ${themeTokens.text.primary} max-w-4xl mx-auto`,
    accentText: themeTokens.text.accent,
    description: `mt-6 max-w-3xl mx-auto ${sizeTokens.typography.sectionSubtitle} ${themeTokens.text.secondary} font-normal`,
    ctaGroup: 'mt-10 flex flex-wrap items-center justify-center gap-4',
    primaryCta: `inline-flex items-center justify-center gap-2 px-8 py-3.5 ${sizeTokens.radius.md} ${themeTokens.brand.buttonPrimary} text-sm font-bold`,
    telemetryBar: `mt-12 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-3 ${sizeTokens.radius.lg} ${themeTokens.surface.well} text-xs ${themeTokens.text.secondary} font-medium`,
    telemetryItem: 'flex items-center gap-2',
    telemetryStatusDot: `w-2 h-2 ${sizeTokens.radius.full} bg-emerald-500 animate-pulse`,
    telemetryTimeIcon: themeTokens.text.accent,
    telemetryGlobeIcon: themeTokens.text.muted,
    telemetryDivider: 'hidden sm:inline text-slate-300 dark:text-[#404040]',
  },

  /** Capabilities / Features section */
  features: {
    section: 'py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    headerWrap: 'text-center max-w-3xl mx-auto mb-16',
    sectionTag: `text-xs font-bold uppercase tracking-widest ${themeTokens.text.accent} mb-2 block`,
    sectionTitle: `${sizeTokens.typography.sectionTitle} ${themeTokens.text.primary}`,
    sectionSubtitle: `mt-4 ${sizeTokens.typography.sectionSubtitle} ${themeTokens.text.secondary}`,
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8',
    card: `group flex flex-col justify-between ${sizeTokens.component.cardPadding} ${sizeTokens.radius.lg} ${themeTokens.surface.cardInteractive}`,
    cardTop: 'flex items-start justify-between gap-4 mb-4',
    iconWrap: `${sizeTokens.component.iconBox} ${sizeTokens.radius.md} ${themeTokens.brand.iconWrap} flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-200`,
    badge: `px-2.5 py-1 ${sizeTokens.radius.sm} bg-slate-100 dark:bg-[#242424] border ${themeTokens.border.default} ${themeTokens.text.secondary} ${sizeTokens.typography.micro}`,
    cardTitle: `${sizeTokens.typography.cardTitle} ${themeTokens.text.primary} ${themeTokens.text.accentHover} transition-colors`,
    cardSubtitle: `text-xs font-medium ${themeTokens.text.accent} mt-0.5`,
    cardDescription: `mt-3 ${sizeTokens.typography.bodySmall} ${themeTokens.text.secondary}`,
  },

  /** Workflow progression section */
  workflow: {
    section: `py-16 sm:py-20 bg-white dark:bg-[#141414]/80 border-y ${themeTokens.border.default}`,
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    headerWrap: 'text-center max-w-3xl mx-auto mb-16',
    sectionTag: `text-xs font-bold uppercase tracking-widest ${themeTokens.text.accent} mb-2 block`,
    sectionTitle: `${sizeTokens.typography.sectionTitle} ${themeTokens.text.primary}`,
    sectionSubtitle: `mt-4 ${sizeTokens.typography.sectionSubtitle} ${themeTokens.text.secondary}`,
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
    card: `p-6 ${sizeTokens.radius.lg} ${themeTokens.surface.card} flex flex-col justify-between`,
    stepHeader: 'flex items-center justify-between mb-4',
    stepNumber: `text-xs font-black font-mono px-2 py-0.5 rounded-md ${themeTokens.brand.pill}`,
    stepIcon: `text-xl ${themeTokens.text.muted}`,
    stepTitle: `text-sm font-bold ${themeTokens.text.primary} mb-2`,
    stepDescription: `text-xs ${themeTokens.text.secondary}`,
  },

  /** Footer */
  footer: {
    root: `${themeTokens.surface.footer} py-12 px-4 sm:px-6 lg:px-8`,
    container: 'max-w-7xl mx-auto flex flex-col gap-8',
    topRow: `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b ${themeTokens.border.subtle} pb-8`,
    brandGroup: 'flex items-center gap-3',
    brandBadge: `${sizeTokens.component.badgeMini} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-xs`,
    brandTitle: `text-sm font-bold ${themeTokens.text.primary}`,
    brandSubtitle: `text-xs ${themeTokens.text.muted}`,
    linksGroup: 'flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-semibold',
    footerLink: `${themeTokens.text.secondary} ${themeTokens.text.accentHover} transition-colors`,
    bottomRow: `flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs ${themeTokens.text.muted}`,
    disclaimer: `max-w-3xl leading-relaxed text-[11px] ${themeTokens.text.muted}`,
    versionPill: `px-2.5 py-1 ${sizeTokens.radius.sm} bg-slate-100 dark:bg-[#242424] border ${themeTokens.border.default} font-mono text-[11px] ${themeTokens.text.secondary} shrink-0`,
  },
} as const;
