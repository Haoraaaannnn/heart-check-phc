import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { fontSizeHeader, fontSizeBody } from "@/constants/kiosk";

// Re-export text copy for backward compatibility
export { categorySelectionTexts } from "./categorySelectionTexts";

/**
 * Spacing tokens for the unified age category selection screen.
 */
export const categorySelectionSpacing = {
    containerPaddingX: 24,
    contentGap: "clamp(24px, 4vh, 48px)",
    cardsGap: "clamp(18px, 2.5vw, 32px)",
    cardPadding: "clamp(24px, 3.5vw, 40px)",
    iconPadding: 16,
    iconSize: 64,
    ctaMarginTop: 8,
} as const;

/**
 * Typography tokens for the age category selection screen.
 */
export const categorySelectionFontSize = {
    title: "clamp(28px, 3.2vw, 42px)",
    subtitle: "clamp(18px, 2vw, 26px)",
    cardTitle: "clamp(24px, 2.6vw, 34px)",
    cardSubtitle: "clamp(14px, 1.4vw, 18px)",
    cta: fontSizeBody.Body2,
} as const;

/**
 * Font weight tokens for the age category selection screen.
 */
export const categorySelectionFontWeight = {
    normal: 400,
    medium: 500,
    bold: 700,
    black: 900,
} as const;

/**
 * Theme colours for the Adult and Pedia category buttons.
 */
export const categorySelectionTheme = {
    adultColor: themeColors.brandRed,
    pediaColor: themeColors.skyBlue,
    iconFill: themeColors.white,
    titleColor: themeColors.black,
    subtitleColor: "#4B5563", // gray-600
    cardSubtitleColor: "#6B7280", // gray-500
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB", // gray-300
    adultCtaColor: "#B91C1C", // red-700
    pediaCtaColor: "#0369A1", // sky-700
} as const;

/**
 * Inline style definitions for `CategorySelectionPage`, composed from the tokens above.
 * Applied via the `style` prop to ensure UI properties remain centralized and decoupled.
 */
export const CategorySelectionStyle = {
    container: {
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: categorySelectionSpacing.containerPaddingX,
        paddingRight: categorySelectionSpacing.containerPaddingX,
        overflowY: "auto",
    },
    contentWrapper: {
        margin: "auto",
        display: "flex",
        width: "100%",
        maxWidth: "960px",
        flexDirection: "column",
        alignItems: "center",
        gap: categorySelectionSpacing.contentGap,
    },
    header: {
        textAlign: "center",
        width: "100%",
    },
    title: {
        fontSize: categorySelectionFontSize.title,
        fontWeight: categorySelectionFontWeight.black,
        color: categorySelectionTheme.titleColor,
        lineHeight: 1.2,
        margin: 0,
    },
    subtitle: {
        marginTop: 8,
        fontSize: categorySelectionFontSize.subtitle,
        fontWeight: categorySelectionFontWeight.medium,
        color: categorySelectionTheme.subtitleColor,
        margin: 0,
    },
    cardsGrid: {
        display: "grid",
        width: "100%",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: categorySelectionSpacing.cardsGap,
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
        borderColor: categorySelectionTheme.cardBorder,
        backgroundColor: categorySelectionTheme.cardBg,
        padding: categorySelectionSpacing.cardPadding,
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
        padding: categorySelectionSpacing.iconPadding,
        backgroundColor: categorySelectionTheme.adultColor,
    },
    pediaIconTile: {
        width: 88,
        height: 88,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: categorySelectionSpacing.iconPadding,
        backgroundColor: categorySelectionTheme.pediaColor,
    },
    cardTitle: {
        display: "block",
        fontSize: categorySelectionFontSize.cardTitle,
        fontWeight: categorySelectionFontWeight.black,
        color: categorySelectionTheme.titleColor,
        lineHeight: 1.2,
    },
    cardSubtitle: {
        display: "block",
        marginTop: 4,
        fontSize: categorySelectionFontSize.cardSubtitle,
        fontWeight: categorySelectionFontWeight.bold,
        color: categorySelectionTheme.cardSubtitleColor,
    },
    ctaAdult: {
        marginTop: categorySelectionSpacing.ctaMarginTop,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: categorySelectionTheme.adultCtaColor,
        fontWeight: categorySelectionFontWeight.bold,
        fontSize: categorySelectionFontSize.cta,
    },
    ctaPedia: {
        marginTop: categorySelectionSpacing.ctaMarginTop,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: categorySelectionTheme.pediaCtaColor,
        fontWeight: categorySelectionFontWeight.bold,
        fontSize: categorySelectionFontSize.cta,
    },
} satisfies Record<string, CSSProperties>;
