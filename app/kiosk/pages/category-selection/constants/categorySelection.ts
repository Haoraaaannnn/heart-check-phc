/**
 * @file categorySelection.ts
 * @description Centralized barrel re-exporting component-scoped styles, tokens, and classes for category selection.
 */

import { CSSProperties } from "react";
import { CategoryLayoutStyle, CategoryLayoutClasses, categoryLayoutSpacing } from "./categoryLayout";
import { CategoryHeaderStyle, categoryHeaderTypography } from "./categoryHeader";
import {
    CategoryCardsStyle,
    CategoryCardsClasses,
    categoryCardsTheme,
    categoryCardsSpacing,
    categoryCardsTypography,
} from "./categoryCards";

// Re-export component constants
export * from "./categoryLayout";
export * from "./categoryHeader";
export * from "./categoryCards";
export * from "./categorySelectionTexts";

/**
 * Backward-compatible composite spacing tokens.
 */
export const categorySelectionSpacing = {
    containerPaddingX: categoryLayoutSpacing.containerPaddingX,
    containerPaddingBottomLandscape: 120,
    containerPaddingBottomPortrait: 140,
    contentGap: categoryLayoutSpacing.contentGap,
    cardsGap: categoryCardsSpacing.cardsGap,
    cardPadding: categoryCardsSpacing.cardPadding,
    iconPadding: categoryCardsSpacing.iconPadding,
    iconSize: categoryCardsSpacing.iconSize,
    ctaMarginTop: categoryCardsSpacing.ctaMarginTop,
} as const;

/**
 * Backward-compatible typography tokens.
 */
export const categorySelectionFontSize = {
    title: categoryHeaderTypography.titleSize,
    subtitle: categoryHeaderTypography.subtitleSize,
    cardTitle: categoryCardsTypography.cardTitle,
    cardSubtitle: categoryCardsTypography.cardSubtitle,
    cta: categoryCardsTypography.cta,
} as const;

/**
 * Backward-compatible font weight tokens.
 */
export const categorySelectionFontWeight = {
    normal: 400,
    medium: 500,
    bold: 700,
    black: 900,
} as const;

/**
 * Backward-compatible theme color tokens.
 */
export const categorySelectionTheme = {
    adultColor: categoryCardsTheme.adultColor,
    pediaColor: categoryCardsTheme.pediaColor,
    iconFill: categoryCardsTheme.iconFill,
    titleColor: categoryCardsTheme.titleColor,
    subtitleColor: "#4B5563",
    cardSubtitleColor: categoryCardsTheme.cardSubtitleColor,
    cardBg: categoryCardsTheme.cardBg,
    cardBorder: categoryCardsTheme.cardBorder,
    adultCtaColor: categoryCardsTheme.adultCtaColor,
    pediaCtaColor: categoryCardsTheme.pediaCtaColor,
} as const;

/**
 * Composite style definitions for `CategorySelectionPage`.
 * Maintained for backwards compatibility.
 */
export const CategorySelectionStyle = {
    container: CategoryLayoutStyle.container,
    contentWrapper: CategoryLayoutStyle.contentWrapper,
    header: CategoryHeaderStyle.header,
    title: CategoryHeaderStyle.title,
    subtitle: CategoryHeaderStyle.subtitle,
    cardsGrid: CategoryCardsStyle.cardsGrid,
    card: CategoryCardsStyle.card,
    adultIconTile: CategoryCardsStyle.adultIconTile,
    pediaIconTile: CategoryCardsStyle.pediaIconTile,
    cardTitle: CategoryCardsStyle.cardTitle,
    cardSubtitle: CategoryCardsStyle.cardSubtitle,
    ctaAdult: CategoryCardsStyle.ctaAdult,
    ctaPedia: CategoryCardsStyle.ctaPedia,
} satisfies Record<string, CSSProperties>;

/**
 * Composite class name dictionary for `CategorySelectionPage`.
 * Maintained for backwards compatibility.
 */
export const CategorySelectionClasses = {
    container: CategoryLayoutClasses.container,
    adultCard: CategoryCardsClasses.adultCard,
    pediaCard: CategoryCardsClasses.pediaCard,
    iconTile: CategoryCardsClasses.iconTile,
    cta: CategoryCardsClasses.cta,
} as const;
