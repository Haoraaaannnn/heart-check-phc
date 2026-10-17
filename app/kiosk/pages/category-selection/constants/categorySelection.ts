/**
 * @file categorySelection.ts
 * @description Centralized barrel re-exporting component-scoped styles, tokens, and classes for category selection.
 */

import { CSSProperties } from "react";
import { CategoryLayoutStyle, CategoryLayoutClasses, categoryLayoutSpacing } from "@/app/kiosk/pages/category-selection/constants/categoryLayout";
import { CategoryHeaderStyle, categoryHeaderTypography } from "@/app/kiosk/pages/category-selection/constants/categoryHeader";
import {
    CategoryCardsStyle,
    CategoryCardsClasses,
    categoryCardsTheme,
    categoryCardsSpacing,
    categoryCardsTypography,
} from "@/app/kiosk/pages/category-selection/constants/categoryCards";

// Re-export component constants
export * from "@/app/kiosk/pages/category-selection/constants/categoryLayout";
export * from "@/app/kiosk/pages/category-selection/constants/categoryHeader";
export * from "@/app/kiosk/pages/category-selection/constants/categoryCards";
export * from "@/app/kiosk/pages/category-selection/constants/categorySelectionTexts";

/**
 * Backward-compatible composite spacing tokens.
 */
export const categorySelectionSpacing = {
    containerPaddingX: categoryLayoutSpacing.containerPaddingX,
    containerPaddingBottomLandscape: 120,
    containerPaddingBottomPortrait: 140,
    contentGap: categoryLayoutSpacing.contentGap,
    cardsGap: categoryCardsSpacing.cardsGap,
    cardPadding: categoryCardsSpacing.paddingX,
    iconPadding: categoryCardsSpacing.paddingY,
    iconSize: categoryCardsSpacing.iconSize,
    ctaMarginTop: "0px",
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
    iconFill: categoryCardsTheme.adultColor,
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
    ctaAdult: CategoryCardsStyle.cardBadgeAdult,
    ctaPedia: CategoryCardsStyle.cardBadgePedia,
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
