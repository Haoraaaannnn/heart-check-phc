/**
 * @file categoryCards.ts
 * @description Centralized visual styles and Tailwind utility classes for category selection cards.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { fontSizeBody } from "@/constants/kiosk";

/** Theme colors for the Adult and Pedia category buttons. */
export const categoryCardsTheme = {
    adultColor: themeColors.brandRed,
    pediaColor: themeColors.skyBlue,
    iconFill: themeColors.white,
    titleColor: themeColors.black,
    cardSubtitleColor: "#6B7280",
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB",
    adultCtaColor: "#B91C1C",
    pediaCtaColor: "#0369A1",
} as const;

/** Spacing tokens for category cards. */
export const categoryCardsSpacing = {
    cardsGap: "clamp(18px, 2.5vw, 32px)",
    cardPadding: "clamp(24px, 3.5vw, 40px)",
    iconPadding: 16,
    iconSize: 64,
    ctaMarginTop: 8,
} as const;

/** Typography tokens for category cards. */
export const categoryCardsTypography = {
    cardTitle: "clamp(24px, 2.6vw, 34px)",
    cardSubtitle: "clamp(14px, 1.4vw, 18px)",
    cta: fontSizeBody.Body2,
} as const;

/** Inline styles for the category cards grid and buttons. */
export const CategoryCardsStyle = {
    cardsGrid: {
        display: "grid",
        width: "100%",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: categoryCardsSpacing.cardsGap,
    },
    card: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: categoryCardsTheme.cardBorder,
        backgroundColor: categoryCardsTheme.cardBg,
        padding: categoryCardsSpacing.cardPadding,
        textAlign: "center",
        cursor: "pointer",
    },
    adultIconTile: {
        width: 88,
        height: 88,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: categoryCardsSpacing.iconPadding,
        backgroundColor: categoryCardsTheme.adultColor,
    },
    pediaIconTile: {
        width: 88,
        height: 88,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: categoryCardsSpacing.iconPadding,
        backgroundColor: categoryCardsTheme.pediaColor,
    },
    cardTitle: {
        display: "block",
        fontSize: categoryCardsTypography.cardTitle,
        fontWeight: 900,
        color: categoryCardsTheme.titleColor,
        lineHeight: 1.2,
    },
    cardSubtitle: {
        display: "block",
        marginTop: 4,
        fontSize: categoryCardsTypography.cardSubtitle,
        fontWeight: 700,
        color: categoryCardsTheme.cardSubtitleColor,
    },
    ctaAdult: {
        marginTop: categoryCardsSpacing.ctaMarginTop,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: categoryCardsTheme.adultCtaColor,
        fontWeight: 700,
        fontSize: categoryCardsTypography.cta,
    },
    ctaPedia: {
        marginTop: categoryCardsSpacing.ctaMarginTop,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: categoryCardsTheme.pediaCtaColor,
        fontWeight: 700,
        fontSize: categoryCardsTypography.cta,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for category cards. */
export const CategoryCardsClasses = {
    adultCard: "group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-lg",
    pediaCard: "group transition-all duration-150 active:scale-95 hover:border-sky-400 hover:shadow-lg",
    iconTile: "transition-transform group-hover:scale-105",
    cta: "group-hover:translate-x-1 transition-transform",
} as const;
