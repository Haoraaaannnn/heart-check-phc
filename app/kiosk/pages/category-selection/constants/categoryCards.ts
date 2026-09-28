/**
 * @file categoryCards.ts
 * @description Centralized visual styles and Tailwind utility classes for category selection cards.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography, fontSizeBody } from "@/constants/kiosk";
import { SUBCATEGORY_ICONS, COMMON_ICONS } from "@/constants/icons";

/** Boxicons class tokens for age category selection cards. */
export const CategoryCardsIcons = {
    adult: SUBCATEGORY_ICONS.Adult,
    pedia: SUBCATEGORY_ICONS.Pedia,
    arrow: COMMON_ICONS.arrowRight,
} as const;

/** Theme colors for the Adult and Pedia category buttons. */
export const categoryCardsTheme = {
    adultColor: themeColors.brandRed,
    pediaColor: themeColors.brandRed,
    titleColor: themeColors.black,
    cardSubtitleColor: "#4B5563",
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB",
    adultCtaColor: "#B91C1C",
    pediaCtaColor: "#B91C1C",
} as const;

/**
 * Spacing tokens for category cards.
 */
export const categoryCardsSpacing = {
    cardsGap: "clamp(16px, 2vw, 24px)",
    paddingX: "clamp(20px, 2.5vw, 32px)",
    paddingY: 20,
    iconSize: 72,
    arrowSize: 36,
} as const;

/**
 * Typography tokens for category cards, referencing centralized root typography scale.
 */
export const categoryCardsTypography = {
    cardTitle: kioskTypography.cardCategoryTitle,
    cardBadge: kioskTypography.badgeMedium,
    cardSubtitle: kioskTypography.cardSubtitle,
    cta: kioskTypography.ctaText,
} as const;

/**
 * Inline styles for the category cards grid, cards, labels, and icons.
 *
 * @remarks
 * Uses horizontal flex alignment matching other kiosk buttons:
 * icon on left, labels in center (with gray divider line between Filipino and English),
 * and directional arrow on right.
 */
export const CategoryCardsStyle = {
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: categoryCardsTheme.cardBorder,
        backgroundColor: categoryCardsTheme.cardBg,
        paddingLeft: categoryCardsSpacing.paddingX,
        paddingRight: categoryCardsSpacing.paddingX,
        paddingTop: categoryCardsSpacing.paddingY,
        paddingBottom: categoryCardsSpacing.paddingY,
        textAlign: "left",
        overflow: "hidden",
        cursor: "pointer",
    },
    iconWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    adultIconTile: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    pediaIconTile: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    icon: {
        fontSize: categoryCardsSpacing.iconSize,
        color: categoryCardsTheme.adultColor,
        lineHeight: 1,
    },
    adultIcon: {
        fontSize: categoryCardsSpacing.iconSize,
        color: categoryCardsTheme.adultColor,
        lineHeight: 1,
    },
    pediaIcon: {
        fontSize: categoryCardsSpacing.iconSize,
        color: categoryCardsTheme.pediaColor,
        lineHeight: 1,
    },
    labelsWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minWidth: 0,
        paddingLeft: 8,
    },
    cardTitle: {
        fontWeight: 900,
        fontSize: categoryCardsTypography.cardTitle,
        lineHeight: 1.2,
        color: categoryCardsTheme.titleColor,
        overflow: "hidden",
    },
    divider: {
        height: 2,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        marginTop: 8,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: categoryCardsTypography.cardSubtitle,
        fontWeight: 600,
        color: categoryCardsTheme.cardSubtitleColor,
        lineHeight: 1.3,
    },
    cardBadgeAdult: {
        marginTop: 6,
        width: "fit-content",
        display: "inline-block",
        backgroundColor: "rgba(254, 226, 226, 0.7)",
        border: "1px solid rgba(252, 165, 165, 0.6)",
        color: "#450a0a",
        fontWeight: 700,
        fontSize: categoryCardsTypography.cardBadge,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        lineHeight: 1,
    },
    cardBadgePedia: {
        marginTop: 6,
        width: "fit-content",
        display: "inline-block",
        backgroundColor: "rgba(254, 226, 226, 0.7)",
        border: "1px solid rgba(252, 165, 165, 0.6)",
        color: "#450a0a",
        fontWeight: 700,
        fontSize: categoryCardsTypography.cardBadge,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: categoryCardsSpacing.arrowSize,
        color: "#D7D6D6",
        lineHeight: 1,
    },
    cardsGrid: {
        display: "grid",
        width: "100%",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: categoryCardsSpacing.cardsGap,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for category cards. */
export const CategoryCardsClasses = {
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 py-4",
    adultCard: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    pediaCard: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    iconTile: "shrink-0",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
    cta: "transition-transform",
} as const;
