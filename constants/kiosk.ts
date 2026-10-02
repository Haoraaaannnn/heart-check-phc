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
// Kiosk min 30 max 40
// 28 min 48max
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

