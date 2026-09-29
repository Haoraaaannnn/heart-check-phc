import type { CSSProperties } from "react";

/**
 * Global header font sizes in px.
 * Plain numbers so they can be used directly in inline `style` objects
 * (React appends "px" to numeric values for properties like `fontSize`).
 */
export const fontSizeHeader = {
  Header1: 40,
  Header2: 30,
  Header3: 24,
} as const;

/**
 * Global body / label font sizes in px.
 *
 * Used across kiosk screens for subtitle, secondary, and fine-print text
 * so every page shares a single typographic scale.
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
 *
 * @remarks
 * Defines standard fluid `clamp()` and numeric scales used across the entire
 * kiosk module. Feature-scoped constants import and alias these values,
 * ensuring all typography can be tuned or scaled from this single root file.
 */
export const kioskTypography = {
  // Page / Section Headings
  pageTitle: "clamp(28px, 3.2vw, 44px)",
  pageSubtitle: "clamp(18px, 2vw, 28px)",
  heroTitle: "clamp(32px, 3.5vw, 54px)",

  // Selection & Service Cards
  cardTitle: "clamp(22px, 2vw, 30px)",
  cardSubtitle: "clamp(14px, 1.4vw, 18px)",
  cardCategoryTitle: "clamp(24px, 2.6vw, 34px)",
  cardCubicleTitle: "clamp(20px, 2vw, 28px)",
  cardBadge: "clamp(13px, 1.2vw, 18px)",

  // Pills, Badges & Small Tags
  badgeSmall: "clamp(12px, 1.2vw, 16px)",
  badgeMedium: "clamp(14px, 1.4vw, 18px)",
  badgeLarge: "clamp(16px, 1.6vw, 24px)",

  // Banners & Section Headers
  bannerTitle: "clamp(24px, 3vw, 42px)",
  bannerBadge: "clamp(16px, 1.6vw, 24px)",
  bannerSubtitle: "clamp(12px, 1.2vw, 16px)",

  // Modals & Descriptions
  modalTitle: "clamp(20px, 2.2vw, 24px)",
  modalBadge: 13,
  descriptionTitle: "clamp(16px, 1.6vw, 22px)",
  descriptionText: "clamp(16px, 1.6vw, 22px)",
  descriptionBadge: "clamp(14px, 1.4vw, 18px)",

  // Action Buttons & CTAs
  buttonText: "clamp(18px, 1.8vw, 24px)",
  buttonSmall: "clamp(15px, 1.4vw, 18px)",
  ctaText: 20,

  // Numeric Input, Phone & Keypad
  phoneDigits: "clamp(24px, 3.2vw, 36px)",
  numPadKey: "clamp(30px, 3.8vw, 48px)",
  instructionPrimary: "clamp(20px, 2.2vw, 30px)",
  instructionSecondary: "clamp(15px, 1.5vw, 20px)",

  // Ticket Printing & Queue Numbers
  ticketServiceTitle: "clamp(24px, 3.5vw, 36px)",
  ticketQueueLabel: "clamp(14px, 1.4vw, 16px)",
  ticketQueueNumber: "clamp(48px, 7vw, 96px)",
  ticketNoticePrimary: "clamp(14px, 1.4vw, 20px)",
  ticketNoticeSecondary: "clamp(12px, 1.2vw, 16px)",

  // Footer & Status Bar
  footerBrand: "clamp(20px, 2.4vw, 34px)",
  footerTime: "clamp(20px, 2.4vw, 34px)",
  footerDate: "clamp(12px, 1.4vw, 18px)",
} as const;

/**
 * Alias for {@link kioskTypography} for developer convenience.
 */
export const fontSizeKiosk = kioskTypography;

