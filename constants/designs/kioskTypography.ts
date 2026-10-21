/**
 * @fileoverview Centralized typography and dimension constants for the Kiosk design system.
 *
 * Defines fluid clamp() typography scales, header/body font sizes, and card dimensions
 * used across all kiosk screens to enforce visual harmony.
 *
 * @remarks
 * Conforms to AGENTS.md:
 * - Centralized under constants/designs/kioskTypography.ts.
 * - Strictly zero emojis in code, comments, and strings.
 *
 * @module constants/designs/kioskTypography
 */

/**
 * Global header font sizes in px.
 */
export const fontSizeHeader = {
  Header1: 40,
  Header2: 30,
  Header3: 24,
} as const;

/**
 * Global body / label font sizes in px.
 */
export const fontSizeBody = {
  /** Primary subtitle / instruction text (e.g. category sub-labels). */
  Body1: 26,
  /** Secondary text (e.g. bilingual instruction line). */
  Body2: 20,
  /** Small labels (e.g. English translations below Filipino headings). */
  Body3: 18,
  /** Fine text (e.g. supplementary info). */
  Body4: 16,
} as const;

/**
 * Centralized global font size scale for all Kiosk screens and components.
 */
export const kioskTypography = {
  // Page / Section Headings
  pageTitle: "clamp(40px, 4.5vw, 50px)",
  pageSubtitle: "clamp(18px, 2.2vw, 28px)",
  heroTitle: "clamp(34px, 4vw, 56px)",

  // Selection & Service Cards
  cardTitle: "clamp(30px, 3.4vw, 40px)",
  cardSubtitle: "clamp(20px, 2.5vw, 30px)",
  cardCategoryTitle: "clamp(24px, 2.8vw, 36px)",
  cardCubicleTitle: "clamp(20px, 2.2vw, 30px)",
  cardBadge: "clamp(14px, 1.4vw, 18px)",

  // Pills, Badges & Small Tags
  badgeSmall: "clamp(13px, 1.3vw, 16px)",
  badgeMedium: "clamp(15px, 1.5vw, 18px)",
  badgeLarge: "clamp(16px, 1.8vw, 24px)",

  // Banners & Section Headers
  bannerTitle: "clamp(24px, 3.2vw, 42px)",
  bannerBadge: "clamp(16px, 1.8vw, 24px)",
  bannerSubtitle: "clamp(14px, 1.4vw, 18px)",

  // Modals & Descriptions
  modalTitle: "clamp(22px, 2.5vw, 28px)",
  modalBadge: 14,
  descriptionTitle: "clamp(18px, 1.8vw, 24px)",
  descriptionText: "clamp(16px, 1.8vw, 22px)",
  descriptionBadge: "clamp(14px, 1.5vw, 18px)",

  // Action Buttons & CTAs
  buttonText: "clamp(18px, 2vw, 26px)",
  buttonSmall: "clamp(15px, 1.6vw, 20px)",
  ctaText: 22,

  // Numeric Input, Phone & Keypad
  phoneDigits: "clamp(28px, 3.8vw, 44px)",
  numPadKey: "clamp(32px, 4.2vw, 52px)",
  instructionPrimary: "clamp(20px, 2.4vw, 32px)",
  instructionSecondary: "clamp(16px, 1.8vw, 22px)",

  // Ticket Printing & Queue Numbers
  ticketServiceTitle: "clamp(26px, 3.8vw, 40px)",
  ticketQueueLabel: "clamp(16px, 1.6vw, 18px)",
  ticketQueueNumber: "clamp(54px, 8vw, 108px)",
  ticketNoticePrimary: "clamp(16px, 1.6vw, 22px)",
  ticketNoticeSecondary: "clamp(13px, 1.3vw, 18px)",

  // Footer & Status Bar
  footerBrand: "clamp(20px, 2.4vw, 34px)",
  footerTime: "clamp(20px, 2.4vw, 34px)",
  footerDate: "clamp(13px, 1.4vw, 18px)",
} as const;

/**
 * Alias for {@link kioskTypography} for developer convenience.
 */
export const fontSizeKiosk = kioskTypography;

/**
 * Standardized constant card dimensions for all Kiosk screens and components.
 */
export const kioskCardDimensions = {
  cardMinHeight: "clamp(125px, 13.5vh, 165px)",
  cardPaddingX: "clamp(20px, 2.6vmin, 36px)",
  cardPaddingY: "clamp(16px, 1.8vh, 24px)",
  cardGap: "clamp(14px, 1.8vmin, 22px)",
  iconWrapperWidth: "clamp(52px, 5.2vmin, 76px)",
  iconFontSize: "clamp(48px, 5.2vmin, 76px)",
  arrowFontSize: "clamp(26px, 2.6vmin, 36px)",
  gridGap: "clamp(16px, 2.2vmin, 28px)",
  gridPaddingX: "clamp(12px, 1.5vmin, 24px)",
  gridAutoRows: "1fr",
} as const;
