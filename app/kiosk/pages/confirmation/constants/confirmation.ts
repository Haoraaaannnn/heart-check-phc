import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { confirmationTexts } from "./confirmationTexts";

/** Spacing tokens for confirmation step. */
export const confirmationSpacing = {
    paddingX: "clamp(16px, 2vw, 24px)",
    paddingY: "clamp(20px, 2.5vh, 32px)",
    gap: 16,
    borderRadius: 16,
} as const;

/** Typography tokens for confirmation step. */
export const confirmationTypography = {
    bannerTitleSize: "clamp(24px, 3vw, 42px)",
    bannerBadgeSize: "clamp(16px, 1.6vw, 24px)",
    descBadgeSize: "clamp(14px, 1.4vw, 18px)",
    descTextSize: "clamp(16px, 1.6vw, 22px)",
    btnTextSize: "clamp(18px, 1.8vw, 24px)",
    modalTitleSize: "clamp(20px, 2.2vw, 24px)",
} as const;

/** Colors for confirmation step. */
export const confirmationColors = {
    brandRed: themeColors.brandRed,
    white: themeColors.white,
    darkText: "#1F2937",
    cancelText: "#374151",
    cancelBorder: "#D1D5DB",
    modalOverlay: "rgba(0, 0, 0, 0.6)",
    pillBg: "rgba(255, 255, 255, 0.2)",
    pillBorder: "rgba(255, 255, 255, 0.35)",
} as const;

/** Inline styles for `ServiceBanner`. */
export const ConfirmationBannerStyle = {
    banner: {
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: confirmationSpacing.paddingX,
        paddingRight: confirmationSpacing.paddingX,
        paddingTop: confirmationSpacing.paddingY,
        paddingBottom: confirmationSpacing.paddingY,
        overflow: "hidden",
        color: confirmationColors.white,
        backgroundColor: confirmationColors.brandRed,
    },
    textWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        padding: confirmationSpacing.paddingX,
        minWidth: 0,
    },
    title: {
        fontWeight: 900,
        fontSize: confirmationTypography.bannerTitleSize,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    badge: {
        marginTop: 8,
        width: "fit-content",
        display: "inline-block",
        backgroundColor: confirmationColors.pillBg,
        border: `1px solid ${confirmationColors.pillBorder}`,
        color: confirmationColors.white,
        fontSize: confirmationTypography.bannerBadgeSize,
        fontWeight: 700,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        lineHeight: 1,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `ConfirmationDescriptions`. */
export const ConfirmationDescriptionStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: confirmationSpacing.gap,
    },
    badge: {
        width: "fit-content",
        backgroundColor: confirmationColors.brandRed,
        color: confirmationColors.white,
        fontSize: confirmationTypography.descBadgeSize,
        fontWeight: 700,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
    },
    text: {
        fontSize: confirmationTypography.descTextSize,
        color: confirmationColors.darkText,
        lineHeight: 1.6,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `ConfirmationActions`. */
export const ConfirmationActionsStyle = {
    container: {
        display: "flex",
        gap: confirmationSpacing.gap,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginTop: 8,
    },
    continueBtn: {
        flex: 1,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: confirmationColors.brandRed,
        color: confirmationColors.white,
        fontSize: confirmationTypography.btnTextSize,
        fontWeight: 900,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 16,
        cursor: "pointer",
        border: "none",
    },
    cancelBtn: {
        flex: 1,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: confirmationColors.white,
        color: confirmationColors.cancelText,
        border: `2px solid ${confirmationColors.cancelBorder}`,
        fontSize: confirmationTypography.btnTextSize,
        fontWeight: 700,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 16,
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `ConfirmationModal`. */
export const ConfirmationModalStyle = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: confirmationColors.modalOverlay,
        backdropFilter: "blur(4px)",
        padding: 16,
    },
    modalBox: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 900,
        maxHeight: "92vh",
        overflowY: "auto",
        backgroundColor: confirmationColors.white,
        borderRadius: 24,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },
    modalHeader: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingLeft: 28,
        paddingRight: 28,
        paddingTop: 22,
        paddingBottom: 22,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        color: confirmationColors.white,
        backgroundColor: confirmationColors.brandRed,
        flexShrink: 0,
    },
    modalTitle: {
        fontWeight: 900,
        fontSize: confirmationTypography.modalTitleSize,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    modalBadge: {
        width: "fit-content",
        display: "inline-block",
        backgroundColor: confirmationColors.pillBg,
        border: `1px solid ${confirmationColors.pillBorder}`,
        color: confirmationColors.white,
        fontSize: 13,
        fontWeight: 700,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 9999,
        marginTop: 4,
    },
    modalBody: {
        paddingLeft: 28,
        paddingRight: 28,
        paddingTop: 24,
        paddingBottom: 24,
    },
    modalFooter: {
        paddingLeft: 28,
        paddingRight: 28,
        paddingBottom: 28,
    },
} satisfies Record<string, CSSProperties>;

/** Legacy export for backward compatibility */
export const confirmationStyles = {
    headerBg: {
        backgroundColor: confirmationColors.brandRed,
    },
    badgeBg: {
        backgroundColor: confirmationColors.brandRed,
    },
    continueBtnBg: {
        backgroundColor: confirmationColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;
