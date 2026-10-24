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

import { CSSProperties } from "react";

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
  pageTitle: "clamp(28px, 4vw, 54px)",
  pageSubtitle: "clamp(16px, 2vw, 26px)",
  heroTitle: "clamp(26px, 3.4vw, 54px)",

  // Selection & Service Cards
  cardTitle: "clamp(20px, 2.5vw, 36px)",
  cardSubtitle: "clamp(14px, 1.8vw, 24px)",
  cardCategoryTitle: "clamp(18px, 2.2vw, 32px)",
  cardCubicleTitle: "clamp(16px, 1.8vw, 26px)",
  cardBadge: "clamp(12px, 1.2vw, 16px)",

  // Pills, Badges & Small Tags
  badgeSmall: "clamp(12px, 1.2vw, 15px)",
  badgeMedium: "clamp(13px, 1.4vw, 16px)",
  badgeLarge: "clamp(14px, 1.6vw, 20px)",

  // Banners & Section Headers (bannerSubtitle scaled to 5-8px below bannerTitle)
  bannerTitle: "clamp(28px, 3.6vw, 48px)",
  bannerBadge: "clamp(15px, 1.8vw, 22px)",
  bannerSubtitle: "clamp(22px, 2.9vw, 40px)",

  // Modals & Descriptions (+10 font size boost for high visibility)
  modalTitle: "clamp(30px, 3.2vw, 36px)",
  modalBadge: 24,
  descriptionTitle: "clamp(26px, 2.6vw, 32px)",
  descriptionText: "clamp(24px, 2.5vw, 30px)",
  descriptionBadge: "clamp(23px, 2.3vw, 26px)",

  // Action Buttons & CTAs
  buttonText: "clamp(16px, 1.8vw, 24px)",
  buttonSmall: "clamp(14px, 1.4vw, 18px)",
  ctaText: 22,

  // Numeric Input, Phone & Keypad
  phoneDigits: "clamp(24px, 3.2vw, 40px)",
  numPadKey: "clamp(24px, 3.4vw, 44px)",
  instructionPrimary: "clamp(16px, 2vw, 28px)",
  instructionSecondary: "clamp(13px, 1.5vw, 18px)",

  // Ticket Printing & Queue Numbers
  ticketServiceTitle: "clamp(22px, 3.2vw, 36px)",
  ticketQueueLabel: "clamp(14px, 1.4vw, 16px)",
  ticketQueueNumber: "clamp(44px, 7vw, 96px)",
  ticketNoticePrimary: "clamp(14px, 1.4vw, 20px)",
  ticketNoticeSecondary: "clamp(12px, 1.2vw, 16px)",

  // Footer & Status Bar (scaled to match bannerSubtitle per user requirement)
  footerBrand: "clamp(22px, 2.9vw, 40px)",
  footerTime: "clamp(22px, 2.9vw, 40px)",
  footerDate: "clamp(14px, 1.8vw, 24px)",
} as const;

/**
 * Alias for {@link kioskTypography} for developer convenience.
 */
export const fontSizeKiosk = kioskTypography;

/**
 * Standardized constant card dimensions for all Kiosk screens and components.
 */
export const kioskCardDimensions = {
  cardMinHeight: "clamp(96px, 11vh, 150px)",
  cardPaddingX: "clamp(14px, 2vmin, 28px)",
  cardPaddingY: "clamp(10px, 1.4vh, 20px)",
  cardGap: "clamp(10px, 1.4vmin, 18px)",
  iconWrapperWidth: "clamp(40px, 4.2vmin, 68px)",
  iconFontSize: "clamp(36px, 4.2vmin, 68px)",
  arrowFontSize: "clamp(22px, 2.2vmin, 32px)",
  gridGap: "clamp(12px, 1.8vmin, 24px)",
  gridPaddingX: "clamp(10px, 1.4vmin, 20px)",
  gridAutoRows: "1fr",
} as const;

/**
 * Centralized, shared banner typography tokens used across all kiosk headers.
 */
export const sharedKioskBannerTypography = {
  titleSize: kioskTypography.bannerTitle,
  subtitleSize: kioskTypography.bannerSubtitle,
  bannerTitleSize: kioskTypography.bannerTitle,
  bannerSubtitleSize: kioskTypography.bannerSubtitle,
  titleWeight: 900,
  subtitleWeight: 600,
  titleColor: "#0F172A",
  subtitleColor: "#475569",
} as const;

const sharedBannerContainerStyle: CSSProperties = {
  width: "100%",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 4,
  paddingBottom: 4,
  margin: 0,
};

const sharedBannerTitleStyle: CSSProperties = {
  fontSize: kioskTypography.bannerTitle,
  fontWeight: 900,
  lineHeight: 1.2,
  color: "#0F172A",
  margin: 0,
  whiteSpace: "nowrap",
};

const sharedBannerSubtitleStyle: CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: kioskTypography.bannerSubtitle,
  fontWeight: 600,
  lineHeight: 1.25,
  color: "#475569",
  whiteSpace: "nowrap",
};

/**
 * Single source of truth for banner inline styles across the entire kiosk.
 * Guarantees that entrance, services, category, cubicle, SMS, and ticket screens
 * share identical font sizes, line heights, margins, and zero text wrapping.
 */
export const sharedKioskBannerStyle = {
  container: sharedBannerContainerStyle,
  header: sharedBannerContainerStyle,
  title: sharedBannerTitleStyle,
  Title: sharedBannerTitleStyle,
  bannerTitle: sharedBannerTitleStyle,
  headerTitle: sharedBannerTitleStyle,
  subtitle: sharedBannerSubtitleStyle,
  bannerSubtitle: sharedBannerSubtitleStyle,
  headerSubtitle: sharedBannerSubtitleStyle,
} satisfies Record<string, CSSProperties>;

